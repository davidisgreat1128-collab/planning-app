/**
 * 无限滚动逻辑
 *
 * 职责：
 * - 实现3视图循环复用机制
 * - 处理横向拖拽和重置逻辑
 * - 管理滚动位置和动画
 *
 * 坐标系约定（标准写法）：
 * - translateX = 0        → 当前视图居中显示
 * - translateX = -width   → 内容左移一页（显示下一页/下一月）
 * - translateX = +width   → 内容右移一页（显示上一页/上一月）
 *
 * 动画流程（以向左滑去下一月为例）：
 * 1. 手指滑动：translateX 实时跟随手指（负值）
 * 2. 松手超过阈值：translateX 动画到 -width（CSS transition）
 * 3. 动画结束（transitionend）：更新 baseDate，瞬间重置 translateX=0（无动画）
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
   * 当前内容的横向位移
   * - 0       → 当前视图居中
   * - 负值    → 内容左移（手指向左滑，看下一页）
   * - 正值    → 内容右移（手指向右滑，看上一页）
   */
  const translateX = ref(0)

  /**
   * 是否正在拖拽（true = 禁用 CSS transition，手指跟随无动画）
   */
  const isDragging = ref(false)

  /**
   * 翻页动画是否进行中（防止连续快速滑动时堆叠）
   */
  const isAnimating = ref(false)

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
   * 滚动内容样式
   *
   * 3个视图水平排列，总宽度 = 3 * screenWidth
   * 初始偏移 -screenWidth，显示中间视图（current）
   * 再叠加 translateX，跟随手指或执行吸附动画
   *
   * 最终 transform = -(screenWidth - translateX) = -(screenWidth) + translateX
   * - translateX=0    → -screenWidth（居中）
   * - translateX=-100 → -screenWidth-100（内容左移，看右边）
   * - translateX=+100 → -screenWidth+100（内容右移，看左边）
   */
  const contentStyle = computed(() => {
    const offset = screenWidth - translateX.value

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
    console.log(`[Scroll:DRAG] t=${Date.now()} delta=${deltaX.toFixed(1)} translateX=${translateX.value.toFixed(1)}`)
  }

  /**
   * 结束拖拽，判断吸附目标
   *
   * 标准逻辑：
   * - translateX <= -阈值 → 左滑超过阈值 → 去下一页（target = -width）
   * - translateX >= +阈值 → 右滑超过阈值 → 去上一页（target = +width）
   * - 否则              → 回当前页（target = 0）
   */
  function endDrag() {
    const current = translateX.value
    console.log(`[Scroll:END] t=${Date.now()} translateX=${current.toFixed(1)} 阈值=${SWIPE_THRESHOLD.toFixed(1)} isAnimating=${isAnimating.value}`)

    // 动画进行中，忽略本次松手（防止堆叠）
    if (isAnimating.value) {
      console.log('[Scroll:END] 动画进行中，吸附回原位')
      isDragging.value = false
      snapTo(0)
      return
    }

    let target = 0
    if (current <= -SWIPE_THRESHOLD) {
      target = -screenWidth   // 左滑超阈值 → 去下一页
    } else if (current >= SWIPE_THRESHOLD) {
      target = screenWidth    // 右滑超阈值 → 去上一页
    }

    console.log(`[Scroll:END] target=${target}`)

    // 开启 transition，设置目标位置
    isDragging.value = false
    snapTo(target)

    if (target === -screenWidth) {
      waitForAnimation(() => goNext())
    } else if (target === screenWidth) {
      waitForAnimation(() => goPrev())
    }
  }

  /**
   * 吸附到指定位置（开启 transition 后设置目标值）
   *
   * @param {number} target - 目标 translateX 值
   */
  function snapTo(target) {
    translateX.value = target
  }

  /**
   * 等待 CSS transition 动画结束后执行回调
   * 使用 setTimeout(300) 对齐 CSS transition 时长
   *
   * 动画结束后：
   * 1. 先禁用 transition（isDragging=true）
   * 2. 瞬间重置 translateX=0
   * 3. 更新 baseDate（数据切换）
   * 4. 下一帧开启 transition
   *
   * @param {Function} updateFn - 更新 baseDate 的函数
   */
  function waitForAnimation(updateFn) {
    isAnimating.value = true

    setTimeout(() => {
      console.log(`[Scroll:ANIM] t=${Date.now()} 动画结束，准备重置`)

      // 关键：先禁用 transition，再同步执行重置+数据更新
      // 这样 translateX=0 和 baseDate 变化在同一帧内完成，GPU 看到的是已更新内容居中
      isDragging.value = true    // 关闭 transition
      translateX.value = 0       // 瞬间归零（无动画）
      updateFn()                 // 更新 baseDate（views 重算）

      console.log(`[Scroll:ANIM] t=${Date.now()} 重置完成，translateX=0`)

      // 下一帧开启 transition
      // #ifdef H5
      requestAnimationFrame(() => {
        isDragging.value = false
        isAnimating.value = false
        console.log(`[Scroll:ANIM] t=${Date.now()} transition 已恢复`)
      })
      // #endif
      // #ifndef H5
      setTimeout(() => {
        isDragging.value = false
        isAnimating.value = false
        console.log(`[Scroll:ANIM] t=${Date.now()} transition 已恢复`)
      }, 16)
      // #endif
    }, 305)  // 略大于 CSS transition 的 300ms，确保动画已完成
  }

  /**
   * 切换到下一个视图（手指向左滑）
   */
  function goNext() {
    console.log(`[Scroll:NEXT] t=${Date.now()} baseDate 更新前`)
    if (state.viewMode === VIEW_MODE.WEEK) {
      state.baseDate = addDate(state.baseDate, 1, 'week')
    } else {
      state.baseDate = addDate(state.baseDate, 1, 'month')
    }
    console.log(`[Scroll:NEXT] t=${Date.now()} 新 baseDate=${state.baseDate.toISOString().slice(0, 10)}`)
  }

  /**
   * 切换到上一个视图（手指向右滑）
   */
  function goPrev() {
    console.log(`[Scroll:PREV] t=${Date.now()} baseDate 更新前`)
    if (state.viewMode === VIEW_MODE.WEEK) {
      state.baseDate = addDate(state.baseDate, -1, 'week')
    } else {
      state.baseDate = addDate(state.baseDate, -1, 'month')
    }
    console.log(`[Scroll:PREV] t=${Date.now()} 新 baseDate=${state.baseDate.toISOString().slice(0, 10)}`)
  }

  // ============================================================
  // 5. 兼容旧接口（供外部直接调用）
  // ============================================================

  function snapToCurrent() {
    isDragging.value = false
    translateX.value = 0
  }

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

  // dragOffset 兼容旧代码（InfiniteCalendar.vue 里有 watch(dragOffset)）
  const dragOffset = translateX

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
    goNext,
    goPrev,
    screenWidth,
    SWIPE_THRESHOLD
  }
}
