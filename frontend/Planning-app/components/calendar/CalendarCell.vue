<template>
  <view
    class="calendar-cell"
    :class="cellClass"
    @tap="handleClick"
  >
    <!-- 日期数字 -->
    <view class="day-wrapper">
      <text class="day-number">{{ cell.day }}</text>
    </view>

    <!-- 任务点（如果有任务） -->
    <view v-if="cell.hasTask" class="task-indicator">
      <view
        v-for="(task, index) in displayTasks"
        :key="task.id || index"
        class="task-dot"
        :style="{ backgroundColor: task.color || '#FF9500' }"
      ></view>
    </view>
  </view>
</template>

<script setup>
/**
 * 日历单元格组件
 *
 * 职责：
 * - 显示单个日期
 * - 显示任务点（最多3个）
 * - 处理点击事件
 *
 * 架构层级：Component 层
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { computed } from 'vue'

// ============================================================
// Props
// ============================================================

const props = defineProps({
  /**
   * 日期单元格数据
   * @type {Object}
   * @property {Date} date - 日期对象
   * @property {number} day - 日期数字
   * @property {boolean} isToday - 是否今天
   * @property {boolean} isCurrentMonth - 是否当前月
   * @property {boolean} isSelected - 是否选中
   * @property {boolean} isWeekend - 是否周末
   * @property {Array} tasks - 任务列表（可选）
   * @property {boolean} hasTask - 是否有任务（可选）
   */
  cell: {
    type: Object,
    required: true
  }
})

// ============================================================
// Emits
// ============================================================

const emit = defineEmits(['click'])

// ============================================================
// 计算属性
// ============================================================

/**
 * 单元格样式类
 */
const cellClass = computed(() => ({
  'is-today': props.cell.isToday,
  'is-selected': props.cell.isSelected,
  'is-other-month': !props.cell.isCurrentMonth,
  'is-weekend': props.cell.isWeekend,
  'has-task': props.cell.hasTask
}))

/**
 * 显示的任务列表（最多3个）
 */
const displayTasks = computed(() => {
  if (!props.cell.tasks || props.cell.tasks.length === 0) {
    return []
  }
  return props.cell.tasks.slice(0, 3) // 最多显示3个任务点
})

// ============================================================
// 事件处理
// ============================================================

/**
 * 处理点击事件
 */
function handleClick() {
  emit('click', props.cell.date)
}
</script>

<style scoped lang="scss">
.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 8rpx 0;
  min-height: 80rpx;
}

/* 日期数字容器 */
.day-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
}

/* 日期数字 */
.day-number {
  font-size: 32rpx;
  color: #333333;
  font-weight: 400;
}

/* 今天高亮 */
.is-today .day-wrapper {
  background-color: #007AFF;
}

.is-today .day-number {
  color: #FFFFFF;
  font-weight: 600;
}

/* 选中状态 */
.is-selected .day-wrapper {
  background-color: #34C759;
}

.is-selected .day-number {
  color: #FFFFFF;
  font-weight: 600;
}

/* 非当前月日期淡化 */
.is-other-month .day-number {
  color: #C7C7CC;
}

/* 周末颜色 */
.is-weekend:not(.is-today):not(.is-selected) .day-number {
  color: #FF3B30;
}

/* 任务指示器容器 */
.task-indicator {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  margin-top: 4rpx;
}

/* 任务点 */
.task-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: #FF9500;
}

/* 点击态 */
.calendar-cell:active {
  opacity: 0.7;
}
</style>
