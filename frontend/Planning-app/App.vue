<script>
import { getToken, getUserInfo } from '@/utils/storage.js';
import { useUserStore } from '@/store/user.js';

export default {
  onLaunch() {
    // 清除旧版本缓存数据（防止结构不兼容导致白屏）
    // 注意：保留 guest_mode / planning_app_token / planning_app_user 三个关键key
    try {
      const storageInfo = uni.getStorageInfoSync();
      const oldKeys = storageInfo.keys || [];
      const keepKeys = ['guest_mode', 'planning_app_token', 'planning_app_user'];
      oldKeys.forEach(key => {
        if (!keepKeys.includes(key)) {
          uni.removeStorageSync(key);
        }
      });
      console.log('[App] 已清除旧版本缓存，保留keys:', keepKeys);
    } catch (e) {
      console.warn('[App] 清除缓存失败:', e);
    }

    // 启动时从本地存储恢复登录状态到 store
    const token = getToken();
    const userInfo = getUserInfo();
    console.log('[App] onLaunch, token:', !!token);

    // 检查是否开启了访客模式
    const guestMode = uni.getStorageSync('guest_mode');

    if (token) {
      // 有 Token：恢复登录状态，跳转主页
      const userStore = useUserStore();
      userStore.token = token;
      userStore.userInfo = userInfo;
      console.log('[App] 已登录，跳转主页');
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/calendar/index' });
      }, 100);
    } else if (guestMode) {
      // 访客模式：设置访客token，跳转主页
      const userStore = useUserStore();
      userStore.enterGuestMode();
      console.log('[App] 访客模式，跳转主页');
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/calendar/index' });
      }, 100);
    } else {
      // 普通模式 + 无token：pages.json已配置login为首页，无需跳转
      console.log('[App] 未登录，停留在登录页');
    }
  },

  onShow() {},
  onHide() {}
};
</script>

<style>
/* 全局公共样式 */
page {
  background-color: #f5f5f5;
  box-sizing: border-box;
}
</style>
