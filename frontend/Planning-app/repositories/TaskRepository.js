/**
 * TaskRepository - 任务数据访问层
 *
 * 职责：
 * - 管理任务数据的 CRUD 操作
 * - 内存缓存（Map）+ localStorage 持久化
 * - 离线操作队列 + 后台同步
 * - 软删除（deletedAt 字段）
 *
 * 与 CategoryRepository 的区别：
 * - 无 sortOrder 字段（任务按时间排序）
 * - version 字段可选（任务通常单用户修改）
 *
 * 使用方式：
 * ```javascript
 * import TaskRepository from '@/repositories/TaskRepository'
 *
 * // App 启动时
 * await TaskRepository.hydrate()
 *
 * // 获取所有任务
 * const tasks = TaskRepository.getAll()
 *
 * // 创建任务
 * const newTask = await TaskRepository.create({ title: '完成报告', ... })
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04
 */

// 配置常量
const STORAGE_KEY = 'planning_app_tasks'
const QUEUE_KEY = 'planning_app_task_queue'
const DEBOUNCE_DELAY = 500
const MAX_RETRY = 5

/**
 * 任务 Repository（单例模式）
 */
class TaskRepository {
  constructor() {
    // 内存缓存（Map: id → task）
    this.memoryCache = new Map()

    // 离线操作队列
    this.operationQueue = []

    // Debounce 定时器
    this.saveTimer = null

    // 同步状态
    this.isSyncing = false
    this.lastSyncTime = null
  }

  /**
   * 启动时加载数据
   * @returns {Promise<void>}
   */
  async hydrate() {
    console.log('[TaskRepository] 开始 hydrate...')

    // 从 localStorage 加载缓存
    this._loadFromLocalStorage()

    // 从服务器同步最新数据
    try {
      await this.sync()
    } catch (err) {
      console.warn('[TaskRepository] 离线模式，使用本地缓存', err)
    }

    // 重放操作队列
    await this._replayQueue()

    console.log('[TaskRepository] hydrate 完成，任务数量:', this.memoryCache.size)
  }

  /**
   * 获取所有任务（按时间排序，过滤已删除）
   * @returns {Array<object>}
   */
  getAll() {
    return Array.from(this.memoryCache.values())
      .filter(task => !task.deletedAt)
      .sort((a, b) => b.createdAt - a.createdAt)  // 按创建时间倒序
  }

  /**
   * 按 ID 获取任务
   * @param {string} id
   * @returns {object|null}
   */
  getById(id) {
    const task = this.memoryCache.get(id)
    return task && !task.deletedAt ? task : null
  }

  /**
   * 按日期获取任务
   * @param {string} date - 日期字符串（YYYY-MM-DD）
   * @returns {Array<object>}
   */
  getByDate(date) {
    return this.getAll().filter(task => {
      if (!task.taskDate) return false
      const taskDate = new Date(task.taskDate).toISOString().split('T')[0]
      return taskDate === date
    })
  }

  /**
   * 创建任务
   * @param {object} data - 任务数据
   * @returns {Promise<object>}
   */
  async create(data) {
    const task = {
      id: this._generateId(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    }

    console.log('[TaskRepository] 创建任务:', task.title || task.id)

    // 更新内存缓存
    this.memoryCache.set(task.id, task)

    // 添加到操作队列
    this._addToQueue({
      type: 'create',
      entityId: task.id,
      data: task
    })

    // 持久化 + 同步
    this._saveToLocalStorage()
    this._debouncedSync()

    return task
  }

  /**
   * 更新任务
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async update(id, data) {
    const task = this.memoryCache.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 更新任务:', task.title || task.id)

    const updated = {
      ...task,
      ...data,
      updatedAt: Date.now()
    }

    // 更新缓存
    this.memoryCache.set(id, updated)

    // 添加到队列
    this._addToQueue({
      type: 'update',
      entityId: id,
      data: updated
    })

    // 持久化 + 同步
    this._saveToLocalStorage()
    this._debouncedSync()

    return updated
  }

  /**
   * 删除任务（软删除）
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const task = this.memoryCache.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 删除任务:', task.title || task.id)

    // 标记为已删除
    task.deletedAt = Date.now()

    // 添加到队列
    this._addToQueue({
      type: 'delete',
      entityId: id,
      data: { deletedAt: task.deletedAt }
    })

    // 持久化 + 同步
    this._saveToLocalStorage()
    this._debouncedSync()
  }

  /**
   * 同步到服务器
   * @returns {Promise<void>}
   */
  async sync() {
    if (this.isSyncing) {
      console.log('[TaskRepository] 已在同步中，跳过')
      return
    }

    this.isSyncing = true
    try {
      console.log('[TaskRepository] 开始同步...')

      // TODO: 调用后端 API（待后续集成）
      // const serverData = await taskApi.getAll()
      // this._mergeServerData(serverData)

      // 上传本地操作队列
      await this._uploadQueue()

      this.lastSyncTime = Date.now()
      console.log('[TaskRepository] 同步完成')
    } finally {
      this.isSyncing = false
    }
  }

  // ========== 私有方法 ==========

  /**
   * 从 localStorage 加载
   * @private
   */
  _loadFromLocalStorage() {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const tasks = JSON.parse(cached)
        tasks.forEach(task => {
          this.memoryCache.set(task.id, task)
        })
        console.log('[TaskRepository] 从缓存加载', tasks.length, '个任务')
      } catch (err) {
        console.error('[TaskRepository] 缓存数据损坏，清除缓存', err)
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    const queue = localStorage.getItem(QUEUE_KEY)
    if (queue) {
      try {
        this.operationQueue = JSON.parse(queue)
        console.log('[TaskRepository] 从缓存加载', this.operationQueue.length, '个待同步操作')
      } catch (err) {
        console.error('[TaskRepository] 队列数据损坏，清除队列', err)
        localStorage.removeItem(QUEUE_KEY)
      }
    }
  }

  /**
   * 保存到 localStorage
   * @private
   */
  _saveToLocalStorage() {
    const tasks = Array.from(this.memoryCache.values())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this.operationQueue))
  }

  /**
   * 添加操作到队列
   * @private
   */
  _addToQueue(operation) {
    this.operationQueue.push({
      id: this._generateId(),
      ...operation,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    })
  }

  /**
   * Debounce 同步
   * @private
   */
  _debouncedSync() {
    clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.sync().catch(err => console.error('[TaskRepository] 同步失败', err))
    }, DEBOUNCE_DELAY)
  }

  /**
   * 合并服务器数据
   * @private
   */
  _mergeServerData(serverData) {
    serverData.forEach(serverTask => {
      const localTask = this.memoryCache.get(serverTask.id)

      if (!localTask) {
        // 服务器有但本地没有 → 直接添加
        this.memoryCache.set(serverTask.id, serverTask)
      } else if (serverTask.updatedAt > localTask.updatedAt) {
        // 服务器更新时间更晚 → 使用服务器版本
        this.memoryCache.set(serverTask.id, serverTask)
        console.warn(`[TaskRepository] 冲突：${serverTask.title}，使用服务器版本`)
      }
      // 否则保留本地版本
    })

    this._saveToLocalStorage()
  }

  /**
   * 上传操作队列
   * @private
   */
  async _uploadQueue() {
    const pendingOps = this.operationQueue.filter(op => op.status === 'pending')

    if (pendingOps.length === 0) {
      return
    }

    console.log('[TaskRepository] 上传队列，待处理操作:', pendingOps.length)

    for (const op of pendingOps) {
      try {
        op.status = 'syncing'

        // TODO: 调用后端 API（待后续集成）
        // if (op.type === 'create') {
        //   await taskApi.create(op.data)
        // } else if (op.type === 'update') {
        //   await taskApi.update(op.entityId, op.data)
        // } else if (op.type === 'delete') {
        //   await taskApi.delete(op.entityId)
        // }

        // 模拟成功
        console.log(`[TaskRepository] 操作 ${op.type} 成功:`, op.entityId)

        // 成功 → 从队列移除
        this.operationQueue = this.operationQueue.filter(o => o.id !== op.id)
      } catch (err) {
        op.status = 'failed'
        op.retryCount++

        if (op.retryCount >= MAX_RETRY) {
          console.error(`[TaskRepository] 操作失败（已重试${MAX_RETRY}次），放弃`, op)
          this.operationQueue = this.operationQueue.filter(o => o.id !== op.id)
        } else {
          const delay = Math.pow(2, op.retryCount) * 1000
          console.warn(`[TaskRepository] 操作失败，${delay}ms 后重试`, op)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    this._saveToLocalStorage()
  }

  /**
   * 重放操作队列
   * @private
   */
  async _replayQueue() {
    await this._uploadQueue()
  }

  /**
   * 生成唯一 ID
   * @private
   */
  _generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出单例
export default new TaskRepository()
