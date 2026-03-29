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
 * 动画流程（单段吸附，无重置跳变）：
 * 1. 手指滑动：translateX 实时跟随手指
 * 2. 松手超过阈值：立即更新 baseDate，translateX 从当前位置动画归 0
 * 3. 视觉效果：新内容从偏移位置平滑吸附到正中央
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

  console.log('[useInfiniteScroll] 初始化，屏幕宽度:', screenWidth, '切换阈值:', SWIPE_THRESHOLD)

  // ============================================================
  // 2. 状态
  // ============================================================

  /**
   * 横向位移：手指拖拽时实时更新，松手后动画归 0
   */
  const translateX = ref(0)

  /**
   * 拖拽中禁用 CSS transition，松手后开启
   */
  const isDragging = ref(false)

  /**
   * 防止动画期间重复触发翻页
   */
  const isAnimating = ref(false)

  // ============================================================
  // 3. 样式计算
  // ============================================================

  const containerStyle = computed(() => ({
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative'
  }))

  /**
   * 内容样式
   * 3视图水平排列，初始显示中间视图（offset = screenWidth）
   * translateX 在此基础上叠加手指位移
   */
  const contentStyle = computed(() => {
    const offset = screenWidth - translateX.value

    // 渲染层日志：每次 contentStyle 重算时记录，反映 DOM 实际收到的 transform 值
    console.log(`[RENDER] t=${Date.now()} translateX=${translateX.value.toFixed(1)} offset=${offset.toFixed(1)} isDragging=${isDragging.value}`)

    return {
      width: `${screenWidth * 3}px`,
      height: '100%',
      display: 'flex',
      transform: `translateX(-${offset}px)`,
      transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      willChange: 'transform'
    }
  })

  // ============================================================
  // 4. 核心方法
  // ============================================================

  /**
   * 处理横向拖拽增量（由 useGesture 逐帧调用）
   *
   * @param {number} deltaX - 本帧位移（正=右，负=左）
   */
  function handleDrag(deltaX) {
    isDragging.value = true
    translateX.value += deltaX
  }

  /**
   * 结束拖拽
   *
   * 核心思路（单段吸附，无重置跳变）：
   * - 超过阈值：先更新 baseDate（数据切换），再开启 transition 让 translateX 归 0
   * - 视觉效果：新月份内容从当前偏移位置平滑吸附到正中央
   * - 没有"滑到底→跳回0"的两段式，彻底消除跳变闪烁
   */
  function endDrag() {
    const current = translateX.value

    if (isAnimating.value) {
      isDragging.value = false
      translateX.value = 0
      return
    }

    if (current <= -SWIPE_THRESHOLD) {
      // 左滑超阈值 → 去下一页
      isAnimating.value = true
      if (state.viewMode === VIEW_MODE.WEEK) {
        state.baseDate = addDate(state.baseDate, 1, 'week')
      } else {
        state.baseDate = addDate(state.baseDate, 1, 'month')
      }
      isDragging.value = false
      translateX.value = 0
      setTimeout(() => { isAnimating.value = false }, 350)

    } else if (current >= SWIPE_THRESHOLD) {
      // 右滑超阈值 → 去上一页
      isAnimating.value = true
      if (state.viewMode === VIEW_MODE.WEEK) {
        state.baseDate = addDate(state.baseDate, -1, 'week')
      } else {
        state.baseDate = addDate(state.baseDate, -1, 'month')
      }
      isDragging.value = false
      translateX.value = 0
      setTimeout(() => { isAnimating.value = false }, 350)

    } else {
      // 未超阈值 → 吸附回当前页
      isDragging.value = false
      translateX.value = 0
    }
  }

  // ============================================================
  // 5. 兼容旧接口
  // ============================================================

  function snapToCurrent() {
    isDragging.value = false
    translateX.value = 0
  }

  // dragOffset 别名（供 InfiniteCalendar.vue 的 watch 使用）
  const dragOffset = translateX

  // ============================================================
  // 6. 监听视图模式切换（重置滚动状态）
  // ============================================================

  watch(
    () => state.viewMode,
    () => {
      isDragging.value = true
      translateX.value = 0
      // #ifdef H5
      requestAnimationFrame(() => { isDragging.value = false })
      // #endif
      // #ifndef H5
      setTimeout(() => { isDragging.value = false }, 16)
      // #endif
    }
  )

  // ============================================================
  // 7. 返回公开接口
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
