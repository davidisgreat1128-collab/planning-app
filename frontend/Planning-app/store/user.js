/**
 * 用户状态管理 (Pinia)
 */

import { defineStore } from 'pinia';
import { saveToken, saveUserInfo, clearAuth, getUserInfo, getToken } from '@/utils/storage.js';
import { login, register, logout, getProfile } from '@/api/user.js';

export const useUserStore = defineStore('user', {
  state: () => ({
    /** @type {string|null} */
    token: getToken(),
    /** @type {object|null} */
    userInfo: getUserInfo(),
    /** 是否正在加载 */
    loading: false
  }),

  getters: {
    /** 是否已登录 */
    isLoggedIn: (state) => !!state.token,
    /** 用户昵称 */
    nickname: (state) => state.userInfo?.nickname || '未登录',
    /** 用户ID */
    userId: (state) => state.userInfo?.id || null
  },

  actions: {
    /**
     * 登录
     * @param {object} credentials - { email, password }
     */
    async login(credentials) {
      this.loading = true;
      try {
        const result = await login(credentials);
        this.token = result.token;
        this.userInfo = result.user;
        saveToken(result.token);
        saveUserInfo(result.user);
        return result;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 注册
     * @param {object} data - { email, password, nickname }
     */
    async register(data) {
      this.loading = true;
      try {
        const result = await register(data);
        this.token = result.token;
        this.userInfo = result.user;
        saveToken(result.token);
        saveUserInfo(result.user);
        return result;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 退出登录
     */
    async logout() {
      try {
        await logout();
      } catch {
        // 忽略服务器错误，本地直接清除
      } finally {
        this.token = null;
        this.userInfo = null;
        clearAuth();
        uni.reLaunch({ url: '/pages/user/login' });
      }
    },

    /**
     * 刷新用户信息
     */
    async refreshProfile() {
      if (!this.token) return;
      try {
        const userInfo = await getProfile();
        this.userInfo = userInfo;
        saveUserInfo(userInfo);
      } catch {
        // Token失效时request.js会自动跳转登录页
      }
    }
  }
});
