<template>
  <view
    class="task-card"
    :class="[
      'task-card-' + quadrant,
      { 'task-done': task.status === 'completed' },
      { 'dragging': isDragging }
    ]"
    @touchstart="handleTouchStart"
    @mousedown="handleMouseDown"
    @tap="handleTaskClick"
  >
    <!-- 图标区域（垂直排列，最多3个圆圈） -->
    <view class="task-icons">
      <!-- 1. 顶部：普通完成图标（始终显示） -->
      <view class="icon-wrapper" @tap.stop="handleCheckboxClick">
        <view
          class="checkbox-circle"
          :class="task.status === 'completed' ? 'checked' : ''"
          :style="{ borderColor: quadrantColor, backgroundColor: task.status === 'completed' ? quadrantColor : 'transparent' }"
        >
          <text v-if="task.status === 'completed'" class="check-icon">✓</text>
        </view>
      </view>

      <!-- 2. 中间：重复任务指示器（仅重复任务显示） -->
      <view v-if="task.isRecurring" class="icon-wrapper" @tap.stop="handleRecurringClick">
        <view
          class="recurring-circle"
          :class="task.status === 'completed' ? 'checked' : ''"
        >
          <text class="recurring-icon">🔁</text>
        </view>
      </view>

      <!-- 3. 底部：子任务指示器（仅有子任务时显示） -->
      <view v-if="hasSubtasks" class="icon-wrapper" @tap.stop="handleSubtaskClick">
        <view class="subtask-circle">
          <text class="subtask-icon">📋</text>
          <!-- 子任务计数角标 -->
          <view class="subtask-badge">
            <text class="subtask-badge-text">{{ subtaskCompletedCount }}/{{ subtaskTotalCount }}</text>
          </view>
        </view>
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
  'drag-start',
  'mouse-drag-start',
  'recurring-click',  // 新增：点击重复任务图标
  'subtask-click'     // 新增：点击子任务图标
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

/**
 * 处理点击重复任务图标
 * 向父组件发射事件，由父组件调用 Composable 完成业务逻辑
 */
function handleRecurringClick() {
  emit('recurring-click', props.task);
}

/**
 * 处理点击子任务图标
 * 向父组件发射事件，由父组件打开模态框
 */
function handleSubtaskClick() {
  emit('subtask-click', props.task);
}

function handleTouchStart(e) {
  if (!props.draggable) return;

  // 触发拖拽开始事件（App端触摸）
  emit('drag-start', e, props.task);
}

function handleMouseDown(e) {
  if (!props.draggable) return;

  // 触发拖拽开始事件（H5端鼠标）
  emit('mouse-drag-start', e, props.task);
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

/* ============================================================
   图标区域（垂直排列）
   ============================================================ */

.task-icons {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-right: 20rpx;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================================
   顶部图标：普通完成复选框
   ============================================================ */

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

/* ============================================================
   中间图标：重复任务指示器
   ============================================================ */

.recurring-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #FFA726; /* 橙色 */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2rpx 6rpx rgba(255, 167, 38, 0.3);
}

.recurring-circle.checked {
  background: #CCCCCC; /* 完成后变灰 */
  box-shadow: none;
}

.recurring-icon {
  font-size: 20rpx;
  color: #FFFFFF;
  line-height: 1;
}

/* ============================================================
   底部图标：子任务指示器
   ============================================================ */

.subtask-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #5B8CFF; /* 蓝色 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 2rpx 6rpx rgba(91, 140, 255, 0.3);
}

.subtask-icon {
  font-size: 20rpx;
  color: #FFFFFF;
  line-height: 1;
}

.subtask-badge {
  position: absolute;
  bottom: -10rpx;
  right: -10rpx;
  background: #FF4444;
  padding: 2rpx 8rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 4rpx rgba(255, 68, 68, 0.3);
}

.subtask-badge-text {
  font-size: 18rpx;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.2;
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
