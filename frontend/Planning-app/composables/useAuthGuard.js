/**
 * 访客模式权限守卫 Composable
 *
 * 用途：统一管理访客模式的权限检查逻辑
 * 使用场景：任何需要拦截访客模式修改操作的地方
 *
 * @example
 * import { useAuthGuard } from '@/composables/useAuthGuard';
 *
 * const { requireAuth, isGuest } = useAuthGuard();
 *
 * // 装饰器用法
 * const deleteTask = requireAuth(async (taskId) => {
 *   await taskStore.removeTask(taskId);
 * });
 *
 * // 判断用法
 * if (isGuest()) {
 *   // 加载演示数据
 * } else {
 *   // 加载真实数据
 * }
 */
import { useUserStore } from '@/store/modules/user';

export function useAuthGuard() {
  const userStore = useUserStore();

  /**
   * 检查是否为访客模式
   * @returns {boolean} true-访客模式，false-已登录
   */
  function isGuest() {
    return userStore.token === 'guest';
  }

  /**
   * 装饰器：拦截访客模式的修改操作
   *
   * @param {Function} fn - 需要保护的函数
   * @param {Object} options - 配置选项
   * @param {string} options.message - 提示文案
   * @param {number} options.duration - 提示持续时间(ms)
   * @returns {Function} 包装后的函数
   */
  function requireAuth(fn, options = {}) {
    const {
      message = '访客模式下无法修改任务，请登录后使用',
      duration = 2000
    } = options;

    return async function(...args) {
      if (isGuest()) {
        uni.showToast({
          title: message,
          icon: 'none',
          duration
        });
        return;
      }
      return await fn.apply(this, args);
    };
  }

  return {
    isGuest,
    requireAuth
  };
}
