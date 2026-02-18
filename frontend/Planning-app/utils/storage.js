/**
 * 本地存储工具函数
 * H5 端直接使用 localStorage，App 端使用 uni.setStorageSync
 */

import config from '@/config/index.js';

// 统一读写方法，条件编译区分 H5 和 App
function setStorage(key, value) {
  // #ifdef H5
  localStorage.setItem(key, value);
  // #endif
  // #ifndef H5
  uni.setStorageSync(key, value);
  // #endif
}

function getStorage(key) {
  // #ifdef H5
  return localStorage.getItem(key);
  // #endif
  // #ifndef H5
  return uni.getStorageSync(key);
  // #endif
}

function removeStorage(key) {
  // #ifdef H5
  localStorage.removeItem(key);
  // #endif
  // #ifndef H5
  uni.removeStorageSync(key);
  // #endif
}

/**
 * 保存Token
 * @param {string} token
 */
export function saveToken(token) {
  setStorage(config.TOKEN_KEY, token);
}

/**
 * 获取Token
 * @returns {string|null}
 */
export function getToken() {
  return getStorage(config.TOKEN_KEY) || null;
}

/**
 * 清除Token
 */
export function removeToken() {
  removeStorage(config.TOKEN_KEY);
}

/**
 * 保存用户信息
 * @param {object} userInfo
 */
export function saveUserInfo(userInfo) {
  setStorage(config.USER_INFO_KEY, JSON.stringify(userInfo));
}

/**
 * 获取用户信息
 * @returns {object|null}
 */
export function getUserInfo() {
  const raw = getStorage(config.USER_INFO_KEY);
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
  removeStorage(config.USER_INFO_KEY);
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
  setStorage(key, typeof value === 'object' ? JSON.stringify(value) : value);
}

/**
 * 通用读取
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
export function get(key, defaultValue = null) {
  const val = getStorage(key);
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
  removeStorage(key);
}
