/**
 * 无限滚动逻辑
 *
 * 职责：
 * - 实现3视图循环复用机制
 * - 处理横向拖拽和重置逻辑
 * - 管理滚动位置和动画
 *
 * 坐标系约定：
 * - translateX = 0       → 当前视图居中
 * - translateX < 0       → 内容左移（手指向左滑，看下一页）
 * - translateX > 0       → 内容右移（手指向右滑，看上一页）
 *
 * 动画流程（JS逐帧驱动，无CSS transition依赖）：
 * 1. 手指滑动：translateX 实时跟随手指
 * 2. 松手超过阈值：立即更新 baseDate，JS动画从当前位置归 0
 * 3. 松手未超阈值：JS动画直接弹回 0
 * 4. 全程不依赖 CSS transition，消除 Vue 响应式时序竞争
 *
 * 架构层级：Composable 层
 *
 * @module composables/useInfiniteScroll
 * @author Claude Sonnet 4.6
 * @date 2026-03-29
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
  // 1. 屏幕宽度
  // ============================================================

  const systemInfo = uni.getSystemInfoSync()
  const screenWidth = systemInfo.windowWidth
  const SWIPE_THRESHOLD = screenWidth * GESTURE_THRESHOLD.SWIPE

  // ============================================================
  // 2. 状态
  // ============================================================

  /**
   * 横向位移：手指拖拽时实时更新，松手后JS动画归 0
   */
  const translateX = ref(0)

  /**
   * 防止动画期间重复触发翻页
   */
  const isAnimating = ref(false)

  /**
   * 当前动画帧的 timer ID，用于取消动画
   */
  let animTimer = null

  // ============================================================
  // 3. 样式计算（纯静态 transition，不再动态切换）
  // ============================================================

  const containerStyle = computed(() => ({
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative'
  }))

  /**
   * 内容样式
   * transition 固定为 none，完全由 JS 动画驱动位移
   */
  const contentStyle = computed(() => {
    const offset = screenWidth - translateX.value
    return {
      width: `${screenWidth * 3}px`,
      height: '100%',
      display: 'flex',
      transform: `translateX(-${offset}px)`,
      transition: 'none',
      willChange: 'transform'
    }
  })

  // ============================================================
  // 4. JS 逐帧动画（easeOutCubic）
  // ============================================================

  /**
   * 取消正在进行的动画
   */
  function cancelAnimation() {
    if (animTimer !== null) {
      // #ifdef H5
      cancelAnimationFrame(animTimer)
      // #endif
      // #ifndef H5
      clearTimeout(animTimer)
      // #endif
      animTimer = null
    }
  }

  /**
   * JS 驱动的弹性归位动画
   *
   * 从 from 动画到 to，easeOutCubic 缓动，约 300ms
   * 全程修改 translateX.value，不依赖 CSS transition
   *
   * @param {number} from - 起始位移值
   * @param {number} to - 目标位移值（通常为 0）
   * @param {Function} [onComplete] - 动画完成回调
   */
  function animateSnap(from, to, onComplete) {
    cancelAnimation()

    const duration = 300
    const startTime = Date.now()

    function step() {
      const elapsed = Date.now() - startTime
      const t = Math.min(1, elapsed / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      translateX.value = from + (to - from) * eased

      if (t < 1) {
        // #ifdef H5
        animTimer = requestAnimationFrame(step)
        // #endif
        // #ifndef H5
        animTimer = setTimeout(step, 16)
        // #endif
      } else {
        translateX.value = to
        animTimer = null
        if (onComplete) onComplete()
      }
    }

    // #ifdef H5
    animTimer = requestAnimationFrame(step)
    // #endif
    // #ifndef H5
    animTimer = setTimeout(step, 16)
    // #endif
  }

  // ============================================================
  // 5. 核心方法
  // ============================================================

  /**
   * 处理横向拖拽增量（由 useGesture 逐帧调用）
   *
   * @param {number} deltaX - 本帧位移（正=右，负=左）
   */
  function handleDrag(deltaX) {
    // 拖拽期间取消任何进行中的回弹动画
    cancelAnimation()
    translateX.value += deltaX
  }

  /**
   * 结束拖拽
   *
   * 核心思路（JS逐帧动画，无CSS transition依赖）：
   * - 超过阈值：先更新 baseDate，再用 JS 动画从当前位置归 0
   * - 未超阈值：JS 动画直接从当前位置弹回 0
   * - 全程不依赖 CSS transition，消除 Vue 响应式时序竞争
   */
  function endDrag() {
    if (isAnimating.value) {
      // 动画中：直接硬归零（避免动画堆叠）
      cancelAnimation()
      translateX.value = 0
      return
    }

    const current = translateX.value

    if (current <= -SWIPE_THRESHOLD) {
      // 左滑超阈值 → 去下一页
      isAnimating.value = true
      // 立即更新数据（视图切换）
      if (state.viewMode === VIEW_MODE.WEEK) {
        state.baseDate = addDate(state.baseDate, 1, 'week')
      } else {
        state.baseDate = addDate(state.baseDate, 1, 'month')
      }
      // JS 动画从当前负值位置归 0
      animateSnap(current, 0, () => {
        isAnimating.value = false
      })

    } else if (current >= SWIPE_THRESHOLD) {
      // 右滑超阈值 → 去上一页
      isAnimating.value = true
      if (state.viewMode === VIEW_MODE.WEEK) {
        state.baseDate = addDate(state.baseDate, -1, 'week')
      } else {
        state.baseDate = addDate(state.baseDate, -1, 'month')
      }
      // JS 动画从当前正值位置归 0
      animateSnap(current, 0, () => {
        isAnimating.value = false
      })

    } else {
      // 未超阈值 → JS 动画弹回 0
      animateSnap(current, 0)
    }
  }

  // ============================================================
  // 6. 兼容旧接口
  // ============================================================

  function snapToCurrent() {
    cancelAnimation()
    translateX.value = 0
  }

  // dragOffset 别名（供外部使用）
  const dragOffset = translateX

  // isDragging 兼容（JS动画模式下始终为 false，保留字段不破坏接口）
  const isDragging = ref(false)

  // ============================================================
  // 7. 监听视图模式切换（重置滚动状态）
  // ============================================================

  watch(
    () => state.viewMode,
    () => {
      cancelAnimation()
      translateX.value = 0
    }
  )

  // ============================================================
  // 8. 返回公开接口
  // ============================================================

  return {
    dragOffset,
    translateX,
    isDragging,
    isAnimating,
    containerStyle,
    contentStyle,
    handleDrag,
    endDrag,
    snapToCurrent,
    goNext: () => {},
    goPrev: () => {},
    screenWidth,
    SWIPE_THRESHOLD
  }
}
