<script>
import { getToken } from '@/utils/storage.js';

export default {
  onLaunch() {
    // 启动时检查登录状态
    const token = getToken();
    if (!token) {
      // 未登录：跳转登录页（reLaunch 清空页面栈）
      uni.reLaunch({ url: '/pages/user/login' });
    }
    // 已登录：pages.json 第一个页面（index/index）正常加载
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
