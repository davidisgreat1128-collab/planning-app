<template>
  <view class="view-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-title">视图</text>
    </view>

    <!-- 视图模式选择 -->
    <scroll-view class="content" scroll-y>
      <view class="section-header">
        <text class="section-title">选择查看方式</text>
      </view>

      <!-- 时间轴视图入口 -->
      <view class="view-card" @tap="goCalendarView('timeline')">
        <view class="view-card-icon timeline-icon">⏱</view>
        <view class="view-card-info">
          <text class="view-card-title">时间轴</text>
          <text class="view-card-desc">按时间顺序查看当天任务，红线标注当前时刻</text>
        </view>
        <text class="view-card-arrow">›</text>
      </view>

      <!-- 四象限视图入口 -->
      <view class="view-card" @tap="goCalendarView('quadrant')">
        <view class="view-card-icon quadrant-icon">⊞</view>
        <view class="view-card-info">
          <text class="view-card-title">四象限</text>
          <text class="view-card-desc">按紧急/重要程度分类，清晰区分优先级</text>
        </view>
        <text class="view-card-arrow">›</text>
      </view>

      <!-- 列表视图入口 -->
      <view class="view-card" @tap="goCalendarView('list')">
        <view class="view-card-icon list-icon">☰</view>
        <view class="view-card-info">
          <text class="view-card-title">列表</text>
          <text class="view-card-desc">简洁列表展示，支持快速查看和操作</text>
        </view>
        <text class="view-card-arrow">›</text>
      </view>

      <view class="divider"></view>

      <!-- 统计信息（TODO：后续完善） -->
      <view class="section-header">
        <text class="section-title">近期数据</text>
      </view>
      <view class="stats-placeholder">
        <text class="stats-coming">数据统计功能即将上线</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 视图选择页（TabBar 第2个）
 * 目前功能：选择日历视图模式并跳转回日历主页
 */

/** 跳转到日历主页并切换视图模式 */
function goCalendarView(mode) {
  // 切换到 calendar/index TabBar 并传递视图模式
  uni.switchTab({ url: '/pages/calendar/index' });
  // TODO: 通过全局事件或 store 传递视图模式参数
}
</script>

<style scoped>
.view-page {
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
  padding: 24rpx;
}

.section-header {
  padding: 24rpx 8rpx 16rpx;
}

.section-title {
  font-size: 28rpx;
  color: #999;
  font-weight: bold;
}

.view-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.view-card-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.timeline-icon { background-color: #EEF2FF; }
.quadrant-icon { background-color: #FFF5F5; }
.list-icon { background-color: #F0FFF4; }

.view-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.view-card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.view-card-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}

.view-card-arrow {
  font-size: 40rpx;
  color: #CCC;
  margin-left: 12rpx;
}

.divider {
  height: 1rpx;
  background-color: #EEEEEE;
  margin: 16rpx 0 24rpx;
}

.stats-placeholder {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-coming {
  font-size: 28rpx;
  color: #CCC;
}
</style>
