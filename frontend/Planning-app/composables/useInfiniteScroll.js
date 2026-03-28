/**
 * 无限滚动逻辑
 *
 * 职责：
 * - 实现3视图循环复用机制
 * - 处理横向拖拽和重置逻辑
 * - 管理滚动位置和动画
 *
 * 核心原理：
 * - 只渲染3个视图（prev/current/next）
 * - 初始位置 = screenWidth（显示中间的 current 视图）
 * - 拖拽时 dragOffset 实时跟随手指
 * - 松手超过阈值 → 更新 baseDate + 重置 dragOffset
 *
 * 坐标系约定（重要！）：
 * - dragOffset > 0：内容向右移动（手指向右滑，看上一页）
 * - dragOffset < 0：内容向左移动（手指向左滑，看下一页）
 * - 最终 translateX = -(scrollPosition + dragOffset)
 *   - scrollPosition 固定为 screenWidth（始终指向中间视图）
 *   - dragOffset 跟随手指变化
 *
 * 架构层级：Composable 层
 * 依赖：useCalendarCore 的 state 和 views
 *
 * @module composables/useInfiniteScroll
 * @author Claude Sonnet 4.6
 * @date 2026-03-28
 */

import { ref, computed, watch } from 'vue'
import { addDate } from '@/utils/dateCalculator'
import { VIEW_MODE, GESTURE_THRESHOLD } from '@/utils/calendarConstants'

/**
 * 无限滚动 Composable
 *
 * @param {Object} state - 日历核心状态（来自 useCalendarCore）
 * @param {import('vue').ComputedRef} views - 视图数组（来自 useCalendarCore）
 * @returns {Object} 滚动相关状态和方法
 */
export function useInfiniteScroll(state, views) {
  // ============================================================
  // 1. 获取屏幕宽度
  // ============================================================

  const systemInfo = uni.getSystemInfoSync()
  const screenWidth = systemInfo.windowWidth

  // 滑动切换阈值（30%屏幕宽度，更灵敏）
  const SWIPE_THRESHOLD = screenWidth * GESTURE_THRESHOLD.SWIPE

  console.log('[useInfiniteScroll] 初始化，屏幕宽度:', screenWidth, '切换阈值:', SWIPE_THRESHOLD)

  // ============================================================
  // 2. 滚动状态
  // ============================================================

  /**
   * 基础滚动位置：固定为 screenWidth（始终显示中间视图）
   * 不会变化，只是初始定位
   */
  const scrollPosition = ref(screenWidth)

  /**
   * 拖拽偏移量（实时跟随手指）
   *
   * 正值 = 内容向右偏移（用户向右滑，看上一页）
   * 负值 = 内容向左偏移（用户向左滑，看下一页）
   */
  const dragOffset = ref(0)

  /**
   * 是否正在拖拽（拖拽时禁用 transition 动画）
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
    overflow: 'hidden',
    position: 'relative'
  }))

  /**
   * 滚动内容样式（关键：通过 transform 驱动滑动）
   *
   * translateX = -(scrollPosition + dragOffset)
   * - scrollPosition = screenWidth（固定，指向中间视图）
   * - dragOffset 跟随手指实时变化
   *
   * 例：screenWidth = 390
   * - 初始：translateX = -390px（显示中间视图）
   * - 向左拖 50px：dragOffset = -50，translateX = -440px（内容左移）
   * - 向右拖 50px：dragOffset = +50，translateX = -340px（内容右移）
   */
  const contentStyle = computed(() => {
    const translateX = scrollPosition.value + dragOffset.value

    return {
      width: `${screenWidth * 3}px`,  // 3个视图的总宽度
      height: '100%',
      display: 'flex',
      transform: `translateX(-${translateX}px)`,
      // 拖拽中禁用 transition（避免卡顿），松手后启用（吸附动画）
      transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      willChange: 'transform'
    }
  })

  // ============================================================
  // 4. 核心方法
  // ============================================================

  /**
   * 处理横向拖拽（由 useGesture 调用）
   *
   * 坐标系：
   * - deltaX > 0：手指向右移动（向右滑，看上一页）
   * - deltaX < 0：手指向左移动（向左滑，看下一页）
   *
   * @param {number} deltaX - 本次增量（手指位移，正=右，负=左）
   */
  function handleDrag(deltaX) {
    isDragging.value = true

    // dragOffset 累积手指位移（与手指方向一致）
    dragOffset.value += deltaX

    console.log('[useInfiniteScroll] handleDrag - deltaX:', deltaX.toFixed(1), '累计 dragOffset:', dragOffset.value.toFixed(1))
  }

  /**
   * 结束拖拽（由 useGesture 调用）
   *
   * 判断逻辑：
   * - dragOffset < -SWIPE_THRESHOLD：向左滑超过阈值 → 切换到下一个视图（goNext）
   * - dragOffset > +SWIPE_THRESHOLD：向右滑超过阈值 → 切换到上一个视图（goPrev）
   * - 否则：吸附回当前视图
   */
  function endDrag() {
    const offset = dragOffset.value
    isDragging.value = false

    console.log('[useInfiniteScroll] endDrag - dragOffset:', offset.toFixed(1), '阈值:', SWIPE_THRESHOLD.toFixed(1))

    if (offset < -SWIPE_THRESHOLD) {
      // 向左超过阈值 → 下一页
      console.log('[useInfiniteScroll] 触发 → 下一页')
      goNext()
    } else if (offset > SWIPE_THRESHOLD) {
      // 向右超过阈值 → 上一页
      console.log('[useInfiniteScroll] 触发 → 上一页')
      goPrev()
    } else {
      // 未超过阈值 → 吸附回当前视图
      console.log('[useInfiniteScroll] 未超阈值 → 吸附回原位')
      snapToCurrent()
    }
  }

  /**
   * 吸附回当前视图（有动画：transition 已在 contentStyle 中开启）
   */
  function snapToCurrent() {
    dragOffset.value = 0
  }

  /**
   * 切换到下一个视图（手指向左滑）
   *
   * 原理：
   * 1. 先把 dragOffset 设为 -screenWidth（内容左移一整页，视觉上看到 next 视图）
   * 2. 等 transition 动画完成（300ms）
   * 3. 更新 baseDate（数据前进一周/月）
   * 4. 重置 dragOffset = 0（视图数据已更新，重置后仍显示"中间"视图）
   */
  function goNext() {
    // 先动画到 next 视图位置
    dragOffset.value = -screenWidth

    setTimeout(() => {
      // 更新基准日期（触发 views 重算）
      if (state.viewMode === VIEW_MODE.WEEK) {
        state.baseDate = addDate(state.baseDate, 1, 'week')
      } else {
        state.baseDate = addDate(state.baseDate, 1, 'month')
      }

      // 无动画地重置（因为 baseDate 变了，views 重算，current 视图变成新内容）
      isDragging.value = true   // 先禁用 transition
      dragOffset.value = 0

      // 下一帧再开启 transition
      setTimeout(() => {
        isDragging.value = false
      }, 16)

      console.log('[useInfiniteScroll] goNext 完成，新 baseDate:', state.baseDate.toISOString().slice(0, 10))
    }, 300)
  }

  /**
   * 切换到上一个视图（手指向右滑）
   */
  function goPrev() {
    // 先动画到 prev 视图位置
    dragOffset.value = screenWidth

    setTimeout(() => {
      // 更新基准日期
      if (state.viewMode === VIEW_MODE.WEEK) {
        state.baseDate = addDate(state.baseDate, -1, 'week')
      } else {
        state.baseDate = addDate(state.baseDate, -1, 'month')
      }

      isDragging.value = true
      dragOffset.value = 0

      setTimeout(() => {
        isDragging.value = false
      }, 16)

      console.log('[useInfiniteScroll] goPrev 完成，新 baseDate:', state.baseDate.toISOString().slice(0, 10))
    }, 300)
  }

  // ============================================================
  // 5. 监听视图模式切换（重置滚动状态）
  // ============================================================

  watch(
    () => state.viewMode,
    () => {
      isDragging.value = true
      dragOffset.value = 0
      setTimeout(() => {
        isDragging.value = false
      }, 16)
    }
  )

  // ============================================================
  // 6. 返回公开接口
  // ============================================================

  return {
    scrollPosition,
    dragOffset,
    isDragging,
    containerStyle,
    contentStyle,
    handleDrag,
    endDrag,
    snapToCurrent,
    goNext,
    goPrev,
    screenWidth,
    SWIPE_THRESHOLD
  }
}
