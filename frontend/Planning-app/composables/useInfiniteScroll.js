/**
 * 无限滚动逻辑
 *
 * 职责：
 * - 实现3视图循环复用机制
 * - 处理横向滑动和重置逻辑
 * - 管理滚动位置和动画
 *
 * 核心原理：
 * - 只渲染3个视图（prev/current/next）
 * - 滑动超过阈值时，更新 baseDate 并重置位置
 * - 通过 transform 而非修改 DOM 实现滑动
 *
 * 架构层级：Composable 层
 * 依赖：useCalendarCore 的 state 和 views
 *
 * @module composables/useInfiniteScroll
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { ref, computed, watch } from 'vue'
import { addDate } from '@/utils/dateCalculator'
import { VIEW_MODE, GESTURE_THRESHOLD } from '@/utils/calendarConstants'

/**
 * 无限滚动 Composable
 *
 * @param {Object} state - 日历核心状态（来自 useCalendarCore）
 * @param {Array} views - 视图数组（来自 useCalendarCore）
 * @returns {Object} 滚动相关状态和方法
 */
export function useInfiniteScroll(state, views) {
  // ============================================================
  // 1. 获取屏幕宽度（用于计算滑动阈值）
  // ============================================================

  const systemInfo = uni.getSystemInfoSync()
  const screenWidth = systemInfo.windowWidth

  // 滑动阈值（50%屏幕宽度）
  const SWIPE_THRESHOLD = screenWidth * GESTURE_THRESHOLD.SWIPE

  // ============================================================
  // 2. 滚动位置管理
  // ============================================================

  /**
   * 滚动位置（初始为中间，显示 current 视图）
   * @type {Ref<number>}
   */
  const scrollPosition = ref(screenWidth)

  /**
   * 滑动偏移量（用于实时跟随手指）
   * @type {Ref<number>}
   */
  const dragOffset = ref(0)

  /**
   * 是否正在拖拽
   * @type {Ref<boolean>}
   */
  const isDragging = ref(false)

  // ============================================================
  // 3. 样式计算
  // ============================================================

  /**
   * 容器样式
   */
  const containerStyle = computed(() => ({
    width: '100%',
    height: '100%',
    overflow: 'hidden', // 关键：隐藏溢出
    position: 'relative'
  }))

  /**
   * 内容样式（关键：transform 实现滑动）
   */
  const contentStyle = computed(() => {
    // 计算最终位置 = 基础滚动位置 + 拖拽偏移
    const finalPosition = scrollPosition.value + dragOffset.value

    return {
      width: `${screenWidth * 3}px`, // 3个视图宽度
      height: '100%',
      display: 'flex',
      transform: `translateX(-${finalPosition}px)`,
      transition: isDragging.value ? 'none' : 'transform 0.3s ease', // 拖拽时无动画
      willChange: 'transform' // 性能优化
    }
  })

  // ============================================================
  // 4. 滚动控制方法
  // ============================================================

  /**
   * 处理横向拖拽（由手势调用）
   *
   * @param {number} deltaX - 横向滑动距离（<0向左，>0向右）
   */
  function handleDrag(deltaX) {
    if (!isDragging.value) {
      isDragging.value = true
    }

    // 更新拖拽偏移量（注意：方向相反）
    dragOffset.value = -deltaX

    // 检查是否超过阈值（但不立即重置，等到 endDrag 时处理）
  }

  /**
   * 结束拖拽（由手势调用）
   *
   * 判断逻辑：
   * - 如果滑动超过阈值 → 切换到下一个/上一个视图
   * - 否则 → 吸附回当前视图
   */
  function endDrag() {
    const totalOffset = dragOffset.value

    // 判断是否超过阈值
    if (totalOffset < -SWIPE_THRESHOLD) {
      // 向左滑动超过阈值 → 查看下一个
      resetToNext()
    } else if (totalOffset > SWIPE_THRESHOLD) {
      // 向右滑动超过阈值 → 查看上一个
      resetToPrev()
    } else {
      // 未超过阈值 → 吸附回当前视图
      snapToCurrent()
    }

    isDragging.value = false
  }

  /**
   * 吸附回当前视图（未超过阈值时）
   */
  function snapToCurrent() {
    dragOffset.value = 0 // 重置拖拽偏移
  }

  /**
   * 重置到下一个视图（向左滑动）
   */
  function resetToNext() {
    state.isAnimating = true

    // 1. 更新基准日期
    if (state.viewMode === VIEW_MODE.WEEK) {
      state.baseDate = addDate(state.baseDate, 1, 'week')
    } else {
      state.baseDate = addDate(state.baseDate, 1, 'month')
    }

    // 2. 重置拖拽偏移
    dragOffset.value = 0

    // 3. 重置滚动位置到中间（触发重新计算视图）
    setTimeout(() => {
      // scrollPosition 保持为 screenWidth（始终显示中间的 current 视图）
      state.isAnimating = false
    }, 300)
  }

  /**
   * 重置到上一个视图（向右滑动）
   */
  function resetToPrev() {
    state.isAnimating = true

    // 1. 更新基准日期
    if (state.viewMode === VIEW_MODE.WEEK) {
      state.baseDate = addDate(state.baseDate, -1, 'week')
    } else {
      state.baseDate = addDate(state.baseDate, -1, 'month')
    }

    // 2. 重置拖拽偏移
    dragOffset.value = 0

    // 3. 重置滚动位置到中间
    setTimeout(() => {
      state.isAnimating = false
    }, 300)
  }

  /**
   * 直接跳转到下一个视图（无动画）
   */
  function goNext() {
    if (state.viewMode === VIEW_MODE.WEEK) {
      state.baseDate = addDate(state.baseDate, 1, 'week')
    } else {
      state.baseDate = addDate(state.baseDate, 1, 'month')
    }
    dragOffset.value = 0
  }

  /**
   * 直接跳转到上一个视图（无动画）
   */
  function goPrev() {
    if (state.viewMode === VIEW_MODE.WEEK) {
      state.baseDate = addDate(state.baseDate, -1, 'week')
    } else {
      state.baseDate = addDate(state.baseDate, -1, 'month')
    }
    dragOffset.value = 0
  }

  // ============================================================
  // 5. 监听视图模式切换（重置滚动位置）
  // ============================================================

  watch(
    () => state.viewMode,
    () => {
      // 切换视图模式时，重置所有滚动状态
      scrollPosition.value = screenWidth
      dragOffset.value = 0
      isDragging.value = false
    }
  )

  // ============================================================
  // 6. 返回公开接口
  // ============================================================

  return {
    // 状态
    scrollPosition,
    dragOffset,
    isDragging,

    // 样式
    containerStyle,
    contentStyle,

    // 方法
    handleDrag,
    endDrag,
    snapToCurrent,
    goNext,
    goPrev,

    // 常量（供外部使用）
    screenWidth,
    SWIPE_THRESHOLD
  }
}
