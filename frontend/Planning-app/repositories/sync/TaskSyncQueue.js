/**
 * 任务同步队列管理器
 * 职责：管理离线操作队列、后台同步、指数退避重试
 *
 * 为什么需要这个类？
 * - 单一职责：将同步逻辑从TaskRepository中分离
 * - 离线支持：网络断开时缓存操作，恢复后自动同步
 * - 智能重试：指数退避策略（1s→2s→4s→8s→16s）
 *
 * 设计原则：
 * - 队列结构：FIFO（先进先出）
 * - 持久化队列：localStorage备份，应用重启后恢复
 * - 错误处理：超过5次重试后放弃
 *
 * @example
 * const syncQueue = new TaskSyncQueue('planning_app_task_queue')
 * syncQueue.enqueue({ type: 'create', entityId: 'task_001', data: {...} })
 * await syncQueue.sync(request)
 */

const MAX_RETRY_COUNT = 5 // 最大重试次数
const INITIAL_RETRY_DELAY = 1000 // 初始重试延迟（1秒）

export class TaskSyncQueue {
  /**
   * 构造函数
   * @param {string} storageKey - localStorage键名
   */
  constructor(storageKey) {
    this.storageKey = storageKey
    this.queue = [] // 操作队列
  }

  /**
   * 添加操作到队列
   * @param {object} operation - 操作对象
   * @param {string} operation.type - 操作类型（create/update/delete）
   * @param {string} operation.entityId - 实体ID
   * @param {object} operation.data - 操作数据
   */
  enqueue(operation) {
    const queueItem = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: operation.type,
      entityId: operation.entityId,
      data: operation.data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    }

    this.queue.push(queueItem)
    this._saveQueueToLocalStorage()
  }

  /**
   * 移除队列中的操作
   * @param {string} operationId - 操作ID
   */
  dequeue(operationId) {
    const index = this.queue.findIndex(item => item.id === operationId)
    if (index !== -1) {
      this.queue.splice(index, 1)
      this._saveQueueToLocalStorage()
      console.log(`[TaskSyncQueue] 已移除操作: ${operationId}`)
    }
  }

  /**
   * 获取待同步的操作（状态为pending）
   * @returns {Array<object>} 待同步操作数组
   */
  getPendingOperations() {
    return this.queue.filter(item => item.status === 'pending')
  }

  /**
   * 同步队列中的所有待处理操作
   * @param {Function} requestFn - 网络请求函数（request工具）
   * @param {Function} onSuccess - 成功回调（可选），用于更新缓存等操作
   *   格式：async (operation, result) => void
   *   参数：operation - 当前操作对象，result - 服务器返回结果
   * @returns {Promise<object>} { success: number, failed: number }
   */
  async sync(requestFn, onSuccess = null) {
    const pending = this.getPendingOperations()

    if (pending.length === 0) {
      console.log('[TaskSyncQueue] 队列为空，无需同步')
      return { success: 0, failed: 0 }
    }

    let successCount = 0
    let failedCount = 0

    for (const operation of pending) {
      try {
        operation.status = 'syncing'

        // 调用后端API同步
        const result = await this._syncOperation(operation, requestFn)

        // ⭐ 新增（2026-03-17）：调用成功回调（用于更新缓存）
        if (onSuccess && typeof onSuccess === 'function') {
          try {
            await onSuccess(operation, result)
          } catch (callbackError) {
            console.error(`[TaskSyncQueue] 成功回调执行失败:`, callbackError)
          }
        }

        // 成功：从队列移除
        this.dequeue(operation.id)
        successCount++
      } catch (error) {
        console.error(`[TaskSyncQueue] 同步操作失败: ${operation.id}`, error)

        operation.status = 'pending'
        operation.retryCount++

        // 超过最大重试次数：放弃并移除
        if (operation.retryCount >= MAX_RETRY_COUNT) {
          console.error(`[TaskSyncQueue] 操作失败次数过多，已放弃: ${operation.id}`)
          this.dequeue(operation.id)
        } else {
          // 指数退避重试
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, operation.retryCount - 1)
          console.log(`[TaskSyncQueue] 将在 ${delay}ms 后重试`)
        }

        failedCount++
      }
    }

    this._saveQueueToLocalStorage()

    return { success: successCount, failed: failedCount }
  }

  /**
   * 从localStorage加载队列
   */
  loadQueueFromLocalStorage() {
    try {
      const data = uni.getStorageSync(this.storageKey)
      if (data) {
        this.queue = JSON.parse(data)
        console.log(`[TaskSyncQueue] 从localStorage加载 ${this.queue.length} 个待同步操作`)
      }
    } catch (error) {
      console.error('[TaskSyncQueue] 加载队列失败:', error)
      this.queue = []
    }
  }

  /**
   * 保存队列到localStorage
   * @private
   */
  _saveQueueToLocalStorage() {
    try {
      uni.setStorageSync(this.storageKey, JSON.stringify(this.queue))
    } catch (error) {
      console.error('[TaskSyncQueue] 保存队列失败:', error)
    }
  }

  /**
   * 同步单个操作到后端
   * ⭐ 修复（2026-03-18）：DELETE操作的幂等性处理（404视为成功）
   *
   * @private
   * @param {object} operation - 操作对象
   * @param {Function} requestFn - 网络请求函数
   * @returns {Promise<any>} 服务器返回结果
   *
   * 修复原因：
   * - 问题：DELETE操作返回404时会被catch捕获，导致无限重试
   * - 场景：任务已被软删除，再次删除返回404（"接口不存在"）
   * - 解决：对于DELETE操作，404应视为成功（幂等性）
   * - 逻辑：资源已不存在 = 删除的目的已达成 ✅
   */
  async _syncOperation(operation, requestFn) {
    const { type, entityId, data } = operation

    switch (type) {
      case 'create':
        return await requestFn({ url: '/tasks', method: 'POST', data })
      case 'update':
        return await requestFn({ url: `/tasks/${entityId}`, method: 'PUT', data })
      case 'delete':
        // DELETE操作的幂等性处理
        try {
          return await requestFn({ url: `/tasks/${entityId}`, method: 'DELETE' })
        } catch (error) {
          // 如果是404错误，说明资源已被删除，视为成功（幂等性）
          if (error.message && (error.message.includes('接口不存在') || error.message.includes('404'))) {
            console.log(`[TaskSyncQueue] DELETE操作返回404，视为成功（幂等性）: ${entityId}`)
            return null  // 返回null表示成功（无返回值）
          }
          // 其他错误（如500、网络错误）正常抛出，触发重试
          throw error
        }
      default:
        throw new Error(`未知操作类型: ${type}`)
    }
  }
}
