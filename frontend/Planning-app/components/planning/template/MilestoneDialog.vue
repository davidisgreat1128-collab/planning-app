<template>
  <view v-if="visible" class="milestone-modal" @tap="handleClose">
    <view class="milestone-modal-content" @tap.stop>
      <text class="milestone-modal-title">{{ milestoneIndex + 1 }}.{{ milestone.title }}</text>
      <text class="milestone-modal-desc">{{ milestone.description }}</text>
      <text class="milestone-modal-days">{{ milestone.days }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 里程碑详情弹窗组件
 * 职责：展示里程碑详情（弹窗形式）
 */
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 里程碑对象 */
  milestone: {
    type: Object,
    default: () => ({
      title: '',
      description: '',
      days: ''
    })
  },
  /** 里程碑索引 */
  milestoneIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close'])

/**
 * 处理关闭弹窗
 */
function handleClose() {
  emit('close')
}
</script>

<style scoped>
.milestone-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.milestone-modal-content {
  width: 600rpx;
  padding: 40rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.milestone-modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.milestone-modal-desc {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.milestone-modal-days {
  font-size: 24rpx;
  color: #4CAF50;
  padding: 12rpx 24rpx;
  background-color: #E8F5E9;
  border-radius: 12rpx;
  align-self: flex-start;
}
</style>
