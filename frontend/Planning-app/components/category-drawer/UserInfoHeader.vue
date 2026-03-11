<template>
  <view class="user-info">
    <text class="user-avatar">{{ userAvatar }}</text>
    <view class="user-details">
      <text class="user-nickname">{{ userNickname }}</text>
      <text class="user-stats">已坚持做计划{{ persistDays }}天</text>
    </view>
    <view class="toggle-completed" @tap="handleToggle">
      <text class="toggle-icon">{{ showCompleted ? '👁️' : '🚫' }}</text>
      <text class="toggle-text">{{ showCompleted ? '显示已完成' : '隐藏已完成' }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * UserInfoHeader - 用户信息头部组件
 *
 * 职责:
 * - 显示用户头像和昵称
 * - 显示坚持做计划的天数
 * - 提供显示/隐藏已完成项的切换按钮
 */

const props = defineProps({
  /** 用户头像（emoji） */
  userAvatar: {
    type: String,
    default: '🐣'
  },
  /** 用户昵称 */
  userNickname: {
    type: String,
    default: '用户'
  },
  /** 坚持做计划的天数 */
  persistDays: {
    type: Number,
    default: 1
  },
  /** 是否显示已完成项 */
  showCompleted: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['toggle-completed']);

/**
 * 切换显示/隐藏已完成
 */
function handleToggle() {
  emit('toggle-completed');
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  padding: 30rpx 20rpx;
  gap: 15rpx;
  background-color: #fff;
  box-sizing: border-box;
}

.user-avatar {
  font-size: 60rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5rpx;
  min-width: 0;
}

.user-nickname {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.user-stats {
  font-size: 24rpx;
  color: #999;
}

.toggle-completed {
  display: flex;
  align-items: center;
  gap: 5rpx;
  padding: 10rpx 15rpx;
  background-color: #f9f9f9;
  border-radius: 30rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle-icon {
  font-size: 24rpx;
}

.toggle-text {
  font-size: 22rpx;
  color: #666;
  white-space: nowrap;
}
</style>
