/**
 * useCategoryManager - 分类管理业务逻辑层
 *
 * 职责：封装分类/规划的加载、创建、选择等业务逻辑
 *
 * ⚠️ 架构重构说明(2026-03-10):
 * 从 AddTaskPanel.vue Component层提取到 Composable层
 * 原因：Component不应直接操作localStorage,应由Composable/Repository管理
 *
 * 未来优化方向：
 * - 将localStorage操作移至CategoryRepository(四层架构)
 * - 与后端API集成，支持分类同步
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-10
 * @version 1.0.0
 */

import { ref, computed } from 'vue'

/**
 * 分类管理 Composable
 * @returns {Object} 分类管理状态和方法
 */
export function useCategoryManager() {
  // ============================================================
  // 状态
  // ============================================================

  /** 用户分类列表(包含普通分类和规划) */
  const userCategories = ref([])

  /** 选中的分类ID */
  const selectedCategoryId = ref(null)

  // ============================================================
  // 计算属性
  // ============================================================

  /**
   * 获取当前选中分类的图标
   * @param {string} fallbackCategoryId - 备用分类ID(如props传入的categoryId)
   * @returns {string} 图标emoji或首字母
   */
  function getCurrentCategoryIcon(fallbackCategoryId = null) {
    // 优先使用用户手动选择的分类
    if (selectedCategoryId.value) {
      const category = userCategories.value.find(c => c.id === selectedCategoryId.value)
      return category ? (category.iconEmoji || category.name.charAt(0)) : '无'
    }
    // 其次使用备用分类ID(如props传入的categoryId)
    if (fallbackCategoryId) {
      const category = userCategories.value.find(c => c.id === fallbackCategoryId)
      return category ? (category.iconEmoji || category.name.charAt(0)) : '无'
    }
    // 都没有时显示"无"
    return '无'
  }

  // ============================================================
  // 业务方法
  // ============================================================

  /**
   * 从localStorage加载用户分类列表
   * ⚠️ 未来优化：移至CategoryRepository，支持多数据源(localStorage/API/IndexedDB)
   */
  function loadCategories() {
    const savedCategories = uni.getStorageSync('user_categories')
    if (savedCategories) {
      try {
        userCategories.value = JSON.parse(savedCategories)
      } catch (e) {
        console.error('[useCategoryManager] 加载分类失败:', e)
        userCategories.value = []
      }
    } else {
      userCategories.value = []
    }
  }

  /**
   * 从localStorage加载全局选中的分类ID
   * ⚠️ 未来优化：移至CategoryRepository
   */
  function loadSelectedCategory() {
    const savedCategoryId = uni.getStorageSync('selected_category_id')
    if (savedCategoryId && savedCategoryId !== 'all' && savedCategoryId !== 'none') {
      selectedCategoryId.value = savedCategoryId
    } else {
      selectedCategoryId.value = null
    }
  }

  /**
   * 创建新分类
   * @param {Object} data - 分类数据
   * @param {string} data.name - 分类名称
   * @param {string} data.icon - 分类图标
   * @param {string} data.iconEmoji - 分类emoji图标
   * @returns {Object} 创建的分类对象
   *
   * ⚠️ 包含业务规则:
   * - ID生成: Date.now().toString()
   * - 时间戳生成: new Date().toISOString()
   * - 持久化到localStorage
   */
  function createCategory(data) {
    console.log('[useCategoryManager] 创建分类:', data)

    // ⚠️ 业务规则：生成唯一ID (未来应由后端生成或使用UUID)
    const newCategory = {
      id: Date.now().toString(),
      name: data.name,
      icon: data.icon,
      iconEmoji: data.iconEmoji,
      createTime: new Date().toISOString()
    }

    // 添加到分类列表
    userCategories.value.push(newCategory)

    // ⚠️ 持久化到localStorage (未来应由Repository管理)
    try {
      uni.setStorageSync('user_categories', JSON.stringify(userCategories.value))
    } catch (e) {
      console.error('[useCategoryManager] 保存分类失败:', e)
      throw new Error('保存分类失败')
    }

    // 自动选中新创建的分类
    selectedCategoryId.value = newCategory.id

    return newCategory
  }

  /**
   * 选择分类
   * @param {string} categoryId - 分类ID (null表示"无分类")
   */
  function selectCategory(categoryId) {
    selectedCategoryId.value = categoryId
  }

  /**
   * 根据ID获取分类对象
   * @param {string} categoryId - 分类ID
   * @returns {Object|null} 分类对象
   */
  function getCategoryById(categoryId) {
    if (!categoryId) return null
    return userCategories.value.find(c => c.id === categoryId) || null
  }

  /**
   * 重置选中状态
   */
  function resetSelection() {
    selectedCategoryId.value = null
  }

  // ============================================================
  // 返回公开接口
  // ============================================================
  return {
    // 状态
    userCategories,
    selectedCategoryId,

    // 方法
    loadCategories,
    loadSelectedCategory,
    createCategory,
    selectCategory,
    getCategoryById,
    getCurrentCategoryIcon,
    resetSelection
  }
}
