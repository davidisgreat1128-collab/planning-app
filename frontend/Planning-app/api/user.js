/**
 * 用户相关API
 */

import { post, get, put } from '@/utils/request.js';

/**
 * 用户注册
 * @param {object} data
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {string} data.nickname - 昵称
 * @returns {Promise<{token: string, user: object}>}
 */
export function register(data) {
  return post('/auth/register', data, false);
}

/**
 * 用户登录
 * @param {object} data
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @returns {Promise<{token: string, user: object}>}
 */
export function login(data) {
  return post('/auth/login', data, false);
}

/**
 * 退出登录
 * @returns {Promise<void>}
 */
export function logout() {
  return post('/auth/logout');
}

/**
 * 获取当前用户信息
 * @returns {Promise<object>}
 */
export function getProfile() {
  return get('/users/me');
}

/**
 * 更新用户信息
 * @param {object} data
 * @returns {Promise<object>}
 */
export function updateProfile(data) {
  return put('/users/me', data);
}

/**
 * 修改密码
 * @param {object} data
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise<void>}
 */
export function changePassword(data) {
  return post('/users/me/password', data);
}
