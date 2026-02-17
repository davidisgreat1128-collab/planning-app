/**
 * 前端全局配置
 * UniApp环境下通过条件编译区分环境
 */

// #ifdef H5
const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:3000/api/v1'
  : 'https://api.planning-app.com/api/v1';
// #endif

// #ifndef H5
const BASE_URL = 'http://127.0.0.1:3000/api/v1';
// #endif

export default {
  /** API基础地址 */
  BASE_URL,
  /** 请求超时时间（毫秒） */
  REQUEST_TIMEOUT: 10000,
  /** Token本地存储Key */
  TOKEN_KEY: 'planning_app_token',
  /** 用户信息本地存储Key */
  USER_INFO_KEY: 'planning_app_user',
  /** 应用名称 */
  APP_NAME: '规划助手',
  /** 版本号 */
  VERSION: '0.1.0'
};
