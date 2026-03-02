<template>
  <!-- 删除任务确认弹窗 -->
  <view v-if="show" class="tep-modal-mask" @tap="handleCancel">
    <view class="delete-dialog" @tap.stop>
      <!-- 选项1：仅删除当天任务（带勾选标记） -->
      <view
        class="delete-option"
        :class="{ 'delete-option-selected': selectedOption === 1 }"
        @tap="handleSelectOption(1)"
      >
        <view class="delete-option-content">
          <text class="delete-option-title">仅删除当天任务</text>
          <text class="delete-option-desc">不影响该任务的过去及未来任务</text>
        </view>
        <view v-if="selectedOption === 1" class="delete-option-check">
          <text class="delete-option-check-icon">✓</text>
        </view>
      </view>

      <!-- 分隔线 -->
      <view class="delete-divider"></view>

      <!-- 选项2：完整清空此条重复任务 -->
      <view
        class="delete-option"
        :class="{ 'delete-option-selected': selectedOption === 2 }"
        @tap="handleSelectOption(2)"
      >
        <text class="delete-option-title">完整清空此条重复任务</text>
        <view v-if="selectedOption === 2" class="delete-option-check">
          <text class="delete-option-check-icon">✓</text>
        </view>
      </view>

      <!-- 分隔线 -->
      <view class="delete-divider"></view>

      <!-- 选项3：删除当天及未来任务 -->
      <view
        class="delete-option"
        :class="{ 'delete-option-selected': selectedOption === 3 }"
        @tap="handleSelectOption(3)"
      >
        <view class="delete-option-content">
          <text class="delete-option-title">删除当天及未来任务</text>
          <text class="delete-option-desc">不影响该任务的过去记录</text>
        </view>
        <view v-if="selectedOption === 3" class="delete-option-check">
          <text class="delete-option-check-icon">✓</text>
        </view>
      </view>

      <!-- 底部按钮区域：取消 + 确定 -->
      <view class="delete-actions">
        <view class="delete-cancel-btn" @tap="handleCancel">
          <text class="delete-cancel-text">取消</text>
        </view>
        <view class="delete-confirm-btn" @tap="handleConfirm">
          <text class="delete-confirm-text">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * Props
 */
const props = defineProps({
  // 是否显示对话框
  show: {
    type: Boolean,
    default: false
  },
  // 当前选中的删除选项 (1=仅删除当天, 2=完整清空, 3=删除当天及未来)
  selectedOption: {
    type: Number,
    default: 1
  }
});

/**
 * Emits
 */
const emit = defineEmits(['update:show', 'update:selectedOption', 'confirm', 'cancel']);

/**
 * 选择删除选项
 */
function handleSelectOption(option) {
  emit('update:selectedOption', option);
}

/**
 * 取消删除
 */
function handleCancel() {
  emit('update:show', false);
  emit('cancel');
}

/**
 * 确认删除
 */
function handleConfirm() {
  emit('confirm', props.selectedOption);
}
</script>

<style scoped>
/* 遮罩层 */
.tep-modal-mask {
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

/* 对话框主体 */
.delete-dialog {
  position: relative;
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx 30rpx 30rpx;
  display: flex;
  flex-direction: column;
}

/* 删除选项 */
.delete-option {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 20rpx;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-option:active {
  background-color: #F5F5F5;
}

.delete-option-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.delete-option-title {
  font-size: 30rpx;
  color: #1A1A2E;
  font-weight: 500;
}

.delete-option-desc {
  font-size: 24rpx;
  color: #999;
}

.delete-option-check {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-option-check-icon {
  font-size: 32rpx;
  color: #1A1A2E;
  font-weight: bold;
}

.delete-option-selected {
  background-color: #F8F8F8;
}

/* 分隔线 */
.delete-divider {
  height: 1px;
  background-color: #E5E5E5;
  margin: 0 20rpx;
}

/* 底部按钮区域 */
.delete-actions {
  margin-top: 32rpx;
  display: flex;
  flex-direction: row;
  gap: 24rpx;
}

.delete-cancel-btn {
  flex: 1;
  background-color: #F5F5F5;
  border-radius: 40rpx;
  padding: 24rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-cancel-btn:active {
  background-color: #E5E5E5;
}

.delete-cancel-text {
  font-size: 30rpx;
  color: #666666;
  font-weight: 500;
}

.delete-confirm-btn {
  flex: 1;
  background-color: #1A1A2E;
  border-radius: 40rpx;
  padding: 24rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.delete-confirm-btn:active {
  opacity: 0.8;
}

.delete-confirm-text {
  font-size: 30rpx;
  color: #FFFFFF;
  font-weight: 500;
}
</style>
