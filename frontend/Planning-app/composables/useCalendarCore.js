/**
 * 日历核心状态管理
 *
 * 职责：
 * - 管理日历核心状态（baseDate、currentDate、viewMode 等）
 * - 生成视图数据（3个视图循环复用）
 * - 集成任务数据（通过 Store）
 * - 提供日期选择、跳转等操作
 *
 * 架构层级：Composable 层
 * 调用链：Component → useCalendarCore → Store → Repository
 *
 * @module composables/useCalendarCore
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { reactive, computed, watch } from 'vue'
import { useTaskStore } from '@/store/task'
import {
  getWeekStart,
  getMonthStart,
  getWeekDays,
  getMonthGrid,
  addDate,
  isSameDay,
  isToday,
  isWeekend,
  formatMonthTitle,
  formatWeekTitle
} from '@/utils/dateCalculator'
import { VIEW_MODE, VIEW_OFFSET } from '@/utils/calendarConstants'

/**
 * 日历核心状态 Composable
 *
 * @param {Date} [initialDate=new Date()] - 初始日期
 * @param {Object} [options={}] - 配置选项
 * @param {boolean} [options.enableTaskIntegration=true] - 是否启用任务集成
 * @returns {Object} 日历核心状态和方法
 */
export function useCalendarCore(initialDate = new Date(), options = {}) {
  const { enableTaskIntegration = true } = options


  // ============================================================
  // 1. 状态定义
  // ============================================================

  /**
   * 核心状态
   * @type {Object}
   * @property {Date} baseDate - 基准日期（当前视图的锚点）
   * @property {Date} currentDate - 当前选中日期
   * @property {number} offset - 横向偏移量（周数或月数）
   * @property {string} viewMode - 视图模式（'week' | 'month'）
   * @property {number} transitionProgress - 周/月切换进度（0=week, 1=month）
   * @property {number} scrollX - 横向滚动位置
   * @property {boolean} isAnimating - 是否正在动画中
   */
  const state = reactive({
    baseDate: new Date(initialDate),
    currentDate: new Date(initialDate),
    offset: 0,
    viewMode: VIEW_MODE.MONTH, // 默认月视图
    transitionProgress: 1, // 0=week, 1=month
    scrollX: 0,
    isAnimating: false
  })

  // ============================================================
  // 2. Store 集成（可选）
  // ============================================================

  let taskStore = null
  if (enableTaskIntegration) {
    try {
      taskStore = useTaskStore()
    } catch (error) {
      console.warn('[useCalendarCore] 任务 Store 初始化失败，任务集成功能将不可用:', error)
    }
  }

  // ============================================================
  // 3. 视图数据生成
  // ============================================================

  /**
   * 生成单个视图的数据（周或月）
   *
   * @param {Date} baseDate - 基准日期
   * @param {number} offset - 偏移量（-1/0/+1）
   * @param {string} viewMode - 视图模式
   * @param {Date} currentDate - 当前选中日期
   * @returns {Object} 视图数据
   */
  function generateViewData(baseDate, offset, viewMode, currentDate) {
    // 1. 计算该视图的起始日期
    let viewDate
    if (viewMode === VIEW_MODE.WEEK) {
      const weekStart = getWeekStart(baseDate)
      viewDate = addDate(weekStart, offset, 'week')
    } else {
      const monthStart = getMonthStart(baseDate)
      viewDate = addDate(monthStart, offset, 'month')
    }

    // 2. 获取日期数组
    const dates = viewMode === VIEW_MODE.WEEK
      ? getWeekDays(viewDate)
      : getMonthGrid(viewDate)

    // 3. 转换为 DateCell 对象
    const days = dates.map(date => {
      const cell = {
        date,
        day: date.getDate(),
        isToday: isToday(date),
        isCurrentMonth: date.getMonth() === viewDate.getMonth(),
        isSelected: isSameDay(date, currentDate),
        isWeekend: isWeekend(date)
      }

      // 集成任务数据（如果启用）
      if (taskStore) {
        cell.tasks = getTasksForDate(date)
        cell.hasTask = cell.tasks.length > 0
      }

      return cell
    })

    // 4. 生成标题
    const title = viewMode === VIEW_MODE.WEEK
      ? formatWeekTitle(viewDate)
      : formatMonthTitle(viewDate)

    return {
      id: `${viewMode}-${offset}-${viewDate.getTime()}`,
      offset,
      days,
      title,
      viewDate // 保存用于调试
    }
  }

  /**
   * 计算3个视图的数据（prev/current/next）
   */
  const views = computed(() => {
    const result = [VIEW_OFFSET.PREV, VIEW_OFFSET.CURRENT, VIEW_OFFSET.NEXT].map(offset =>
      generateViewData(
        state.baseDate,
        offset,
        state.viewMode,
        state.currentDate
      )
    )
    const current = result.find(v => v.offset === VIEW_OFFSET.CURRENT)
    return result
  })

  /**
   * 当前视图（offset = 0）
   */
  const currentView = computed(() => {
    return views.value.find(v => v.offset === VIEW_OFFSET.CURRENT)
  })

  // ============================================================
  // 4. 任务数据集成（通过 Store）
  // ============================================================

  /**
   * 获取某日期的任务列表
   *
   * @param {Date} date - 日期
   * @returns {Array} 任务数组
   */
  function getTasksForDate(date) {
    if (!taskStore || !taskStore.tasks) {
      return []
    }

    // 过滤出该日期的任务
    return taskStore.tasks.filter(task => {
      // 处理普通任务
      if (task.startDate && isSameDay(new Date(task.startDate), date)) {
        return true
      }

      // 处理重复任务（RRULE）
      if (task.rrule && task.rruleOccurrences) {
        return task.rruleOccurrences.some(occurrence =>
          isSameDay(new Date(occurrence), date)
        )
      }

      return false
    })
  }

  /**
   * 获取某日期的任务数量
   *
   * @param {Date} date - 日期
   * @returns {number} 任务数量
   */
  function getTaskCountForDate(date) {
    return getTasksForDate(date).length
  }

  // ============================================================
  // 5. 操作方法
  // ============================================================

  /**
   * 选择日期
   *
   * @param {Date} date - 日期
   */
  function selectDate(date) {
    state.currentDate = new Date(date)
    state.baseDate = new Date(date) // 同步基准日期
  }

  /**
   * 跳转到今天
   */
  function goToToday() {
    const today = new Date()
    state.currentDate = today
    state.baseDate = today
    state.offset = 0
  }

  /**
   * 切换视图模式（周 ⇄ 月）
   */
  function toggleViewMode() {
    const targetMode = state.viewMode === VIEW_MODE.WEEK
      ? VIEW_MODE.MONTH
      : VIEW_MODE.WEEK
    const targetProgress = targetMode === VIEW_MODE.MONTH ? 1 : 0

    // 动画过渡
    animateProgress(state.transitionProgress, targetProgress, () => {
      state.viewMode = targetMode
    })
  }

  /**
   * 切换到指定视图模式
   *
   * @param {string} mode - 视图模式（'week' | 'month'）
   */
  function setViewMode(mode) {
    if (mode === state.viewMode) return

    const targetProgress = mode === VIEW_MODE.MONTH ? 1 : 0
    animateProgress(state.transitionProgress, targetProgress, () => {
      state.viewMode = mode
    })
  }

  /**
   * 动画过渡到目标 progress
   *
   * @param {number} from - 起始值
   * @param {number} to - 目标值
   * @param {Function} [callback] - 完成回调
   */
  function animateProgress(from, to, callback) {
    const duration = 300
    const RAF_THROTTLE = 16 // 约60fps
    const startTime = Date.now()

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / duration)

      // 缓动函数（easeOutCubic）
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      state.transitionProgress = from + (to - from) * easeProgress

      if (progress < 1) {
        // 三端兼容：APP端不支持 requestAnimationFrame，使用 setTimeout 模拟
        // #ifdef H5
        requestAnimationFrame(animate)
        // #endif
        // #ifndef H5
        setTimeout(animate, RAF_THROTTLE)
        // #endif
      } else {
        state.transitionProgress = to // 确保精确到终点
        if (callback) {
          callback()
        }
      }
    }

    // 三端兼容启动动画
    // #ifdef H5
    requestAnimationFrame(animate)
    // #endif
    // #ifndef H5
    setTimeout(animate, RAF_THROTTLE)
    // #endif
  }

  /**
   * 前进一个周期（周或月）
   */
  function goNext() {
    const unit = state.viewMode === VIEW_MODE.WEEK ? 'week' : 'month'
    state.baseDate = addDate(state.baseDate, 1, unit)
  }

  /**
   * 后退一个周期（周或月）
   */
  function goPrev() {
    const unit = state.viewMode === VIEW_MODE.WEEK ? 'week' : 'month'
    state.baseDate = addDate(state.baseDate, -1, unit)
  }

  // ============================================================
  // 6. 监听任务数据变化（自动刷新视图）
  // ============================================================

  if (taskStore) {
    watch(
      () => taskStore.tasks,
      () => {
        // 任务数据变化时，强制重新计算视图
        // views 是 computed，会自动触发更新
      },
      { deep: true }
    )
  }

  // ============================================================
  // 7. 返回公开接口
  // ============================================================

  return {
    // 状态
    state,

    // 计算属性
    views,
    currentView,

    // 任务集成方法
    getTasksForDate,
    getTaskCountForDate,

    // 操作方法
    selectDate,
    goToToday,
    toggleViewMode,
    setViewMode,
    goNext,
    goPrev
  }
}
