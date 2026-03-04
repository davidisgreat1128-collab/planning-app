<template>
  <view
    class="task-card"
    :class="[
      'task-card-' + quadrant,
      { 'task-done': task.status === 'completed' },
      { 'dragging': isDragging }
    ]"
    @touchstart="handleTouchStart"
    @tap="handleTaskClick"
  >
    <!-- 复选框 -->
    <view class="task-checkbox" @tap.stop="handleCheckboxClick">
      <view
        class="checkbox-circle"
        :class="task.status === 'completed' ? 'checked' : ''"
        :style="{ borderColor: quadrantColor, backgroundColor: task.status === 'completed' ? quadrantColor : 'transparent' }"
      >
        <text v-if="task.status === 'completed'" class="check-icon">✓</text>
      </view>
    </view>

    <!-- 任务标题 -->
    <view class="task-content">
      <text
        class="task-title"
        :class="{ 'task-title-done': task.status === 'completed' }"
      >
        {{ task.title }}
      </text>

      <!-- 子任务指示器 -->
      <view v-if="hasSubtasks" class="subtask-indicator">
        <text class="subtask-count">{{ subtaskCompletedCount }}/{{ subtaskTotalCount }}</text>
      </view>

      <!-- 时间信息（仅时间轴视图中的定时任务显示） -->
      <view v-if="showTime && task.startTime" class="task-time">
        <text class="time-text">{{ formatTime(task.startTime) }}</text>
        <text v-if="task.endTime" class="time-text"> - {{ formatTime(task.endTime) }}</text>
      </view>
    </view>

    <!-- 拖拽手柄（可选） -->
    <view v-if="draggable" class="drag-handle">
      <text class="handle-icon">⋮⋮</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { getQuadrant, getQuadrantColor } from '@/utils/quadrant';

// Props
const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  draggable: {
    type: Boolean,
    default: true
  },
  showTime: {
    type: Boolean,
    default: false
  },
  isDragging: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits([
  'task-click',
  'checkbox-click',
  'drag-start'
]);

// 计算属性
const quadrant = computed(() => getQuadrant(props.task));
const quadrantColor = computed(() => getQuadrantColor(quadrant.value));

const hasSubtasks = computed(() => {
  return props.task.subtasks && props.task.subtasks.length > 0;
});

const subtaskTotalCount = computed(() => {
  return props.task.subtasks?.length || 0;
});

const subtaskCompletedCount = computed(() => {
  return props.task.subtasks?.filter(sub => sub.isDone).length || 0;
});

// 方法
function handleTaskClick() {
  emit('task-click', props.task);
}

function handleCheckboxClick() {
  emit('checkbox-click', props.task);
}

function handleTouchStart(e) {
  if (!props.draggable) return;

  // 触发拖拽开始事件
  emit('drag-start', e, props.task);
}

function formatTime(timeStr) {
  if (!timeStr) return '';

  // timeStr 格式：'HH:MM' 或 'HH:MM:SS'
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
}
</script>

<style scoped>
.task-card {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
  background: #FFFFFF;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.task-card.dragging {
  opacity: 0.6;
  transform: scale(0.98);
}

.task-card:active {
  background: #F8F9FA;
}

/* 已完成任务样式 */
.task-card.task-done {
  opacity: 0.6;
  background: #F5F5F5;
}

/* 复选框 */
.task-checkbox {
  margin-right: 20rpx;
  padding: 8rpx;
}

.checkbox-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox-circle.checked {
  border-width: 0;
}

.check-icon {
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: bold;
}

/* 任务内容 */
.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 28rpx;
  color: #333333;
  line-height: 40rpx;
  word-break: break-all;
  display: block;
}

.task-title-done {
  text-decoration: line-through;
  color: #999999;
}

/* 子任务指示器 */
.subtask-indicator {
  margin-top: 8rpx;
}

.subtask-count {
  font-size: 22rpx;
  color: #999999;
  padding: 4rpx 12rpx;
  background: #F0F0F0;
  border-radius: 8rpx;
}

/* 时间信息 */
.task-time {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
}

.time-text {
  font-size: 24rpx;
  color: #666666;
}

/* 拖拽手柄 */
.drag-handle {
  margin-left: 16rpx;
  padding: 8rpx;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.handle-icon {
  font-size: 32rpx;
  color: #CCCCCC;
  line-height: 1;
  letter-spacing: -4rpx;
}

/* 象限颜色变体 */
.task-card-q1 .checkbox-circle {
  border-color: #FF4D4F;
}

.task-card-q1 .checkbox-circle.checked {
  background-color: #FF4D4F;
}

.task-card-q2 .checkbox-circle {
  border-color: #597EF7;
}

.task-card-q2 .checkbox-circle.checked {
  background-color: #597EF7;
}

.task-card-q3 .checkbox-circle {
  border-color: #FFA940;
}

.task-card-q3 .checkbox-circle.checked {
  background-color: #FFA940;
}

.task-card-q4 .checkbox-circle {
  border-color: #73D13D;
}

.task-card-q4 .checkbox-circle.checked {
  background-color: #73D13D;
}
</style>
