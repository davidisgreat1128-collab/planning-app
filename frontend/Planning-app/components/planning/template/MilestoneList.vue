<template>
  <view class="milestones-section">
    <!-- 横向滚动容器 -->
    <scroll-view class="milestones-scroll" scroll-x enable-flex>
      <view class="milestones-wrapper">
        <view
          v-for="(milestone, index) in milestones"
          :key="index"
          class="milestone-item"
          @tap="handleMilestoneClick(milestone, index)"
        >
          <!-- 里程碑卡片 -->
          <view class="milestone-card">
            <text class="milestone-flag">🚩</text>
            <view class="milestone-info">
              <text class="milestone-num">{{ index + 1 }}.里程碑</text>
              <text class="milestone-title">{{ milestone.title }}</text>
            </view>
            <text class="milestone-arrow">›</text>
          </view>
          <!-- 连接线和圆点 -->
          <view class="milestone-connector">
            <view class="milestone-dot"></view>
            <view v-if="index < milestones.length - 1" class="milestone-line"></view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 里程碑列表组件
 * 职责：展示里程碑横向滚动列表
 */

const props = defineProps({
  /** 里程碑列表 */
  milestones: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

/**
 * 处理里程碑点击
 * @param {object} milestone - 里程碑对象
 * @param {number} index - 索引
 */
function handleMilestoneClick(milestone, index) {
  emit('select', { milestone, index })
}
</script>

<style scoped>
.milestones-section {
  margin-top: 20rpx;
  padding-bottom: 20rpx;
}

.milestones-scroll {
  width: 100%;
  white-space: nowrap;
}

.milestones-wrapper {
  display: inline-flex;
  padding: 0 30rpx;
}

.milestone-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20rpx;
}

.milestone-card {
  width: 280rpx;
  padding: 24rpx;
  background-color: rgba(0, 0, 0, 0.4);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.milestone-flag {
  font-size: 32rpx;
  filter: drop-shadow(0 1rpx 2rpx rgba(0, 0, 0, 0.5));
}

.milestone-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.milestone-num {
  font-size: 20rpx;
  color: #ffffff;
  opacity: 0.8;
  text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.5);
}

.milestone-title {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 500;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
}

.milestone-arrow {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.5);
}

.milestone-connector {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.milestone-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.4);
}

.milestone-line {
  width: 80rpx;
  height: 3rpx;
  background-color: rgba(255, 255, 255, 0.6);
  margin-left: 8rpx;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
}
</style>
