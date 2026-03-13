<script>
import { useUserStore } from '@/store/user.js';
import { useCategoryStore } from '@/store/category.js';
import { useTaskStore } from '@/store/task.js';
import { useLogStore } from '@/store/log.js';
import { usePlanningStore } from '@/store/planning.js';
import { useTemplateStore } from '@/store/template.js';
// ⭐ 架构统一：规划现在存储在 CategoryRepository（type='plan'），通过 categoryStore.hydrate() 加载
// import { usePlanStore } from '@/store/plan.js';

export default {
  async onLaunch() {
    // 【已完成测试】访客模式测试阶段已完成，注释掉清除缓存逻辑
    // TODO: 正式发布时实现版本检测，升级时才清除旧数据
    // try {
    //   uni.clearStorageSync();
    //   console.log('[App] 已清除所有缓存（测试模式）');
    // } catch (e) {
    //   console.warn('[App] 清除缓存失败:', e);
    // }

    // 记录首次安装日期（用于计算坚持天数）
    const firstInstallDate = uni.getStorageSync('first_install_date');
    if (!firstInstallDate) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      uni.setStorageSync('first_install_date', today);
      console.log('[App] 首次安装日期已记录:', today);
    }

    // 【四层架构】从 Repository 加载所有数据到 Store
    const userStore = useUserStore();
    const categoryStore = useCategoryStore();
    const taskStore = useTaskStore();
    const logStore = useLogStore();
    const planningStore = usePlanningStore();
    const templateStore = useTemplateStore();
    // ⭐ 架构统一：规划现在存储在 CategoryRepository（type='plan'）
    // const planStore = usePlanStore();

    try {
      // 并行加载所有 Store 数据
      await Promise.all([
        userStore.hydrate(),      // 加载用户数据（token + userInfo）
        categoryStore.hydrate(),  // ⭐ 加载分类数据（包括规划type='plan'）
        taskStore.hydrate(),      // 加载任务数据
        logStore.hydrate(),       // 加载日志数据
        planningStore.hydrate(),  // 加载规划数据
        templateStore.hydrate()   // 加载模板数据
      ]);

      // ⭐ 架构统一：规划现在统一由 categoryStore.hydrate() 加载（type='plan'）
      console.log('[App] 所有数据已加载，规划数量:', categoryStore.plans.length);
    } catch (err) {
      console.error('[App] Repository 数据加载失败:', err);
    }

    // 根据登录状态决定跳转
    if (userStore.isLoggedIn) {
      // 已登录（包括访客模式）：跳转主页
      console.log('[App] 已登录，跳转主页');
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/calendar/index' });
      }, 100);
    } else {
      // 未登录：pages.json 已配置 login 为首页，无需跳转
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
