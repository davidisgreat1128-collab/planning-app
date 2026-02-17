/**
 * 本地存储工具函数
 * 统一封装uni.setStorageSync / getStorageSync，避免分散调用
 */

import config from '@/config/index.js';

/**
 * 保存Token
 * @param {string} token
 */
export function saveToken(token) {
  uni.setStorageSync(config.TOKEN_KEY, token);
}

/**
 * 获取Token
 * @returns {string|null}
 */
export function getToken() {
  return uni.getStorageSync(config.TOKEN_KEY) || null;
}

/**
 * 清除Token
 */
export function removeToken() {
  uni.removeStorageSync(config.TOKEN_KEY);
}

/**
 * 保存用户信息
 * @param {object} userInfo
 */
export function saveUserInfo(userInfo) {
  uni.setStorageSync(config.USER_INFO_KEY, JSON.stringify(userInfo));
}

/**
 * 获取用户信息
 * @returns {object|null}
 */
export function getUserInfo() {
  const raw = uni.getStorageSync(config.USER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 清除用户信息
 */
export function removeUserInfo() {
  uni.removeStorageSync(config.USER_INFO_KEY);
}

/**
 * 清除所有登录相关数据（退出登录时调用）
 */
export function clearAuth() {
  removeToken();
  removeUserInfo();
}

/**
 * 通用存储
 * @param {string} key
 * @param {*} value
 */
export function set(key, value) {
  uni.setStorageSync(key, typeof value === 'object' ? JSON.stringify(value) : value);
}

/**
 * 通用读取
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
export function get(key, defaultValue = null) {
  const val = uni.getStorageSync(key);
  if (val === '' || val === undefined || val === null) return defaultValue;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

/**
 * 通用删除
 * @param {string} key
 */
export function remove(key) {
  uni.removeStorageSync(key);
}
