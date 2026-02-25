<template>
  <view v-if="visible" class="delete-dialog-mask" @tap="onMaskTap">
    <view class="delete-dialog" @tap.stop>
      <!-- 提示文字 -->
      <text class="dialog-message">删除分类后，该分类下的计划将变为无分类</text>

      <!-- 复选框：同时删除分类下的计划 -->
      <view class="checkbox-row" @tap="toggleDeleteTasks">
        <view class="checkbox" :class="{ checked: deleteWithTasks }">
          <text v-if="deleteWithTasks" class="check-icon">✓</text>
        </view>
        <text class="checkbox-label">同时删除分类下的计划</text>
      </view>

      <!-- 按钮 -->
      <view class="dialog-buttons">
        <view class="dialog-btn cancel-btn" @tap="onCancel">取消</view>
        <view
          class="dialog-btn confirm-btn"
          :class="{ 'with-countdown': !deleteWithTasks && countdown > 0 }"
          @tap="onConfirm"
        >
          <text v-if="!deleteWithTasks && countdown > 0">确定 ({{ countdown }})</text>
          <text v-else>确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue';

// ============================================================
// Props & Emits
// ============================================================
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  categoryName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'confirm']);

// ============================================================
// 状态
// ============================================================
const deleteWithTasks = ref(false); // 是否同时删除任务
const countdown = ref(3); // 倒计时秒数
let countdownTimer = null; // 倒计时定时器

// ============================================================
// 方法
// ============================================================

/**
 * 切换删除任务选项
 */
function toggleDeleteTasks() {
  deleteWithTasks.value = !deleteWithTasks.value;

  // 如果取消勾选，重新启动倒计时
  if (!deleteWithTasks.value) {
    startCountdown();
  } else {
    // 如果勾选，清除倒计时
    clearCountdown();
  }
}

/**
 * 点击遮罩关闭
 */
function onMaskTap() {
  // 点击遮罩不关闭，防止误操作
}

/**
 * 取消
 */
function onCancel() {
  clearCountdown();
  emit('update:visible', false);
}

/**
 * 确定
 */
function onConfirm() {
  // 如果未勾选删除任务且倒计时未结束，不允许确认
  if (!deleteWithTasks.value && countdown.value > 0) {
    return;
  }

  clearCountdown();
  emit('confirm', deleteWithTasks.value);
  emit('update:visible', false);
}

/**
 * 启动倒计时
 */
function startCountdown() {
  clearCountdown(); // 先清除之前的定时器
  countdown.value = 3;

  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearCountdown();
    }
  }, 1000);
}

/**
 * 清除倒计时
 */
function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.value = 0;
}

// ============================================================
// 监听弹窗显示状态
// ============================================================
watch(() => props.visible, (val) => {
  if (val) {
    // 弹窗打开时，重置状态并启动倒计时
    deleteWithTasks.value = false;
    startCountdown();
  } else {
    // 弹窗关闭时，清除倒计时
    clearCountdown();
  }
});
</script>

<style scoped>
/* ============================================================
   遮罩层
   ============================================================ */
.delete-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* ============================================================
   弹窗主体
   ============================================================ */
.delete-dialog {
  width: 600rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx 30rpx;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

/* ============================================================
   提示文字
   ============================================================ */
.dialog-message {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  text-align: left;
}

/* ============================================================
   复选框行
   ============================================================ */
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 0;
  cursor: pointer;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background-color: #333;
  border-color: #333;
}

.check-icon {
  font-size: 24rpx;
  color: #fff;
  font-weight: bold;
}

.checkbox-label {
  font-size: 28rpx;
  color: #333;
}

/* ============================================================
   按钮区域
   ============================================================ */
.dialog-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
}

.dialog-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 28rpx;
  font-weight: 500;
}

.dialog-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.cancel-btn {
  background-color: #fff;
  border: 2rpx solid #ddd;
  color: #666;
}

.confirm-btn {
  background-color: #333;
  color: #fff;
}

.confirm-btn.with-countdown {
  background-color: #ccc;
  cursor: not-allowed;
}

.confirm-btn.with-countdown:active {
  opacity: 1;
  transform: scale(1);
}
</style>
