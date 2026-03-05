/**
 * PlanningRepository - 规划数据访问层
 *
 * 职责：
 * - 管理规划记录（planning_records 表）
 * - 提供 CRUD 接口和按类型过滤
 * - 离线优先：memoryCache + operationQueue + localStorage
 * - 支持分页加载（但本地缓存所有数据）
 *
 * 数据结构：
 * - type: 规划类型（life/career/project/mood/health/time/habit）
 * - title: 标题
 * - content: 内容
 * - status: 状态（planning/in_progress/completed/cancelled）
 * - relatedStage: 关联的人生阶段（可选）
 *
 * 使用方式：
 * import PlanningRepository from '@/repositories/PlanningRepository'
 *
 * await PlanningRepository.hydrate()
 * const plannings = PlanningRepository.getByType('life')
 * await PlanningRepository.create({ type, title, content })
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04
 */

import {
  getPlanningList as getPlanningListApi,
  createPlanning as createPlanningApi,
  updatePlanning as updatePlanningApi,
  deletePlanning as deletePlanningApi,
  updatePlanningStatus as updatePlanningStatusApi
} from '@/api/planning.js'

/**
 * PlanningRepository 类
 *
 * 复用 CategoryRepository 的核心逻辑：
 * - memoryCache (Map 结构，O(1) 查找)
 * - operationQueue (离线队列，指数退避重试)
 * - localStorage 持久化
 * - 500ms debounce 防抖
 */
class PlanningRepository {
  constructor() {
    /** @type {Map<number, object>} 内存缓存（id → planning对象） */
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

    console.log('[PlanningRepository] 初始化')
  }

  // ==================== 读取操作 ====================

  /**
   * 获取所有规划（过滤已删除）
   * @returns {Array<object>}
   */
  getAll() {
    return Array.from(this.memoryCache.values())
      .filter(planning => !planning.deletedAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // 按创建时间倒序
  }

  /**
   * 按类型获取规划
   * @param {string} type - life/career/project/mood/health/time/habit
   * @returns {Array<object>}
   */
  getByType(type) {
    if (!type) return this.getAll()
    return this.getAll().filter(planning => planning.type === type)
  }

  /**
   * 按ID获取规划
   * @param {number} id
   * @returns {object|undefined}
   */
  getById(id) {
    const planning = this.memoryCache.get(id)
    return planning && !planning.deletedAt ? planning : undefined
  }

  /**
   * 按状态获取规划
   * @param {string} status - planning/in_progress/completed/cancelled
   * @returns {Array<object>}
   */
  getByStatus(status) {
    return this.getAll().filter(planning => planning.status === status)
  }

  // ==================== 写入操作 ====================

  /**
   * 创建规划
   * @param {object} data - { type, title, content, status?, relatedStage?, targetDate? }
   * @returns {Promise<object>}
   */
  async create(data) {
    const planning = {
      id: this._generateId(), // 临时ID
      ...data,
      status: data.status || 'planning', // 默认状态：规划中
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    }

    // 立即写入内存缓存
    this.memoryCache.set(planning.id, planning)

    // 添加到离线队列
    this._addToQueue({
      type: 'create',
      entityId: planning.id,
      data: planning
    })

    // 防抖写入 localStorage 和同步服务器
    this._saveToLocalStorage()
    this._debouncedSync()

    console.log('[PlanningRepository] 创建规划:', planning.id)
    return planning
  }

  /**
   * 更新规划
   * @param {number} id
   * @param {object} changes
   * @returns {Promise<object>}
   */
  async update(id, changes) {
    const planning = this.memoryCache.get(id)
    if (!planning) {
      throw new Error(`规划不存在: ${id}`)
    }

    const updated = {
      ...planning,
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

    console.log('[PlanningRepository] 更新规划:', id)
    return updated
  }

  /**
   * 更新规划状态
   * @param {number} id
   * @param {string} status - planning/in_progress/completed/cancelled
   * @returns {Promise<object>}
   */
  async updateStatus(id, status) {
    return await this.update(id, { status })
  }

  /**
   * 软删除规划
   * @param {number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const planning = this.memoryCache.get(id)
    if (!planning) return

    const deleted = {
      ...planning,
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

    console.log('[PlanningRepository] 删除规划:', id)
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
    console.log('[PlanningRepository] 开始数据水合')

    // 步骤1：从 localStorage 加载
    this._loadFromLocalStorage()

    // 步骤2：从服务器同步
    await this.sync()

    // 步骤3：重放离线队列
    await this._replayQueue()

    console.log(`[PlanningRepository] 水合完成，当前 ${this.memoryCache.size} 条规划`)
  }

  /**
   * 同步服务器数据
   */
  async sync() {
    if (this.isSyncing) {
      console.log('[PlanningRepository] 已在同步中，跳过')
      return
    }

    this.isSyncing = true
    console.log('[PlanningRepository] 开始同步服务器数据')

    try {
      // 获取所有规划（分页拉取，最多100条，受后端Joi验证限制）
      const result = await getPlanningListApi({ page: 1, pageSize: 100 })
      const serverPlannings = result.list || []

      // 合并到 memoryCache（服务器数据优先）
      for (const planning of serverPlannings) {
        this.memoryCache.set(planning.id, planning)
      }

      this._saveToLocalStorage()
      this.lastSyncTime = Date.now()

      console.log(`[PlanningRepository] 同步完成，服务器返回 ${serverPlannings.length} 条规划`)

    } catch (err) {
      console.warn('[PlanningRepository] 同步失败（已忽略）:', err)
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
          plannings: Array.from(this.memoryCache.entries()),
          queue: this.operationQueue
        }
        // #ifdef H5
        localStorage.setItem('planning_app_plannings', JSON.stringify(data))
        // #endif
        // #ifndef H5
        uni.setStorageSync('planning_app_plannings', JSON.stringify(data))
        // #endif
        console.log('[PlanningRepository] 已保存到 localStorage')
      } catch (err) {
        console.error('[PlanningRepository] 保存失败:', err)
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
      raw = localStorage.getItem('planning_app_plannings')
      // #endif
      // #ifndef H5
      raw = uni.getStorageSync('planning_app_plannings')
      // #endif

      if (!raw) {
        console.log('[PlanningRepository] localStorage 无缓存')
        return
      }

      const data = JSON.parse(raw)
      this.memoryCache = new Map(data.plannings || [])
      this.operationQueue = data.queue || []

      console.log(`[PlanningRepository] 从 localStorage 加载 ${this.memoryCache.size} 条规划，${this.operationQueue.length} 个待同步操作`)

    } catch (err) {
      console.error('[PlanningRepository] 加载失败:', err)
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

    console.log(`[PlanningRepository] 上传队列：${pendingOps.length} 个操作`)

    for (const op of pendingOps) {
      try {
        let response

        switch (op.type) {
          case 'create':
            response = await createPlanningApi(op.data)
            // 替换临时ID为服务器ID
            this.memoryCache.delete(op.entityId)
            this.memoryCache.set(response.id, response)
            break

          case 'update':
            response = await updatePlanningApi(op.entityId, op.data)
            this.memoryCache.set(op.entityId, response)
            break

          case 'delete':
            await deletePlanningApi(op.entityId)
            // 保留软删除标记
            break
        }

        op.uploaded = true
        console.log(`[PlanningRepository] 操作已上传:`, op.type, op.entityId)

      } catch (err) {
        console.warn(`[PlanningRepository] 操作上传失败 (第${op.retryCount + 1}次):`, err)

        op.retryCount++

        if (op.retryCount >= 5) {
          console.error('[PlanningRepository] 操作彻底失败，已放弃:', op)
          op.failed = true
        } else {
          // 指数退避：1s → 2s → 4s → 8s → 16s
          const delay = Math.pow(2, op.retryCount) * 1000
          console.log(`[PlanningRepository] ${delay}ms 后重试`)
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
      console.log('[PlanningRepository] 无待重放操作')
      return
    }

    console.log(`[PlanningRepository] 重放队列：${this.operationQueue.length} 个操作`)
    await this._uploadQueue()
  }
}

// 导出单例
export default new PlanningRepository()
