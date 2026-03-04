/**
 * UserRepository - 用户数据访问层
 *
 * 职责：
 * - 管理用户登录状态（token、userInfo）
 * - 管理访客模式（guest_mode）
 * - 提供 localStorage 统一持久化接口
 * - 集成登录/注册/登出 API 调用
 *
 * 特点：
 * - 简化版 Repository（用户数据无需离线队列）
 * - 直接调用 API，成功后写入缓存
 * - 支持访客模式（无需服务器认证）
 *
 * 使用方式：
 * import UserRepository from '@/repositories/UserRepository'
 *
 * await UserRepository.login({ email, password })
 * const token = UserRepository.getToken()
 * const userInfo = UserRepository.getUserInfo()
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04
 */

import { login as loginApi, register as registerApi, logout as logoutApi, getProfile as getProfileApi } from '@/api/user.js'
import config from '@/config/index.js'

/**
 * 统一存储接口（兼容 H5 和 App）
 */
function setStorage(key, value) {
  // #ifdef H5
  localStorage.setItem(key, value)
  // #endif
  // #ifndef H5
  uni.setStorageSync(key, value)
  // #endif
}

function getStorage(key) {
  // #ifdef H5
  return localStorage.getItem(key)
  // #endif
  // #ifndef H5
  return uni.getStorageSync(key)
  // #endif
}

function removeStorage(key) {
  // #ifdef H5
  localStorage.removeItem(key)
  // #endif
  // #ifndef H5
  uni.removeStorageSync(key)
  // #endif
}

/**
 * UserRepository 类
 *
 * 设计说明：
 * - 用户数据无需 memoryCache（token/userInfo 实时性要求高，直接读 localStorage）
 * - 用户数据无需 operationQueue（登录/注册必须立即成功，无离线场景）
 * - 简化为：API 调用成功 → 写 localStorage → Store 读取
 */
class UserRepository {
  constructor() {
    console.log('[UserRepository] 初始化')
  }

  /**
   * 【读】获取 Token
   * @returns {string|null}
   */
  getToken() {
    const token = getStorage(config.TOKEN_KEY)
    return token || null
  }

  /**
   * 【读】获取用户信息
   * @returns {object|null}
   */
  getUserInfo() {
    const raw = getStorage(config.USER_INFO_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch (err) {
      console.warn('[UserRepository] 解析 userInfo 失败:', err)
      return null
    }
  }

  /**
   * 【读】获取访客模式状态
   * @returns {boolean}
   */
  getGuestMode() {
    const guestMode = getStorage('guest_mode')
    return guestMode === 'true' || guestMode === true
  }

  /**
   * 【读】检查是否已登录（包括访客模式）
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!this.getToken() || this.getGuestMode()
  }

  /**
   * 【写】登录
   * @param {object} credentials - { email, password }
   * @returns {Promise<{token: string, user: object}>}
   * @throws {Error} 登录失败时抛出
   */
  async login(credentials) {
    console.log('[UserRepository] 执行登录:', credentials.email)

    try {
      // 调用登录 API
      const result = await loginApi(credentials)

      // 写入 localStorage
      setStorage(config.TOKEN_KEY, result.token)
      setStorage(config.USER_INFO_KEY, JSON.stringify(result.user))

      // 清除访客模式标记（如果有）
      removeStorage('guest_mode')

      console.log('[UserRepository] 登录成功:', result.user.nickname)
      return result

    } catch (err) {
      console.error('[UserRepository] 登录失败:', err)
      throw err
    }
  }

  /**
   * 【写】注册
   * @param {object} data - { email, password, nickname }
   * @returns {Promise<{token: string, user: object}>}
   * @throws {Error} 注册失败时抛出
   */
  async register(data) {
    console.log('[UserRepository] 执行注册:', data.email)

    try {
      // 调用注册 API
      const result = await registerApi(data)

      // 写入 localStorage
      setStorage(config.TOKEN_KEY, result.token)
      setStorage(config.USER_INFO_KEY, JSON.stringify(result.user))

      // 清除访客模式标记（如果有）
      removeStorage('guest_mode')

      console.log('[UserRepository] 注册成功:', result.user.nickname)
      return result

    } catch (err) {
      console.error('[UserRepository] 注册失败:', err)
      throw err
    }
  }

  /**
   * 【写】登出
   * @returns {Promise<void>}
   */
  async logout() {
    console.log('[UserRepository] 执行登出')

    try {
      // 尝试调用服务器登出 API（销毁 token）
      await logoutApi()
    } catch (err) {
      // 服务器错误不影响本地清除
      console.warn('[UserRepository] 服务器登出失败（已忽略）:', err)
    } finally {
      // 清除本地所有认证数据
      this.clearAuth()
      console.log('[UserRepository] 本地认证数据已清除')
    }
  }

  /**
   * 【写】刷新用户信息（从服务器获取最新数据）
   * @returns {Promise<object|null>}
   */
  async refreshProfile() {
    const token = this.getToken()
    if (!token || token === 'guest') {
      console.warn('[UserRepository] 无有效 Token，跳过刷新')
      return null
    }

    try {
      const userInfo = await getProfileApi()
      setStorage(config.USER_INFO_KEY, JSON.stringify(userInfo))
      console.log('[UserRepository] 用户信息已刷新:', userInfo.nickname)
      return userInfo

    } catch (err) {
      console.error('[UserRepository] 刷新用户信息失败:', err)
      // Token 失效时，request.js 会自动跳转登录页，无需额外处理
      throw err
    }
  }

  /**
   * 【写】进入访客模式
   *
   * 访客模式设计说明：
   * - 不调用任何服务器 API
   * - 本地设置特殊 token = 'guest' 和 guest_mode = true 标记
   * - Store 和 Component 层可正常工作
   * - 服务器 API 请求会因 token='guest' 返回 401，由业务层处理
   */
  enterGuestMode() {
    console.log('[UserRepository] 进入访客模式')

    // 写入访客标记
    setStorage(config.TOKEN_KEY, 'guest')
    setStorage(config.USER_INFO_KEY, JSON.stringify({
      id: 0,
      nickname: '访客',
      email: 'guest@local'
    }))
    setStorage('guest_mode', 'true')

    console.log('[UserRepository] 访客模式已激活')
  }

  /**
   * 【写】清除所有认证数据（包括访客模式）
   */
  clearAuth() {
    removeStorage(config.TOKEN_KEY)
    removeStorage(config.USER_INFO_KEY)
    removeStorage('guest_mode')
    console.log('[UserRepository] 所有认证数据已清除')
  }

  /**
   * 【辅助】hydrate - 数据水合（应用启动时调用）
   *
   * 用户数据无需 hydrate（localStorage 已是最新，无需同步服务器）
   * 此方法仅为保持接口一致性，实际不做任何操作
   */
  async hydrate() {
    console.log('[UserRepository] hydrate 调用（用户数据无需水合，跳过）')

    // 检查数据完整性（验证 localStorage 中的数据是否有效）
    const token = this.getToken()
    const userInfo = this.getUserInfo()

    if (token && !userInfo) {
      console.warn('[UserRepository] Token 存在但 userInfo 缺失，清除无效数据')
      this.clearAuth()
    }

    if (!token && userInfo) {
      console.warn('[UserRepository] userInfo 存在但 Token 缺失，清除无效数据')
      removeStorage(config.USER_INFO_KEY)
    }
  }
}

// 导出单例（利用 Node.js require 缓存机制）
export default new UserRepository()
