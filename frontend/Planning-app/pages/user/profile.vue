<template>
  <view class="profile-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <!-- App 端状态栏占位 -->
      <!-- #ifdef APP-PLUS -->
      <view :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- #endif -->

      <view class="card-body">
        <view class="avatar-wrap">
          <image
            class="avatar"
            :src="userStore.userInfo?.avatarUrl || '/static/logo.png'"
            mode="aspectFill"
          />
        </view>
        <view class="user-info">
          <text class="nickname">{{ userStore.nickname }}</text>
          <text class="email">{{ userStore.userInfo?.email || '' }}</text>
          <text v-if="userStore.userInfo?.createdAt" class="join-date">
            加入于 {{ formatJoinDate(userStore.userInfo.createdAt) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 账号信息 -->
    <view v-else class="menu-section">
      <text class="section-title">账号信息</text>
      <view class="menu-list">
        <view class="menu-item">
          <text class="menu-label">昵称</text>
          <text class="menu-value">{{ userStore.nickname }}</text>
        </view>
        <view class="menu-item">
          <text class="menu-label">邮箱</text>
          <text class="menu-value">{{ userStore.userInfo?.email || '—' }}</text>
        </view>
        <view class="menu-item">
          <text class="menu-label">用户ID</text>
          <text class="menu-value gray">#{{ userStore.userId || '—' }}</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <text class="section-title">设置</text>
      <view class="menu-list">
        <view class="menu-item clickable" @tap="goEditProfile">
          <text class="menu-label">编辑资料</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item clickable" @tap="goChangePassword">
          <text class="menu-label">修改密码</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item clickable" @tap="goSettings">
          <text class="menu-label">应用设置</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-wrap">
      <view class="btn-logout" @tap="handleLogout">
        <text class="btn-logout-text">退出登录</text>
      </view>
    </view>

    <view class="bottom-safe"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user.js';
import { getToken } from '@/utils/storage.js';

const userStore = useUserStore();
const loading = ref(false);
const statusBarHeight = ref(0);

// ============================================================
// 生命周期
// ============================================================
onMounted(async () => {
  // #ifdef APP-PLUS
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0;
  // #endif

  await checkLoginAndLoad();
});

// ============================================================
// 方法
// ============================================================

/** 检查登录状态并刷新用户信息 */
async function checkLoginAndLoad() {
  // store 无 token 时，尝试从本地缓存恢复
  if (!userStore.token) {
    const savedToken = getToken();
    if (!savedToken) {
      uni.reLaunch({ url: '/pages/user/login' });
      return;
    }
    userStore.token = savedToken;
  }

  loading.value = true;
  try {
    await userStore.refreshProfile();
  } finally {
    loading.value = false;
  }
}

/** 格式化加入日期（显示年月） */
function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function goEditProfile() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

function goChangePassword() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

function goSettings() {
  uni.navigateTo({ url: '/pages/settings/index' });
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后需要重新登录，确定要退出吗？',
    confirmText: '退出',
    confirmColor: '#E74C3C',
    success: async (res) => {
      if (res.confirm) {
        await userStore.logout();
        // logout() 内部已调用 uni.reLaunch 跳转登录页
      }
    }
  });
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #F5F6FA;
}

/* 用户信息卡片 */
.user-card {
  background: linear-gradient(135deg, #5B8CFF 0%, #3B6FE0 100%);
  padding-bottom: 48rpx;
}

.card-body {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 40rpx 40rpx 0;
  gap: 32rpx;
}

.avatar-wrap { flex-shrink: 0; }

.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.6);
}

.user-info { flex: 1; }

.nickname {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
}

.email {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.join-date {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 6rpx;
}

/* 加载提示 */
.loading-wrap {
  padding: 60rpx;
  display: flex;
  justify-content: center;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 菜单区块 */
.menu-section { margin: 24rpx 24rpx 0; }

.section-title {
  font-size: 24rpx;
  color: #999;
  padding: 16rpx 8rpx 8rpx;
  display: block;
}

.menu-list {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.menu-item:last-child { border-bottom: none; }

.menu-item.clickable:active { background-color: #F8F8F8; }

.menu-label {
  font-size: 30rpx;
  color: #333;
}

.menu-value {
  font-size: 28rpx;
  color: #666;
  max-width: 400rpx;
  text-align: right;
}

.menu-value.gray { color: #BBB; }

.menu-arrow {
  font-size: 36rpx;
  color: #CCC;
}

/* 退出登录 */
.logout-wrap { margin: 32rpx 24rpx 0; }

.btn-logout {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #FF4444;
}

.btn-logout:active { background-color: #FFF5F5; }

.btn-logout-text {
  font-size: 32rpx;
  color: #FF4444;
  font-weight: 500;
}

.bottom-safe { height: 80rpx; }
</style>
