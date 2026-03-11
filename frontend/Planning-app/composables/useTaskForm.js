/**
 * useTaskForm - 任务表单业务逻辑复用层
 *
 * 职责：封装任务表单的核心业务逻辑，供 task-edit.vue 和 AddTaskPanel.vue 复用
 *
 * 遵循三层架构：Component → Composable(useTaskForm) → Store → Repository
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-08
 * @version 1.0.0
 */

import { ref, computed } from 'vue'
import { useTaskStore } from '@/store/task.js'
import { usePlanStore } from '@/store/plan.js'
import { useRepeatRuleManager } from './useRepeatRuleManager.js'
import { formatDate, getWeekdayName, calcDays, timeDiffMinutes, formatDuration } from '@/utils/date.js'
import { validateTaskForm } from '@/utils/taskFormValidator.js'

/**
 * 任务表单业务逻辑 Composable
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 模式：'create' | 'edit'
 * @param {string} options.taskId - 任务ID（编辑模式必传）
 * @param {string} options.presetDate - 预设日期（YYYY-MM-DD）
 * @returns {Object} 表单数据、方法、计算属性
 */
export function useTaskForm(options = {}) {
  const { mode = 'create', taskId: initialTaskId = null, presetDate: initialPresetDate = '' } = options

  // ============================================================
  // Store 引用
  // ============================================================
  const taskStore = useTaskStore()
  const planStore = usePlanStore()

  // ============================================================
  // 重复规则管理器
  // ============================================================
  const repeatRuleManager = useRepeatRuleManager()

  // ============================================================
  // 核心状态
  // ============================================================

  /** 任务ID（编辑模式时有值） */
  const taskId = ref(initialTaskId)

  /** 原始任务ID（用于重复任务，保存时使用） */
  const originalTaskId = ref(null)

  /** 预设日期（从日历页传入） */
  const presetDate = ref(initialPresetDate)

  /** 是否编辑模式 */
  const isEdit = computed(() => !!taskId.value)

  /** 当前任务是否已完成（页面内直接切换） */
  const taskDone = ref(false)

  // ============================================================
  // 表单数据（字段名与后端对齐）
  // ============================================================
  const form = ref({
    title: '',
    description: '',
    isUrgent: false,
    isImportant: false,
    isAllDay: true,        // 全天任务
    hasTimeRange: false,   // 是否设置时间段（开关）
    taskDate: '',          // 开始日期 YYYY-MM-DD
    endDate: '',           // 结束日期 YYYY-MM-DD（hasTimeRange=false 多天范围时用）
    startTime: '',         // 开始时间 HH:mm（hasTimeRange=true 时使用）
    endTime: '',           // 结束时间 HH:mm（hasTimeRange=true 时使用）
    rrule: '',             // 重复规则 RRULE 字符串
    planId: null,
    reminderEnabled: false,    // 是否开启提醒
    reminderOffset: null,      // 提醒偏移分钟数（负=提前，0=当天当时）
    reminderAdvanceMode: 'day', // 'day' | 'week'
    reminderAdvanceDays: 0,    // 按天提前：0=当天, 1=提前1天...
    reminderHour: 0,           // 提醒小时
    reminderMin: 0,            // 提醒分钟
    strongReminder: false,     // 强力提醒（持续提醒开关）
    wechatReminder: false      // 微信辅助提醒
  })

  /** 子计划列表 */
  const subtasks = ref([])

  /** 日期 Tab：today / tomorrow / custom / preset / other */
  const activeDateTab = ref('today')

  /** 用户自定义选择的日期（用于动态Tab显示，YYYY-MM-DD格式） */
  const customDate = ref('')

  /** 选中的规划名称（显示用） */
  const selectedPlanName = ref('')

  /** 原始表单数据（用于检测变化） */
  const originalForm = ref(null)

  /** 原始子任务数据（用于检测变化） */
  const originalSubtasks = ref(null)

  /** 当前任务的创建时间（编辑模式从任务数据读取） */
  const createdAt = ref('')
  const completedAt = ref('')

  // ============================================================
  // 计算属性
  // ============================================================

  /** 当前四象限 key */
  const currentQuadrant = computed(() => {
    if (form.value.isUrgent && form.value.isImportant) return 'q1'
    if (!form.value.isUrgent && form.value.isImportant) return 'q2'
    if (form.value.isUrgent && !form.value.isImportant) return 'q3'
    return 'q4'
  })

  /** 重复规则是否有变化 */
  const hasRepeatChanged = computed(() => {
    if (!originalForm.value) {
      console.log('[hasRepeatChanged] originalForm 不存在，返回 false')
      return false
    }

    // ✅ 修复：直接访问响应式变量，让 Vue 追踪依赖
    const repeatMode = repeatRuleManager.repeatMode.value
    const repeatInterval = repeatRuleManager.repeatInterval.value
    const repeatWeekDays = repeatRuleManager.repeatWeekDays.value
    const repeatEndDate = repeatRuleManager.repeatEndDate.value
    const monthlySubMode = repeatRuleManager.monthlySubMode.value
    const monthlyDays = repeatRuleManager.monthlyDays.value

    const currentRrule = repeatRuleManager.generateRrule() || ''
    const originalRrule = originalForm.value.rrule || ''
    const changed = currentRrule !== originalRrule

    console.log('[hasRepeatChanged] 重复规则检测:', {
      currentRrule,
      originalRrule,
      changed,
      repeatMode,
      repeatInterval,
      repeatWeekDays,
      repeatEndDate
    })

    return changed
  })

  /** 表单是否有变化 */
  const hasFormChanged = computed(() => {
    if (!originalForm.value) {
      console.log('[hasFormChanged] originalForm 不存在，返回 false')
      return false
    }

    // 检测表单变化
    const formChanged = JSON.stringify(form.value) !== JSON.stringify(originalForm.value)

    // 检测子任务变化
    const subtasksChanged = JSON.stringify(subtasks.value) !== JSON.stringify(originalSubtasks.value || [])

    // 检测重复规则变化
    const repeatChanged = hasRepeatChanged.value

    const result = formChanged || subtasksChanged || repeatChanged

    console.log('[hasFormChanged] 表单变化检测汇总:', {
      formChanged,
      subtasksChanged,
      repeatChanged,
      最终结果: result
    })

    return result
  })

  /** 创建时间显示文本 */
  const createdAtText = computed(() => {
    if (!createdAt.value) return '暂无'
    const d = new Date(createdAt.value)
    if (isNaN(d.getTime())) return createdAt.value
    const Y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${Y}.${M}.${D}  ${hh}:${mm}`
  })

  /** 完成时间显示文本 */
  const completedAtText = computed(() => {
    if (!completedAt.value) return '暂无'
    const d = new Date(completedAt.value)
    if (isNaN(d.getTime())) return completedAt.value
    const Y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${Y}.${M}.${D}  ${hh}:${mm}`
  })

  /** 完成期限显示文本 */
  const deadlineText = computed(() => {
    if (form.value.endDate) {
      const d = new Date(form.value.endDate)
      const today = formatDate(new Date())
      const tomorrow = formatDate(new Date(Date.now() + 86400000))
      if (form.value.endDate === today) return '当天'
      if (form.value.endDate === tomorrow) return '明天'
      return `${d.getMonth() + 1}月${d.getDate()}日`
    }
    const d = new Date(form.value.taskDate || new Date())
    const today = formatDate(new Date())
    if ((form.value.taskDate || today) === today) return '当天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  })

  // ============================================================
  // 子计划管理
  // ============================================================

  /**
   * 添加子计划
   * @param {string} title - 子计划标题
   */
  function addSubtask(title) {
    if (!title || !title.trim()) return
    subtasks.value.unshift({ title: title.trim(), done: false })
  }

  /**
   * 删除子计划
   * @param {number} index - 子计划索引
   */
  function removeSubtask(index) {
    subtasks.value.splice(index, 1)
  }

  /**
   * 切换子计划完成状态
   * @param {number} index - 子计划索引
   */
  function toggleSubtaskDone(index) {
    subtasks.value[index].done = !subtasks.value[index].done
  }

  // ============================================================
  // 日期管理
  // ============================================================

  /**
   * 切换日期 Tab
   * @param {'today' | 'tomorrow' | 'custom' | 'preset' | 'other'} tab - Tab标识
   */
  function onDateTab(tab) {
    const today = formatDate(new Date())
    const tomorrow = formatDate(new Date(Date.now() + 86400000))

    if (tab === 'today') {
      form.value.taskDate = today
      activeDateTab.value = 'today'
      customDate.value = ''  // 清空自定义日期，恢复为3个Tab
    } else if (tab === 'tomorrow') {
      form.value.taskDate = tomorrow
      activeDateTab.value = 'tomorrow'
      customDate.value = ''  // 清空自定义日期，恢复为3个Tab
    } else if (tab === 'custom' || tab === 'preset') {
      // 点击已选择的自定义日期，不做任何操作（已经是选中状态）
      return
    }
    // 注意：'other' tab 的处理由组件层自己控制弹窗显示
  }

  /**
   * 设置自定义日期
   * @param {string} date - 日期字符串 YYYY-MM-DD
   */
  function setCustomDate(date) {
    customDate.value = date
    form.value.taskDate = date
    activeDateTab.value = 'custom'
  }

  // ============================================================
  // 四象限管理
  // ============================================================

  /**
   * 选择四象限
   * @param {Object} quadrant - 象限对象 { isUrgent, isImportant }
   */
  function selectQuadrant(quadrant) {
    form.value.isUrgent = quadrant.isUrgent
    form.value.isImportant = quadrant.isImportant
  }

  // ============================================================
  // 提交/保存逻辑
  // ============================================================

  /**
   * 提交表单（创建新任务）
   * @returns {Promise<Object>} 新任务对象
   */
  async function submit() {
    // 验证表单
    const { valid, errors } = validateTaskForm(form.value, subtasks.value)
    if (!valid) {
      uni.showToast({
        title: errors[0] || '表单验证失败',
        icon: 'none',
        duration: 2000
      })
      throw new Error(errors[0])
    }

    // 🔥 BUG排查：输出 form.value.planId 的值
    console.log('%c[useTaskForm.submit] 组装任务数据前，form.value.planId =', 'color: #FF6B00; font-size: 14px; font-weight: bold;', form.value.planId)

    // 组装任务数据
    const taskData = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || '',
      isUrgent: form.value.isUrgent,
      isImportant: form.value.isImportant,
      isAllDay: form.value.isAllDay,
      hasTimeRange: form.value.hasTimeRange,
      taskDate: form.value.taskDate,
      endDate: form.value.endDate || null,
      startTime: form.value.startTime || null,
      endTime: form.value.endTime || null,
      rrule: repeatRuleManager.generateRrule() || null,
      planId: form.value.planId || null,
      reminderEnabled: form.value.reminderEnabled,
      reminderOffset: form.value.reminderOffset,
      reminderAdvanceMode: form.value.reminderAdvanceMode,
      reminderAdvanceDays: form.value.reminderAdvanceDays,
      reminderHour: form.value.reminderHour,
      reminderMin: form.value.reminderMin,
      strongReminder: form.value.strongReminder,
      wechatReminder: form.value.wechatReminder,
      subtasks: subtasks.value
    }

    console.log('[useTaskForm] 提交任务数据:', taskData)
    console.log('%c[useTaskForm] ⭐⭐⭐ taskData.planId 的值:', 'color: #FF0000; font-size: 16px; font-weight: bold;', taskData.planId)

    // 调用 Store 创建任务
    const newTask = await taskStore.addTask(taskData)

    console.log('[useTaskForm] 任务创建成功:', newTask)

    // 重置表单
    resetForm()

    return newTask
  }

  /**
   * 更新任务
   * @returns {Promise<Object>} 更新后的任务对象
   */
  async function update() {
    if (!taskId.value) {
      throw new Error('更新任务时 taskId 不能为空')
    }

    // 验证表单
    const { valid, errors } = validateTaskForm(form.value, subtasks.value)
    if (!valid) {
      uni.showToast({
        title: errors[0] || '表单验证失败',
        icon: 'none',
        duration: 2000
      })
      throw new Error(errors[0])
    }

    // 组装任务数据
    const taskData = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || '',
      isUrgent: form.value.isUrgent,
      isImportant: form.value.isImportant,
      isAllDay: form.value.isAllDay,
      hasTimeRange: form.value.hasTimeRange,
      taskDate: form.value.taskDate,
      endDate: form.value.endDate || null,
      startTime: form.value.startTime || null,
      endTime: form.value.endTime || null,
      rrule: repeatRuleManager.generateRrule() || null,
      planId: form.value.planId || null,
      reminderEnabled: form.value.reminderEnabled,
      reminderOffset: form.value.reminderOffset,
      reminderAdvanceMode: form.value.reminderAdvanceMode,
      reminderAdvanceDays: form.value.reminderAdvanceDays,
      reminderHour: form.value.reminderHour,
      reminderMin: form.value.reminderMin,
      strongReminder: form.value.strongReminder,
      wechatReminder: form.value.wechatReminder,
      subtasks: subtasks.value
    }

    console.log('[useTaskForm] 更新任务数据:', taskData)

    // 调用 Store 更新任务
    const updatedTask = await taskStore.updateTask(taskId.value, taskData)

    console.log('[useTaskForm] 任务更新成功:', updatedTask)

    return updatedTask
  }

  /**
   * 删除任务
   * @returns {Promise<void>}
   */
  async function deleteTask() {
    if (!taskId.value) {
      throw new Error('删除任务时 taskId 不能为空')
    }

    console.log('[useTaskForm] 删除任务:', taskId.value)

    // 调用 Store 删除任务
    await taskStore.deleteTask(taskId.value)

    console.log('[useTaskForm] 任务删除成功')
  }

  // ============================================================
  // 表单初始化和重置
  // ============================================================

  /**
   * 从任务数据加载表单
   * @param {Object} task - 任务对象
   */
  function loadFromTask(task) {
    if (!task) return

    console.log('[useTaskForm] 从任务数据加载表单:', task)

    taskId.value = task.id
    originalTaskId.value = task.originalTaskId || task.id

    form.value.title = task.title || ''
    form.value.description = task.description || ''
    form.value.isUrgent = task.isUrgent || false
    form.value.isImportant = task.isImportant || false
    form.value.isAllDay = task.isAllDay !== undefined ? task.isAllDay : true
    form.value.hasTimeRange = task.hasTimeRange || false
    form.value.taskDate = task.taskDate || formatDate(new Date())
    form.value.endDate = task.endDate || ''
    form.value.startTime = task.startTime || ''
    form.value.endTime = task.endTime || ''
    form.value.rrule = task.rrule || ''
    form.value.planId = task.planId || null
    form.value.reminderEnabled = task.reminderEnabled || false
    form.value.reminderOffset = task.reminderOffset
    form.value.reminderAdvanceMode = task.reminderAdvanceMode || 'day'
    form.value.reminderAdvanceDays = task.reminderAdvanceDays || 0
    form.value.reminderHour = task.reminderHour || 0
    form.value.reminderMin = task.reminderMin || 0
    form.value.strongReminder = task.strongReminder || false
    form.value.wechatReminder = task.wechatReminder || false

    subtasks.value = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : []
    taskDone.value = task.status === 'done'

    createdAt.value = task.createdAt || ''
    completedAt.value = task.completedAt || ''

    // 保存原始数据
    originalForm.value = JSON.parse(JSON.stringify(form.value))
    originalSubtasks.value = JSON.parse(JSON.stringify(subtasks.value))

    // 根据 planId 设置分类名称
    if (task.planId) {
      const plan = planStore.plans.find(p => p.id === task.planId)
      selectedPlanName.value = plan ? plan.name : '无分类'
    } else {
      selectedPlanName.value = '无分类'
    }

    // 设置日期 Tab
    const today = formatDate(new Date())
    const tomorrow = formatDate(new Date(Date.now() + 86400000))
    if (form.value.taskDate === today) {
      activeDateTab.value = 'today'
    } else if (form.value.taskDate === tomorrow) {
      activeDateTab.value = 'tomorrow'
    } else if (presetDate.value && form.value.taskDate === presetDate.value) {
      activeDateTab.value = 'preset'
    } else {
      activeDateTab.value = 'custom'
      customDate.value = form.value.taskDate
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    taskId.value = null
    originalTaskId.value = null

    const today = formatDate(new Date())

    form.value = {
      title: '',
      description: '',
      isUrgent: false,
      isImportant: false,
      isAllDay: true,
      hasTimeRange: false,
      taskDate: presetDate.value || today,
      endDate: '',
      startTime: '',
      endTime: '',
      rrule: '',
      planId: null,
      reminderEnabled: false,
      reminderOffset: null,
      reminderAdvanceMode: 'day',
      reminderAdvanceDays: 0,
      reminderHour: 0,
      reminderMin: 0,
      strongReminder: false,
      wechatReminder: false
    }

    subtasks.value = []
    taskDone.value = false
    selectedPlanName.value = ''
    createdAt.value = ''
    completedAt.value = ''

    originalForm.value = null
    originalSubtasks.value = null

    // 重置重复规则状态
    repeatRuleManager.resetRepeatRule()

    // 重置日期 Tab
    if (presetDate.value) {
      activeDateTab.value = 'preset'
    } else {
      activeDateTab.value = 'today'
    }
    customDate.value = ''

    console.log('[useTaskForm] 表单已重置')
  }

  // ============================================================
  // 返回 API
  // ============================================================

  return {
    // 核心状态
    taskId,
    originalTaskId,
    presetDate,
    isEdit,
    taskDone,

    // 表单数据
    form,
    subtasks,
    activeDateTab,
    customDate,
    selectedPlanName,
    createdAt,
    completedAt,

    // ✅ 重复规则管理器（新增）
    repeatRuleManager,

    // 计算属性
    currentQuadrant,
    hasFormChanged,
    createdAtText,
    completedAtText,
    deadlineText,

    // 子计划管理
    addSubtask,
    removeSubtask,
    toggleSubtaskDone,

    // 日期管理
    onDateTab,
    setCustomDate,

    // 四象限管理
    selectQuadrant,

    // 提交/保存
    submit,
    update,
    deleteTask,

    // 表单初始化
    loadFromTask,
    resetForm
  }
}
