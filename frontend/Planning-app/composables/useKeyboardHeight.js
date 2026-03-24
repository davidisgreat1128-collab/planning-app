import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 键盘高度管理 Composable
 *
 * 职责：
 * - 监听系统键盘弹起/收起事件
 * - 提供实时键盘高度（单位：px）
 * - 仅App端生效，H5端返回0
 *
 * 使用场景：
 * - 任务弹窗需要根据键盘高度调整位置
 * - 其他需要避免键盘遮挡的组件
 *
 * @returns {object} { keyboardHeight }
 */
export function useKeyboardHeight() {
  // 键盘高度（单位：px）
  const keyboardHeight = ref(0)

  // #ifdef APP-PLUS
  let keyboardChangeHandler = null

  onMounted(() => {
    // 监听键盘高度变化
    keyboardChangeHandler = (res) => {
      keyboardHeight.value = res.height
    }

    uni.onKeyboardHeightChange(keyboardChangeHandler)
  })

  onUnmounted(() => {
    // 清理监听器（防止内存泄漏）
    if (keyboardChangeHandler) {
      uni.offKeyboardHeightChange(keyboardChangeHandler)
    }
  })
  // #endif

  return {
    keyboardHeight
  }
}
