/**
 * 规划表单业务逻辑
 * 职责：管理规划表单状态、验证、创建、更新逻辑
 */

import { ref, computed, watch } from 'vue'
import { useCategoryStore } from '@/store/category.js'
import { calculateDateInfo } from '@/utils/planDate.js'

/**
 * 规划表单Composable
 * @param {object} options - 配置选项
 * @param {string} options.mode - 模式：'create' | 'edit'
 * @param {string} options.editingPlanId - 编辑模式下的规划ID
 * @param {string} options.templateId - 模板ID（从模板创建时）
 * @param {object} options.templateData - 模板数据
 * @returns {object} 表单状态和方法
 */
export function usePlanForm(options = {}) {
  // ============================================================
  // 1. 引入 Store
  // ============================================================
  // ⭐ 统一使用 categoryStore，规划存储为 type='plan' 的分类
  const categoryStore = useCategoryStore()

  // ============================================================
  // 2. 响应式状态
  // ============================================================

  // 编辑模式相关
  const isEditMode = ref(options.mode === 'edit')
  const editingPlanId = ref(options.editingPlanId || null)
  const originalFormData = ref(null) // 原始表单数据（用于检测变化）
  const hasFormChanged = ref(false) // 表单是否有变化

  // 表单数据
  const planForm = ref({
    title: '',
    buff: '',
    icon: '', // 图标ID
    iconEmoji: '🔔', // 图标emoji（默认铃铛）
    startDate: '',
    startWeekday: '',
    startHint: '',
    endDate: '',
    endWeekday: '',
    duration: '',
    milestones: []
  })

  // ============================================================
  // 3. 计算属性
  // ============================================================

  /**
   * 日期格式转换：将 yyyy/MM/dd 转为 yyyy-MM-dd（用于picker组件）
   */
  const pickerStartDate = computed(() => {
    return planForm.value.startDate.replace(/\//g, '-')
  })

  const pickerEndDate = computed(() => {
    return planForm.value.endDate.replace(/\//g, '-')
  })

  /**
   * 提交按钮文字（根据模式和表单变化动态显示）
   */
  const submitButtonText = computed(() => {
    if (isEditMode.value) {
      return hasFormChanged.value ? '更新规划' : '编辑规划'
    }
    return '创建规划'
  })

  // ============================================================
  // 4. 业务方法
  // ============================================================

  /**
   * 计算日期相关信息（星期、提示、持续天数）
   */
  function updateDateInfo() {
    if (!planForm.value.startDate || !planForm.value.endDate) {
      return
    }

    const dateInfo = calculateDateInfo(planForm.value.startDate, planForm.value.endDate)

    planForm.value.startWeekday = dateInfo.startWeekday
    planForm.value.startHint = dateInfo.startHint
    planForm.value.endWeekday = dateInfo.endWeekday
    planForm.value.duration = dateInfo.duration

    console.log('[usePlanForm] 日期更新:', {
      startHint: planForm.value.startHint,
      duration: planForm.value.duration
    })
  }

  /**
   * 验证表单
   * @returns {boolean} 是否通过验证
   */
  function validateForm() {
    // 验证规划名称
    if (!planForm.value.title.trim()) {
      uni.showToast({
        title: '请输入规划名称',
        icon: 'none'
      })
      return false
    }

    // 验证规划期限
    if (!planForm.value.startDate || !planForm.value.endDate) {
      uni.showToast({
        title: '请选择规划期限',
        icon: 'none'
      })
      return false
    }

    return true
  }

  /**
   * 创建规划
   * @returns {Promise<object>} 创建的规划对象
   */
  async function createPlan() {
    console.log('[usePlanForm] 创建规划:', planForm.value)

    // 验证必填项
    if (!validateForm()) {
      return null
    }

    // ⭐ 统一使用 categoryStore.createPlan()（内部调用 Repository）
    const newPlan = await categoryStore.createPlan({
      title: planForm.value.title,
      buff: planForm.value.buff,
      icon: planForm.value.icon,
      iconEmoji: planForm.value.iconEmoji || '🔔',
      startDate: planForm.value.startDate,
      endDate: planForm.value.endDate,
      duration: planForm.value.duration,
      milestones: planForm.value.milestones || [],
      stats: {
        totalMilestones: planForm.value.milestones?.length || 0,
        completedMilestones: 0,
        totalDays: 0,
        progressDays: 0
      }
    })

    console.log('[usePlanForm] 规划已创建（通过Repository）:', newPlan)

    uni.showToast({
      title: '创建成功',
      icon: 'success'
    })

    return newPlan
  }

  /**
   * 更新规划
   * @returns {Promise<boolean>} 是否更新成功
   */
  async function updatePlan() {
    console.log('[usePlanForm] 更新规划:', planForm.value)

    // 验证必填项
    if (!validateForm()) {
      return false
    }

    try {
      // ⭐ 统一使用 categoryStore.updatePlan()（内部调用 Repository）
      await categoryStore.updatePlan(editingPlanId.value, {
        title: planForm.value.title,
        buff: planForm.value.buff,
        icon: planForm.value.icon,
        iconEmoji: planForm.value.iconEmoji || '🔔',
        startDate: planForm.value.startDate,
        endDate: planForm.value.endDate,
        duration: planForm.value.duration,
        milestones: planForm.value.milestones || []
      })

      console.log('[usePlanForm] 规划已更新（通过Repository）')

      uni.showToast({
        title: '规划已更新',
        icon: 'success',
        duration: 1500
      })

      return true
    } catch (error) {
      console.error('[usePlanForm] 更新失败:', error)
      uni.showToast({
        title: '更新失败',
        icon: 'error'
      })
      return false
    }
  }

  /**
   * 加载规划数据（编辑模式）
   * @param {string} planId - 规划ID
   */
  function loadPlanData(planId) {
    console.log('[usePlanForm] 加载规划数据，ID:', planId)

    // ⭐ 统一从 categoryStore 中获取规划数据（type='plan'）
    const plan = categoryStore.getCategoryById(planId)

    if (!plan) {
      uni.showToast({
        title: '规划不存在',
        icon: 'error'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }

    // 填充表单数据
    planForm.value = {
      title: plan.title || plan.name || '',
      buff: plan.buff || '',
      icon: plan.icon || '',
      iconEmoji: plan.iconEmoji || '🔔',
      startDate: plan.startDate || '',
      startWeekday: plan.startWeekday || '',
      startHint: plan.startHint || '',
      endDate: plan.endDate || '',
      endWeekday: plan.endWeekday || '',
      duration: plan.duration || '',
      milestones: plan.milestones ? JSON.parse(JSON.stringify(plan.milestones)) : []
    }

    // 保存原始数据（用于检测变化）
    originalFormData.value = JSON.parse(JSON.stringify(planForm.value))

    console.log('[usePlanForm] 规划数据已加载（来自CategoryRepository）')
  }

  /**
   * 初始化表单数据（从模板或默认值）
   * @param {object} templateData - 模板数据
   * @param {function} getRandomBuff - 获取随机Buff函数
   * @param {function} getRandomIconEmoji - 获取随机图标函数
   * @param {function} formatDate - 日期格式化函数
   */
  function initializeForm(templateData, getRandomBuff, getRandomIconEmoji, formatDate) {
    if (templateData) {
      // 从模板初始化
      console.log('[usePlanForm] 从模板创建规划，模板数据:', templateData)

      planForm.value.title = templateData.title
      planForm.value.buff = templateData.buff
      planForm.value.iconEmoji = templateData.iconEmoji || '🔔'

      // 计算日期：从今天开始，持续模板指定的天数
      const today = new Date()
      const startDate = new Date(today)
      planForm.value.startDate = formatDate(startDate)

      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + (templateData.duration - 1))
      planForm.value.endDate = formatDate(endDate)

      // 加载里程碑
      if (templateData.milestones && templateData.milestones.length > 0) {
        planForm.value.milestones = templateData.milestones.map((milestone) => {
          // 计算里程碑日期（基于模板的天数）
          const dayMatch = milestone.days.match(/第(\d+)天/)
          let milestoneDate = startDate
          if (dayMatch) {
            const dayNumber = parseInt(dayMatch[1])
            milestoneDate = new Date(startDate)
            milestoneDate.setDate(milestoneDate.getDate() + dayNumber)
          }

          return {
            title: milestone.title,
            description: milestone.description,
            date: formatDate(milestoneDate),
            days: milestone.days
          }
        })
      }

      uni.showToast({
        title: '模板已加载',
        icon: 'success',
        duration: 1500
      })
    } else {
      // 使用默认值初始化
      console.log('[usePlanForm] 普通创建规划，使用默认值')

      planForm.value.title = '' // 空白标题
      planForm.value.buff = getRandomBuff()
      planForm.value.iconEmoji = getRandomIconEmoji() // 随机图标

      // 默认日期：开始日期为今天，结束日期为空
      const today = new Date()
      planForm.value.startDate = formatDate(today)
      planForm.value.endDate = '' // 结束日期为空，需要用户选择

      planForm.value.milestones = []
    }

    // 计算日期信息
    updateDateInfo()
  }

  // ============================================================
  // 5. 监听表单变化
  // ============================================================

  watch(
    () => planForm.value,
    (newVal) => {
      if (isEditMode.value && originalFormData.value) {
        // 比较当前表单数据和原始数据
        hasFormChanged.value = JSON.stringify(newVal) !== JSON.stringify(originalFormData.value)
      }
    },
    { deep: true }
  )

  // ============================================================
  // 6. 返回公开接口
  // ============================================================

  return {
    // 状态
    planForm,
    isEditMode,
    editingPlanId,
    hasFormChanged,

    // 计算属性
    pickerStartDate,
    pickerEndDate,
    submitButtonText,

    // 方法
    validateForm,
    createPlan,
    updatePlan,
    loadPlanData,
    initializeForm,
    updateDateInfo
  }
}
