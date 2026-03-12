/**
 * 模板详情页业务逻辑 Composable
 *
 * 职责：
 * - 管理模板详情页的状态（当前天数、弹窗显示状态）
 * - 提供业务方法（切换天数、显示里程碑弹窗、导航跳转）
 * - 计算当前选中天数的任务列表
 *
 * 使用场景：
 * - template/detail.vue 页面
 *
 * 创建时间：2026-03-12
 * 创建原因：SRP重构 Stage 2 - 提取业务流程层，分离业务逻辑和UI逻辑
 *
 * @param {object} templateData - 模板数据（ref 对象）
 * @returns {object} 状态和方法
 */
import { ref, computed } from 'vue'

export function useTemplateDetail(templateData) {
  // ============================================================
  // 1. 响应式状态（页面级状态，不放 Store）
  // ============================================================

  /**
   * 当前选中的Day（1-30）
   */
  const currentDay = ref(1)

  /**
   * 是否显示里程碑详情弹窗
   */
  const showMilestoneModal = ref(false)

  /**
   * 当前选中的里程碑数据
   */
  const currentMilestone = ref({
    title: '',
    description: '',
    days: '',
    index: 0
  })

  // ============================================================
  // 2. 计算属性（基于模板数据和当前状态）
  // ============================================================

  /**
   * 当前选中天数的任务列表
   * @returns {Array} 任务数组
   */
  const currentDayTasks = computed(() => {
    if (!templateData.value || !templateData.value.tasksByDay) {
      return []
    }
    return templateData.value.tasksByDay[currentDay.value] || []
  })

  // ============================================================
  // 3. 业务方法
  // ============================================================

  /**
   * 切换Day标签
   * @param {number} day - 目标Day（1-30）
   */
  function switchDay(day) {
    if (day < 1 || day > 30) {
      console.warn('[useTemplateDetail] 无效的Day值:', day)
      return
    }
    currentDay.value = day
    console.log('[useTemplateDetail] 切换到Day', day)
  }

  /**
   * 处理里程碑点击事件，显示详情弹窗
   * @param {object} payload - { milestone, index }
   * @param {object} payload.milestone - 里程碑对象
   * @param {number} payload.index - 里程碑索引
   */
  function handleMilestoneSelect({ milestone, index }) {
    currentMilestone.value = {
      title: milestone.title || '',
      description: milestone.description || '',
      days: milestone.days || '',
      index
    }
    showMilestoneModal.value = true
    console.log('[useTemplateDetail] 显示里程碑详情:', currentMilestone.value)
  }

  /**
   * 关闭里程碑详情弹窗
   */
  function closeMilestoneDetail() {
    showMilestoneModal.value = false
    console.log('[useTemplateDetail] 关闭里程碑详情弹窗')
  }

  /**
   * 添加规划到个人计划（跳转到创建页面）
   * @param {string} templateId - 模板ID
   */
  function addGoal(templateId) {
    if (!templateId) {
      console.error('[useTemplateDetail] 缺少模板ID，无法创建规划')
      uni.showToast({
        title: '模板ID缺失',
        icon: 'none'
      })
      return
    }

    console.log('[useTemplateDetail] 添加规划，模板ID:', templateId)
    uni.navigateTo({
      url: `/pages/planning/plan/create?templateId=${templateId}`
    })
  }

  /**
   * 返回上一页
   */
  function goBack() {
    console.log('[useTemplateDetail] 返回上一页')
    uni.navigateBack()
  }

  /**
   * 从URL参数加载模板数据
   * @returns {string|null} 模板ID
   */
  function loadTemplateIdFromUrl() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = currentPage.options || {}

    if (options.id) {
      console.log('[useTemplateDetail] 从URL加载模板ID:', options.id)
      return options.id
    } else {
      console.log('[useTemplateDetail] 未指定模板ID')
      return null
    }
  }

  // ============================================================
  // 4. 返回公开接口
  // ============================================================

  return {
    // 状态
    currentDay,
    showMilestoneModal,
    currentMilestone,

    // 计算属性
    currentDayTasks,

    // 方法
    switchDay,
    handleMilestoneSelect,
    closeMilestoneDetail,
    addGoal,
    goBack,
    loadTemplateIdFromUrl
  }
}
