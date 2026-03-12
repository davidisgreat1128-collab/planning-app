<template>
  <view class="task-list">
    <view
      v-for="(task, index) in tasks"
      :key="index"
      class="task-item"
      :class="[`priority-${task.priority || 'medium'}`]"
    >
      <view class="task-content">
        <text class="task-title">{{ task.title }}</text>
        <text v-if="task.isRepeat" class="task-repeat">重复事件</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 任务列表组件
 * 职责：展示任务列表
 */
import { defineProps } from 'vue'

const props = defineProps({
  /** 任务列表 */
  tasks: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.task-list {
  margin-top: 20rpx;
}

.task-item {
  padding: 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  border-left: 6rpx solid #4CAF50;
}

.task-item.priority-high {
  border-left-color: #FF5252;
}

.task-item.priority-medium {
  border-left-color: #FFC107;
}

.task-item.priority-low {
  border-left-color: #4CAF50;
}

.task-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-title {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

.task-repeat {
  font-size: 20rpx;
  color: #999999;
  padding: 4rpx 12rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
}
</style>
