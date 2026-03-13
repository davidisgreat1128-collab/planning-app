/**
 * CategoryRepository - 分类数据访问层
 *
 * 职责：
 * - 管理分类数据的 CRUD 操作
 * - 内存缓存（Map）+ localStorage 持久化
 * - 离线操作队列 + 后台同步
 * - 乐观锁版本控制（version 字段）
 * - 排序逻辑（sortOrder 字段）
 * - 软删除（deletedAt 字段）
 *
 * 使用方式：
 * ```javascript
 * import CategoryRepository from '@/repositories/CategoryRepository'
 *
 * // App 启动时
 * await CategoryRepository.hydrate()
 *
 * // 获取所有分类
 * const categories = CategoryRepository.getAll()
 *
 * // 创建分类
 * const newCat = await CategoryRepository.create({ name: '工作', color: '#FF0000' })
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04
 */

// 配置常量
const STORAGE_KEY = 'planning_app_categories'
const QUEUE_KEY = 'planning_app_category_queue'
const DEBOUNCE_DELAY = 500  // 500ms
const MAX_RETRY = 5         // 最多重试5次

/**
 * 分类 Repository（单例模式）
 */
class CategoryRepository {
  constructor() {
    // 内存缓存（Map: id → category）
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
   * 启动时加载数据（hydrate）
   *
   * 流程：
   * 1. 从 localStorage 加载缓存
   * 2. 从服务器同步最新数据
   * 3. 合并本地未同步的修改
   * 4. 重放操作队列
   *
   * @returns {Promise<void>}
   */
  async hydrate() {
    console.log('[CategoryRepository] 开始 hydrate...')

    // 步骤1: 从 localStorage 加载缓存（离线可用）
    this._loadFromLocalStorage()

    // 步骤2: 从服务器同步最新数据（在线时）
    try {
      await this.sync()
    } catch (err) {
      console.warn('[CategoryRepository] 离线模式，使用本地缓存', err)
    }

    // 步骤3: 重放操作队列（上传未同步的修改）
    await this._replayQueue()

    console.log('[CategoryRepository] hydrate 完成，分类数量:', this.memoryCache.size)
  }

  /**
   * 获取所有分类（已排序，过滤已删除）
   *
   * @returns {Array<object>} 分类数组
   */
  getAll() {
    const allCategories = Array.from(this.memoryCache.values())
    const activeCategories = allCategories.filter(cat => !cat.deletedAt)

    // ⭐ 诊断日志：检查分类数据
    console.log('[CategoryRepository] getAll 诊断:')
    console.log(`  总分类数: ${allCategories.length}`)
    console.log(`  未删除分类数: ${activeCategories.length}`)

    // 统计分类类型
    const categoryTypeCount = activeCategories.filter(c => c.type === 'category' || !c.type).length
    const planTypeCount = activeCategories.filter(c => c.type === 'plan').length

    console.log(`  普通分类: ${categoryTypeCount}`)
    console.log(`  规划分类: ${planTypeCount}`)

    // ⭐ 打印每个分类的详细信息
    activeCategories.forEach(cat => {
      console.log(`  [分类] id=${cat.id}, name=${cat.name}, type=${cat.type}, deletedAt=${cat.deletedAt}`)
    })

    return activeCategories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))  // 按 sortOrder 排序
  }

  /**
   * 按 ID 获取分类
   *
   * @param {string} id - 分类 ID
   * @returns {object|null} 分类对象，不存在返回 null
   */
  getById(id) {
    const cat = this.memoryCache.get(id)
    return cat && !cat.deletedAt ? cat : null  // 软删除的视为不存在
  }

  /**
   * 创建分类
   *
   * @param {object} data - 分类数据 { name, color, icon, iconEmoji, type, sortOrder }
   * @returns {Promise<object>} 创建的分类对象
   */
  async create(data) {
    // 1. 构造完整对象
    const category = {
      id: this._generateId(),  // 生成唯一 ID
      name: data.name || '',
      color: data.color || '#000000',
      icon: data.icon || '',               // 图标ID
      iconEmoji: data.iconEmoji || '',     // 图标Emoji
      type: data.type || 'category',       // 类型：category（普通分类）或 plan（规划）
      sortOrder: data.sortOrder ?? this.memoryCache.size,  // 默认排在最后
      version: 1,              // 初始版本号
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,

      // ⭐ 规划特有字段（type='plan'时使用）
      buff: data.buff || '',               // Buff激励语
      startDate: data.startDate || '',     // 开始日期（yyyy/MM/dd）
      endDate: data.endDate || '',         // 结束日期（yyyy/MM/dd）
      duration: data.duration || '',       // 持续时间描述
      milestones: data.milestones || [],   // 里程碑数组
      stats: data.stats || {               // 统计数据
        totalMilestones: 0,
        completedMilestones: 0,
        totalDays: 0,
        progressDays: 0
      }
    }

    console.log('[CategoryRepository] 创建分类:', category.name)

    // 2. 更新内存缓存
    this.memoryCache.set(category.id, category)

    // 3. 添加到操作队列
    this._addToQueue({
      type: 'create',
      entityId: category.id,
      data: category
    })

    // 4. 持久化到 localStorage
    this._saveToLocalStorage()

    // 5. 后台同步到服务器（debounce 500ms）
    this._debouncedSync()

    return category
  }

  /**
   * 更新分类（乐观锁版本控制）
   *
   * @param {string} id - 分类 ID
   * @param {object} data - 要更新的字段
   * @returns {Promise<object>} 更新后的分类对象
   */
  async update(id, data) {
    const category = this.memoryCache.get(id)
    if (!category) {
      throw new Error(`分类不存在：${id}`)
    }

    console.log('[CategoryRepository] 更新分类:', category.name)

    // 乐观锁：递增 version
    const updated = {
      ...category,
      ...data,
      version: category.version + 1,  // ← 关键：版本号+1
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
   * 删除分类
   *
   * @param {string} id - 分类 ID
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
    const category = this.memoryCache.get(id)
    if (!category) {
      throw new Error(`分类不存在：${id}`)
    }

    console.log('[CategoryRepository] 删除分类:', category.name)

    const deletedAt = Date.now()

    // 1. 添加删除操作到队列（用于同步到服务器）
    this._addToQueue({
      type: 'delete',
      entityId: id,
      data: { deletedAt }
    })

    // 2. ⭐ 从内存缓存中移除（立即生效，避免刷新页面恢复）
    this.memoryCache.delete(id)
    console.log('[CategoryRepository] 已从内存缓存中移除:', id)

    // 3. 持久化到 localStorage（memoryCache 已移除，所以 localStorage 中也会移除）
    this._saveToLocalStorage()

    // 4. 后台同步到服务器
    this._debouncedSync()
  }

  /**
   * 同步到服务器（三步流程）
   *
   * @returns {Promise<void>}
   */
  async sync() {
    if (this.isSyncing) {
      console.log('[CategoryRepository] 已在同步中，跳过')
      return
    }

    this.isSyncing = true
    try {
      console.log('[CategoryRepository] 开始同步...')

      // 步骤1: 获取服务器最新数据
      // TODO: 调用后端 API（当前为空实现，待后续集成）
      // const serverData = await categoryApi.getAll()

      // 步骤2: 合并服务器数据（处理版本冲突）
      // this._mergeServerData(serverData)

      // 步骤3: 上传本地操作队列
      await this._uploadQueue()

      this.lastSyncTime = Date.now()
      console.log('[CategoryRepository] 同步完成')
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
    // 加载数据
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const categories = JSON.parse(cached)

        // ⭐ 自动清理垃圾数据：过滤掉 deletedAt 不为 null 的数据
        const beforeCount = categories.length
        const cleaned = categories.filter(cat => !cat.deletedAt)
        const garbageCount = beforeCount - cleaned.length

        if (garbageCount > 0) {
          console.warn(`[CategoryRepository] 检测到 ${garbageCount} 个垃圾分类（deletedAt 不为 null），已自动清理`)
          // 立即保存清理后的数据到 localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
        }

        cleaned.forEach(cat => {
          this.memoryCache.set(cat.id, cat)
        })
        console.log('[CategoryRepository] 从缓存加载', cleaned.length, '个分类（清理后）')
      } catch (err) {
        console.error('[CategoryRepository] 缓存数据损坏，清除缓存', err)
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    // 加载队列
    const queue = localStorage.getItem(QUEUE_KEY)
    if (queue) {
      try {
        this.operationQueue = JSON.parse(queue)
        console.log('[CategoryRepository] 从缓存加载', this.operationQueue.length, '个待同步操作')
      } catch (err) {
        console.error('[CategoryRepository] 队列数据损坏，清除队列', err)
        localStorage.removeItem(QUEUE_KEY)
      }
    }
  }

  /**
   * 保存到 localStorage
   * @private
   */
  _saveToLocalStorage() {
    const categories = Array.from(this.memoryCache.values())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this.operationQueue))
  }

  /**
   * 添加操作到队列
   * @private
   * @param {object} operation - 操作对象 { type, entityId, data }
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
   * Debounce 同步（500ms 延迟）
   * @private
   */
  _debouncedSync() {
    clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.sync().catch(err => console.error('[CategoryRepository] 同步失败', err))
    }, DEBOUNCE_DELAY)
  }

  /**
   * 合并服务器数据（处理版本冲突）
   * @private
   * @param {Array<object>} serverData - 服务器数据
   */
  _mergeServerData(serverData) {
    serverData.forEach(serverCat => {
      const localCat = this.memoryCache.get(serverCat.id)

      if (!localCat) {
        // 服务器有但本地没有 → 新数据，直接添加
        this.memoryCache.set(serverCat.id, serverCat)
      } else if (serverCat.version > localCat.version) {
        // 服务器版本更新 → 覆盖本地
        this.memoryCache.set(serverCat.id, serverCat)
        console.warn(`[CategoryRepository] 版本冲突：${serverCat.name}，使用服务器版本`)
      }
      // 否则保留本地版本（本地优先）
    })

    this._saveToLocalStorage()
  }

  /**
   * 上传操作队列（指数退避重试）
   * @private
   * @returns {Promise<void>}
   */
  async _uploadQueue() {
    const pendingOps = this.operationQueue.filter(op => op.status === 'pending')

    if (pendingOps.length === 0) {
      return
    }

    console.log('[CategoryRepository] 上传队列，待处理操作:', pendingOps.length)

    for (const op of pendingOps) {
      try {
        op.status = 'syncing'

        // TODO: 调用后端 API（当前为空实现，待后续集成）
        // if (op.type === 'create') {
        //   await categoryApi.create(op.data)
        // } else if (op.type === 'update') {
        //   await categoryApi.update(op.entityId, op.data)
        // } else if (op.type === 'delete') {
        //   await categoryApi.delete(op.entityId)
        // }

        // 模拟成功（实际应等待 API 响应）
        console.log(`[CategoryRepository] 操作 ${op.type} 成功:`, op.entityId)

        // 成功 → 从队列移除
        this.operationQueue = this.operationQueue.filter(o => o.id !== op.id)
      } catch (err) {
        op.status = 'failed'
        op.retryCount++

        // 超过最大重试次数 → 放弃
        if (op.retryCount >= MAX_RETRY) {
          console.error(`[CategoryRepository] 操作失败（已重试${MAX_RETRY}次），放弃`, op)
          this.operationQueue = this.operationQueue.filter(o => o.id !== op.id)
        } else {
          // 指数退避：1s → 2s → 4s → 8s → 16s
          const delay = Math.pow(2, op.retryCount) * 1000
          console.warn(`[CategoryRepository] 操作失败，${delay}ms 后重试`, op)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // 更新 localStorage
    this._saveToLocalStorage()
  }

  /**
   * 重放操作队列
   * @private
   * @returns {Promise<void>}
   */
  async _replayQueue() {
    await this._uploadQueue()
  }

  /**
   * 生成唯一 ID
   * @private
   * @returns {string} 格式: cat_timestamp_random
   */
  _generateId() {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出单例
export default new CategoryRepository()
