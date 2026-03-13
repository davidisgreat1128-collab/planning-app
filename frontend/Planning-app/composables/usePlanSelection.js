/**
 * 规划选中状态管理 Composable
 *
 * 职责：管理当前选中的规划ID，用于日历中显示规划任务
 *
 * 使用场景：
 * - 用户在规划列表中选中某个规划
 * - 日历页面根据选中的规划显示对应的里程碑任务
 * - 取消选中后，日历不再显示规划任务
 *
 * @author Claude
 * @date 2026-03-13
 * @version 1.0.0
 */

import { ref } from 'vue'

/**
 * 规划选中状态管理 Composable
 * @returns {object} 选中状态和方法
 */
export function usePlanSelection() {
  // ============================================================
  // 1. 响应式状态
  // ============================================================

  /**
   * 当前选中的规划ID
   * null 表示未选中任何规划
   */
  const selectedPlanId = ref(null)

  // ============================================================
  // 2. 核心方法
  // ============================================================

  /**
   * 选择规划
   * @param {string} planId - 规划ID
   */
  function selectPlan(planId) {
    console.log('[usePlanSelection] 选择规划:', planId)
    selectedPlanId.value = planId
    _saveToStorage()
  }

  /**
   * 取消选中规划
   */
  function deselectPlan() {
    console.log('[usePlanSelection] 取消选中规划')
    selectedPlanId.value = null
    _saveToStorage()
  }

  /**
   * 切换规划选中状态
   * @param {string} planId - 规划ID
   */
  function togglePlanSelection(planId) {
    if (selectedPlanId.value === planId) {
      // 如果已选中，则取消选中
      deselectPlan()
    } else {
      // 如果未选中，则选中
      selectPlan(planId)
    }
  }

  /**
   * 从 localStorage 加载选中状态
   */
  function loadSelection() {
    try {
      const saved = uni.getStorageSync('selected_plan_id')
      if (saved) {
        selectedPlanId.value = saved
        console.log('[usePlanSelection] 已加载选中状态:', saved)
      }
    } catch (e) {
      console.error('[usePlanSelection] 加载选中状态失败:', e)
    }
  }

  /**
   * 保存选中状态到 localStorage
   * @private
   */
  function _saveToStorage() {
    try {
      uni.setStorageSync('selected_plan_id', selectedPlanId.value || '')
      console.log('[usePlanSelection] 已保存选中状态:', selectedPlanId.value)
    } catch (e) {
      console.error('[usePlanSelection] 保存选中状态失败:', e)
    }
  }

  // ============================================================
  // 3. 初始化
  // ============================================================

  // 初始化时从 localStorage 加载选中状态
  loadSelection()

  // ============================================================
  // 4. 返回公开接口
  // ============================================================

  return {
    // 状态
    selectedPlanId,

    // 方法
    selectPlan,
    deselectPlan,
    togglePlanSelection,
    loadSelection
  }
}
