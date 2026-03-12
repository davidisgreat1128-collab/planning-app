/**
 * 模板仓库（Template Repository）
 *
 * 职责：
 * - 管理规划模板数据的 CRUD 操作
 * - 内存缓存（Map 结构，快速查找）
 * - 本地持久化（localStorage，离线支持）
 * - 服务器同步（后续实现）
 *
 * 数据流：
 * - 读取：localStorage → memoryCache → 返回给 Store
 * - 写入：memoryCache → localStorage（debounce 500ms）→ 服务器（debounce 500ms）
 *
 * 缓存策略：
 * - Memory Cache: Map 结构（id → template），O(1) 查找性能
 * - LocalStorage: 持久化备份，debounce 写入避免频繁 I/O
 * - 容量限制：5MB（约可存储 100+ 模板）
 *
 * 创建时间：2026-03-12
 * 创建原因：SRP 重构 Stage 3 - 数据访问层，符合四层架构
 */

class TemplateRepository {
  constructor() {
    /**
     * 内存缓存（Map: templateId → template对象）
     * @type {Map<string, object>}
     */
    this.memoryCache = new Map()

    /**
     * LocalStorage Key
     * @type {string}
     */
    this.storageKey = 'planning_app_templates'

    /**
     * 版本号 Key（用于检测数据版本）
     * @type {string}
     */
    this.versionKey = 'planning_app_templates_version'

    /**
     * 当前数据版本（新增模板时需要增加版本号）
     * @type {number}
     */
    this.currentVersion = 2 // v1: 只有tpl_1, v2: 有tpl_1~tpl_4

    /**
     * Debounce 定时器（用于延迟写入 localStorage）
     * @type {number|null}
     */
    this.saveTimer = null

    /**
     * 是否已初始化（hydrate 是否已调用）
     * @type {boolean}
     */
    this.isHydrated = false

    console.log('[TemplateRepository] 仓库已创建')
  }

  // ============================================================
  // 1. 初始化和数据加载
  // ============================================================

  /**
   * 启动时加载数据（从 localStorage 加载 → 内存缓存）
   * 必须在 App.vue onLaunch 时调用
   *
   * @returns {Promise<void>}
   */
  async hydrate() {
    if (this.isHydrated) {
      console.log('[TemplateRepository] 已初始化，跳过重复 hydrate')
      console.log('[TemplateRepository] 当前缓存的模板ID列表:', Array.from(this.memoryCache.keys()))
      return
    }

    console.log('[TemplateRepository] 开始 hydrate：加载本地缓存数据')

    try {
      // 检查数据版本
      const savedVersion = uni.getStorageSync(this.versionKey)
      console.log(`[TemplateRepository] 保存的版本: ${savedVersion}, 当前版本: ${this.currentVersion}`)

      // 版本不匹配，清除旧数据
      if (savedVersion !== this.currentVersion) {
        console.warn(`[TemplateRepository] ⚠️ 版本不匹配，清除旧数据并重新加载默认模板`)
        uni.removeStorageSync(this.storageKey)
        uni.setStorageSync(this.versionKey, this.currentVersion)
        this._loadDefaultTemplates()
      } else {
        // 版本匹配，从 localStorage 加载
        const cachedData = uni.getStorageSync(this.storageKey)
        console.log('[TemplateRepository] localStorage 原始数据:', cachedData ? `${cachedData.substring(0, 100)}...` : 'null')

        if (cachedData) {
          const templates = JSON.parse(cachedData)
          console.log(`[TemplateRepository] 从 localStorage 加载了 ${templates.length} 个模板`)
          console.log('[TemplateRepository] 模板ID列表:', templates.map(t => t.id))

          // 写入内存缓存
          templates.forEach((template) => {
            this.memoryCache.set(template.id, template)
            console.log(`[TemplateRepository] 缓存模板: ${template.id} - ${template.title}`)
          })
        } else {
          console.log('[TemplateRepository] localStorage 无缓存，使用默认模板数据')
          this._loadDefaultTemplates()
        }
      }

      this.isHydrated = true
      console.log('[TemplateRepository] hydrate 完成')
      console.log('[TemplateRepository] 最终缓存的模板数量:', this.memoryCache.size)
      console.log('[TemplateRepository] 最终缓存的模板ID列表:', Array.from(this.memoryCache.keys()))
    } catch (error) {
      console.error('[TemplateRepository] hydrate 失败:', error)
      // 降级：加载默认模板
      this._loadDefaultTemplates()
      this.isHydrated = true
    }
  }

  /**
   * 加载默认模板数据（硬编码，用于初始化）
   * @private
   */
  _loadDefaultTemplates() {
    const defaultTemplates = [
      // 模板 1：一个科学的攒钱模式
      {
        id: 'tpl_1',
        title: '一个科学的攒钱模式',
        coverImage: '/static/images/template-money.jpg',
        tags: ['培养理财能力', '财务管理'],
        users: 8141,
        userAvatars: [
          '/static/images/avatar1.png',
          '/static/images/avatar2.png',
          '/static/images/avatar3.png'
        ],
        buff: '财富自由，从今天开始',
        duration: 30,
        milestones: [
          {
            title: '建立理财意识',
            description: '认识到理财的重要性，了解复利的力量。',
            days: '第7天'
          },
          {
            title: '制定储蓄计划',
            description: '根据收入和支出，制定合理的储蓄目标和计划。',
            days: '第15天'
          },
          {
            title: '养成记账习惯',
            description: '坚持每日记账，了解自己的消费习惯和资金流向。',
            days: '第30天'
          }
        ],
        days: Array.from({ length: 30 }, (_, i) => i + 1),
        tasksByDay: {
          1: [
            { title: '记录今日收支情况', isRepeat: true, priority: 'high' },
            { title: '设定月度储蓄目标', isRepeat: false, priority: 'high' }
          ],
          2: [
            { title: '记录今日收支情况', isRepeat: true, priority: 'high' },
            { title: '分析昨日消费习惯', isRepeat: false, priority: 'medium' }
          ],
          3: [
            { title: '记录今日收支情况', isRepeat: true, priority: 'high' },
            { title: '制定每周储蓄计划', isRepeat: false, priority: 'medium' }
          ]
        }
      },

      // 模板 2：循序渐进养成良好作息
      {
        id: 'tpl_2',
        title: '循序渐进养成良好作息',
        coverImage: '/static/images/template-sleep.jpg',
        tags: ['作息改善', '健康生活'],
        users: 9504,
        userAvatars: [
          '/static/images/avatar1.png',
          '/static/images/avatar2.png',
          '/static/images/avatar3.png'
        ],
        buff: '早睡早起，健康生活',
        duration: 21,
        milestones: [
          {
            title: '调整作息时间',
            description: '逐步将睡眠时间提前30分钟，养成规律作息。',
            days: '第7天'
          },
          {
            title: '稳定睡眠周期',
            description: '保持固定的睡眠和起床时间，形成生物钟。',
            days: '第14天'
          },
          {
            title: '养成良好习惯',
            description: '睡前避免使用电子设备，提高睡眠质量。',
            days: '第21天'
          }
        ],
        days: Array.from({ length: 21 }, (_, i) => i + 1),
        tasksByDay: {
          1: [
            { title: '晚上11点前上床', isRepeat: true, priority: 'high' },
            { title: '早上7点前起床', isRepeat: true, priority: 'high' }
          ],
          2: [
            { title: '晚上11点前上床', isRepeat: true, priority: 'high' },
            { title: '早上7点前起床', isRepeat: true, priority: 'high' }
          ],
          3: [
            { title: '晚上11点前上床', isRepeat: true, priority: 'high' },
            { title: '睡前阅读15分钟', isRepeat: true, priority: 'medium' }
          ]
        }
      },

      // 模板 3：晨跑打卡计划
      {
        id: 'tpl_3',
        title: '晨跑打卡计划',
        coverImage: '/static/images/template-running.jpg',
        tags: ['健康生活', '运动健身'],
        users: 5623,
        userAvatars: [
          '/static/images/avatar1.png',
          '/static/images/avatar2.png',
          '/static/images/avatar3.png'
        ],
        buff: '坚持晨跑，拥抱健康',
        duration: 30,
        milestones: [
          {
            title: '开始晨跑',
            description: '每天早晨坚持跑步30分钟，养成运动习惯。',
            days: '第7天'
          },
          {
            title: '提升跑量',
            description: '逐步增加跑步距离，从3公里提升到5公里。',
            days: '第15天'
          },
          {
            title: '形成习惯',
            description: '晨跑已成为生活的一部分，体能明显提升。',
            days: '第30天'
          }
        ],
        days: Array.from({ length: 30 }, (_, i) => i + 1),
        tasksByDay: {
          1: [
            { title: '晨跑30分钟', isRepeat: true, priority: 'high' },
            { title: '跑步后拉伸10分钟', isRepeat: true, priority: 'medium' }
          ],
          2: [
            { title: '晨跑30分钟', isRepeat: true, priority: 'high' },
            { title: '记录跑步距离和时间', isRepeat: true, priority: 'medium' }
          ],
          3: [
            { title: '晨跑30分钟', isRepeat: true, priority: 'high' },
            { title: '补充水分和能量', isRepeat: true, priority: 'medium' }
          ]
        }
      },

      // 模板 4：每日任务清单
      {
        id: 'tpl_4',
        title: '每日任务清单',
        coverImage: '/static/images/template-checklist.jpg',
        tags: ['效率提升', '时间管理'],
        users: 7234,
        userAvatars: [
          '/static/images/avatar1.png',
          '/static/images/avatar2.png',
          '/static/images/avatar3.png'
        ],
        buff: '高效管理，提升效率',
        duration: 30,
        milestones: [
          {
            title: '建立任务清单习惯',
            description: '每天制定任务清单，养成计划习惯。',
            days: '第7天'
          },
          {
            title: '优化任务优先级',
            description: '学会区分任务优先级，提高执行效率。',
            days: '第15天'
          },
          {
            title: '掌握时间管理',
            description: '完全掌握任务清单方法，时间利用率显著提升。',
            days: '第30天'
          }
        ],
        days: Array.from({ length: 30 }, (_, i) => i + 1),
        tasksByDay: {
          1: [
            { title: '制定今日任务清单', isRepeat: true, priority: 'high' },
            { title: '完成3个重要任务', isRepeat: true, priority: 'high' }
          ],
          2: [
            { title: '制定今日任务清单', isRepeat: true, priority: 'high' },
            { title: '回顾昨日完成情况', isRepeat: true, priority: 'medium' }
          ],
          3: [
            { title: '制定今日任务清单', isRepeat: true, priority: 'high' },
            { title: '优化任务执行流程', isRepeat: true, priority: 'medium' }
          ]
        }
      }
    ]

    defaultTemplates.forEach((template) => {
      this.memoryCache.set(template.id, template)
      console.log(`[TemplateRepository] 默认模板缓存: ${template.id} - ${template.title}`)
    })

    console.log(`[TemplateRepository] 加载了 ${defaultTemplates.length} 个默认模板`)
    console.log('[TemplateRepository] 默认模板ID列表:', defaultTemplates.map(t => t.id))

    // 保存到 localStorage
    this._saveToLocalStorage()
  }

  // ============================================================
  // 2. 数据读取
  // ============================================================

  /**
   * 获取所有模板（从内存缓存）
   *
   * @returns {Array<object>} 模板数组
   */
  getAll() {
    if (!this.isHydrated) {
      console.warn('[TemplateRepository] 未初始化，请先调用 hydrate()')
      return []
    }

    const templates = Array.from(this.memoryCache.values())
    console.log(`[TemplateRepository] getAll: 返回 ${templates.length} 个模板`)
    return templates
  }

  /**
   * 按 ID 获取单个模板
   *
   * @param {string} id - 模板 ID
   * @returns {object|null} 模板对象，不存在时返回 null
   */
  getById(id) {
    console.log(`[TemplateRepository] getById 调用: 查找模板 ${id}`)
    console.log('[TemplateRepository] 当前 isHydrated 状态:', this.isHydrated)
    console.log('[TemplateRepository] 当前缓存大小:', this.memoryCache.size)
    console.log('[TemplateRepository] 当前缓存的所有ID:', Array.from(this.memoryCache.keys()))

    if (!this.isHydrated) {
      console.warn('[TemplateRepository] ⚠️ 未初始化，请先调用 hydrate()')
      console.warn('[TemplateRepository] ⚠️ 缓存状态异常，尝试强制加载默认模板')
      this._loadDefaultTemplates()
      this.isHydrated = true
    }

    const template = this.memoryCache.get(id)

    if (template) {
      console.log(`[TemplateRepository] ✅ getById: 找到模板 ${id} - ${template.title}`)
      return { ...template } // 返回副本，避免外部修改缓存
    } else {
      console.error(`[TemplateRepository] ❌ getById: 模板 ${id} 不存在`)
      console.error('[TemplateRepository] ❌ 可用的模板ID列表:', Array.from(this.memoryCache.keys()))
      return null
    }
  }

  // ============================================================
  // 3. 数据写入（CRUD）
  // ============================================================

  /**
   * 创建新模板
   *
   * @param {object} templateData - 模板数据
   * @returns {Promise<object>} 创建后的模板对象
   */
  async create(templateData) {
    const newTemplate = {
      id: `tpl_${Date.now()}`, // 生成唯一 ID
      ...templateData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.memoryCache.set(newTemplate.id, newTemplate)
    console.log(`[TemplateRepository] create: 创建模板 ${newTemplate.id}`)

    // Debounce 写入 localStorage
    this._saveToLocalStorage()

    return { ...newTemplate }
  }

  /**
   * 更新模板
   *
   * @param {string} id - 模板 ID
   * @param {object} updates - 更新的字段
   * @returns {Promise<object|null>} 更新后的模板对象
   */
  async update(id, updates) {
    const template = this.memoryCache.get(id)

    if (!template) {
      console.error(`[TemplateRepository] update: 模板 ${id} 不存在`)
      return null
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now()
    }

    this.memoryCache.set(id, updatedTemplate)
    console.log(`[TemplateRepository] update: 更新模板 ${id}`)

    // Debounce 写入 localStorage
    this._saveToLocalStorage()

    return { ...updatedTemplate }
  }

  /**
   * 删除模板（软删除，标记 deletedAt）
   *
   * @param {string} id - 模板 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    const template = this.memoryCache.get(id)

    if (!template) {
      console.error(`[TemplateRepository] delete: 模板 ${id} 不存在`)
      return false
    }

    // 软删除：标记 deletedAt
    const deletedTemplate = {
      ...template,
      deletedAt: Date.now()
    }

    this.memoryCache.set(id, deletedTemplate)
    console.log(`[TemplateRepository] delete: 软删除模板 ${id}`)

    // Debounce 写入 localStorage
    this._saveToLocalStorage()

    return true
  }

  // ============================================================
  // 4. 持久化（LocalStorage）
  // ============================================================

  /**
   * 保存到 localStorage（Debounce 500ms）
   * @private
   */
  _saveToLocalStorage() {
    // 清除之前的定时器
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    // Debounce 500ms
    this.saveTimer = setTimeout(() => {
      try {
        const templates = Array.from(this.memoryCache.values())
        const jsonData = JSON.stringify(templates)

        uni.setStorageSync(this.storageKey, jsonData)
        console.log(`[TemplateRepository] 保存 ${templates.length} 个模板到 localStorage`)
      } catch (error) {
        console.error('[TemplateRepository] 保存到 localStorage 失败:', error)
      }
    }, 500)
  }

  // ============================================================
  // 5. 工具方法
  // ============================================================

  /**
   * 清空所有数据（谨慎使用）
   */
  clear() {
    this.memoryCache.clear()
    uni.removeStorageSync(this.storageKey)
    console.log('[TemplateRepository] 已清空所有模板数据')
  }

  /**
   * 获取统计信息
   *
   * @returns {object} 统计信息
   */
  getStats() {
    return {
      totalTemplates: this.memoryCache.size,
      isHydrated: this.isHydrated,
      storageKey: this.storageKey
    }
  }
}

// ============================================================
// 导出单例实例（利用 Node.js require 缓存机制）
// ============================================================

/**
 * TemplateRepository 单例实例
 * 同一进程中只创建一次，后续 require/import 直接返回缓存
 */
export const templateRepository = new TemplateRepository()

// 默认导出（支持两种引入方式）
export default templateRepository
