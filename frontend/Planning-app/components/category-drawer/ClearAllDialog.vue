<template>
  <view v-if="visible" class="dialog-mask" @tap="handleCancel">
    <view class="dialog-container" @tap.stop>
      <view class="dialog-header">
        <text class="dialog-title">清空所有规划和分类</text>
      </view>

      <view class="dialog-body">
        <text class="dialog-message">
          清空所有规划和分类，所有规划和分类下的任务将会变为无分类
        </text>

        <view class="dialog-checkbox">
          <checkbox
            :checked="deleteAllTasks"
            @tap="deleteAllTasks = !deleteAllTasks"
            color="#7CA1FF"
          />
          <text class="checkbox-label">同时删除全部任务</text>
        </view>
      </view>

      <view class="dialog-footer">
        <view class="dialog-btn cancel-btn" @tap="handleCancel">
          <text class="btn-text">取消</text>
        </view>
        <view class="dialog-btn confirm-btn" @tap="handleConfirm">
          <text class="btn-text">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * ClearAllDialog - 清空所有规划和分类确认弹窗
 *
 * 职责:
 * - 显示确认弹窗
 * - 提供"同时删除全部任务"选项
 * - 触发确认/取消事件
 */

import { ref } from 'vue';

const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['confirm', 'cancel']);

/**
 * 是否同时删除全部任务
 */
const deleteAllTasks = ref(false);

/**
 * 确认清空
 */
function handleConfirm() {
  emit('confirm', deleteAllTasks.value);
  deleteAllTasks.value = false; // 重置状态
}

/**
 * 取消操作
 */
function handleCancel() {
  emit('cancel');
  deleteAllTasks.value = false; // 重置状态
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
  margin-bottom: 30rpx;
}

.dialog-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 20rpx;
  background-color: #fafafa;
  border-radius: 12rpx;
}

.checkbox-label {
  font-size: 28rpx;
  color: #333;
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

.confirm-btn .btn-text {
  color: #7CA1FF;
  font-weight: 600;
}

.btn-text {
  font-size: 30rpx;
  color: #666;
}
</style>
