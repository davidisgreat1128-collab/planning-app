/**
 * 规划记录状态管理 (Pinia Composition API)
 *
 * 三层架构：Component → Store → Repository
 * - Store 层不直接调用 API
 * - 所有数据持久化由 PlanningRepository 管理
 * - Store 层提供响应式状态和业务方法
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04 (重构为三层架构)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import PlanningRepository from '@/repositories/PlanningRepository'

export const usePlanningStore = defineStore('planning', () => {
  // ==================== 响应式状态 ====================

  /** 加载状态 */
  const loading = ref(false)

  /** 当前筛选的规划类型 */
  const currentType = ref('')

  /** 分页大小（用于兼容旧逻辑，实际 Repository 缓存所有数据） */
  const pageSize = ref(20)

  // ==================== 计算属性 ====================

  /**
   * 当前列表数据（从 Repository 自动获取）
   */
  const list = computed(() => {
    return PlanningRepository.getByType(currentType.value)
  })

  /**
   * 分页信息（基于当前过滤的列表）
   */
  const pagination = computed(() => {
    const total = list.value.length
    return {
      total,
      page: 1, // Repository 已缓存所有数据，无需真实分页
      pageSize: pageSize.value,
      totalPages: Math.ceil(total / pageSize.value)
    }
  })

  /**
   * 是否还有更多数据（始终为 false，因为 Repository 已缓存所有数据）
   */
  const hasMore = computed(() => false)

  /**
   * 规划总数
   */
  const totalCount = computed(() => PlanningRepository.getAll().length)

  // ==================== Actions ====================

  /**
   * hydrate - 数据水合（应用启动时调用）
   */
  async function hydrate() {
    await PlanningRepository.hydrate()
    console.log('[PlanningStore] 数据水合完成')
  }

  /**
   * 加载规划列表（刷新）
   * @param {string} [type] - 规划类型
   */
  async function loadList(type = '') {
    loading.value = true
    currentType.value = type
    try {
      // Repository 已在 hydrate() 时同步过数据
      // 这里只需设置 currentType，computed 会自动更新
      console.log('[PlanningStore] 切换到类型:', type || '全部')
    } catch (err) {
      console.error('[PlanningStore] 加载列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载更多（分页追加）
   * 注：Repository 已缓存所有数据，此方法仅为保持 API 兼容
   */
  async function loadMore() {
    // Repository 模式下无需分页，直接返回
    console.log('[PlanningStore] Repository 模式无需分页')
    return
  }

  /**
   * 创建规划
   * @param {object} data
   */
  async function create(data) {
    const newItem = await PlanningRepository.create(data)
    // Repository 更新后，computed 会自动触发更新
    return newItem
  }

  /**
   * 更新规划
   * @param {number} id
   * @param {object} data
   */
  async function update(id, data) {
    const updated = await PlanningRepository.update(id, data)
    return updated
  }

  /**
   * 更新规划状态
   * @param {number} id
   * @param {string} status
   */
  async function updateStatus(id, status) {
    const updated = await PlanningRepository.updateStatus(id, status)
    return updated
  }

  /**
   * 删除规划
   * @param {number} id
   */
  async function remove(id) {
    await PlanningRepository.delete(id)
    // Repository 软删除后，computed 会自动过滤
  }

  /**
   * 同步服务器数据
   */
  async function sync() {
    await PlanningRepository.sync()
  }

  /**
   * 按ID获取规划
   * @param {number} id
   * @returns {object|undefined}
   */
  function getById(id) {
    return PlanningRepository.getById(id)
  }

  // ==================== 返回 ====================

  return {
    // State
    loading,
    currentType,
    pageSize,

    // Getters
    list,
    pagination,
    hasMore,
    totalCount,

    // Actions
    hydrate,
    loadList,
    loadMore,
    create,
    update,
    updateStatus,
    remove,
    sync,
    getById
  }
})
