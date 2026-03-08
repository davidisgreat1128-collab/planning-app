<template>
  <view class="quadrant-view">
    <!-- 顶部工具栏 -->
    <view class="top-toolbar">
      <view class="toolbar-left" @tap="handleGoalsClick">
        <text class="toolbar-text">规划和分类</text>
        <text class="toolbar-icon">≡</text>
      </view>
      <view class="toolbar-right">
        <text class="mode-label">⇌ 四象限</text>
      </view>
    </view>

    <!-- 四象限网格 -->
    <view class="quadrant-grid">
      <!-- 第一行 -->
      <view class="quadrant-row">
        <!-- Q3: 紧急不重要 (左上) -->
        <view
          class="quadrant-card quadrant-q3"
          @touchstart="handleQuadrantTouchStart($event, 'q3')"
          @touchmove="handleQuadrantTouchMove"
          @touchend="handleQuadrantTouchEnd($event, 'q3')"
        >
          <!-- 回形针装饰 -->
          <view class="nb-clips">
            <view class="nb-clip"></view>
          </view>

          <!-- 卡片标题 -->
          <view class="quadrant-header">
            <text class="quadrant-title">紧急不重要</text>
            <view class="title-underline quadrant-q3-line"></view>
          </view>

          <!-- 任务列表 -->
          <scroll-view class="quadrant-content" scroll-y>
            <!-- 未完成任务 -->
            <task-card
              v-for="task in urgentNotImportant"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q3')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q3')"
            />

            <!-- 已完成任务 -->
            <task-card
              v-for="task in urgentNotImportantDone"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q3')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q3')"
            />

            <!-- 空状态 -->
            <view v-if="urgentNotImportant.length === 0 && urgentNotImportantDone.length === 0" class="empty-quadrant">
              <text class="empty-icon">○</text>
              <text class="empty-text">琐事象限</text>
              <text class="empty-hint">减少做</text>
            </view>
          </scroll-view>
        </view>

        <!-- Q1: 重要且紧急 (右上) -->
        <view
          class="quadrant-card quadrant-q1"
          @touchstart="handleQuadrantTouchStart($event, 'q1')"
          @touchmove="handleQuadrantTouchMove"
          @touchend="handleQuadrantTouchEnd($event, 'q1')"
        >
          <view class="nb-clips">
            <view class="nb-clip"></view>
          </view>

          <view class="quadrant-header">
            <text class="quadrant-title">重要且紧急</text>
            <view class="title-underline quadrant-q1-line"></view>
          </view>

          <scroll-view class="quadrant-content" scroll-y>
            <task-card
              v-for="task in urgentImportant"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q1')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q1')"
            />

            <task-card
              v-for="task in urgentImportantDone"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q1')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q1')"
            />

            <view v-if="urgentImportant.length === 0 && urgentImportantDone.length === 0" class="empty-quadrant">
              <text class="empty-icon">○</text>
              <text class="empty-text">危机象限</text>
              <text class="empty-hint">快速解决</text>
            </view>
          </scroll-view>
        </view>
      </view>

      <!-- 第二行 -->
      <view class="quadrant-row">
        <!-- Q4: 不重要不紧急 (左下) -->
        <view
          class="quadrant-card quadrant-q4"
          @touchstart="handleQuadrantTouchStart($event, 'q4')"
          @touchmove="handleQuadrantTouchMove"
          @touchend="handleQuadrantTouchEnd($event, 'q4')"
        >
          <view class="nb-clips">
            <view class="nb-clip"></view>
          </view>

          <view class="quadrant-header">
            <text class="quadrant-title">不重要不紧急</text>
            <view class="title-underline quadrant-q4-line"></view>
          </view>

          <scroll-view class="quadrant-content" scroll-y>
            <task-card
              v-for="task in notUrgentNotImportant"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q4')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q4')"
            />

            <task-card
              v-for="task in notUrgentNotImportantDone"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q4')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q4')"
            />

            <view v-if="notUrgentNotImportant.length === 0 && notUrgentNotImportantDone.length === 0" class="empty-quadrant">
              <text class="empty-icon">○</text>
              <text class="empty-text">无益象限</text>
              <text class="empty-hint">不做</text>
            </view>
          </scroll-view>
        </view>

        <!-- Q2: 重要不紧急 (右下) -->
        <view
          class="quadrant-card quadrant-q2"
          @touchstart="handleQuadrantTouchStart($event, 'q2')"
          @touchmove="handleQuadrantTouchMove"
          @touchend="handleQuadrantTouchEnd($event, 'q2')"
        >
          <view class="nb-clips">
            <view class="nb-clip"></view>
          </view>

          <view class="quadrant-header">
            <text class="quadrant-title">重要不紧急</text>
            <view class="title-underline quadrant-q2-line"></view>
          </view>

          <scroll-view class="quadrant-content" scroll-y>
            <task-card
              v-for="task in notUrgentImportant"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q2')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q2')"
            />

            <task-card
              v-for="task in notUrgentImportantDone"
              :key="task.id"
              :task="task"
              :draggable="true"
              @task-click="handleTaskClick"
              @checkbox-click="handleCheckboxClick"
              @drag-start="(e, task) => handleDragStart(e, task, 'q2')"
              @mouse-drag-start="(e, task) => handleMouseDragStart(e, task, 'q2')"
            />

            <view v-if="notUrgentImportant.length === 0 && notUrgentImportantDone.length === 0" class="empty-quadrant">
              <text class="empty-icon">○</text>
              <text class="empty-text">成长象限</text>
              <text class="empty-hint">投入精力</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import TaskCard from './TaskCard.vue';

// Props
const props = defineProps({
  urgentImportant: {
    type: Array,
    default: () => []
  },
  urgentImportantDone: {
    type: Array,
    default: () => []
  },
  notUrgentImportant: {
    type: Array,
    default: () => []
  },
  notUrgentImportantDone: {
    type: Array,
    default: () => []
  },
  urgentNotImportant: {
    type: Array,
    default: () => []
  },
  urgentNotImportantDone: {
    type: Array,
    default: () => []
  },
  notUrgentNotImportant: {
    type: Array,
    default: () => []
  },
  notUrgentNotImportantDone: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits([
  'task-click',
  'checkbox-click',
  'drag-start',
  'mouse-drag-start',
  'drag-over',
  'drop',
  'goals-click'
]);

// 状态
const touchStartY = ref(0);

// 方法
function handleTaskClick(task) {
  emit('task-click', task);
}

function handleCheckboxClick(task) {
  emit('checkbox-click', task);
}

function handleDragStart(e, task, quadrant) {
  emit('drag-start', e, task, quadrant);
}

function handleMouseDragStart(e, task, quadrant) {
  emit('mouse-drag-start', e, task, quadrant);
}

function handleQuadrantTouchStart(e, quadrant) {
  touchStartY.value = e.touches[0].clientY;
}

function handleQuadrantTouchMove(e) {
  // 可以在这里处理拖拽悬停事件
  emit('drag-over', e);
}

function handleQuadrantTouchEnd(e, quadrant) {
  // 触发放置事件
  emit('drop', e, quadrant);
}

function handleGoalsClick() {
  emit('goals-click');
}
</script>

<style scoped>
.quadrant-view {
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

/* 四象限网格 */
.quadrant-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20rpx 16rpx;
  overflow: hidden;
}

.quadrant-row {
  flex: 1;
  display: flex;
  margin-bottom: 20rpx;
}

.quadrant-row:last-child {
  margin-bottom: 0;
}

/* 象限卡片 */
.quadrant-card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 16rpx;
  margin: 0 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.quadrant-card:first-child {
  margin-left: 0;
}

.quadrant-card:last-child {
  margin-right: 0;
}

/* 回形针装饰 */
.nb-clips {
  position: absolute;
  top: -6rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  z-index: 10;
}

.nb-clip {
  width: 60rpx;
  height: 12rpx;
  background: linear-gradient(135deg, #D0D0D0 0%, #A0A0A0 100%);
  border-radius: 8rpx 8rpx 0 0;
  margin: 0 4rpx;
}

/* 卡片标题 */
.quadrant-header {
  padding: 24rpx 20rpx 16rpx;
}

.quadrant-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 12rpx;
}

.title-underline {
  height: 6rpx;
  width: 80rpx;
  border-radius: 3rpx;
}

.quadrant-q1-line {
  background: #FF4D4F;
}

.quadrant-q2-line {
  background: #597EF7;
}

.quadrant-q3-line {
  background: #FFA940;
}

.quadrant-q4-line {
  background: #73D13D;
}

/* 任务内容区域 */
.quadrant-content {
  flex: 1;
  padding: 0 20rpx 20rpx;
  overflow-y: auto;
}

/* 空状态 */
.empty-quadrant {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 20rpx;
}

.empty-icon {
  font-size: 80rpx;
  color: #E0E0E0;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #CCCCCC;
}
</style>
