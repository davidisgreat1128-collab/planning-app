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
import { TaskCacheManager } from './cache/TaskCacheManager' // ⭐ 新增（2026-03-17）：缓存管理器
import { TaskSyncQueue } from './sync/TaskSyncQueue' // ⭐ 新增（2026-03-17）：同步队列管理器

// 配置常量
const STORAGE_KEY = 'planning_app_tasks'
const QUEUE_KEY = 'planning_app_task_queue'
const DEBOUNCE_DELAY = 500 // Debounce延迟（ms）

/**
 * 任务 Repository（单例模式）
 *
 * ⭐ 新增功能（2026-03-14）：事件通知机制（发布-订阅模式）
 * - 数据变化时自动通知订阅者（Store）
 * - 支持事件类型：create、update、delete、batchCreate、hydrate
 */
class TaskRepository {
  constructor() {
    // ⭐ 重构（2026-03-17）：使用缓存管理器和同步队列管理器（单一职责原则）
    this.cacheManager = new TaskCacheManager(STORAGE_KEY)
    this.syncQueue = new TaskSyncQueue(QUEUE_KEY)

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

    // ⭐ 重构（2026-03-17）：使用缓存管理器加载
    this.cacheManager.loadFromLocalStorage()

    // ⭐ 重构（2026-03-17）：使用同步队列管理器加载
    this.syncQueue.loadQueueFromLocalStorage()

    // 从服务器同步最新数据
    try {
      await this.sync()
    } catch (err) {
      console.warn('[TaskRepository] 离线模式，使用本地缓存', err)
    }

    // 重放操作队列（同步队列中的待处理操作）
    // ⭐ 传入回调函数处理 create 成功后的缓存更新
    await this.syncQueue.sync(request, this._handleSyncSuccess.bind(this))

    console.log('[TaskRepository] hydrate 完成，任务数量:', this.cacheManager.size())

    // ⭐ 发布事件：通知订阅者数据已加载完成
    this._notify('hydrate', null)
  }

  /**
   * 获取所有任务（按时间排序，过滤已删除）
   * @returns {Array<object>}
   */
  getAll() {
    // ⭐ 重构（2026-03-17）：使用缓存管理器（已自动过滤deletedAt）
    const allTasks = this.cacheManager.getAll()
    return allTasks.sort((a, b) => b.createdAt - a.createdAt)  // 按创建时间倒序
  }

  /**
   * 按 ID 获取任务
   * @param {string} id
   * @returns {object|null}
   */
  getById(id) {
    // ⭐ 重构（2026-03-17）：使用缓存管理器
    const task = this.cacheManager.get(id)
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
    console.log('  当前缓存任务数:', this.cacheManager.size())

    const task = {
      id: this._generateId(),
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    }

    console.log('  生成的任务ID:', task.id)

    // 更新内存缓存
    this.cacheManager.set(task.id, task)
    console.log('  缓存更新后任务数:', this.cacheManager.size())

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
    const task = this.cacheManager.get(id)
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
    this.cacheManager.set(id, updated)

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
    const task = this.cacheManager.get(id)
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
      this.cacheManager.set(id, updated)

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
    const task = this.cacheManager.get(id)
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
    const task = this.cacheManager.get(id)
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
    const task = this.cacheManager.get(id)
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
      this.cacheManager.set(originalTask.id, originalTask)

      // 添加新任务到缓存
      this.cacheManager.set(newTask.id, newTask)

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
    const task = this.cacheManager.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    const deletedAt = Date.now()

    // 1. 添加删除操作到队列（用于同步到服务器）
    this._addToQueue({
      type: 'delete',
      entityId: id,
      data: { deletedAt }
    })

    // 2. ⭐ 从内存缓存中移除（立即生效，避免刷新页面恢复）
    this.cacheManager.delete(id)
    console.log('[TaskRepository] 已从内存缓存中移除:', id)

    // 3. 持久化到 localStorage（memoryCache 已移除，所以 localStorage 中也会移除）
    this._saveToLocalStorage()

    // 4. 后台同步到服务器
    this._debouncedSync()

    // ⭐ 发布事件：通知订阅者任务已删除
    this._notify('delete', { id, deletedAt })
  }

  /**
   * 删除重复任务的单日实例（标记is_deleted=true）⭐ RRULE架构升级（2026-03-17）
   *
   * 设计变更：
   * - 旧方案：将日期添加到tasks.exdate数组
   * - 新方案：后端创建task_overrides记录（is_deleted=true）
   * - 原理：删除 = 阻止实例生成（非修改数据）
   *
   * @param {string} id - 任务 ID
   * @param {string} date - 目标日期（格式：YYYY-MM-DD）
   * @returns {Promise<object>} 返回{ taskId, date, isDeleted: true }
   *
   * 实现逻辑：
   * 1. 调用后端API：POST /api/v1/tasks/:id/delete-single-day
   * 2. 后端会：创建task_overrides记录（is_deleted=true）
   * 3. ⚠️ 不更新本地缓存（task对象不变）
   * 4. 通知订阅者触发重新查询（重新计算RRULE实例）
   */
  async deleteTaskSingleDay(id, date) {
    const task = this.cacheManager.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 删除单日实例（is_deleted）:', task.title || task.id, '日期:', date)

    try {
      // 调用后端API（POST /tasks/:id/delete-single-day）
      const result = await request({
        url: `/tasks/${id}/delete-single-day`,
        method: 'POST',
        data: { date }
      })

      // ⚠️ 关键变更：不再更新task.exdate字段（后端已改用task_overrides表）
      // 删除标记存储在独立表中，task对象本身不变

      // 持久化（虽然task未变，但仍执行以保持一致性）
      this._saveToLocalStorage()

      // ⭐ 通知订阅者：触发重新查询（后端会应用is_deleted过滤）
      this._notify('deleteTaskSingleDay', { taskId: id, date, isDeleted: result.isDeleted })

      return result
    } catch (error) {
      console.error('[TaskRepository] 删除单日实例失败:', error)
      throw error
    }
  }

  /**
   * 删除重复任务的全部实例（软删除任务）⭐ RRULE架构升级（2026-03-17）
   *
   * @param {string} id - 任务 ID
   * @returns {Promise<void>}
   *
   * 实现逻辑：
   * 1. 调用后端API：DELETE /api/v1/tasks/:id
   * 2. 后端会：软删除Task表记录 + 级联删除task_overrides记录
   * 3. 从本地缓存中移除任务
   * 4. 通知订阅者触发UI刷新
   */
  async deleteTaskAll(id) {
    const task = this.cacheManager.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 删除全部实例（软删除）:', task.title || task.id)

    try {
      // 调用后端API（DELETE /tasks/:id）
      await request({
        url: `/tasks/${id}`,
        method: 'DELETE'
      })

      // 从内存缓存中移除
      this.cacheManager.delete(id)
      console.log('[TaskRepository] 已从内存缓存中移除:', id)

      // 持久化
      this._saveToLocalStorage()

      // ⭐ 通知订阅者
      this._notify('deleteTaskAll', { taskId: id })
    } catch (error) {
      console.error('[TaskRepository] 删除全部实例失败:', error)
      throw error
    }
  }

  /**
   * 删除重复任务的未来实例（修改UNTIL）⭐ RRULE架构升级（2026-03-17）
   *
   * @param {string} id - 任务 ID
   * @param {string} fromDate - 从哪天开始删除（格式：YYYY-MM-DD）
   * @returns {Promise<object>} 更新后的任务对象（包含新的rrule和rruleUntil）
   *
   * 实现逻辑：
   * 1. 调用后端API：POST /api/v1/tasks/:id/delete-future
   * 2. 后端会：修改RRULE的UNTIL参数为fromDate前一天
   * 3. 更新本地缓存（Task表的rrule和rruleUntil字段）
   * 4. 通知订阅者触发重新查询
   */
  async deleteTaskFuture(id, fromDate) {
    const task = this.cacheManager.get(id)
    if (!task) {
      throw new Error(`任务不存在：${id}`)
    }

    console.log('[TaskRepository] 删除未来实例（修改UNTIL）:', task.title || task.id, '开始日期:', fromDate)

    try {
      // 调用后端API（POST /tasks/:id/delete-future）
      // ⚠️ 后端API参数名为endDate（语义："从此日期开始停止"）
      const result = await request({
        url: `/tasks/${id}/delete-future`,
        method: 'POST',
        data: { endDate: fromDate }  // ⭐ 修复：后端API期望endDate参数
      })

      // 更新本地缓存（更新rrule和rruleUntil字段）
      const updatedTask = {
        ...task,
        rrule: result.rrule,
        rruleUntil: result.rruleUntil
      }
      this.cacheManager.set(id, updatedTask)

      // 持久化
      this._saveToLocalStorage()

      // ⭐ 通知订阅者
      this._notify('deleteTaskFuture', { taskId: id, fromDate, rrule: result.rrule })

      return result
    } catch (error) {
      console.error('[TaskRepository] 删除未来实例失败:', error)
      throw error
    }
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

  /**
   * 更新缓存中的任务
   * ⭐ 新增（2026-03-17）：提供公共方法更新缓存，避免外部直接访问memoryCache
   *
   * @param {object} task - 任务对象
   * @returns {void}
   *
   * 使用场景：
   * - Store层从后端获取到最新任务数据，需要更新本地缓存
   * - 不触发操作队列（因为数据来自服务器，不需要同步回服务器）
   */
  updateCache(task) {
    if (!task || !task.id) {
      console.error('[TaskRepository] updateCache 参数无效:', task)
      return
    }

    // 直接更新缓存（不添加到操作队列）
    this.cacheManager.set(task.id, task)
    console.log('[TaskRepository] 缓存已更新:', task.id, task.title)

    // 持久化到 localStorage
    this._saveToLocalStorage()
  }

  // ========== 私有方法 ==========
  // ⭐ 注意（2026-03-17）：_loadFromLocalStorage 方法已删除
  // 该职责已委托给 TaskCacheManager.loadFromLocalStorage() 和 TaskSyncQueue.loadQueueFromLocalStorage()

  /**
   * 保存到 localStorage
   * ⭐ 重构（2026-03-17）：委托给缓存管理器
   * @private
   */
  _saveToLocalStorage() {
    // 委托给缓存管理器
    this.cacheManager.saveToLocalStorage()
  }

  /**
   * 添加操作到队列
   * ⭐ 重构（2026-03-17）：委托给同步队列管理器
   * @private
   */
  _addToQueue(operation) {
    this.syncQueue.enqueue(operation)
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
   * ⭐ 重构（2026-03-17）：使用缓存管理器
   * @private
   */
  _mergeServerData(serverData) {
    serverData.forEach(serverTask => {
      const localTask = this.cacheManager.get(serverTask.id)

      if (!localTask) {
        // 服务器有但本地没有 → 直接添加
        this.cacheManager.set(serverTask.id, serverTask)
      } else if (serverTask.updatedAt > localTask.updatedAt) {
        // 服务器更新时间更晚 → 使用服务器版本
        this.cacheManager.set(serverTask.id, serverTask)
        console.warn(`[TaskRepository] 冲突：${serverTask.title}，使用服务器版本`)
      }
      // 否则保留本地版本
    })

    this._saveToLocalStorage()
  }

  /**
   * 上传操作队列
   * ⭐ 重构（2026-03-17）：委托给同步队列管理器
   * @private
   */
  async _uploadQueue() {
    // ⭐ 委托给同步队列管理器，传入request函数和成功回调
    const result = await this.syncQueue.sync(request, this._handleSyncSuccess.bind(this))

    console.log(`[TaskRepository] 同步完成: 成功 ${result.success} 个，失败 ${result.failed} 个`)

    // 如果有成功的操作，保存缓存（因为可能更新了任务）
    if (result.success > 0) {
      this._saveToLocalStorage()
    }
  }

  /**
   * 处理同步成功后的回调（更新缓存）
   * ⭐ 新增（2026-03-17）：处理 create 操作成功后更新缓存为服务器版本
   * ⭐ 修复（2026-03-18）：create操作成功后，删除旧的临时ID条目，添加新的数字ID条目
   *
   * @private
   * @param {object} operation - 同步操作对象（含 type、entityId、data）
   * @param {object} result - 服务器返回的结果对象
   *
   * 修复原因：
   * - 旧逻辑：create成功后只添加新ID缓存，不删除旧ID，导致缓存中同时存在临时ID和真实ID
   * - 问题：UI显示的任务使用临时ID，删除时发送临时ID到后端，后端要求数字ID（400错误）
   * - 新逻辑：删除旧的临时ID条目 → 添加新的数字ID条目 → 通知Store层更新
   */
  async _handleSyncSuccess(operation, result) {
    // 只处理 create 操作（update/delete 不需要更新缓存）
    if (operation.type === 'create' && result && result.id) {
      const tempId = operation.entityId  // 临时ID（字符串，如 task_xxx）
      const realId = result.id           // 真实ID（数字，如 123）

      console.log(`[TaskRepository] create同步成功，ID映射：${tempId} → ${realId}`)

      // ⭐ 修复（2026-03-18）：删除旧的临时ID条目
      if (this.cacheManager.get(tempId)) {
        this.cacheManager.delete(tempId)
        console.log(`[TaskRepository] 已删除临时ID条目: ${tempId}`)
      }

      // ⭐ 添加新的数字ID条目（使用后端返回的完整任务对象）
      this.cacheManager.set(realId, result)
      console.log(`[TaskRepository] 已添加真实ID条目: ${realId}`)

      // ⭐ 持久化到localStorage
      this._saveToLocalStorage()

      // ⭐ 通知订阅者：ID已更新（Store层需要更新tasks数组）
      this._notify('idUpdated', { tempId, realId, task: result })
    }
  }

  // ⭐ 注意（2026-03-17）：_replayQueue 方法已删除
  // 该职责已委托给 TaskSyncQueue.sync()

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

  /**
   * 等待同步队列完成（用于解决DELETE和fetchTasksByDate()竞态条件）
   *
   * @description
   * 当同步队列中有待同步操作时，等待其完成。
   * 主要用于确保DELETE操作已同步到服务器后，再执行依赖服务器状态的操作（如fetchTasksByDate）。
   *
   * @returns {Promise<void>} 无返回值，当队列为空或超时后resolve
   *
   * @example
   * // Store层使用
   * await TaskRepository.delete(182)
   * await TaskRepository.delete(183)
   * await TaskRepository.waitForSync()  // 等待DELETE请求完成
   * // 此时fetchTasksByDate()不会返回已删除任务
   *
   * @throws {Error} 不抛出异常，超时后自动resolve（容错）
   */
  async waitForSync() {
    // 队列为空，无需等待
    if (this.syncQueue.queue.length === 0) {
      console.log('[TaskRepository.waitForSync] 队列为空，无需等待')
      return
    }

    console.log('[TaskRepository.waitForSync] 等待同步队列完成，当前队列长度:', this.syncQueue.queue.length)

    // 等待同步完成
    return new Promise((resolve) => {
      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime

        // 队列已清空且未在同步中
        if (this.syncQueue.queue.length === 0 && !this.syncQueue.isSyncing) {
          console.log(`[TaskRepository.waitForSync] 同步队列已完成（耗时: ${elapsed}ms）`)
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)  // 每50ms检查一次

      // 超时保护（最多等待5秒）
      setTimeout(() => {
        const elapsed = Date.now() - startTime
        console.warn(`[TaskRepository.waitForSync] 等待超时（${elapsed}ms），强制继续`)
        console.warn('  剩余队列长度:', this.syncQueue.queue.length)
        console.warn('  是否正在同步:', this.syncQueue.isSyncing)
        clearInterval(checkInterval)
        resolve()  // 即使超时也resolve，不影响后续流程（容错）
      }, 5000)
    })
  }
}

// 导出单例
export default new TaskRepository()
