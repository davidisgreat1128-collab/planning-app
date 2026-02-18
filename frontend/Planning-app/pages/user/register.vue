<template>
  <view class="register-page">
    <!-- App 端状态栏占位 -->
    <!-- #ifdef APP-PLUS -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- #endif -->

    <view class="header">
      <text class="title">创建账号</text>
      <text class="subtitle">加入规划助手，开启智慧人生</text>
    </view>

    <view class="form">
      <!-- 昵称 -->
      <view class="input-group">
        <text class="input-label">昵称</text>
        <input
          class="input"
          type="text"
          placeholder="请输入昵称（2-20个字符）"
          placeholder-class="input-placeholder"
          :value="form.nickname"
          @input="form.nickname = $event.detail.value"
          maxlength="20"
        />
      </view>

      <!-- 邮箱 -->
      <view class="input-group">
        <text class="input-label">邮箱</text>
        <input
          class="input"
          type="text"
          placeholder="请输入邮箱地址"
          placeholder-class="input-placeholder"
          :value="form.email"
          @input="form.email = $event.detail.value"
        />
      </view>

      <!-- 密码 -->
      <view class="input-group">
        <text class="input-label">密码</text>
        <input
          class="input"
          type="text"
          password
          placeholder="8位以上，含字母和数字"
          placeholder-class="input-placeholder"
          :value="form.password"
          @input="form.password = $event.detail.value"
          maxlength="64"
        />
      </view>

      <!-- 确认密码 -->
      <view class="input-group">
        <text class="input-label">确认密码</text>
        <input
          class="input"
          type="text"
          password
          placeholder="请再次输入密码"
          placeholder-class="input-placeholder"
          :value="form.confirmPassword"
          @input="form.confirmPassword = $event.detail.value"
          maxlength="64"
        />
      </view>

      <button
        class="btn-primary"
        :loading="loading"
        :disabled="loading"
        @click="handleRegister"
      >
        注册
      </button>

      <button class="btn-text" @click="goLogin">
        已有账号？去登录
      </button>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/store/user.js';

export default {
  name: 'RegisterPage',

  data() {
    return {
      form: {
        nickname: '',
        email: '',
        password: '',
        confirmPassword: ''
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
    async handleRegister() {
      // 前端基础校验
      if (!this.form.nickname || this.form.nickname.trim().length < 2) {
        return uni.showToast({ title: '昵称至少2个字符', icon: 'none' });
      }
      if (!this.form.email) {
        return uni.showToast({ title: '请输入邮箱', icon: 'none' });
      }
      if (!this.form.password || this.form.password.length < 8) {
        return uni.showToast({ title: '密码至少8位', icon: 'none' });
      }
      if (!/(?=.*[A-Za-z])(?=.*\d)/.test(this.form.password)) {
        return uni.showToast({ title: '密码必须同时含字母和数字', icon: 'none' });
      }
      if (this.form.password !== this.form.confirmPassword) {
        return uni.showToast({ title: '两次密码不一致', icon: 'none' });
      }

      this.loading = true;
      try {
        const userStore = useUserStore();
        await userStore.register({
          email: this.form.email,
          password: this.form.password,
          nickname: this.form.nickname.trim()
        });
        uni.showToast({ title: '注册成功', icon: 'success' });
        // 注册成功后跳转日历主页（清空页面栈）
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/calendar/index' });
        }, 1000);
      } catch (err) {
        uni.showToast({ title: err.message || '注册失败，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },

    goLogin() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 60rpx 40rpx 80rpx;
  box-sizing: border-box;
}
.header {
  margin-bottom: 50rpx;
}
.title {
  display: block;
  font-size: 52rpx;
  font-weight: bold;
  color: #333;
}
.subtitle {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
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
