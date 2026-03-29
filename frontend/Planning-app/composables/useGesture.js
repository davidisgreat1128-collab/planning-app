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

  /**
   * 触摸追踪状态
   */
  const gesture = ref({
    startX: 0,           // 触摸起始 X
    startY: 0,           // 触摸起始 Y
    prevX: 0,            // 上一帧的 X（用于计算增量）
    prevY: 0,            // 上一帧的 Y
    direction: GESTURE_DIRECTION.NONE,  // 锁定的方向
    isTracking: false,   // 是否正在追踪
    lastMoveTime: 0      // 上次 move 时间（节流用）
  })

  // ============================================================
  // 2. 触摸事件处理
  // ============================================================

  /**
   * 触摸开始 - 记录起始点
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

    console.log('[useGesture] touchStart - x:', x.toFixed(1), 'y:', y.toFixed(1))
  }

  /**
   * 触摸移动 - 识别方向并分发
   *
   * @param {TouchEvent} e
   */
  function handleTouchMove(e) {
    // 【日志A】每次 touchMove 进入时立即打印，节流前，用于检测 touchEnd 后是否有残留 move
    console.log(`[Gesture:MOVE入口] t=${Date.now()} isTracking=${gesture.value.isTracking}`)

    if (!gesture.value.isTracking) return

    // 节流：约60fps
    const now = Date.now()
    if (now - gesture.value.lastMoveTime < ANIMATION_CONFIG.RAF_THROTTLE) {
      return
    }
    gesture.value.lastMoveTime = now

    const touch = e.touches ? e.touches[0] : e
    const x = touch.clientX
    const y = touch.clientY

    // 与起始点的累计位移（用于首次方向判断）
    const totalDeltaX = x - gesture.value.startX
    const totalDeltaY = y - gesture.value.startY

    // 与上一帧的增量（用于实时驱动）
    const frameDeltaX = x - gesture.value.prevX
    const frameDeltaY = y - gesture.value.prevY

    // 1. 首次移动超过阈值时，锁定方向
    if (gesture.value.direction === GESTURE_DIRECTION.NONE) {
      const absX = Math.abs(totalDeltaX)
      const absY = Math.abs(totalDeltaY)

      if (absX > GESTURE_THRESHOLD.DIRECTION || absY > GESTURE_THRESHOLD.DIRECTION) {
        if (absX >= absY) {
          gesture.value.direction = GESTURE_DIRECTION.HORIZONTAL
          console.log('[useGesture] 锁定方向 → 横向（totalDeltaX:', totalDeltaX.toFixed(1), '）')
        } else {
          gesture.value.direction = GESTURE_DIRECTION.VERTICAL
          console.log('[useGesture] 锁定方向 → 纵向（totalDeltaY:', totalDeltaY.toFixed(1), '）')
        }
      }
    }

    // 2. 根据锁定方向处理
    if (gesture.value.direction === GESTURE_DIRECTION.HORIZONTAL) {
      // 阻止页面滚动
      preventDefaultCompat(e)

      // 传递增量（正=右，负=左），useInfiniteScroll 负责累积
      handleDrag(frameDeltaX)

      console.log('[useGesture] 横向移动 - 帧增量:', frameDeltaX.toFixed(1))

    } else if (gesture.value.direction === GESTURE_DIRECTION.VERTICAL) {
      preventDefaultCompat(e)

      // 传递帧增量给纵向处理
      handleVerticalDrag(frameDeltaY)

      console.log('[useGesture] 纵向移动 - 帧增量:', frameDeltaY.toFixed(1), 'progress:', state.transitionProgress.toFixed(3))
    }

    // 更新上一帧坐标
    gesture.value.prevX = x
    gesture.value.prevY = y
  }

  /**
   * 触摸结束 - 根据方向决定最终状态
   *
   * @param {TouchEvent} e
   */
  function handleTouchEnd(e) {
    if (!gesture.value.isTracking) return

    const dir = gesture.value.direction
    // 【日志B】touchEnd 触发时记录时间戳，对比日志A 判断是否有 move 残留
    console.log(`[Gesture:END] t=${Date.now()} dir=${dir}`)

    if (dir === GESTURE_DIRECTION.HORIZONTAL) {
      endDrag()
    } else if (dir === GESTURE_DIRECTION.VERTICAL) {
      snapToViewMode()
    }

    gesture.value.isTracking = false
    // 【日志C】isTracking 关闭时间点
    console.log(`[Gesture:END] t=${Date.now()} isTracking已关闭`)
  }

  /**
   * 触摸取消（系统中断）
   */
  function handleTouchCancel(e) {
    console.log('[useGesture] touchCancel')
    handleTouchEnd(e)
  }

  // ============================================================
  // 3. 纵向滑动：控制 transitionProgress
  // ============================================================

  /**
   * 处理纵向拖拽（增量模式）
   *
   * 物理模型（与用户期望对齐）：
   * - 周视图（progress=0）下，向下拖（frameDeltaY > 0）→ progress 增大 → 展开成月视图
   * - 月视图（progress=1）下，向上拖（frameDeltaY < 0）→ progress 减小 → 收起成周视图
   *
   * 即：progress 与手指向下的位移正相关
   * delta = +frameDeltaY / SENSITIVITY
   *
   * 灵敏度：每拖动 150px 完成 0→1 或 1→0 的完整过渡
   *
   * @param {number} frameDeltaY - 本帧纵向增量（正=向下，负=向上）
   */
  function handleVerticalDrag(frameDeltaY) {
    const SENSITIVITY = 150  // 完整过渡所需的像素距离

    // 向下拖（frameDeltaY > 0）→ progress 增大 → 展开月视图（周→月）
    // 向上拖（frameDeltaY < 0）→ progress 减小 → 收起月视图（月→周）
    const delta = frameDeltaY / SENSITIVITY

    const newProgress = Math.max(0, Math.min(1, state.transitionProgress + delta))
    state.transitionProgress = newProgress
  }

  /**
   * 松手后吸附到最近的视图模式
   *
   * - progress < 0.5 → 吸附到周视图（0）
   * - progress >= 0.5 → 吸附到月视图（1）
   */
  function snapToViewMode() {
    const targetProgress = state.transitionProgress < 0.5 ? 0 : 1
    const targetMode = targetProgress === 0 ? 'week' : 'month'

    console.log('[useGesture] snapToViewMode - 当前 progress:', state.transitionProgress.toFixed(3), '目标:', targetMode)

    animateProgress(state.transitionProgress, targetProgress, () => {
      state.viewMode = targetMode
    })
  }

  // ============================================================
  // 4. 动画工具（三端兼容）
  // ============================================================

  /**
   * 缓动动画（easeOutCubic）
   * 三端兼容：H5 用 requestAnimationFrame，APP 用 setTimeout
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
      // easeOutCubic
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
        state.transitionProgress = to  // 确保精确落点
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
