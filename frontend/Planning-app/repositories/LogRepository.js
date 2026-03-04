/**
 * LogRepository - 日志数据访问层
 *
 * 职责：
 * - 管理日志记录（journal_logs 表）
 * - 提供 CRUD 接口和按日期过滤
 * - 离线优先：memoryCache + operationQueue + localStorage
 * - 支持日志转任务功能
 *
 * 数据结构：
 * - logTime: 精确到分钟的时间戳（ISO 8601格式）
 * - content: 日志内容
 * - mood: 心情（可选）
 * - convertedToTaskId: 已转化为任务的ID（可选）
 *
 * 使用方式：
 * import LogRepository from '@/repositories/LogRepository'
 *
 * await LogRepository.hydrate()
 * const logs = LogRepository.getByDate('2026-03-04')
 * await LogRepository.create({ logTime, content, mood })
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04
 */

import { getLogs as getLogsApi, createLog as createLogApi, updateLog as updateLogApi, deleteLog as deleteLogApi, convertLogToTask as convertLogToTaskApi } from '@/api/log.js'

/**
 * LogRepository 类
 *
 * 复用 CategoryRepository 的核心逻辑：
 * - memoryCache (Map 结构，O(1) 查找)
 * - operationQueue (离线队列，指数退避重试)
 * - localStorage 持久化
 * - 500ms debounce 防抖
 */
class LogRepository {
  constructor() {
    /** @type {Map<number, object>} 内存缓存（id → log对象） */
    this.memoryCache = new Map()

    /** @type {Array<object>} 离线操作队列 */
    this.operationQueue = []

    /** @type {number|null} 防抖定时器 */
    this.saveTimer = null

    /** @type {number|null} 同步定时器 */
    this.syncTimer = null

    /** @type {boolean} 是否正在同步 */
    this.isSyncing = false

    /** @type {number|null} 上次同步时间 */
    this.lastSyncTime = null

    console.log('[LogRepository] 初始化')
  }

  // ==================== 读取操作 ====================

  /**
   * 获取所有日志（过滤已删除）
   * @returns {Array<object>}
   */
  getAll() {
    return Array.from(this.memoryCache.values())
      .filter(log => !log.deletedAt)
      .sort((a, b) => new Date(b.logTime) - new Date(a.logTime)) // 按时间倒序
  }

  /**
   * 按日期获取日志
   * @param {string} date - YYYY-MM-DD
   * @returns {Array<object>}
   */
  getByDate(date) {
    return this.getAll().filter(log => {
      if (!log.logTime) return false
      const logDate = new Date(log.logTime).toISOString().split('T')[0]
      return logDate === date
    })
  }

  /**
   * 按ID获取日志
   * @param {number} id
   * @returns {object|undefined}
   */
  getById(id) {
    const log = this.memoryCache.get(id)
    return log && !log.deletedAt ? log : undefined
  }

  // ==================== 写入操作 ====================

  /**
   * 创建日志
   * @param {object} data - { logTime, content, mood?, relatedTaskId?, relatedPlanId? }
   * @returns {Promise<object>}
   */
  async create(data) {
    const log = {
      id: this._generateId(), // 临时ID
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      convertedToTaskId: null // 初始未转化
    }

    // 立即写入内存缓存
    this.memoryCache.set(log.id, log)

    // 添加到离线队列
    this._addToQueue({
      type: 'create',
      entityId: log.id,
      data: log
    })

    // 防抖写入 localStorage 和同步服务器
    this._saveToLocalStorage()
    this._debouncedSync()

    console.log('[LogRepository] 创建日志:', log.id)
    return log
  }

  /**
   * 更新日志
   * @param {number} id
   * @param {object} changes
   * @returns {Promise<object>}
   */
  async update(id, changes) {
    const log = this.memoryCache.get(id)
    if (!log) {
      throw new Error(`日志不存在: ${id}`)
    }

    const updated = {
      ...log,
      ...changes,
      updatedAt: Date.now()
    }

    // 立即更新内存
    this.memoryCache.set(id, updated)

    // 离线队列记录
    this._addToQueue({
      type: 'update',
      entityId: id,
      data: updated
    })

    this._saveToLocalStorage()
    this._debouncedSync()

    console.log('[LogRepository] 更新日志:', id)
    return updated
  }

  /**
   * 软删除日志
   * @param {number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const log = this.memoryCache.get(id)
    if (!log) return

    const deleted = {
      ...log,
      deletedAt: Date.now(),
      updatedAt: Date.now()
    }

    this.memoryCache.set(id, deleted)

    this._addToQueue({
      type: 'delete',
      entityId: id,
      data: deleted
    })

    this._saveToLocalStorage()
    this._debouncedSync()

    console.log('[LogRepository] 删除日志:', id)
  }

  /**
   * 将日志转化为任务
   * @param {number} id - 日志ID
   * @param {object} taskData - 可选的任务数据（补充字段）
   * @returns {Promise<object>} 新创建的任务
   */
  async convertToTask(id, taskData = {}) {
    const log = this.memoryCache.get(id)
    if (!log) {
      throw new Error(`日志不存在: ${id}`)
    }

    if (log.convertedToTaskId) {
      throw new Error('该日志已转化为任务')
    }

    try {
      // 调用 API 转化（服务器端创建任务）
      const task = await convertLogToTaskApi(id, taskData)

      // 标记日志已转化
      const updated = {
        ...log,
        convertedToTaskId: task.id,
        updatedAt: Date.now()
      }

      this.memoryCache.set(id, updated)
      this._saveToLocalStorage()

      console.log('[LogRepository] 日志已转化为任务:', id, '→', task.id)
      return task

    } catch (err) {
      console.error('[LogRepository] 转化失败:', err)
      throw err
    }
  }

  // ==================== 数据水合 ====================

  /**
   * hydrate - 应用启动时调用
   *
   * 流程：
   * 1. 从 localStorage 加载缓存
   * 2. 从服务器同步最新数据
   * 3. 重放离线操作队列
   */
  async hydrate() {
    console.log('[LogRepository] 开始数据水合')

    // 步骤1：从 localStorage 加载
    this._loadFromLocalStorage()

    // 步骤2：从服务器同步
    await this.sync()

    // 步骤3：重放离线队列
    await this._replayQueue()

    console.log(`[LogRepository] 水合完成，当前 ${this.memoryCache.size} 条日志`)
  }

  /**
   * 同步服务器数据
   */
  async sync() {
    if (this.isSyncing) {
      console.log('[LogRepository] 已在同步中，跳过')
      return
    }

    this.isSyncing = true
    console.log('[LogRepository] 开始同步服务器数据')

    try {
      // 获取最近30天的日志（避免一次拉取过多数据）
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const res = await getLogsApi({ start: startDate, end: endDate })
      const serverLogs = res.list || res || []

      // 合并到 memoryCache（服务器数据优先）
      for (const log of serverLogs) {
        this.memoryCache.set(log.id, log)
      }

      this._saveToLocalStorage()
      this.lastSyncTime = Date.now()

      console.log(`[LogRepository] 同步完成，服务器返回 ${serverLogs.length} 条日志`)

    } catch (err) {
      console.warn('[LogRepository] 同步失败（已忽略）:', err)
    } finally {
      this.isSyncing = false
    }
  }

  // ==================== 内部方法 ====================

  /**
   * 生成临时ID（客户端生成）
   * @returns {string} 'temp_' + 时间戳
   */
  _generateId() {
    return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * 添加操作到队列
   * @param {object} operation
   */
  _addToQueue(operation) {
    operation.timestamp = Date.now()
    operation.retryCount = 0
    operation.uploaded = false
    this.operationQueue.push(operation)
  }

  /**
   * 防抖写入 localStorage（500ms）
   */
  _saveToLocalStorage() {
    clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      try {
        const data = {
          logs: Array.from(this.memoryCache.entries()),
          queue: this.operationQueue
        }
        // #ifdef H5
        localStorage.setItem('planning_app_logs', JSON.stringify(data))
        // #endif
        // #ifndef H5
        uni.setStorageSync('planning_app_logs', JSON.stringify(data))
        // #endif
        console.log('[LogRepository] 已保存到 localStorage')
      } catch (err) {
        console.error('[LogRepository] 保存失败:', err)
      }
    }, 500)
  }

  /**
   * 从 localStorage 加载
   */
  _loadFromLocalStorage() {
    try {
      let raw
      // #ifdef H5
      raw = localStorage.getItem('planning_app_logs')
      // #endif
      // #ifndef H5
      raw = uni.getStorageSync('planning_app_logs')
      // #endif

      if (!raw) {
        console.log('[LogRepository] localStorage 无缓存')
        return
      }

      const data = JSON.parse(raw)
      this.memoryCache = new Map(data.logs || [])
      this.operationQueue = data.queue || []

      console.log(`[LogRepository] 从 localStorage 加载 ${this.memoryCache.size} 条日志，${this.operationQueue.length} 个待同步操作`)

    } catch (err) {
      console.error('[LogRepository] 加载失败:', err)
    }
  }

  /**
   * 防抖同步服务器（500ms）
   */
  _debouncedSync() {
    clearTimeout(this.syncTimer)
    this.syncTimer = setTimeout(() => {
      this._uploadQueue()
    }, 500)
  }

  /**
   * 上传离线队列（指数退避重试）
   */
  async _uploadQueue() {
    const pendingOps = this.operationQueue.filter(op => !op.uploaded && !op.failed)
    if (pendingOps.length === 0) return

    console.log(`[LogRepository] 上传队列：${pendingOps.length} 个操作`)

    for (const op of pendingOps) {
      try {
        let response

        switch (op.type) {
          case 'create':
            response = await createLogApi(op.data)
            // 替换临时ID为服务器ID
            this.memoryCache.delete(op.entityId)
            this.memoryCache.set(response.id, response)
            break

          case 'update':
            response = await updateLogApi(op.entityId, op.data)
            this.memoryCache.set(op.entityId, response)
            break

          case 'delete':
            await deleteLogApi(op.entityId)
            // 保留软删除标记
            break
        }

        op.uploaded = true
        console.log(`[LogRepository] 操作已上传:`, op.type, op.entityId)

      } catch (err) {
        console.warn(`[LogRepository] 操作上传失败 (第${op.retryCount + 1}次):`, err)

        op.retryCount++

        if (op.retryCount >= 5) {
          console.error('[LogRepository] 操作彻底失败，已放弃:', op)
          op.failed = true
        } else {
          // 指数退避：1s → 2s → 4s → 8s → 16s
          const delay = Math.pow(2, op.retryCount) * 1000
          console.log(`[LogRepository] ${delay}ms 后重试`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // 清理已上传和已失败的操作
    this.operationQueue = this.operationQueue.filter(op => !op.uploaded && !op.failed)
    this._saveToLocalStorage()
  }

  /**
   * 重放离线队列（应用启动时调用）
   */
  async _replayQueue() {
    if (this.operationQueue.length === 0) {
      console.log('[LogRepository] 无待重放操作')
      return
    }

    console.log(`[LogRepository] 重放队列：${this.operationQueue.length} 个操作`)
    await this._uploadQueue()
  }
}

// 导出单例
export default new LogRepository()
