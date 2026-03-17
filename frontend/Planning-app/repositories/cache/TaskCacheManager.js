/**
 * 任务缓存管理器
 * 职责：管理内存缓存（memoryCache）和本地持久化（localStorage）
 *
 * 为什么需要这个类？
 * - 单一职责：将缓存逻辑从TaskRepository中分离
 * - 可测试性：独立的缓存逻辑便于单元测试
 * - 可维护性：缓存策略变化时只需修改此文件
 *
 * 设计原则：
 * - 使用Map结构（O(1)查找性能）
 * - localStorage作为备份（5MB容量限制）
 * - Debounce写入（500ms延迟，避免频繁磁盘I/O）
 *
 * @example
 * const cacheManager = new TaskCacheManager('planning_app_tasks')
 * cacheManager.set(task.id, task)
 * const task = cacheManager.get(taskId)
 */

const DEBOUNCE_DELAY = 500 // localStorage写入防抖延迟（ms）

export class TaskCacheManager {
  /**
   * 构造函数
   * @param {string} storageKey - localStorage键名
   */
  constructor(storageKey) {
    this.storageKey = storageKey
    this.memoryCache = new Map() // 内存缓存（快速访问）
    this.saveTimer = null // Debounce定时器
  }

  /**
   * 获取任务（从内存缓存）
   * @param {string} id - 任务ID
   * @returns {object|null} 任务对象，不存在返回null
   */
  get(id) {
    return this.memoryCache.get(id) || null
  }

  /**
   * 设置任务（写入内存缓存，自动触发localStorage持久化）
   * @param {string} id - 任务ID
   * @param {object} task - 任务对象
   */
  set(id, task) {
    this.memoryCache.set(id, task)
    this._scheduleSave() // 自动触发持久化（防抖）
  }

  /**
   * 删除任务（从内存缓存，自动触发localStorage持久化）
   * @param {string} id - 任务ID
   */
  delete(id) {
    this.memoryCache.delete(id)
    this._scheduleSave()
  }

  /**
   * 获取所有任务（从内存缓存）
   * @returns {Array<object>} 任务数组（按sortOrder排序）
   */
  getAll() {
    return Array.from(this.memoryCache.values())
      .filter(task => !task.deletedAt) // 排除软删除的任务
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  }

  /**
   * 清空缓存（内存 + localStorage）
   */
  clear() {
    this.memoryCache.clear()
    uni.removeStorageSync(this.storageKey)
  }

  /**
   * 获取缓存大小
   * @returns {number} 任务数量
   */
  size() {
    return this.memoryCache.size
  }

  /**
   * 从localStorage加载数据到内存缓存
   * @returns {number} 加载的任务数量
   */
  loadFromLocalStorage() {
    try {
      const data = uni.getStorageSync(this.storageKey)
      if (!data) {
        console.log('[TaskCacheManager] localStorage无数据，跳过加载')
        return 0
      }

      const tasks = JSON.parse(data)
      if (!Array.isArray(tasks)) {
        console.warn('[TaskCacheManager] localStorage数据格式错误，期望数组')
        return 0
      }

      tasks.forEach(task => {
        this.memoryCache.set(task.id, task)
      })

      console.log(`[TaskCacheManager] 从localStorage加载 ${tasks.length} 个任务`)
      return tasks.length
    } catch (error) {
      console.error('[TaskCacheManager] 从localStorage加载失败:', error)
      return 0
    }
  }

  /**
   * 保存内存缓存到localStorage（立即执行，无防抖）
   */
  saveToLocalStorage() {
    try {
      const tasks = Array.from(this.memoryCache.values())
      uni.setStorageSync(this.storageKey, JSON.stringify(tasks))
      console.log(`[TaskCacheManager] 已保存 ${tasks.length} 个任务到localStorage`)
    } catch (error) {
      console.error('[TaskCacheManager] 保存到localStorage失败:', error)
    }
  }

  /**
   * 计划保存（防抖，500ms延迟）
   * @private
   */
  _scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.saveTimer = setTimeout(() => {
      this.saveToLocalStorage()
      this.saveTimer = null
    }, DEBOUNCE_DELAY)
  }
}
