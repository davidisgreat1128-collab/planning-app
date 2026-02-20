<script>
import { getToken, getUserInfo } from '@/utils/storage.js';
import { useUserStore } from '@/store/user.js';

export default {
  onLaunch() {
    // 启动时从本地存储恢复登录状态到 store
    const token = getToken();
    const userInfo = getUserInfo();
    console.log('[App] onLaunch, token:', !!token);

    if (token) {
      // 有 Token：恢复登录状态
      const userStore = useUserStore();
      userStore.token = token;
      userStore.userInfo = userInfo;
    } else {
      // 无 Token：检查是否开启了访客模式
      const guestMode = uni.getStorageSync('guest_mode');
      if (guestMode) {
        // 访客模式已开启：直接进入主页，无需登录
        const userStore = useUserStore();
        userStore.enterGuestMode();
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/calendar/index' });
        }, 100);
      } else {
        // 普通模式：跳转登录页（延迟等待首页组件加载完再跳转）
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/user/login' });
        }, 100);
      }
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
