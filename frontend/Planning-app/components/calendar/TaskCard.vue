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
      <!-- 临时测试：显示所有任务的循环图标，验证CSS是否正常 -->
      <view v-if="task.isRecurring || task.title?.includes('重复')" class="icon-wrapper" @tap.stop="handleRecurringClick">
        <!-- 用两个同心圆表示循环 -->
        <view class="recurring-double-circle">
          <view
            class="recurring-outer-circle"
            :style="{ borderColor: task.status === 'completed' ? '#CCCCCC' : quadrantColor }"
          ></view>
          <view
            class="recurring-inner-circle"
            :style="{ borderColor: task.status === 'completed' ? '#CCCCCC' : quadrantColor }"
          ></view>
        </view>
      </view>

      <!-- 3. 底部：子任务指示器（仅有子任务时显示） -->
      <view v-if="hasSubtasks" class="icon-wrapper" @tap.stop="handleSubtaskClick">
        <view class="subtask-icon-container">
          <view
            class="subtask-square-border"
            :style="{ borderColor: quadrantColor }"
          >
            <image
              class="subtask-icon-img"
              src="/static/icons/subtask.png"
              mode="aspectFit"
            />
          </view>
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

/**
 * 将十六进制颜色转换为CSS filter滤镜
 * 用于将黑色图标变为指定颜色
 *
 * @param {string} hexColor - 十六进制颜色值（如 #FF4D4F）
 * @returns {string} CSS filter滤镜字符串
 */
function getIconFilter(hexColor) {
  // 将hex颜色转换为RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 计算色相、饱和度、亮度
  // 这是一个简化的颜色滤镜生成算法
  const brightness = (r + g + b) / 3 / 255;
  const saturate = 1.5; // 饱和度增强

  // 根据颜色生成对应的滤镜
  // 红色系：hue-rotate(0deg)
  // 橙色系：hue-rotate(30deg)
  // 蓝色系：hue-rotate(220deg)
  // 绿色系：hue-rotate(100deg)
  let hueRotate = 0;
  if (hexColor === '#FF4D4F' || hexColor === '#FF4444') {
    hueRotate = 0; // 红色
  } else if (hexColor === '#FFA940' || hexColor === '#FFA726') {
    hueRotate = 30; // 橙色
  } else if (hexColor === '#597EF7' || hexColor === '#5B8CFF') {
    hueRotate = 220; // 蓝色
  } else if (hexColor === '#73D13D' || hexColor === '#4CAF50') {
    hueRotate = 100; // 绿色
  } else if (hexColor === '#999999' || hexColor === '#CCCCCC') {
    // 灰色：降低饱和度
    return `grayscale(100%) brightness(0.6)`;
  }

  return `sepia(100%) saturate(${saturate}) hue-rotate(${hueRotate}deg) brightness(${brightness + 0.5})`;
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
   中间图标：重复任务指示器（两个同心圆）
   ============================================================ */

.recurring-double-circle {
  width: 36rpx;
  height: 36rpx;
  position: relative;
}

.recurring-outer-circle {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.recurring-inner-circle {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 3rpx solid;
  box-sizing: border-box;
  position: absolute;
  top: 8rpx;  /* (36-20)/2 = 8rpx 居中 */
  left: 8rpx; /* (36-20)/2 = 8rpx 居中 */
  transition: all 0.2s ease;
}

/* ============================================================
   底部图标：子任务指示器（方框+图片）
   ============================================================ */

.subtask-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subtask-square-border {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  border: 3rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.2s ease;
}

.subtask-icon-img {
  width: 20rpx;
  height: 20rpx;
  opacity: 0.8;
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
