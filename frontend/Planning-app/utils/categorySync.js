/**
 * categorySync.js - 分类/规划字段同步工具
 *
 * 职责：处理Task模型中categoryId和planId的同步逻辑
 *
 * 核心业务规则（2026-03-12）：
 * - Task模型有两个字段：categoryId（分类）和 planId（规划）
 * - 一个任务只能属于以下之一：
 *   1. 某个分类（categoryId有值，planId为null）
 *   2. 某个规划（planId有值，categoryId为null）
 *   3. 无分类（categoryId和planId都为null）
 * - 通过 category.type 字段区分：
 *   - type='category' → 设置给 categoryId
 *   - type='plan' → 设置给 planId
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-12
 * @version 1.0.0
 */

/**
 * 根据分类/规划ID和类型，同步到表单的categoryId和planId字段
 *
 * @param {Object} options - 配置选项
 * @param {string|null} options.selectedId - 用户手动选择的ID（优先级高）
 * @param {string|null} options.fallbackId - 备用ID（如props传入的categoryId，优先级低）
 * @param {Array<Object>} options.categories - 分类列表（包含分类和规划）
 * @param {string} options.categories[].id - 分类/规划ID
 * @param {string} options.categories[].type - 类型（'category' | 'plan'）
 *
 * @returns {Object} 同步结果
 * @returns {string|null} returns.categoryId - 分类ID（如果是分类）
 * @returns {string|null} returns.planId - 规划ID（如果是规划）
 *
 * @example
 * // 场景1：用户选择了一个分类
 * const result = syncCategoryFields({
 *   selectedId: 'cat_001',
 *   fallbackId: null,
 *   categories: [
 *     { id: 'cat_001', name: '工作', type: 'category' },
 *     { id: 'plan_001', name: '健身计划', type: 'plan' }
 *   ]
 * })
 * // => { categoryId: 'cat_001', planId: null }
 *
 * @example
 * // 场景2：用户选择了一个规划
 * const result = syncCategoryFields({
 *   selectedId: 'plan_001',
 *   fallbackId: null,
 *   categories: [
 *     { id: 'cat_001', name: '工作', type: 'category' },
 *     { id: 'plan_001', name: '健身计划', type: 'plan' }
 *   ]
 * })
 * // => { categoryId: null, planId: 'plan_001' }
 *
 * @example
 * // 场景3：用户选择了"无分类"
 * const result = syncCategoryFields({
 *   selectedId: null,
 *   fallbackId: null,
 *   categories: []
 * })
 * // => { categoryId: null, planId: null }
 *
 * @example
 * // 场景4：用户未选择，使用fallbackId
 * const result = syncCategoryFields({
 *   selectedId: null,
 *   fallbackId: 'cat_002',
 *   categories: [
 *     { id: 'cat_002', name: '生活', type: 'category' }
 *   ]
 * })
 * // => { categoryId: 'cat_002', planId: null }
 */
export function syncCategoryFields(options) {
  const { selectedId, fallbackId, categories } = options

  // 优先使用用户手动选择的ID，其次使用fallbackId
  const targetId = selectedId || fallbackId

  // 如果没有任何ID，返回null（无分类）
  if (!targetId) {
    return { categoryId: null, planId: null }
  }

  // 在分类列表中查找对应的项
  const item = categories.find(c => c.id === targetId)

  // 如果找不到对应的分类/规划（数据不一致），默认当作category处理
  if (!item) {
    return { categoryId: targetId, planId: null }
  }

  // 根据type字段决定设置哪个字段
  if (item.type === 'plan') {
    // 规划类型 → 设置给 planId
    return { categoryId: null, planId: targetId }
  } else {
    // 分类类型（或其他未知类型） → 设置给 categoryId
    return { categoryId: targetId, planId: null }
  }
}

/**
 * 验证分类/规划ID是否存在于列表中
 *
 * @param {string} id - 要验证的ID
 * @param {Array<Object>} categories - 分类列表
 * @returns {boolean} 是否存在
 *
 * @example
 * const exists = isCategoryExists('cat_001', categories)
 * if (!exists) {
 *   console.warn('分类不存在')
 * }
 */
export function isCategoryExists(id, categories) {
  if (!id) return false
  return categories.some(c => c.id === id)
}

/**
 * 获取分类/规划的类型
 *
 * @param {string} id - 分类/规划ID
 * @param {Array<Object>} categories - 分类列表
 * @returns {'category'|'plan'|null} 类型（找不到返回null）
 *
 * @example
 * const type = getCategoryType('plan_001', categories)
 * if (type === 'plan') {
 *   console.log('这是一个规划')
 * }
 */
export function getCategoryType(id, categories) {
  if (!id) return null
  const item = categories.find(c => c.id === id)
  return item ? item.type : null
}
