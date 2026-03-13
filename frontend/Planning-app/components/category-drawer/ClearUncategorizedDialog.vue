<template>
  <view v-if="visible" class="dialog-mask" @tap="handleCancel">
    <view class="dialog-container" @tap.stop>
      <view class="dialog-header">
        <text class="dialog-title">清空无分类任务</text>
      </view>

      <view class="dialog-body">
        <text class="dialog-message">
          确定要清空所有无分类的任务吗？
        </text>
        <text class="dialog-warning">
          此操作将删除所有无分类的任务，且不可恢复。
        </text>
      </view>

      <view class="dialog-footer">
        <view class="dialog-btn cancel-btn" @tap="handleCancel">
          <text class="btn-text">取消</text>
        </view>
        <view class="dialog-btn confirm-btn" @tap="handleConfirm">
          <text class="btn-text danger">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * ClearUncategorizedDialog - 清空无分类任务确认弹窗
 *
 * 职责:
 * - 显示确认弹窗
 * - 警告用户操作不可恢复
 * - 触发确认/取消事件
 */

const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['confirm', 'cancel']);

/**
 * 确认清空
 */
function handleConfirm() {
  emit('confirm');
}

/**
 * 取消操作
 */
function handleCancel() {
  emit('cancel');
}
</script>

<style scoped>
.dialog-mask {
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

.dialog-container {
  width: 600rpx;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.dialog-header {
  padding: 40rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  display: block;
}

.dialog-body {
  padding: 30rpx;
}

.dialog-message {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  text-align: center;
  display: block;
  margin-bottom: 15rpx;
}

.dialog-warning {
  font-size: 24rpx;
  color: #ff6b6b;
  line-height: 1.6;
  text-align: center;
  display: block;
}

.dialog-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.dialog-btn {
  flex: 1;
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dialog-btn:active {
  background-color: #f5f5f5;
}

.cancel-btn {
  border-right: 1rpx solid #f0f0f0;
}

.btn-text {
  font-size: 30rpx;
  color: #666;
}

.btn-text.danger {
  color: #ff6b6b;
  font-weight: 600;
}
</style>
