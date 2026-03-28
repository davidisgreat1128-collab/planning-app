<template>
  <view class="header-section" :style="{ backgroundImage: `url(${coverImage})` }">
    <!-- 返回按钮 -->
    <view class="back-btn" @tap="handleBack">
      <text class="back-icon">←</text>
    </view>

    <!-- 规划标题和标签 -->
    <view class="header-content">
      <text class="goal-title"># {{ title }}</text>

      <view class="tag-list">
        <view v-for="(tag, index) in tags" :key="index" class="tag-item">
          <text class="tag-text">{{ tag }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 模板头部组件
 * 职责：展示模板封面、标题、标签和返回按钮
 */

const props = defineProps({
  /** 封面图片URL */
  coverImage: {
    type: String,
    required: true
  },
  /** 模板标题 */
  title: {
    type: String,
    required: true
  },
  /** 标签列表 */
  tags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['back'])

/**
 * 处理返回按钮点击
 */
function handleBack() {
  emit('back')
}
</script>

<style scoped>
.header-section {
  position: relative;
  width: 750rpx;
  height: 400rpx;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
}

.back-btn {
  position: absolute;
  top: 40rpx;
  left: 30rpx;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.back-icon {
  font-size: 36rpx;
  color: #ffffff;
  font-weight: bold;
}

.header-content {
  position: absolute;
  bottom: 90rpx;
  left: 30rpx;
  right: 30rpx;
}

.goal-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20rpx;
  display: block;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.6),
               0 4rpx 16rpx rgba(0, 0, 0, 0.4),
               0 0 4rpx rgba(0, 0, 0, 0.8);
  /* 添加半透明背景提高可读性 */
  padding: 8rpx 16rpx;
  background: linear-gradient(to bottom,
              rgba(0, 0, 0, 0.4),
              rgba(0, 0, 0, 0.3));
  border-radius: 8rpx;
  backdrop-filter: blur(4rpx);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 8rpx 20rpx;
  background-color: rgba(0, 0, 0, 0.45);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 30rpx;
  backdrop-filter: blur(10rpx);
}

.tag-text {
  font-size: 24rpx;
  color: #ffffff;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
}
</style>
