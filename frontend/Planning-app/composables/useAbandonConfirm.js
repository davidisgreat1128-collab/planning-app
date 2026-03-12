/**
 * 放弃规划确认业务逻辑
 * 职责：管理放弃规划的倒计时、弹窗状态
 */

import { ref } from 'vue'

/**
 * 放弃规划确认Composable
 * @param {function} onConfirm - 确认放弃后的回调函数
 * @returns {object} 弹窗状态和控制方法
 */
export function useAbandonConfirm(onConfirm) {
  // ============================================================
  // 1. 响应式状态
  // ============================================================

  // 放弃规划确认弹窗显示状态
  const showAbandonDialog = ref(false)

  // 放弃规划倒计时（秒）
  const abandonCountdown = ref(0)

  // 倒计时定时器
  let abandonTimer = null

  // ============================================================
  // 2. 业务方法
  // ============================================================

  /**
   * 显示放弃规划确认弹窗（启动3秒倒计时）
   */
  function showDialog() {
    showAbandonDialog.value = true
    abandonCountdown.value = 3
    startCountdown()
  }

  /**
   * 关闭放弃规划弹窗
   */
  function closeDialog() {
    showAbandonDialog.value = false
    abandonCountdown.value = 0
    if (abandonTimer) {
      clearInterval(abandonTimer)
      abandonTimer = null
    }
  }

  /**
   * 开始放弃规划倒计时
   */
  function startCountdown() {
    if (abandonTimer) {
      clearInterval(abandonTimer)
    }
    abandonTimer = setInterval(() => {
      if (abandonCountdown.value > 0) {
        abandonCountdown.value--
      } else {
        clearInterval(abandonTimer)
        abandonTimer = null
      }
    }, 1000)
  }

  /**
   * 确认放弃规划
   */
  function confirmAbandon() {
    // 倒计时未结束，不允许点击
    if (abandonCountdown.value > 0) {
      return
    }

    // 执行回调函数
    if (onConfirm) {
      onConfirm()
    }

    // 关闭弹窗
    closeDialog()
  }

  // ============================================================
  // 3. 返回公开接口
  // ============================================================

  return {
    // 状态
    showAbandonDialog,
    abandonCountdown,

    // 方法
    showDialog,
    closeDialog,
    confirmAbandon
  }
}
