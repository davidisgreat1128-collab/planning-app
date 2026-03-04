<template>
  <view class="timeline-view">
    <!-- 顶部工具栏 -->
    <view class="top-toolbar">
      <view class="toolbar-left" @tap="handleGoalsClick">
        <text class="toolbar-text">目标和分类</text>
        <text class="toolbar-icon">≡</text>
      </view>
      <view class="toolbar-right">
        <text class="mode-label">⇌ 时间轴</text>
      </view>
    </view>

    <!-- 时间轴内容 -->
    <scroll-view class="timeline-scroll" scroll-y :scroll-top="scrollTop">
      <!-- 全天区域 -->
      <view class="allday-section">
        <view class="allday-label">
          <text class="label-text">全天</text>
        </view>
        <view class="allday-tasks">
          <!-- 未完成的全天任务 -->
          <view
            v-for="task in allDayTasksPending"
            :key="task.id"
            class="tl-bar"
            :class="'tl-bar-' + getTaskQuadrant(task)"
            @tap="handleTaskClick(task)"
            @touchstart="(e) => handleDragStart(e, task, 'allday')"
          >
            <text class="tl-bar-text">{{ task.title }}</text>
          </view>

          <!-- 已完成的全天任务 -->
          <view
            v-for="task in allDayTasksDone"
            :key="task.id"
            class="tl-bar tl-bar-done"
            @tap="handleTaskClick(task)"
          >
            <text class="tl-bar-text tl-bar-text-done">{{ task.title }}</text>
          </view>

          <!-- 空状态 -->
          <view v-if="allDayTasksPending.length === 0 && allDayTasksDone.length === 0" class="allday-empty">
            <text class="empty-text">暂无全天任务</text>
          </view>
        </view>
      </view>

      <!-- 24小时时间格 -->
      <view class="timeline-grid">
        <view
          v-for="hour in 24"
          :key="hour"
          class="hour-slot"
          :class="{ 'current-hour': isCurrentHour(hour - 1) }"
        >
          <!-- 小时标签 -->
          <view class="hour-label">
            <text class="hour-text">{{ formatHour(hour - 1) }}</text>
          </view>

          <!-- 时间格内容 -->
          <view class="hour-content">
            <!-- 半小时分隔线 -->
            <view class="half-hour-line"></view>

            <!-- 该小时的定时任务 -->
            <view
              v-for="task in getTasksAtHour(hour - 1)"
              :key="task.id"
              class="tl-timed-task"
              :class="'tl-timed-' + getTaskQuadrant(task)"
              :style="{ top: calculateTaskTop(task) + 'rpx', height: calculateTaskHeight(task) + 'rpx' }"
              @tap="handleTaskClick(task)"
              @touchstart="(e) => handleDragStart(e, task, 'timed')"
            >
              <view class="tl-timed-bar" :class="{ 'tl-timed-done': task.status === 'completed' }">
                <text class="tl-timed-text" :class="{ 'tl-timed-text-done': task.status === 'completed' }">
                  {{ task.title }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 当前时间红线（仅今天显示） -->
      <view v-if="showCurrentTimeLine" class="current-time-line" :style="{ top: currentTimeTop + 'rpx' }">
        <view class="time-dot"></view>
        <view class="time-line"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getQuadrant } from '@/utils/quadrant';
import { formatDate, isToday } from '@/utils/date';

// Props
const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  },
  allDayTasksPending: {
    type: Array,
    default: () => []
  },
  allDayTasksDone: {
    type: Array,
    default: () => []
  },
  timedTasks: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits([
  'task-click',
  'drag-start',
  'goals-click'
]);

// 状态
const scrollTop = ref(0);
const currentTimeTop = ref(0);
const currentHour = ref(0);
const currentMinute = ref(0);

let timeUpdateTimer = null;

// 计算属性
const showCurrentTimeLine = computed(() => {
  return isToday(props.selectedDate);
});

// 方法
function handleTaskClick(task) {
  emit('task-click', task);
}

function handleDragStart(e, task, type) {
  emit('drag-start', e, task, type);
}

function handleGoalsClick() {
  emit('goals-click');
}

function getTaskQuadrant(task) {
  return getQuadrant(task);
}

function formatHour(hour) {
  return hour.toString().padStart(2, '0') + ':00';
}

function isCurrentHour(hour) {
  return showCurrentTimeLine.value && hour === currentHour.value;
}

function getTasksAtHour(hour) {
  return props.timedTasks.filter(task => {
    if (!task.startTime) return false;

    const startHour = parseInt(task.startTime.split(':')[0]);
    const endHour = task.endTime ? parseInt(task.endTime.split(':')[0]) : startHour;

    return hour >= startHour && hour <= endHour;
  });
}

function calculateTaskTop(task) {
  if (!task.startTime) return 0;

  const [hour, minute] = task.startTime.split(':').map(Number);
  const hourIndex = hour; // 0-23

  // 每个小时格100rpx，每分钟 100/60 ≈ 1.67rpx
  const topInHour = (minute / 60) * 100;

  return topInHour;
}

function calculateTaskHeight(task) {
  if (!task.startTime) return 50; // 默认30分钟

  const [startHour, startMinute] = task.startTime.split(':').map(Number);

  let endHour = startHour;
  let endMinute = startMinute + 30; // 默认30分钟

  if (task.endTime) {
    [endHour, endMinute] = task.endTime.split(':').map(Number);
  }

  // 计算总分钟数
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  const durationMinutes = endTotalMinutes - startTotalMinutes;

  // 每分钟约 1.67rpx（100rpx / 60分钟）
  return Math.max((durationMinutes / 60) * 100, 50); // 最小高度50rpx
}

function updateCurrentTime() {
  const now = new Date();
  currentHour.value = now.getHours();
  currentMinute.value = now.getMinutes();

  // 计算当前时间红线位置
  // 全天区域高度约200rpx + 每小时100rpx
  const alldayHeight = 200;
  const hourHeight = 100;

  currentTimeTop.value = alldayHeight + (currentHour.value * hourHeight) + (currentMinute.value / 60 * hourHeight);

  // 自动滚动到当前时间（仅首次加载）
  if (showCurrentTimeLine.value && scrollTop.value === 0) {
    scrollTop.value = Math.max(0, currentTimeTop.value - 400); // 偏移400rpx使红线在屏幕中部
  }
}

// 生命周期
onMounted(() => {
  updateCurrentTime();

  // 每分钟更新一次时间
  timeUpdateTimer = setInterval(() => {
    updateCurrentTime();
  }, 60000);
});

onUnmounted(() => {
  if (timeUpdateTimer) {
    clearInterval(timeUpdateTimer);
  }
});
</script>

<style scoped>
.timeline-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #F5F5F5;
}

/* 顶部工具栏 */
.top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #E8E8E8;
}

.toolbar-left {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.toolbar-text {
  font-size: 28rpx;
  color: #333333;
  margin-right: 12rpx;
}

.toolbar-icon {
  font-size: 32rpx;
  color: #666666;
}

.toolbar-right {
  padding: 8rpx 20rpx;
}

.mode-label {
  font-size: 28rpx;
  color: #597EF7;
  font-weight: 500;
}

/* 时间轴滚动区域 */
.timeline-scroll {
  flex: 1;
  position: relative;
}

/* 全天区域 */
.allday-section {
  display: flex;
  background: #FFFFFF;
  border-bottom: 2rpx solid #E8E8E8;
  min-height: 160rpx;
}

.allday-label {
  width: 120rpx;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20rpx 0;
  background: #FAFAFA;
  border-right: 1rpx solid #E8E8E8;
}

.label-text {
  font-size: 26rpx;
  color: #999999;
}

.allday-tasks {
  flex: 1;
  padding: 16rpx 20rpx;
  display: flex;
  flex-direction: column;
}

/* 全天任务条 */
.tl-bar {
  padding: 16rpx 20rpx;
  margin-bottom: 12rpx;
  border-radius: 8rpx;
  transition: all 0.2s;
}

.tl-bar:last-child {
  margin-bottom: 0;
}

.tl-bar-q1 {
  background: #FF4D4F;
}

.tl-bar-q2 {
  background: #597EF7;
}

.tl-bar-q3 {
  background: #FFA940;
}

.tl-bar-q4 {
  background: #73D13D;
}

.tl-bar-done {
  background: #D9D9D9 !important;
  opacity: 0.55;
}

.tl-bar-text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.tl-bar-text-done {
  text-decoration: line-through;
}

.allday-empty {
  padding: 40rpx 20rpx;
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: #CCCCCC;
}

/* 时间格网格 */
.timeline-grid {
  position: relative;
  background: #FFFFFF;
}

.hour-slot {
  display: flex;
  height: 100rpx;
  border-bottom: 1rpx solid #F0F0F0;
  position: relative;
}

.hour-slot.current-hour {
  background: #F8F9FF;
}

.hour-label {
  width: 120rpx;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8rpx;
  background: #FAFAFA;
  border-right: 1rpx solid #E8E8E8;
}

.hour-text {
  font-size: 24rpx;
  color: #999999;
}

.hour-content {
  flex: 1;
  position: relative;
}

.half-hour-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1rpx;
  background: #F5F5F5;
}

/* 定时任务条 */
.tl-timed-task {
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  z-index: 5;
}

.tl-timed-bar {
  height: 100%;
  padding: 8rpx 16rpx;
  border-radius: 6rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.tl-timed-q1 .tl-timed-bar {
  background: #FF4D4F;
  border-left: 6rpx solid #D93B3D;
}

.tl-timed-q2 .tl-timed-bar {
  background: #597EF7;
  border-left: 6rpx solid #4765E0;
}

.tl-timed-q3 .tl-timed-bar {
  background: #FFA940;
  border-left: 6rpx solid #E69033;
}

.tl-timed-q4 .tl-timed-bar {
  background: #73D13D;
  border-left: 6rpx solid #5FB832;
}

.tl-timed-done {
  background: #D9D9D9 !important;
  border-left-color: #B0B0B0 !important;
  opacity: 0.6;
}

.tl-timed-text {
  font-size: 26rpx;
  color: #FFFFFF;
  line-height: 1.4;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-timed-text-done {
  text-decoration: line-through;
}

/* 当前时间红线 */
.current-time-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2rpx;
  z-index: 10;
  pointer-events: none;
}

.time-dot {
  position: absolute;
  left: 120rpx;
  top: -6rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #FF4D4F;
}

.time-line {
  position: absolute;
  left: 126rpx;
  right: 0;
  top: 0;
  height: 2rpx;
  background: #FF4D4F;
}
</style>
