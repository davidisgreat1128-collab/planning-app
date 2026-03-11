<template>
  <view>
    <!-- 底部占位 -->
    <view class="bottom-spacer"></view>

    <!-- 底部按钮 -->
    <view class="bottom-buttons">
      <view class="bottom-btn" @tap="handleCreateCategory">
        <text class="btn-text">新建分类</text>
      </view>
      <view class="bottom-btn" @tap="handleCreatePlan">
        <text class="btn-text">新建规划</text>
      </view>
      <view class="bottom-btn icon-btn">
        <text class="btn-icon">📷</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * DrawerFooter - 抽屉底部组件
 *
 * 职责:
 * - 显示底部占位（用于滚动区域的缓冲）
 * - 显示底部操作按钮（新建分类、新建规划、拍照）
 */

const emit = defineEmits(['create-category', 'create-plan']);

/**
 * 新建分类
 */
function handleCreateCategory() {
  emit('create-category');
}

/**
 * 新建规划
 */
function handleCreatePlan() {
  emit('create-plan');
}
</script>

<style scoped>
.bottom-spacer {
  height: 40rpx;
}

/* 底部按钮 */
.bottom-buttons {
  display: flex;
  gap: 15rpx;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #e0e0e0;
  box-sizing: border-box;
}

.bottom-btn {
  flex: 1;
  height: 80rpx;
  background-color: #7CA1FF;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.bottom-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.bottom-btn.icon-btn {
  flex: none;
  width: 80rpx;
  background-color: #f9f9f9;
}

.btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.btn-icon {
  font-size: 36rpx;
}
</style>
