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

import request from '@/utils/request' // ⭐ 新增（2026-03-15）：直接调用后端API

// 配置常量
const STORAGE_KEY = 'planning_app_tasks'
const QUEUE_KEY = 'planning_app_task_queue'
const DEBOUNCE_DELAY = 500
const MAX_RETRY = 5

/**
 * 任务 Repository（单例模式）
 *
 * ⭐ 新增功能（2026-03-14）：事件通知机制（发布-订阅模式）
 * - 数据变化时自动通知订阅者（Store）
 * - 支持事件类型：create、update、delete、batchCreate、hydrate
 */
class TaskRepository {
  constructor() {
    // 内存缓存（Map: id → task）
    this.memoryCache = new Map()

    // 离线操作队列
    this.operationQueue = []

    // Debounce 定时器
    this.saveTimer = null

    /**
     * ⭐ 事件订阅者列表（发布-订阅模式）
     * @type {Array<Function>}
     */
    this.listeners = []

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

    // ⭐ 发布事件：通知订阅者数据已加载完成
    this._notify('hydrate', null)
  }

  /**
   * 获取所有任务（按时间排序，过滤已删除）
   * @returns {Array<object>}
   */
  getAll() {
    const allTasks = Array.from(this.memoryCache.values())
    const activeTasks = allTasks.filter(task => !task.deletedAt)
    return activeTasks.sort((a, b) => b.createdAt - a.createdAt)  // 按创建时间倒序
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
    // ⭐⭐⭐ 详细日志：追踪任务创建来源
    console.log('========================================')
    console.log('[TaskRepository.create] 开始创建任务')
    console.log('  调用时间:', new Date().toISOString())
    console.log('  任务标题:', data.title)
    console.log('  任务日期:', data.taskDate)
    console.log('  分类ID:', data.categoryId)
    console.log('  调用栈:', new Error().stack)
    console.log('  当前缓存任务数:', this.memoryCache.size)

    const task = {
      id: this._generateId(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    }

    console.log('  生成的任务ID:', task.id)

    // 更新内存缓存
    this.memoryCache.set(task.id, task)
    console.log('  缓存更新后任务数:', this.memoryCache.size)

    // 添加到操作队列
    this._addToQueue({
      type: 'create',
      entityId: task.id,
      data: task
    })

    // 持久化 + 同步
    this._saveToLocalStorage()
    this._debouncedSync()

    // ⭐ 发布事件：通知订阅者任务已创建
    console.log('  准备发布 create 事件，订阅者数量:', this.listeners.length)
    this._notify('create', task)
    console.log('[TaskRepository.create] 任务创建完成')
    console.log('========================================')

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

    // ⭐ 处理 subtasks 字段（确保格式正确）
    // 如果 data 中包含 subtasks 字段，验证其格式
    if (data.subtasks !== undefined) {
      if (!Array.isArray(data.subtasks)) {
        console.warn('[TaskRepository] subtasks 字段必须是数组，当前类型:', typeof data.subtasks)
        data.subtasks = []
      }
      // 验证每个子任务对象包含 title 和 isDone 字段
      data.subtasks = data.subtasks.map(st => ({
        title: st.title || '',
        isDone: Boolean(st.isDone)
      }))
    }

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

    // ⭐ 发布事件：通知订阅者任务已更新
    this._notify('update', updated)

    return updated
  }

  /**
   * 更新重复任务的未来实例（保留过去记录）⭐ 新增（2026-03-15）
   *
   * @param {string} id - 任务 ID
   * @param {object} data - 要更新的字段（如 isUrgent, isImportant）
   * @param {string} currentDate - 当前日期（格式：YYYY-MM-DD），作为"未来"的分界点
   * @returns {Promise<object>} 更新后的任务对象
   *
   * 实现逻辑：
   * 1. 调用后端API：PUT /api/v1/tasks/:id/recurrence?scope=future&date=:date
   * 2. 后端会：更新Task表 + 清理未来CompletionRecord（保留过去记录）
   * 3. 更新本地缓存
   * 4. 通知订阅者
   */
  async updateFuture(id, data, currentDate) {
    const task = this.memoryCache.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 更新未来实例:', task.title || task.id, '分界日期:', currentDate)

    try {
      // 调用后端API（scope=future）
      // ⚠️ 注意：query参数需要手动拼接到URL中
      const url = `/tasks/${id}/recurrence?scope=future&date=${currentDate}`
      const updated = await request({
        url,
        method: 'PUT',
        data
      })

      // 更新缓存
      this.memoryCache.set(id, updated)

      // 持久化
      this._saveToLocalStorage()

      // ⭐ 发布事件：通知订阅者任务已更新
      this._notify('update', updated)

      return updated
    } catch (error) {
      console.error('[TaskRepository] 更新未来实例失败:', error)
      throw error
    }
  }

  /**
   * 仅更新重复任务的单个日期实例（象限覆盖）⭐ 新增（2026-03-15）
   *
   * @param {string} id - 任务 ID
   * @param {object} data - 要更新的字段（如 isUrgent, isImportant）
   * @param {string} date - 指定日期（格式：YYYY-MM-DD）
   * @returns {Promise<object>} 更新后的 CompletionRecord 对象
   *
   * 实现逻辑：
   * 1. 调用后端API：PUT /api/v1/tasks/:id/occurrences/:date
   * 2. 后端会：创建/更新CompletionRecord，在note字段中存储象限覆盖信息
   * 3. 不更新本地缓存（因为只影响单个日期）
   * 4. 通知订阅者（触发重新查询）
   */
  async updateOnce(id, data, date) {
    const task = this.memoryCache.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 更新单日实例:', task.title || task.id, '日期:', date)

    try {
      // 调用后端API
      const completionRecord = await request({
        url: `/tasks/${id}/occurrences/${date}`,
        method: 'PUT',
        data
      })

      // ⭐ 不更新本地缓存（Task表未改变）
      // ⭐ 但仍然通知订阅者（触发重新查询getTasksByDate）
      this._notify('updateOnce', { taskId: id, date, record: completionRecord })

      return completionRecord
    } catch (error) {
      console.error('[TaskRepository] 更新单日实例失败:', error)
      throw error
    }
  }

  /**
   * 修改重复任务的单日实例（创建task_overrides记录）⭐ RRULE架构升级（2026-03-16）
   *
   * @param {string} id - 任务 ID
   * @param {object} data - 要更新的字段（如 isUrgent, isImportant, title, description等）
   * @param {string} date - 目标日期（格式：YYYY-MM-DD）
   * @returns {Promise<object>} task_overrides记录
   *
   * 实现逻辑：
   * 1. 调用后端API：POST /api/v1/tasks/:id/modify-single-day
   * 2. 后端会：创建task_overrides记录（所有字段支持NULL覆盖机制）
   * 3. 不更新本地缓存（Task表未改变）
   * 4. 通知订阅者触发重新查询
   */
  async updateTaskSingleDay(id, data, date) {
    const task = this.memoryCache.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 修改单日实例（task_overrides）:', task.title || task.id, '日期:', date, '更新:', data)

    try {
      // 调用后端API（POST /tasks/:id/modify-single-day）
      const override = await request({
        url: `/tasks/${id}/modify-single-day`,
        method: 'POST',
        data: {
          date,      // 目标日期
          updates: data  // 要覆盖的字段
        }
      })

      // ⭐ 不更新本地缓存（Task表未改变）
      // ⭐ 但仍然通知订阅者（触发重新查询getTasksByDate）
      this._notify('updateSingleDay', { taskId: id, date, override })

      return override
    } catch (error) {
      console.error('[TaskRepository] 修改单日实例失败:', error)
      throw error
    }
  }

  /**
   * 修改重复任务未来实例（拆分规则）⭐ RRULE架构升级（2026-03-16）
   *
   * @param {string} id - 任务 ID
   * @param {object} data - 要更新的字段（如 isUrgent, isImportant）
   * @param {string} splitDate - 拆分日期（格式：YYYY-MM-DD），从这天开始应用新规则
   * @returns {Promise<object>} { originalTask, newTask }
   *
   * 实现逻辑：
   * 1. 调用后端API：POST /api/v1/tasks/:id/modify-future
   * 2. 后端会：拆分任务规则（旧任务UNTIL截止，新任务继承属性+应用更新）
   * 3. 更新本地缓存（新旧两个任务）
   * 4. 通知订阅者
   */
  async updateTaskFuture(id, data, splitDate) {
    const task = this.memoryCache.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 修改未来实例（拆分规则）:', task.title || task.id, '拆分日期:', splitDate, '更新:', data)

    try {
      // 调用后端API（POST /tasks/:id/modify-future）
      const result = await request({
        url: `/tasks/${id}/modify-future`,
        method: 'POST',
        data: {
          splitDate,  // 拆分日期
          updates: data  // 要更新的字段
        }
      })

      // result = { originalTask, newTask }
      const { originalTask, newTask } = result

      // 更新旧任务缓存（UNTIL已修改）
      this.memoryCache.set(originalTask.id, originalTask)

      // 添加新任务到缓存
      this.memoryCache.set(newTask.id, newTask)

      // 持久化
      this._saveToLocalStorage()

      // ⭐ 发布事件：通知订阅者任务已更新
      this._notify('updateTaskFuture', { originalTask, newTask })

      return result
    } catch (error) {
      console.error('[TaskRepository] 修改未来实例失败:', error)
      throw error
    }
  }


  /**
   * 删除任务
   *
   * @param {string} id - 任务 ID
   * @returns {Promise<void>}
   *
   * 删除流程：
   * 1. 标记 deletedAt（用于同步到服务器）
   * 2. 添加删除操作到队列（等待同步）
   * 3. 从内存缓存中移除（立即生效，刷新页面不恢复）
   * 4. 持久化到 localStorage
   * 5. 后台同步到服务器
   */
  async delete(id) {
    const task = this.memoryCache.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 删除任务:', task.title || task.id)

    const deletedAt = Date.now()

    // 1. 添加删除操作到队列（用于同步到服务器）
    this._addToQueue({
      type: 'delete',
      entityId: id,
      data: { deletedAt }
    })

    // 2. ⭐ 从内存缓存中移除（立即生效，避免刷新页面恢复）
    this.memoryCache.delete(id)
    console.log('[TaskRepository] 已从内存缓存中移除:', id)

    // 3. 持久化到 localStorage（memoryCache 已移除，所以 localStorage 中也会移除）
    this._saveToLocalStorage()

    // 4. 后台同步到服务器
    this._debouncedSync()

    // ⭐ 发布事件：通知订阅者任务已删除
    this._notify('delete', { id, deletedAt })
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

        // ⭐ 自动清理垃圾数据：过滤掉 deletedAt 不为 null 的数据
        const beforeCount = tasks.length
        const cleaned = tasks.filter(task => !task.deletedAt)
        const garbageCount = beforeCount - cleaned.length

        if (garbageCount > 0) {
          console.warn(`[TaskRepository] 检测到 ${garbageCount} 个垃圾任务（deletedAt 不为 null），已自动清理`)
          // 立即保存清理后的数据到 localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
        }

        cleaned.forEach(task => {
          this.memoryCache.set(task.id, task)
        })
        console.log('[TaskRepository] 从缓存加载', cleaned.length, '个任务（清理后）')
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
   * ⭐ BUG修复（2026-03-15）：启用后端API调用，解决任务不同步到服务器的问题
   * @private
   */
  async _uploadQueue() {
    const pendingOps = this.operationQueue.filter(op => op.status === 'pending')

    if (pendingOps.length === 0) {
      return
    }

    console.log('[TaskRepository] 上传队列，待处理操作:', pendingOps.length)

    // ⭐ 动态导入 taskApi（避免循环依赖）
    const { createTask, updateTask, deleteTask } = await import('@/api/task')

    for (const op of pendingOps) {
      try {
        op.status = 'syncing'

        // ✅ 调用后端 API（已启用）
        if (op.type === 'create') {
          const serverTask = await createTask(op.data)  // ⭐ request.js已返回data字段
          console.log(`[TaskRepository] 操作 create 成功，服务器返回:`, serverTask)

          // ⭐ 同步服务器返回的完整数据（包含 id、isRecurring 等字段）
          if (serverTask && serverTask.id) {
            this.memoryCache.set(serverTask.id, serverTask)
            console.log(`[TaskRepository] 已更新内存缓存为服务器版本:`, serverTask.id)
          }
        } else if (op.type === 'update') {
          await updateTask(op.entityId, op.data)
          console.log(`[TaskRepository] 操作 update 成功:`, op.entityId)
        } else if (op.type === 'delete') {
          await deleteTask(op.entityId)
          console.log(`[TaskRepository] 操作 delete 成功:`, op.entityId)
        }

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

  // ============================================================
  // ⭐ 事件通知机制（发布-订阅模式）- 2026-03-14 新增
  // ============================================================

  /**
   * 订阅 Repository 事件
   *
   * @param {Function} callback - 回调函数 (event, data) => void
   * @returns {Function} 取消订阅函数
   *
   * @example
   * const unsubscribe = TaskRepository.subscribe((event, data) => {
   *   console.log('事件:', event, '数据:', data)
   * })
   * // 取消订阅
   * unsubscribe()
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('[TaskRepository] subscribe 参数必须是函数')
      return () => {}
    }

    this.listeners.push(callback)
    console.log(`[TaskRepository] 新增订阅者，当前订阅者数量: ${this.listeners.length}`)

    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
        console.log(`[TaskRepository] 取消订阅，剩余订阅者数量: ${this.listeners.length}`)
      }
    }
  }

  /**
   * 发布事件给所有订阅者（内部方法）
   *
   * @param {string} event - 事件类型（create、update、delete、batchCreate、hydrate）
   * @param {*} data - 事件数据
   * @private
   */
  _notify(event, data) {
    if (this.listeners.length === 0) {
      return
    }

    console.log(`[TaskRepository] 发布事件 [${event}]，订阅者数量: ${this.listeners.length}`)

    this.listeners.forEach(callback => {
      try {
        callback(event, data)
      } catch (err) {
        console.error(`[TaskRepository] 事件通知失败 [${event}]:`, err)
      }
    })
  }
}

// 导出单例
export default new TaskRepository()
