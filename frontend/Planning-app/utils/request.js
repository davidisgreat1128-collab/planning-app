/**
 * 统一HTTP请求封装
 * 基于uni.request，支持Token自动注入和统一错误处理
 */

import config from '@/config/index.js';
import { removeToken, removeUserInfo } from '@/utils/storage.js';

/**
 * 发起HTTP请求
 * @param {object} options - 请求配置
 * @param {string} options.url - 接口路径（不含baseUrl）
 * @param {string} [options.method='GET'] - 请求方法
 * @param {object} [options.data] - 请求数据
 * @param {boolean} [options.auth=true] - 是否需要Token认证
 * @returns {Promise<*>} 返回data字段内容
 */
function request({ url, method = 'GET', data = {}, auth = true } = {}) {
  return new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/json'
    };

    // 自动注入Token
    if (auth) {
      // #ifdef H5
      const token = localStorage.getItem(config.TOKEN_KEY);
      // #endif
      // #ifndef H5
      const token = uni.getStorageSync(config.TOKEN_KEY);
      // #endif
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }
    }

    const fullUrl = `${config.BASE_URL}${url}`;
    console.log(`[Request] ${method} ${fullUrl}`, data);

    uni.request({
      url: fullUrl,
      method,
      data,
      header,
      timeout: config.REQUEST_TIMEOUT,
      success: (res) => {
        console.log(`[Response] ${method} ${fullUrl} → ${res.statusCode}`, res.data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          if (res.data && res.data.success) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data?.message || '请求失败'));
          }
        } else if (res.statusCode === 204) {
          resolve(null);
        } else if (res.statusCode === 401) {
          // Token失效：访客模式下仅提示，不跳转登录页
          const guestMode = uni.getStorageSync('guest_mode');
          if (guestMode) {
            uni.showToast({ title: '请登录后使用该功能', icon: 'none' });
            reject(new Error('请登录后使用该功能'));
          } else {
            removeToken();
            removeUserInfo();
            uni.reLaunch({ url: '/pages/user/login' });
            reject(new Error('登录已过期，请重新登录'));
          }
        } else if (res.statusCode === 404) {
          console.error(`[404] 接口不存在: ${method} ${fullUrl}`);
          reject(new Error(`接口不存在: ${url}`));
        } else {
          const msg = res.data?.message || `请求失败(${res.statusCode})`;
          reject(new Error(msg));
        }
      },
      fail: (err) => {
        console.error(`[RequestFail] ${method} ${fullUrl}`, err);
        reject(new Error('网络连接失败，请检查网络'));
      }
    });
  });
}

/**
 * GET请求快捷方法
 * @param {string} url
 * @param {object} [params]
 * @param {boolean} [auth=true]
 */
export const get = (url, params = {}, auth = true) =>
  request({ url: buildUrl(url, params), method: 'GET', auth });

/**
 * POST请求快捷方法
 * @param {string} url
 * @param {object} [data]
 * @param {boolean} [auth=true]
 */
export const post = (url, data = {}, auth = true) =>
  request({ url, method: 'POST', data, auth });

/**
 * PUT请求快捷方法
 */
export const put = (url, data = {}, auth = true) =>
  request({ url, method: 'PUT', data, auth });

/**
 * PATCH请求快捷方法
 */
export const patch = (url, data = {}, auth = true) =>
  request({ url, method: 'PATCH', data, auth });

/**
 * DELETE请求快捷方法
 */
export const del = (url, auth = true) =>
  request({ url, method: 'DELETE', auth });

/**
 * 将参数对象拼接到URL
 * @param {string} url
 * @param {object} params
 * @returns {string}
 */
function buildUrl(url, params) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `${url}?${query}` : url;
}

export default request;
