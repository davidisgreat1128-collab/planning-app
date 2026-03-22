/**
 * 前端全局配置
 * UniApp环境下通过条件编译区分环境
 */

// ============================================================
// 生产环境配置
// ============================================================
const PROD_BASE_URL = 'https://txjjzyzqbx.cn/api/v1'; // ✅ 使用HTTPS域名（QQ浏览器测试成功）

// ============================================================
// 开发环境配置（VPN会导致IP变化，开发期也用服务器）
// ============================================================
const DEV_BASE_URL = 'https://txjjzyzqbx.cn/api/v1'; // ✅ 使用HTTPS域名（QQ浏览器测试成功）

// ============================================================
// 环境开关（打包正式版前改为 false）
// ============================================================
const IS_DEV_MODE = false; // ⚠️ 打包前确认为 false

let BASE_URL;

// ============================================================
// H5端：根据 process.env 判断
// ============================================================
// #ifdef H5
BASE_URL = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production')
  ? PROD_BASE_URL
  : DEV_BASE_URL;
console.log('[Config] H5环境，BASE_URL:', BASE_URL);
// #endif

// ============================================================
// App端：根据手动开关判断
// ============================================================
// #ifdef APP-PLUS
BASE_URL = IS_DEV_MODE ? DEV_BASE_URL : PROD_BASE_URL;
console.log('[Config] App环境，BASE_URL:', BASE_URL, '开发模式:', IS_DEV_MODE);
// #endif

export default {
  /** API基础地址 */
  BASE_URL,
  /** 是否开发模式 */
  IS_DEV_MODE,
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
