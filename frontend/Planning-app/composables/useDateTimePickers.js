/**
 * useDateTimePickers - 日期/时间选择器 Composable
 *
 * 职责：封装任务编辑页面中的日期/时间选择器交互逻辑
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-11
 */

import { ref, computed } from 'vue'
import { formatDate } from '@/utils/date.js'

/**
 * 日期/时间选择器管理 Composable
 * @param {Object} options - 配置选项
 * @param {Object} options.form - 表单对象（包含 taskDate, endDate, startTime, endTime, isAllDay, hasTimeRange）
 * @returns {Object} 选择器状态和方法
 */
export function useDateTimePickers(options = {}) {
  const { form } = options

  // ============================================================
  // 日历选择器状态（DayPicker - 选择结束日期）
  // ============================================================

  /** 是否显示日历选择器 */
  const showDaysPicker = ref(false)

  /** 是否显示农历 */
  const showLunar = ref(true)

  /** 临时选中的结束日期 */
  const tempEndDate = ref('')

  // ============================================================
  // 时间选择器状态（TimePicker - 选择开始/结束时间）
  // ============================================================

  /** 是否显示时间选择器 */
  const showTimePicker = ref(false)

  /** 小时数组（0-23） */
  const hours = Array.from({ length: 24 }, (_, i) => i)

  /** 分钟数组（0-59） */
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  /** 临时选中的开始时间 - 小时 */
  const tempStartHour = ref(9)

  /** 临时选中的开始时间 - 分钟 */
  const tempStartMin = ref(0)

  /** 临时选中的结束时间 - 小时 */
  const tempEndHour = ref(10)

  /** 临时选中的结束时间 - 分钟 */
  const tempEndMin = ref(0)

  // ============================================================
  // 计算属性
  // ============================================================

  /** 滚轮 scroll-top 计算（用于滚动定位） */
  const ITEM_HEIGHT = 48 // rpx->px 近似值

  const startHourScrollTop = computed(() => tempStartHour.value * ITEM_HEIGHT)
  const startMinScrollTop = computed(() => tempStartMin.value * ITEM_HEIGHT)
  const endHourScrollTop = computed(() => tempEndHour.value * ITEM_HEIGHT)
  const endMinScrollTop = computed(() => tempEndMin.value * ITEM_HEIGHT)

  // ============================================================
  // 日历选择器方法
  // ============================================================

  /**
   * DayPicker 组件确认回调
   * @param {object} payload - { date: string, daysCount: number }
   */
  function onDayPickerConfirm(payload) {
    form.endDate = payload.date
    // 多天任务，isAllDay=true
    form.isAllDay = true
    form.startTime = ''
    form.endTime = ''
    tempEndDate.value = payload.date
    showDaysPicker.value = false
  }

  /**
   * 关闭日历选择器
   */
  function closeDaysPicker() {
    showDaysPicker.value = false
  }

  /**
   * 打开日历选择器（从外部调用）
   */
  function openDaysPicker() {
    const startDate = form.taskDate || formatDate(new Date())
    // 初始化临时结束日期
    tempEndDate.value = form.endDate || startDate
    showDaysPicker.value = true
  }

  // ============================================================
  // 时间选择器方法
  // ============================================================

  /**
   * 选择开始小时
   * @param {number} h - 小时（0-23）
   */
  function selectStartHour(h) {
    tempStartHour.value = h
    autoAdjustEndTime()
  }

  /**
   * 选择开始分钟
   * @param {number} m - 分钟（0-59）
   */
  function selectStartMin(m) {
    tempStartMin.value = m
    autoAdjustEndTime()
  }

  /**
   * 选择结束小时
   * @param {number} h - 小时（0-23）
   */
  function selectEndHour(h) {
    tempEndHour.value = h
  }

  /**
   * 选择结束分钟
   * @param {number} m - 分钟（0-59）
   */
  function selectEndMin(m) {
    tempEndMin.value = m
  }

  /**
   * 自动调整结束时间 = 开始时间 + 30分钟
   */
  function autoAdjustEndTime() {
    const totalMins = tempStartHour.value * 60 + tempStartMin.value + 30
    tempEndHour.value = Math.min(23, Math.floor(totalMins / 60))
    tempEndMin.value = totalMins % 60
  }

  /**
   * 打开时间选择器
   */
  function openTimePicker() {
    // 初始化：若已有值则读取，否则用当前时间
    if (form.startTime) {
      const [sh, sm] = form.startTime.split(':').map(Number)
      tempStartHour.value = sh
      tempStartMin.value = sm
    } else {
      const now = new Date()
      tempStartHour.value = now.getHours()
      tempStartMin.value = now.getMinutes()
    }
    if (form.endTime) {
      const [eh, em] = form.endTime.split(':').map(Number)
      tempEndHour.value = eh
      tempEndMin.value = em
    } else {
      autoAdjustEndTime()
    }
    showTimePicker.value = true
  }

  /**
   * 关闭时间选择器
   */
  function closeTimePicker() {
    showTimePicker.value = false
  }

  /**
   * 确认时间选择
   */
  function confirmTime() {
    const sh = String(tempStartHour.value).padStart(2, '0')
    const sm = String(tempStartMin.value).padStart(2, '0')
    const eh = String(tempEndHour.value).padStart(2, '0')
    const em = String(tempEndMin.value).padStart(2, '0')
    form.startTime = `${sh}:${sm}`
    form.endTime = `${eh}:${em}`
    form.isAllDay = false
    showTimePicker.value = false
  }

  // ============================================================
  // 滚动事件（占位符，实际使用tap选择）
  // ============================================================

  function onStartHourScroll() {}
  function onStartMinScroll() {}
  function onEndHourScroll() {}
  function onEndMinScroll() {}

  // ============================================================
  // 返回 API
  // ============================================================

  return {
    // 日历选择器状态
    showDaysPicker,
    showLunar,
    tempEndDate,

    // 时间选择器状态
    showTimePicker,
    hours,
    minutes,
    tempStartHour,
    tempStartMin,
    tempEndHour,
    tempEndMin,

    // 计算属性
    startHourScrollTop,
    startMinScrollTop,
    endHourScrollTop,
    endMinScrollTop,

    // 日历选择器方法
    openDaysPicker,
    closeDaysPicker,
    onDayPickerConfirm,

    // 时间选择器方法
    openTimePicker,
    closeTimePicker,
    confirmTime,
    selectStartHour,
    selectStartMin,
    selectEndHour,
    selectEndMin,
    autoAdjustEndTime,

    // 滚动事件
    onStartHourScroll,
    onStartMinScroll,
    onEndHourScroll,
    onEndMinScroll
  }
}
