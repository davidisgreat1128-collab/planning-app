<template>
  <view class="day-tabs-container">
    <text class="plan-title">计划模板</text>

    <scroll-view class="day-tabs-scroll" scroll-x enable-flex>
      <view class="day-tabs">
        <view
          v-for="day in days"
          :key="day"
          class="day-tab"
          :class="{ active: currentDay === day }"
          @tap="handleDaySwitch(day)"
        >
          <text class="day-label">Day</text>
          <text class="day-num">{{ day }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * Day标签栏组件
 * 职责：展示和切换Day标签
 */
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  /** Day列表 */
  days: {
    type: Array,
    default: () => []
  },
  /** 当前选中的Day */
  currentDay: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['switch'])

/**
 * 处理Day切换
 * @param {number} day - 目标Day
 */
function handleDaySwitch(day) {
  emit('switch', day)
}
</script>

<style scoped>
.day-tabs-container {
  padding: 30rpx;
}

.plan-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.day-tabs-scroll {
  width: 100%;
  white-space: nowrap;
}

.day-tabs {
  display: inline-flex;
  gap: 16rpx;
}

.day-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 16rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  min-width: 100rpx;
  transition: all 0.3s;
}

.day-tab.active {
  background-color: #4CAF50;
}

.day-label {
  font-size: 20rpx;
  color: #999999;
}

.day-tab.active .day-label {
  color: rgba(255, 255, 255, 0.8);
}

.day-num {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.day-tab.active .day-num {
  color: #ffffff;
}
</style>
