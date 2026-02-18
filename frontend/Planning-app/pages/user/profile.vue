<template>
  <view class="profile-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar-wrap">
        <image class="avatar" :src="userStore.userInfo?.avatarUrl || '/static/logo.png'" mode="aspectFill" />
      </view>
      <view class="user-info">
        <text class="nickname">{{ userStore.nickname }}</text>
        <text class="email">{{ userStore.userInfo?.email || '' }}</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="goEditProfile">
        <text class="menu-text">编辑资料</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goSettings">
        <text class="menu-text">设置</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-wrap">
      <button class="btn-logout" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/store/user.js';

export default {
  name: 'ProfilePage',

  setup() {
    const userStore = useUserStore();
    return { userStore };
  },

  onShow() {
    // 每次显示时刷新用户信息
    if (this.userStore.isLoggedIn) {
      this.userStore.refreshProfile();
    } else {
      uni.reLaunch({ url: '/pages/user/login' });
    }
  },

  methods: {
    goEditProfile() {
      uni.showToast({ title: '功能开发中', icon: 'none' });
    },

    goSettings() {
      uni.navigateTo({ url: '/pages/settings/index' });
    },

    async handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            await this.userStore.logout();
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.profile-page { min-height: 100vh; background: #f5f5f5; }
.user-card { background: #07c160; padding: 80rpx 40rpx 50rpx; display: flex; align-items: center; gap: 32rpx; }
.avatar-wrap { flex-shrink: 0; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; border: 4rpx solid rgba(255,255,255,0.6); }
.user-info { flex: 1; }
.nickname { display: block; font-size: 36rpx; font-weight: bold; color: #fff; }
.email { display: block; font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }
.menu-list { background: #fff; margin: 24rpx 0; border-radius: 16rpx; overflow: hidden; margin-left: 24rpx; margin-right: 24rpx; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 36rpx 32rpx; border-bottom: 1rpx solid #f0f0f0; }
.menu-item:last-child { border-bottom: none; }
.menu-text { font-size: 30rpx; color: #333; }
.menu-arrow { font-size: 36rpx; color: #ccc; }
.logout-wrap { padding: 0 24rpx; margin-top: 24rpx; }
.btn-logout { background: #fff; color: #e74c3c; border-radius: 16rpx; font-size: 30rpx; border: none; }
</style>
