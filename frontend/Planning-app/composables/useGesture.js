/**
 * 手势处理系统
 *
 * 职责：
 * - 识别横向/纵向手势方向
 * - 处理横向滑动（翻页）
 * - 处理纵向滑动（周/月切换）
 * - 确保三端兼容（H5 / Android / iOS）
 *
 * 关键设计：
 * - 首次移动时判断方向（避免横纵冲突）
 * - 锁定方向后只响应一个手势
 * - 使用 RAF 节流确保60fps
 *
 * 架构层级：Composable 层
 * 依赖：useCalendarCore 的 state，useInfiniteScroll 的方法
 *
 * @module composables/useGesture
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { ref } from 'vue'
import { GESTURE_DIRECTION, GESTURE_THRESHOLD, ANIMATION_CONFIG } from '@/utils/calendarConstants'

/**
 * 手势处理 Composable
 *
 * @param {Object} state - 日历核心状态（来自 useCalendarCore）
 * @param {Object} scrollMethods - 滚动方法（来自 useInfiniteScroll）
 * @returns {Object} 手势处理方法
 */
export function useGesture(state, scrollMethods) {
  const { handleDrag, endDrag } = scrollMethods

  // ============================================================
  // 1. 手势状态
  // ============================================================

  /**
   * 手势状态
   * @type {Ref<Object>}
   */
  const gesture = ref({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    direction: GESTURE_DIRECTION.NONE, // 'horizontal' | 'vertical' | null
    isTracking: false,
    startTime: 0, // 用于计算速度
    lastMoveTime: 0 // 用于 RAF 节流
  })

  // ============================================================
  // 2. 触摸事件处理（三端兼容）
  // ============================================================

  /**
   * 触摸开始
   *
   * @param {Event} e - 触摸事件
   */
  function handleTouchStart(e) {
    // 获取触摸点坐标（兼容 H5 和 APP）
    const touch = e.touches ? e.touches[0] : e
    const clientX = touch.clientX || touch.pageX
    const clientY = touch.clientY || touch.pageY

    gesture.value = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      direction: GESTURE_DIRECTION.NONE,
      isTracking: true,
      startTime: Date.now(),
      lastMoveTime: Date.now()
    }
  }

  /**
   * 触摸移动
   *
   * @param {Event} e - 触摸事件
   */
  function handleTouchMove(e) {
    if (!gesture.value.isTracking) return

    // RAF 节流（确保60fps）
    const now = Date.now()
    if (now - gesture.value.lastMoveTime < ANIMATION_CONFIG.RAF_THROTTLE) {
      return
    }
    gesture.value.lastMoveTime = now

    // 获取触摸点坐标
    const touch = e.touches ? e.touches[0] : e
    const clientX = touch.clientX || touch.pageX
    const clientY = touch.clientY || touch.pageY

    const deltaX = clientX - gesture.value.startX
    const deltaY = clientY - gesture.value.startY

    // 1. 首次移动判断方向（避免横纵冲突）
    if (gesture.value.direction === GESTURE_DIRECTION.NONE) {
      if (Math.abs(deltaX) > GESTURE_THRESHOLD.DIRECTION ||
          Math.abs(deltaY) > GESTURE_THRESHOLD.DIRECTION) {
        gesture.value.direction = Math.abs(deltaX) > Math.abs(deltaY)
          ? GESTURE_DIRECTION.HORIZONTAL
          : GESTURE_DIRECTION.VERTICAL
      }
    }

    // 2. 根据方向处理（三端兼容的阻止默认行为）
    if (gesture.value.direction === GESTURE_DIRECTION.HORIZONTAL) {
      // 横向滑动：翻页
      preventDefaultCompat(e)
      const moveDelta = clientX - gesture.value.currentX
      handleDrag(-moveDelta) // 注意：方向相反
      gesture.value.currentX = clientX
    } else if (gesture.value.direction === GESTURE_DIRECTION.VERTICAL) {
      // 纵向滑动：周/月切换
      preventDefaultCompat(e)
      handleVerticalDrag(deltaY)
    }
  }

  /**
   * 触摸结束
   *
   * @param {Event} e - 触摸事件
   */
  function handleTouchEnd(e) {
    if (!gesture.value.isTracking) return

    const direction = gesture.value.direction

    // 松手后自动吸附到最近的视图
    if (direction === GESTURE_DIRECTION.HORIZONTAL) {
      endDrag() // 交给 useInfiniteScroll 处理
    } else if (direction === GESTURE_DIRECTION.VERTICAL) {
      snapToViewMode()
    }

    gesture.value.isTracking = false
  }

  /**
   * 触摸取消（用户手指离开屏幕或被系统中断）
   *
   * @param {Event} e - 触摸事件
   */
  function handleTouchCancel(e) {
    handleTouchEnd(e)
  }

  // ============================================================
  // 3. 纵向滚动处理（周/月切换）
  // ============================================================

  /**
   * 处理纵向拖拽（控制 transitionProgress）
   *
   * @param {number} deltaY - 纵向滑动距离（<0向上，>0向下）
   */
  function handleVerticalDrag(deltaY) {
    // 向下滑：month → week（progress: 1 → 0）
    // 向上滑：week → month（progress: 0 → 1）
    const maxDelta = 200 // 最大滑动距离200px
    const delta = -deltaY / maxDelta // 反向
    const newProgress = Math.max(0, Math.min(1, state.transitionProgress + delta))

    state.transitionProgress = newProgress
  }

  /**
   * 吸附到视图模式（纵向滑动结束后）
   */
  function snapToViewMode() {
    // 根据 progress 吸附到 week(0) 或 month(1)
    const targetProgress = state.transitionProgress < 0.5 ? 0 : 1
    const targetMode = targetProgress === 0 ? 'week' : 'month'

    animateProgress(state.transitionProgress, targetProgress, () => {
      state.viewMode = targetMode
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
    const duration = ANIMATION_CONFIG.DURATION
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
        setTimeout(animate, ANIMATION_CONFIG.RAF_THROTTLE)
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
    setTimeout(animate, ANIMATION_CONFIG.RAF_THROTTLE)
    // #endif
  }

  // ============================================================
  // 4. 三端兼容工具函数
  // ============================================================

  /**
   * 阻止默认行为（三端兼容）
   *
   * 注意：
   * - H5 端：直接使用 e.preventDefault()
   * - APP 端：部分情况需要特殊处理
   *
   * @param {Event} e - 事件对象
   */
  function preventDefaultCompat(e) {
    // #ifdef H5
    if (e.cancelable) {
      e.preventDefault()
    }
    // #endif

    // #ifdef APP-PLUS
    // APP 端某些情况下 preventDefault 不生效
    // 可能需要通过其他方式阻止（如设置 @touchmove.stop.prevent）
    // 这里保持调用，由外部通过修饰符处理
    if (e.preventDefault) {
      e.preventDefault()
    }
    // #endif
  }

  // ============================================================
  // 5. 返回公开接口
  // ============================================================

  return {
    // 状态
    gesture,

    // 触摸事件处理
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  }
}
