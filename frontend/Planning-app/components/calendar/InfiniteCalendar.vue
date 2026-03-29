<template>
  <view class="infinite-calendar">
    <!-- 头部 -->
    <calendar-header
      :title="currentTitle"
      :view-mode="state.viewMode"
      @today="goToToday"
      @toggle-view="toggleViewMode"
    />

    <!-- 星期标题 -->
    <calendar-weekdays />

    <!-- 滚动容器（关键部分） -->
    <view
      class="scroll-container"
      :style="containerStyle"
      @touchstart="handleTouchStart"
      @touchmove.stop.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchCancel"
    >
      <view
        class="scroll-content"
        :style="contentStyle"
      >
        <!-- 3个视图 -->
        <calendar-grid
          v-for="view in views"
          :key="view.id"
          :view="view"
          :transition-progress="state.transitionProgress"
          @select="handleSelectDate"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 无限日历主容器组件
 *
 * 职责：
 * - 组装子组件（Header + Weekdays + Grid）
 * - 协调 Composable 层（Core + Scroll + Gesture）
 * - 处理用户交互事件
 *
 * 架构层级：Component 层
 * 调用链：Component → Composable → Store → Repository
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { computed } from 'vue'
import CalendarHeader from './CalendarHeader.vue'
import CalendarWeekdays from './CalendarWeekdays.vue'
import CalendarGrid from './CalendarGrid.vue'
import { useCalendarCore } from '@/composables/useCalendarCore'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useGesture } from '@/composables/useGesture'

// ============================================================
// Props
// ============================================================

const props = defineProps({
  /**
   * 初始日期
   */
  initialDate: {
    type: Date,
    default: () => new Date()
  },

  /**
   * 是否启用任务集成
   */
  enableTaskIntegration: {
    type: Boolean,
    default: true
  }
})

// ============================================================
// Emits
// ============================================================

const emit = defineEmits([
  'select',      // 选择日期
  'view-change'  // 视图模式变化
])

// ============================================================
// Composables（四层架构：Component → Composable）
// ============================================================

// 1. 核心状态管理
const {
  state,
  views,
  currentView,
  selectDate,
  goToToday,
  toggleViewMode
} = useCalendarCore(props.initialDate, {
  enableTaskIntegration: props.enableTaskIntegration
})

// 2. 无限滚动逻辑
const {
  containerStyle,
  contentStyle,
  handleDrag,
  endDrag,
  dragOffset,
  isDragging
} = useInfiniteScroll(state, views)

// 3. 手势处理
const {
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleTouchCancel
} = useGesture(state, { handleDrag, endDrag })


// ============================================================
// 计算属性
// ============================================================

/**
 * 当前标题
 */
const currentTitle = computed(() => {
  return currentView.value?.title || ''
})

// ============================================================
// 事件处理
// ============================================================

/**
 * 处理日期选择
 *
 * @param {Date} date - 选中的日期
 */
function handleSelectDate(date) {
  selectDate(date)
  emit('select', date)
}

/**
 * 处理"今天"按钮点击
 */
function handleGoToToday() {
  goToToday()
}

/**
 * 处理视图模式切换
 */
function handleToggleViewMode() {
  toggleViewMode()
  emit('view-change', state.viewMode)
}
</script>

<style scoped lang="scss">
.infinite-calendar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
}

.scroll-container {
  flex: 1;
  overflow: hidden; /* 关键：隐藏溢出 */
  position: relative;
}

.scroll-content {
  display: flex;
  height: 100%;
  /* transition 由 contentStyle 动态控制 */
}
</style>
