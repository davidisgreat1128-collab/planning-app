<template>
  <view class="login-page">
    <!-- App 端状态栏占位 -->
    <!-- #ifdef APP-PLUS -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- #endif -->

    <view class="logo-area">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="app-name">规划助手</text>
      <text class="slogan">知天时，顺人意，趋利避凶</text>
    </view>

    <view class="form">
      <!-- 邮箱输入框：三端兼容写法 -->
      <view class="input-group">
        <text class="input-label">邮箱</text>
        <input
          class="input"
          type="text"
          placeholder="请输入邮箱"
          placeholder-class="input-placeholder"
          :value="form.email"
          @input="form.email = $event.detail.value"
        />
      </view>

      <!-- 密码输入框：三端兼容写法 -->
      <view class="input-group">
        <text class="input-label">密码</text>
        <input
          class="input"
          type="text"
          password
          placeholder="请输入密码"
          placeholder-class="input-placeholder"
          :value="form.password"
          @input="form.password = $event.detail.value"
        />
      </view>

      <button
        class="btn-primary"
        :loading="loading"
        :disabled="loading"
        @click="handleLogin"
      >
        登录
      </button>

      <button class="btn-text" @click="goRegister">
        没有账号？立即注册
      </button>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/store/user.js';

export default {
  name: 'LoginPage',

  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      loading: false,
      // App 端状态栏高度
      statusBarHeight: 0
    };
  },

  onLoad() {
    // #ifdef APP-PLUS
    // 获取 App 端状态栏高度
    this.statusBarHeight = plus.navigator.getStatusbarHeight();
    // #endif
  },

  methods: {
    async handleLogin() {
      if (!this.form.email) {
        return uni.showToast({ title: '请输入邮箱', icon: 'none' });
      }
      if (!this.form.password) {
        return uni.showToast({ title: '请输入密码', icon: 'none' });
      }

      this.loading = true;
      try {
        const userStore = useUserStore();
        await userStore.login({
          email: this.form.email,
          password: this.form.password
        });
        // 登录成功，跳转首页（清空页面栈）
        uni.reLaunch({ url: '/pages/index/index' });
      } catch (err) {
        uni.showToast({ title: err.message || '登录失败，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },

    goRegister() {
      uni.navigateTo({ url: '/pages/user/register' });
    }
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;
  box-sizing: border-box;
}
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}
.logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 32rpx;
}
.app-name {
  font-size: 48rpx;
  font-weight: bold;
  margin-top: 24rpx;
  color: #333;
}
.slogan {
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
}
.form {
  width: 680rpx;
}
.input-group {
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  padding: 16rpx 32rpx 20rpx;
}
.input-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}
.input {
  width: 100%;
  font-size: 30rpx;
  color: #333;
  height: 72rpx;
  line-height: 72rpx;
  box-sizing: border-box;
}
.input-placeholder {
  color: #ccc;
}
.btn-primary {
  background: #07c160;
  color: #fff;
  border-radius: 12rpx;
  font-size: 32rpx;
  height: 96rpx;
  line-height: 96rpx;
  margin-top: 24rpx;
  border: none;
}
.btn-text {
  background: transparent;
  color: #576b95;
  font-size: 28rpx;
  margin-top: 16rpx;
  border: none;
  box-shadow: none;
}
</style>
