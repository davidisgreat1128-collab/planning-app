<template>
  <view class="register-page">
    <view class="header">
      <text class="title">创建账号</text>
      <text class="subtitle">加入规划助手，开启智慧人生</text>
    </view>

    <view class="form">
      <view class="input-group">
        <text class="label">昵称</text>
        <input
          class="input"
          type="text"
          placeholder="请输入昵称（2-20个字符）"
          v-model="form.nickname"
          maxlength="20"
        />
      </view>

      <view class="input-group">
        <text class="label">邮箱</text>
        <input
          class="input"
          type="email"
          placeholder="请输入邮箱地址"
          v-model="form.email"
        />
      </view>

      <view class="input-group">
        <text class="label">密码</text>
        <input
          class="input"
          type="password"
          placeholder="8位以上，含字母和数字"
          password
          v-model="form.password"
          maxlength="64"
        />
      </view>

      <view class="input-group">
        <text class="label">确认密码</text>
        <input
          class="input"
          type="password"
          placeholder="请再次输入密码"
          password
          v-model="form.confirmPassword"
          maxlength="64"
        />
      </view>

      <button
        class="btn-register"
        :loading="userStore.loading"
        :disabled="userStore.loading"
        @click="handleRegister"
      >
        注册
      </button>

      <button class="btn-login" @click="goLogin">
        已有账号？去登录
      </button>
    </view>
  </view>
</template>

<script>
import { reactive } from 'vue';
import { useUserStore } from '@/store/user.js';

export default {
  name: 'RegisterPage',

  setup() {
    const userStore = useUserStore();
    const form = reactive({
      nickname: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    return { userStore, form };
  },

  methods: {
    async handleRegister() {
      // 基础校验
      if (!this.form.nickname || this.form.nickname.trim().length < 2) {
        return uni.showToast({ title: '昵称至少2个字符', icon: 'none' });
      }
      if (!this.form.email) {
        return uni.showToast({ title: '请输入邮箱', icon: 'none' });
      }
      if (!this.form.password || this.form.password.length < 8) {
        return uni.showToast({ title: '密码至少8位', icon: 'none' });
      }
      if (this.form.password !== this.form.confirmPassword) {
        return uni.showToast({ title: '两次密码不一致', icon: 'none' });
      }

      try {
        await this.userStore.register({
          email: this.form.email,
          password: this.form.password,
          nickname: this.form.nickname.trim()
        });
        uni.showToast({ title: '注册成功', icon: 'success' });
        // 注册成功后跳转首页
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' });
        }, 1000);
      } catch (err) {
        uni.showToast({ title: err.message || '注册失败，请重试', icon: 'none' });
      }
    },

    goLogin() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.register-page { min-height: 100vh; background: #f5f5f5; padding: 80rpx 40rpx 60rpx; box-sizing: border-box; }
.header { margin-bottom: 60rpx; }
.title { display: block; font-size: 52rpx; font-weight: bold; color: #333; }
.subtitle { display: block; font-size: 26rpx; color: #999; margin-top: 12rpx; }
.form { }
.input-group { margin-bottom: 28rpx; }
.label { display: block; font-size: 26rpx; color: #666; margin-bottom: 12rpx; }
.input { background: #fff; border-radius: 12rpx; padding: 28rpx 32rpx; font-size: 30rpx; width: 100%; box-sizing: border-box; }
.btn-register { background: #07c160; color: #fff; border-radius: 12rpx; font-size: 32rpx; margin-top: 24rpx; }
.btn-login { background: transparent; color: #576b95; font-size: 28rpx; margin-top: 16rpx; border: none; }
</style>
