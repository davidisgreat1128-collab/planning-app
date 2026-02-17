<template>
  <view class="login-page">
    <view class="logo-area">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="app-name">规划助手</text>
      <text class="slogan">知天时，顺人意，趋利避凶</text>
    </view>

    <view class="form">
      <view class="input-group">
        <input
          class="input"
          type="email"
          placeholder="请输入邮箱"
          v-model="form.email"
        />
      </view>
      <view class="input-group">
        <input
          class="input"
          type="password"
          placeholder="请输入密码（8位以上，含字母和数字）"
          password
          v-model="form.password"
        />
      </view>

      <button
        class="btn-login"
        :loading="userStore.loading"
        :disabled="userStore.loading"
        @click="handleLogin"
      >
        登录
      </button>

      <button class="btn-register" @click="goRegister">
        没有账号？立即注册
      </button>
    </view>
  </view>
</template>

<script>
import { reactive } from 'vue';
import { useUserStore } from '@/store/user.js';

export default {
  name: 'LoginPage',

  setup() {
    const userStore = useUserStore();
    const form = reactive({ email: '', password: '' });
    return { userStore, form };
  },

  methods: {
    async handleLogin() {
      if (!this.form.email) return uni.showToast({ title: '请输入邮箱', icon: 'none' });
      if (!this.form.password) return uni.showToast({ title: '请输入密码', icon: 'none' });

      try {
        await this.userStore.login({ email: this.form.email, password: this.form.password });
        uni.reLaunch({ url: '/pages/index/index' });
      } catch (err) {
        uni.showToast({ title: err.message || '登录失败', icon: 'none' });
      }
    },

    goRegister() {
      uni.navigateTo({ url: '/pages/user/register' });
    }
  }
};
</script>

<style scoped>
.login-page { min-height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; padding-top: 100rpx; }
.logo-area { display: flex; flex-direction: column; align-items: center; margin-bottom: 80rpx; }
.logo { width: 160rpx; height: 160rpx; border-radius: 32rpx; }
.app-name { font-size: 48rpx; font-weight: bold; margin-top: 24rpx; color: #333; }
.slogan { font-size: 26rpx; color: #999; margin-top: 12rpx; }
.form { width: 680rpx; }
.input-group { margin-bottom: 24rpx; }
.input { background: #fff; border-radius: 12rpx; padding: 28rpx 32rpx; font-size: 30rpx; width: 100%; box-sizing: border-box; }
.btn-login { background: #07c160; color: #fff; border-radius: 12rpx; font-size: 32rpx; margin-top: 16rpx; }
.btn-register { background: transparent; color: #576b95; font-size: 28rpx; margin-top: 16rpx; border: none; }
</style>
