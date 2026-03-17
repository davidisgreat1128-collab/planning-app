/**
 * 系统布局信息 Composable
 * 职责：获取和管理系统级布局参数（Tabbar高度、状态栏高度、安全区等）
 *
 * 为什么需要这个 Composable？
 * - 避免在多个组件中重复获取系统信息
 * - 统一管理三端（H5/Android/iOS）的布局差异
 * - 提供响应式数据，自动适配设备变化
 *
 * 使用场景：
 * - 固定定位的弹窗需要避开 Tabbar
 * - 需要适配刘海屏的底部安全区
 * - 需要计算可用内容区域高度
 *
 * @returns {object} 系统布局信息
 * @property {Ref<number>} tabBarHeight - Tabbar 高度（rpx 单位）
 * @property {Ref<number>} statusBarHeight - 状态栏高度（rpx 单位）
 * @property {Ref<number>} safeAreaBottom - 底部安全区高度（rpx 单位）
 * @property {Ref<number>} contentHeight - 可用内容区域高度（rpx 单位）
 */

import { ref, onMounted } from 'vue';

export function useSystemLayout() {
  // ============================================================
  // 响应式状态
  // ============================================================

  /** Tabbar 高度（rpx） */
  const tabBarHeight = ref(0);

  /** 状态栏高度（rpx） */
  const statusBarHeight = ref(0);

  /** 底部安全区高度（rpx） */
  const safeAreaBottom = ref(0);

  /** 可用内容区域高度（rpx） */
  const contentHeight = ref(0);

  // ============================================================
  // 初始化方法
  // ============================================================

  /**
   * 获取系统布局信息
   * 在 onMounted 时自动调用
   */
  function getSystemLayout() {
    try {
      const systemInfo = uni.getSystemInfoSync();
      console.log('[useSystemLayout] 系统信息:', systemInfo);

      // 像素转 rpx：px * 2 = rpx（750rpx设计稿标准）
      const pixelRatio = 750 / systemInfo.windowWidth;

      // ① 状态栏高度（App端需要）
      // #ifdef APP-PLUS
      statusBarHeight.value = Math.round((systemInfo.statusBarHeight || 0) * pixelRatio);
      // #endif

      // #ifdef H5
      statusBarHeight.value = 0; // H5 端无状态栏
      // #endif

      // ② 底部安全区高度（刘海屏设备）
      const screenHeight = systemInfo.screenHeight || 0;
      const safeAreaBottomPx = systemInfo.safeArea?.bottom || screenHeight;
      const safeInsetBottomPx = screenHeight - safeAreaBottomPx;
      safeAreaBottom.value = Math.round(safeInsetBottomPx * pixelRatio);

      // ③ Tabbar 高度
      // UniApp 官方文档：Tabbar 默认高度为 50px
      // 参考：https://uniapp.dcloud.net.cn/collocation/pages.html#tabbar
      const tabBarHeightPx = 50;

      // #ifdef H5
      // H5 端：Tabbar 固定 50px
      tabBarHeight.value = Math.round(tabBarHeightPx * pixelRatio);
      // #endif

      // #ifdef APP-PLUS
      // App 端：Tabbar 高度 = 50px + 底部安全区
      tabBarHeight.value = Math.round(tabBarHeightPx * pixelRatio) + safeAreaBottom.value;
      // #endif

      // ④ 可用内容区域高度（屏幕高度 - 状态栏 - Tabbar）
      const screenHeightRpx = Math.round(screenHeight * pixelRatio);
      contentHeight.value = screenHeightRpx - statusBarHeight.value - tabBarHeight.value;

      console.log('[useSystemLayout] Tabbar高度:', tabBarHeight.value, 'rpx');
      console.log('[useSystemLayout] 状态栏高度:', statusBarHeight.value, 'rpx');
      console.log('[useSystemLayout] 底部安全区:', safeAreaBottom.value, 'rpx');
      console.log('[useSystemLayout] 内容区高度:', contentHeight.value, 'rpx');

    } catch (error) {
      console.error('[useSystemLayout] 获取系统信息失败:', error);
      // 降级处理：使用默认值
      tabBarHeight.value = 100; // 默认 50px = 100rpx
      statusBarHeight.value = 0;
      safeAreaBottom.value = 0;
      contentHeight.value = 1334; // iPhone 6/7/8 标准高度
    }
  }

  // 组件挂载时自动获取
  onMounted(() => {
    getSystemLayout();
  });

  // ============================================================
  // 返回公开接口
  // ============================================================

  return {
    tabBarHeight,
    statusBarHeight,
    safeAreaBottom,
    contentHeight,
    // 提供手动刷新方法（如屏幕旋转时）
    refresh: getSystemLayout
  };
}
