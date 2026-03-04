/**
 * 用户状态管理 (Pinia Composition API)
 *
 * 三层架构：Component → Store → Repository
 * - Store 层不直接调用 API
 * - 所有数据持久化由 UserRepository 管理
 * - Store 层提供响应式状态和业务方法
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04 (重构为三层架构)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import UserRepository from '@/repositories/UserRepository'

export const useUserStore = defineStore('user', () => {
  // ==================== 响应式状态 ====================

  /**
   * Token（从 Repository 读取）
   * @type {import('vue').Ref<string|null>}
   */
  const token = ref(UserRepository.getToken())

  /**
   * 用户信息（从 Repository 读取）
   * @type {import('vue').Ref<object|null>}
   */
  const userInfo = ref(UserRepository.getUserInfo())

  /**
   * 是否正在加载
   * @type {import('vue').Ref<boolean>}
   */
  const loading = ref(false)

  // ==================== 计算属性 ====================

  /**
   * 是否已登录（包括访客模式）
   */
  const isLoggedIn = computed(() => !!token.value)

  /**
   * 用户昵称
   */
  const nickname = computed(() => userInfo.value?.nickname || '未登录')

  /**
   * 用户ID
   */
  const userId = computed(() => userInfo.value?.id || null)

  /**
   * 是否访客模式
   */
  const isGuest = computed(() => token.value === 'guest')

  // ==================== Actions ====================

  /**
   * 【辅助】同步 Repository 数据到 Store 状态
   *
   * Repository 修改 localStorage 后，需要手动同步到 Store 的响应式状态
   * 这样 Vue 组件才能感知到变化
   */
  function _syncFromRepository() {
    token.value = UserRepository.getToken()
    userInfo.value = UserRepository.getUserInfo()
  }

  /**
   * hydrate - 数据水合（应用启动时调用）
   *
   * 从 Repository 加载持久化数据到 Store 状态
   */
  async function hydrate() {
    await UserRepository.hydrate()
    _syncFromRepository()
    console.log('[UserStore] 数据水合完成')
  }

  /**
   * 登录
   * @param {object} credentials - { email, password }
   * @returns {Promise<{token: string, user: object}>}
   */
  async function login(credentials) {
    loading.value = true
    try {
      const result = await UserRepository.login(credentials)
      _syncFromRepository() // 同步到响应式状态
      return result
    } finally {
      loading.value = false
    }
  }

  /**
   * 注册
   * @param {object} data - { email, password, nickname }
   * @returns {Promise<{token: string, user: object}>}
   */
  async function register(data) {
    loading.value = true
    try {
      const result = await UserRepository.register(data)
      _syncFromRepository() // 同步到响应式状态
      return result
    } finally {
      loading.value = false
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      await UserRepository.logout()
    } catch (err) {
      console.warn('[UserStore] 登出失败（已忽略）:', err)
    } finally {
      _syncFromRepository() // 同步到响应式状态（清空 token 和 userInfo）
      // 跳转登录页
      uni.reLaunch({ url: '/pages/user/login' })
    }
  }

  /**
   * 进入访客模式（无需登录，跳过Auth）
   *
   * 仅在 guest_mode 开关开启时由 App.vue 调用
   */
  function enterGuestMode() {
    UserRepository.enterGuestMode()
    _syncFromRepository() // 同步到响应式状态
    console.log('[UserStore] 已进入访客模式')
  }

  /**
   * 刷新用户信息（从服务器获取最新数据）
   */
  async function refreshProfile() {
    if (!token.value || token.value === 'guest') {
      console.warn('[UserStore] 访客模式或未登录，跳过刷新')
      return
    }

    try {
      await UserRepository.refreshProfile()
      _syncFromRepository() // 同步到响应式状态
    } catch (err) {
      console.error('[UserStore] 刷新用户信息失败:', err)
      // Token 失效时，request.js 会自动跳转登录页
    }
  }

  // ==================== 返回 ====================

  return {
    // State
    token,
    userInfo,
    loading,

    // Getters
    isLoggedIn,
    nickname,
    userId,
    isGuest,

    // Actions
    hydrate,
    login,
    register,
    logout,
    enterGuestMode,
    refreshProfile
  }
})
