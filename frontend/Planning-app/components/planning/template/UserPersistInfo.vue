<template>
  <view class="users-info">
    <view class="user-avatars">
      <image
        v-for="(avatar, index) in userAvatars"
        :key="index"
        class="user-avatar"
        :src="avatar"
        mode="aspectFill"
      />
      <view class="more-users">
        <text class="more-text">...</text>
      </view>
    </view>
    <text class="users-count">{{ userCount }}人坚持</text>
  </view>
</template>

<script setup>
/**
 * 用户坚持信息组件
 * 职责：展示用户头像和坚持人数
 */
import { defineProps } from 'vue'

const props = defineProps({
  /** 用户头像列表（显示前3个） */
  userAvatars: {
    type: Array,
    default: () => []
  },
  /** 坚持人数 */
  userCount: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.users-info {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.user-avatars {
  display: flex;
  align-items: center;
  margin-right: 16rpx;
}

.user-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 3rpx solid #ffffff;
  margin-right: -12rpx;
}

.more-users {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  border: 3rpx solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-text {
  font-size: 20rpx;
  color: #ffffff;
}

.users-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}
</style>
