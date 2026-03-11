/**
 * useSwipeGesture - 左滑手势 Composable
 *
 * 职责:
 * - 统一管理左滑手势状态
 * - 支持左滑打开/关闭操作按钮
 * - 提供编辑/删除回调
 *
 * 使用场景:
 * - 分类列表左滑操作
 * - 规划列表左滑操作
 * - 任何需要左滑操作的列表
 *
 * 使用方式:
 * ```javascript
 * import { useSwipeGesture } from '@/composables/useSwipeGesture'
 *
 * const { swipeOpenId, onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture()
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-11
 */

import { ref } from 'vue';

// ============================================================
// 常量配置
// ============================================================

/** 左滑触发阈值 (像素) */
const SWIPE_THRESHOLD = 50;

/** 最小移动距离 (像素) - 用于判断点击还是滑动 */
const MIN_MOVE_DISTANCE = 10;

// ============================================================
// Composable 主函数
// ============================================================

/**
 * 创建左滑手势管理器
 *
 * @returns {object} 左滑手势状态和方法
 * @returns {Ref<string|null>} swipeOpenId - 当前打开的项目ID
 * @returns {Function} onTouchStart - 触摸开始事件处理
 * @returns {Function} onTouchMove - 触摸移动事件处理
 * @returns {Function} onTouchEnd - 触摸结束事件处理
 * @returns {Function} closeSwipe - 关闭左滑
 */
export function useSwipeGesture() {
  // ============================================================
  // 状态变量
  // ============================================================

  /** 当前左滑打开的项目 ID */
  const swipeOpenId = ref(null);

  /** 触摸开始的 X 坐标 */
  const touchStartX = ref(0);

  /** 触摸开始的 Y 坐标 */
  const touchStartY = ref(0);

  // ============================================================
  // 事件处理方法
  // ============================================================

  /**
   * 触摸开始
   * @param {TouchEvent} event - 触摸事件
   * @param {string} itemId - 项目ID
   */
  function onTouchStart(event, itemId) {
    touchStartX.value = event.touches[0].pageX;
    touchStartY.value = event.touches[0].pageY;
  }

  /**
   * 触摸移动
   * @param {TouchEvent} event - 触摸事件
   * @param {string} itemId - 项目ID
   */
  function onTouchMove(event, itemId) {
    const touchX = event.touches[0].pageX;
    const touchY = event.touches[0].pageY;
    const deltaX = touchX - touchStartX.value;
    const deltaY = touchY - touchStartY.value;

    // 判断是否是横向滑动
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > MIN_MOVE_DISTANCE) {
      // 阻止默认滚动行为
      event.preventDefault?.();
    }
  }

  /**
   * 触摸结束
   * @param {TouchEvent} event - 触摸事件
   * @param {string} itemId - 项目ID
   */
  function onTouchEnd(event, itemId) {
    const touchX = event.changedTouches[0].pageX;
    const deltaX = touchX - touchStartX.value;

    // 左滑阈值：滑动距离超过 SWIPE_THRESHOLD
    if (deltaX < -SWIPE_THRESHOLD) {
      // 左滑，打开操作按钮
      swipeOpenId.value = itemId;
    } else if (deltaX > SWIPE_THRESHOLD) {
      // 右滑，关闭操作按钮
      swipeOpenId.value = null;
    } else if (swipeOpenId.value === itemId && Math.abs(deltaX) < MIN_MOVE_DISTANCE) {
      // 点击已打开的项，关闭
      swipeOpenId.value = null;
    }
  }

  /**
   * 关闭左滑
   */
  function closeSwipe() {
    swipeOpenId.value = null;
  }

  // ============================================================
  // 返回公开接口
  // ============================================================

  return {
    // 状态
    swipeOpenId,

    // 方法
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    closeSwipe
  };
}
