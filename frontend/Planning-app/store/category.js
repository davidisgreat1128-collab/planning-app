/**
 * Category Store - 分类状态管理
 *
 * 职责：
 * - 全局分类状态管理（Pinia）
 * - 调用 CategoryRepository 的方法
 * - 提供计算属性（categories、activeCategoriesCount）
 * - 提供 actions（创建、更新、删除、排序）
 *
 * 使用方式：
 * ```vue
 * <script setup>
 * import { useCategoryStore } from '@/store/category'
 *
 * const categoryStore = useCategoryStore()
 *
 * // 获取所有分类（响应式）
 * const categories = categoryStore.categories
 *
 * // 创建分类
 * await categoryStore.createCategory({ name: '工作', color: '#FF0000' })
 * </script>
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CategoryRepository from '@/repositories/CategoryRepository'
import { useTaskStore } from '@/store/task.js'

export const useCategoryStore = defineStore('category', () => {
  // ========== 状态（State）==========

  /** 所有分类（响应式数组）
   *
   * ⚠️ 重要：必须用 ref 维护响应式副本
   *
   * 原因：CategoryRepository.memoryCache 是普通 Map（非响应式）
   * - Repository.create/delete 修改 memoryCache 时，Vue 不知道数据变化
   * - 如果用 computed(() => Repository.getAll())，UI 不会自动更新
   *
   * 解决方案：
   * - Store 维护 ref([]) 响应式副本
   * - hydrate/create/update/delete 后手动调用 _syncFromRepository()
   * - Component 订阅 ref，自动响应式更新
   */
  const categories = ref([])

  // ========== 计算属性（Getters）==========
	/**
   * 激活的分类数量
   */
  const activeCategoriesCount = computed(() => {
    return categories.value.length
  })

  /**
   * ⭐ 获取所有规划（type='plan'）
   */
  const plans = computed(() => {
    return categories.value.filter(cat => cat.type === 'plan')
  })

  /**
   * ⭐ 获取所有普通分类（type='category'）
   */
  const normalCategories = computed(() => {
    return categories.value.filter(cat => cat.type === 'category' || !cat.type)
  })

	/**
   * 按名称查找分类（模糊匹配）
   * @param {string} name - 搜索关键词
   * @returns {Array<object>}
   */
  function getCategoriesByName(name) {
    if (!name || name.trim().length === 0) {
      return categories.value
    }
    return categories.value.filter(cat => cat.name.includes(name.trim()))
  }

	/**
   * 按颜色获取分类
   * @param {string} color - 颜色代码（如 '#FF0000'）
   * @returns {Array<object>}
   */
  function getCategoriesByColor(color) {
    return categories.value.filter(cat => cat.color === color)
  }

  /**
   * ⭐ 按 ID 获取分类（包括规划）
   * @param {string} id - 分类/规划 ID
   * @returns {object|null}
   */
  function getCategoryById(id) {
    return categories.value.find(cat => cat.id === id) || null
  }

  // ========== 内部方法 ==========
	/**
   * 从 Repository 同步数据到 Store（响应式更新）
   *
   * @private
   */
  function _syncFromRepository() {
    categories.value = CategoryRepository.getAll()
    console.log('[CategoryStore] 同步数据完成，分类数量:', categories.value.length)
  }

  // ========== 操作（Actions）==========
	/*
   * 启动时加载数据
   *
   * 必须在 App.vue 的 onLaunch 中调用：
   * ```javascript
   * // App.vue
   * import { useCategoryStore } from '@/store/category'
   *
   * export default {
   *   async onLaunch() {
   *     const categoryStore = useCategoryStore()
   *     await categoryStore.hydrate()
   *   }
   * }
   * ```
   *
   * @returns {Promise<void>}
   */
  async function hydrate() {
    await CategoryRepository.hydrate()
    _syncFromRepository()  // ✅ 同步到响应式副本
  }
	
	/**
   * 创建分类
   *
   * @param {object} data - 分类数据 { name, color, sortOrder }
   * @returns {Promise<object>} 创建的分类对象
   *
   * @example
   * const newCat = await categoryStore.createCategory({
   *   name: '工作',
   *   color: '#FF0000'
   * })
   */
  async function createCategory(data) {
    const newCategory = await CategoryRepository.create(data)
    _syncFromRepository()  // ✅ 同步到响应式副本，触发UI更新
    return newCategory
  }
	
	/**
   * 更新分类
   *
   * @param {string} id - 分类 ID
   * @param {object} data - 要更新的字段
   * @returns {Promise<object>} 更新后的分类对象
   *
   * @example
   * await categoryStore.updateCategory('cat_123', { name: '生活' })
   */
  async function updateCategory(id, data) {
    const updated = await CategoryRepository.update(id, data)
    _syncFromRepository()  // ✅ 同步到响应式副本，触发UI更新
    return updated
  }
	
	/**
   * 删除分类（软删除）
   *
   * @param {string} id - 分类 ID
   * @returns {Promise<void>}
   *
   * @example
   * await categoryStore.deleteCategory('cat_123')
   */
  async function deleteCategory(id) {
    await CategoryRepository.delete(id)
    _syncFromRepository()  // ✅ 同步到响应式副本，触发UI更新
  }
  
	/**
   * 重新排序分类（拖拽后调用）
   *
   * @param {Array<object>} newOrder - 新的排序数组
   *   格式：[{ id: 'cat_1', sortOrder: 0 }, { id: 'cat_2', sortOrder: 1 }, ...]
   * @returns {Promise<void>}
   *
   * @example
   * // 用户拖拽后
   * const newOrder = categories.value.map((cat, index) => ({
   *   id: cat.id,
   *   sortOrder: index
   * }))
   * await categoryStore.reorderCategories(newOrder)
   */
  async function reorderCategories(newOrder) {
    // 批量更新排序
    for (const item of newOrder) {
      await CategoryRepository.update(item.id, { sortOrder: item.sortOrder })
    }
    _syncFromRepository()  // ✅ 批量更新后同步
  }

	/**
   * 按 ID 获取分类
   *
   * @param {string} id - 分类 ID
   * @returns {object|null}
   *
   * @example
   * const cat = categoryStore.getCategoryById('cat_123')
   */
  function getCategoryById(id) {
    return CategoryRepository.getById(id)
  }

	/**
   * 手动同步到服务器
   *
   * 通常不需要手动调用，Repository 会自动同步。
   * 但在某些场景下（如用户点击"刷新"按钮），可以手动触发。
   *
   * @returns {Promise<void>}
   */
  async function sync() {
    await CategoryRepository.sync()
    _syncFromRepository()  // ✅ 同步后刷新Store
  }


  /**
   * ⭐ 创建规划（使用 Repository）
   * 规划本质上是特殊类型的分类（type='plan'）
   *
   * @param {object} planData - 规划数据
   * @returns {Promise<object>} 创建的规划对象
   */
  async function createPlan(planData) {
    const plan = await CategoryRepository.create({
      type: 'plan',
      name: planData.title || planData.name,  // 兼容 title 和 name
      iconEmoji: planData.iconEmoji || '🔔',
      buff: planData.buff || '',
      startDate: planData.startDate || '',
      endDate: planData.endDate || '',
      duration: planData.duration || '',
      milestones: planData.milestones || [],
      stats: planData.stats || {
        totalMilestones: planData.milestones?.length || 0,
        completedMilestones: 0,
        totalDays: 0,
        progressDays: 0
      }
    })

    _syncFromRepository()  // ✅ 同步后刷新Store
    console.log('[CategoryStore] 规划已创建（通过Repository）')
    return plan
  }

  /**
   * ⭐ 更新规划（使用 Repository）
   *
   * @param {string} planId - 规划 ID
   * @param {object} planData - 要更新的规划数据
   * @returns {Promise<object>} 更新后的规划对象
   */
  async function updatePlan(planId, planData) {
    const updated = await CategoryRepository.update(planId, {
      name: planData.title || planData.name,  // 兼容 title 和 name
      iconEmoji: planData.iconEmoji,
      buff: planData.buff,
      startDate: planData.startDate,
      endDate: planData.endDate,
      duration: planData.duration,
      milestones: planData.milestones,
      stats: planData.stats
    })

    _syncFromRepository()  // ✅ 同步后刷新Store
    console.log('[CategoryStore] 规划已更新（通过Repository）')
    return updated
  }

  /**
   * ⭐ 删除规划（使用 Repository）
   *
   * @param {string} planId - 规划 ID
   * @param {boolean} deleteWithTasks - true=删除关联任务，false=改为无分类（默认false）
   * @returns {Promise<void>}
   *
   * 删除流程：
   * 1. 删除规划数据（CategoryRepository）
   * 2. 处理关联任务（调用 taskStore.updateTasksAfterPlanDelete）
   */
  async function deletePlan(planId, deleteWithTasks = false) {
    console.log('[CategoryStore] 删除规划，planId:', planId, 'deleteWithTasks:', deleteWithTasks)

    // 1. 删除规划数据
    await CategoryRepository.delete(planId)
    _syncFromRepository()  // ✅ 同步后刷新Store
    console.log('[CategoryStore] 规划已删除（通过Repository）')

    // 2. 处理关联任务（调用 taskStore）
    const taskStore = useTaskStore()
    await taskStore.updateTasksAfterPlanDelete(planId, deleteWithTasks)
  }

  /**
   * 【已废弃】从规划创建分类（旧方法，保留向后兼容）
   * @deprecated 请使用 createPlan() 方法
   */
  async function addCategoryFromPlan(planData) {
    console.warn('[CategoryStore] addCategoryFromPlan 已废弃，请使用 createPlan')
    return await createPlan(planData)
  }

  /**
   * 【已废弃】更新规划分类（旧方法，保留向后兼容）
   * @deprecated 请使用 updatePlan() 方法
   */
  async function updateCategoryFromPlan(planId, planData) {
    console.warn('[CategoryStore] updateCategoryFromPlan 已废弃，请使用 updatePlan')
    return await updatePlan(planId, planData)
  }

	/**
   * 清除所有分类（仅用于测试，慎用！）
   *
   * @returns {Promise<void>}
   */
  async function clearAll() {
    const allCategories = categories.value
    for (const cat of allCategories) {
      await CategoryRepository.delete(cat.id)
    }
    _syncFromRepository()  // ✅ 清除后同步
  }

  // ========== 导出 ==========

  return {
    // 状态
    categories,
    activeCategoriesCount,

    // ⭐ 计算属性
    plans,              // 所有规划（type='plan'）
    normalCategories,   // 所有普通分类（type='category'）

    // 分类方法
    hydrate,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryById,
    getCategoriesByName,
    getCategoriesByColor,
    sync,
    clearAll,

    // ⭐ 规划方法（新增）
    createPlan,
    updatePlan,
    deletePlan,

    // 兼容旧方法（已废弃）
    addCategoryFromPlan,
    updateCategoryFromPlan
  }
})
