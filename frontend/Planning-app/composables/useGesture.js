/**
 * 手势处理系统
 *
 * 职责：
 * - 识别横向/纵向手势方向
 * - 横向：调用 handleDrag(deltaX)，deltaX 与手指方向一致
 * - 纵向：控制 transitionProgress（周/月切换）
 * - 三端兼容（H5 / Android / iOS）
 *
 * 坐标系约定（与 useInfiniteScroll 一致）：
 * - 手指向右移动：deltaX > 0 → 看上一页
 * - 手指向左移动：deltaX < 0 → 看下一页
 * - 手指向上移动：deltaY < 0 → 月视图展开
 * - 手指向下移动：deltaY > 0 → 月视图收起成周视图
 *
 * 关键设计：
 * - 首次移动 > 10px 时锁定方向
 * - 方向锁定后只响应一个轴
 * - 每帧传入的是"增量"（本帧移动距离），不是累计值
 *
 * 架构层级：Composable 层
 *
 * @module composables/useGesture
 * @author Claude Sonnet 4.6
 * @date 2026-03-28
 */

import { ref } from 'vue'
import { GESTURE_DIRECTION, GESTURE_THRESHOLD, ANIMATION_CONFIG } from '@/utils/calendarConstants'

/**
 * 手势处理 Composable
 *
 * @param {Object} state - 日历核心状态（来自 useCalendarCore）
 * @param {Object} scrollMethods - 滚动方法（来自 useInfiniteScroll）
 * @param {Function} scrollMethods.handleDrag - 处理增量拖拽
 * @param {Function} scrollMethods.endDrag - 结束拖拽
 * @returns {Object} 触摸事件处理方法
 */
export function useGesture(state, scrollMethods) {
  const { handleDrag, endDrag } = scrollMethods

  // ============================================================
  // 1. 手势内部状态
  // ============================================================

  const gesture = ref({
    startX: 0,
    startY: 0,
    prevX: 0,
    prevY: 0,
    direction: GESTURE_DIRECTION.NONE,
    isTracking: false,
    lastMoveTime: 0
  })

  // ============================================================
  // 2. 触摸事件处理
  // ============================================================

  /**
   * 触摸开始
   *
   * @param {TouchEvent} e
   */
  function handleTouchStart(e) {
    const touch = e.touches ? e.touches[0] : e
    const x = touch.clientX
    const y = touch.clientY

    gesture.value = {
      startX: x,
      startY: y,
      prevX: x,
      prevY: y,
      direction: GESTURE_DIRECTION.NONE,
      isTracking: true,
      lastMoveTime: Date.now()
    }
  }

  /**
   * 触摸移动 - 识别方向并分发
   *
   * @param {TouchEvent} e
   */
  function handleTouchMove(e) {
    if (!gesture.value.isTracking) return

    const touch = e.touches ? e.touches[0] : e
    const x = touch.clientX
    const y = touch.clientY

    // 每帧都打印原始 X 坐标，不受节流影响，观察是否连续平滑
    console.log(`[RAW] t=${Date.now()} x=${x.toFixed(1)} prevX=${gesture.value.prevX.toFixed(1)} delta=${(x - gesture.value.prevX).toFixed(1)}`)

    // 节流：约60fps
    const now = Date.now()
    if (now - gesture.value.lastMoveTime < ANIMATION_CONFIG.RAF_THROTTLE) {
      return
    }
    gesture.value.lastMoveTime = now

    const totalDeltaX = x - gesture.value.startX
    const totalDeltaY = y - gesture.value.startY
    const frameDeltaX = x - gesture.value.prevX
    const frameDeltaY = y - gesture.value.prevY

    // 首次移动超过阈值时锁定方向
    if (gesture.value.direction === GESTURE_DIRECTION.NONE) {
      const absX = Math.abs(totalDeltaX)
      const absY = Math.abs(totalDeltaY)

      if (absX > GESTURE_THRESHOLD.DIRECTION || absY > GESTURE_THRESHOLD.DIRECTION) {
        gesture.value.direction = absX >= absY
          ? GESTURE_DIRECTION.HORIZONTAL
          : GESTURE_DIRECTION.VERTICAL
      }
    }

    if (gesture.value.direction === GESTURE_DIRECTION.HORIZONTAL) {
      preventDefaultCompat(e)
      handleDrag(frameDeltaX)
    } else if (gesture.value.direction === GESTURE_DIRECTION.VERTICAL) {
      preventDefaultCompat(e)
      handleVerticalDrag(frameDeltaY)
    }

    gesture.value.prevX = x
    gesture.value.prevY = y
  }

  /**
   * 触摸结束
   *
   * @param {TouchEvent} e
   */
  function handleTouchEnd(e) {
    if (!gesture.value.isTracking) return

    const dir = gesture.value.direction

    if (dir === GESTURE_DIRECTION.HORIZONTAL) {
      endDrag()
    } else if (dir === GESTURE_DIRECTION.VERTICAL) {
      snapToViewMode()
    }

    gesture.value.isTracking = false
  }

  /**
   * 触摸取消（系统中断）
   */
  function handleTouchCancel(e) {
    handleTouchEnd(e)
  }

  // ============================================================
  // 3. 纵向滑动：控制 transitionProgress
  // ============================================================

  /**
   * 处理纵向拖拽（增量模式）
   *
   * - 向下拖（frameDeltaY > 0）→ progress 增大 → 展开月视图
   * - 向上拖（frameDeltaY < 0）→ progress 减小 → 收起周视图
   *
   * @param {number} frameDeltaY - 本帧纵向增量（正=向下，负=向上）
   */
  function handleVerticalDrag(frameDeltaY) {
    const SENSITIVITY = 150
    const delta = frameDeltaY / SENSITIVITY
    const newProgress = Math.max(0, Math.min(1, state.transitionProgress + delta))
    state.transitionProgress = newProgress
  }

  /**
   * 松手后吸附到最近的视图模式
   */
  function snapToViewMode() {
    const targetProgress = state.transitionProgress < 0.5 ? 0 : 1
    const targetMode = targetProgress === 0 ? 'week' : 'month'
    animateProgress(state.transitionProgress, targetProgress, () => {
      state.viewMode = targetMode
    })
  }

  // ============================================================
  // 4. 动画工具（三端兼容）
  // ============================================================

  /**
   * 缓动动画（easeOutCubic），三端兼容
   *
   * @param {number} from - 起始值
   * @param {number} to - 目标值
   * @param {Function} [callback] - 完成时的回调
   */
  function animateProgress(from, to, callback) {
    const duration = ANIMATION_CONFIG.DURATION
    const RAF_THROTTLE = ANIMATION_CONFIG.RAF_THROTTLE
    const startTime = Date.now()

    function step() {
      const elapsed = Date.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      state.transitionProgress = from + (to - from) * eased

      if (t < 1) {
        // #ifdef H5
        requestAnimationFrame(step)
        // #endif
        // #ifndef H5
        setTimeout(step, RAF_THROTTLE)
        // #endif
      } else {
        state.transitionProgress = to
        if (callback) callback()
      }
    }

    // #ifdef H5
    requestAnimationFrame(step)
    // #endif
    // #ifndef H5
    setTimeout(step, RAF_THROTTLE)
    // #endif
  }

  // ============================================================
  // 5. 三端兼容工具
  // ============================================================

  /**
   * 阻止默认滚动行为（三端兼容）
   *
   * @param {Event} e
   */
  function preventDefaultCompat(e) {
    // #ifdef H5
    if (e && e.cancelable) {
      e.preventDefault()
    }
    // #endif
    // #ifdef APP-PLUS
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    // #endif
  }

  // ============================================================
  // 6. 返回公开接口
  // ============================================================

  return {
    gesture,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  }
}
