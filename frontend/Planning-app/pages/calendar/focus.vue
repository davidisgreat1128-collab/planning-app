<template>
  <view class="focus-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-title">专注</text>
    </view>

    <view class="content">
      <!-- 番茄钟圆形计时器（占位） -->
      <view class="timer-area">
        <view class="timer-circle">
          <view class="timer-ring">
            <!-- 进度环（SVG 实现，预留位置） -->
            <view class="timer-inner">
              <text class="timer-text">25:00</text>
              <text class="timer-label">专注时间</text>
            </view>
          </view>
        </view>

        <view class="timer-mode-tabs">
          <text
            v-for="mode in timerModes"
            :key="mode.key"
            class="mode-tab"
            :class="{ active: currentMode === mode.key }"
            @tap="currentMode = mode.key"
          >{{ mode.label }}</text>
        </view>
      </view>

      <!-- 控制按钮 -->
      <view class="controls">
        <view class="control-btn reset-btn" @tap="reset">
          <text class="control-icon">↺</text>
        </view>
        <view class="control-btn start-btn" :class="{ running: isRunning }" @tap="toggleTimer">
          <text class="control-icon">{{ isRunning ? '⏸' : '▶' }}</text>
        </view>
        <view class="control-btn skip-btn" @tap="skip">
          <text class="control-icon">⏭</text>
        </view>
      </view>

      <!-- 今日专注统计 -->
      <view class="today-stats">
        <view class="stat-item">
          <text class="stat-num">{{ focusCount }}</text>
          <text class="stat-label">今日专注</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ totalMinutes }}分钟</text>
          <text class="stat-label">累计时长</text>
        </view>
      </view>

      <!-- 关联任务（专注时绑定任务） -->
      <view class="linked-task-section">
        <text class="linked-label">正在专注：</text>
        <view class="linked-task" @tap="pickTask">
          <text class="linked-task-title">{{ linkedTaskTitle || '点击选择要专注的任务' }}</text>
          <text class="linked-task-arrow">›</text>
        </view>
      </view>

      <view class="coming-soon">
        <text class="coming-text">完整专注功能即将上线，敬请期待</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

/**
 * 专注页（番茄钟，TabBar 第3个）
 * 当前版本：UI 框架占位，核心计时逻辑预留
 */

/** 计时模式 */
const timerModes = [
  { key: 'focus', label: '专注 25min' },
  { key: 'short', label: '短休 5min' },
  { key: 'long', label: '长休 15min' }
];

const currentMode = ref('focus');
const isRunning = ref(false);
const focusCount = ref(0);
const totalMinutes = ref(0);
const linkedTaskTitle = ref('');

/** 开始/暂停 */
function toggleTimer() {
  isRunning.value = !isRunning.value;
  if (isRunning.value) {
    uni.showToast({ title: '专注计时功能开发中', icon: 'none' });
    isRunning.value = false;
  }
}

/** 重置 */
function reset() {
  isRunning.value = false;
}

/** 跳过 */
function skip() {
  isRunning.value = false;
  uni.showToast({ title: '跳过当前计时', icon: 'none' });
}

/** 选择专注任务 */
function pickTask() {
  uni.showToast({ title: '任务关联功能开发中', icon: 'none' });
}
</script>

<style scoped>
.focus-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F6FA;
}

.nav-bar {
  background-color: #FFFFFF;
  padding: 56rpx 32rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.nav-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1A1A2E;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 32rpx;
}

/* ============================================================
   计时器区域
   ============================================================ */
.timer-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.timer-circle {
  width: 480rpx;
  height: 480rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8CFF, #7B5EA7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(91, 140, 255, 0.3);
  margin: 40rpx 0;
}

.timer-ring {
  width: 440rpx;
  height: 440rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timer-text {
  font-size: 96rpx;
  font-weight: bold;
  color: #FFFFFF;
  letter-spacing: 4rpx;
}

.timer-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
}

.timer-mode-tabs {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  border-radius: 40rpx;
  padding: 6rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.mode-tab {
  font-size: 26rpx;
  color: #999;
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
}

.mode-tab.active {
  background-color: #5B8CFF;
  color: #FFFFFF;
  font-weight: bold;
}

/* ============================================================
   控制按钮
   ============================================================ */
.controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 48rpx;
  margin: 60rpx 0;
}

.control-btn {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.reset-btn, .skip-btn {
  background-color: #FFFFFF;
}

.start-btn {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(135deg, #5B8CFF, #7B5EA7);
  box-shadow: 0 8rpx 24rpx rgba(91, 140, 255, 0.4);
}

.start-btn.running {
  background: linear-gradient(135deg, #FF6B6B, #FF4444);
}

.control-icon {
  font-size: 44rpx;
  color: #666;
}

.start-btn .control-icon {
  font-size: 56rpx;
  color: #FFFFFF;
}

/* ============================================================
   今日统计
   ============================================================ */
.today-stats {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx 60rpx;
  width: 100%;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 44rpx;
  font-weight: bold;
  color: #5B8CFF;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background-color: #EEEEEE;
}

/* ============================================================
   关联任务
   ============================================================ */
.linked-task-section {
  width: 100%;
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
}

.linked-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.linked-task {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.linked-task-title {
  flex: 1;
  font-size: 30rpx;
  color: #555;
}

.linked-task-arrow {
  font-size: 36rpx;
  color: #CCC;
}

/* ============================================================
   即将上线提示
   ============================================================ */
.coming-soon {
  margin-top: 40rpx;
  padding: 20rpx;
}

.coming-text {
  font-size: 24rpx;
  color: #CCC;
  text-align: center;
}
</style>
