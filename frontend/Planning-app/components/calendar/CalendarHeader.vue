<template>
  <view class="calendar-header">
    <!-- 左侧：标题 -->
    <view class="header-left">
      <text class="header-title">{{ title }}</text>
    </view>

    <!-- 右侧：操作按钮 -->
    <view class="header-right">
      <!-- 今天按钮 -->
      <view class="header-btn" @tap="handleToday">
        <text class="btn-text">今天</text>
      </view>

      <!-- 周/月切换按钮 -->
      <view class="header-btn" @tap="handleToggleView">
        <text class="btn-text">{{ viewModeText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 日历头部组件
 *
 * 职责：
 * - 显示当前月份/周标题
 * - 提供"今天"按钮
 * - 提供"周/月"切换按钮
 *
 * 架构层级：Component 层
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { computed } from 'vue'
import { VIEW_MODE } from '@/utils/calendarConstants'

// ============================================================
// Props
// ============================================================

const props = defineProps({
  /**
   * 标题文本（如"2026年3月"）
   */
  title: {
    type: String,
    required: true
  },

  /**
   * 视图模式（'week' | 'month'）
   */
  viewMode: {
    type: String,
    required: true,
    validator: (value) => ['week', 'month'].includes(value)
  }
})

// ============================================================
// Emits
// ============================================================

const emit = defineEmits(['today', 'toggle-view'])

// ============================================================
// 计算属性
// ============================================================

/**
 * 视图模式按钮文本
 */
const viewModeText = computed(() => {
  return props.viewMode === VIEW_MODE.WEEK ? '月' : '周'
})

// ============================================================
// 事件处理
// ============================================================

/**
 * 处理"今天"按钮点击
 */
function handleToday() {
  emit('today')
}

/**
 * 处理"周/月"切换按钮点击
 */
function handleToggleView() {
  emit('toggle-view')
}
</script>

<style scoped lang="scss">
.calendar-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #E5E5EA;
}

/* 左侧 */
.header-left {
  flex: 1;
}

.header-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
}

/* 右侧 */
.header-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.header-btn {
  padding: 12rpx 24rpx;
  background-color: #F5F5F5;
  border-radius: 8rpx;
}

.header-btn:active {
  opacity: 0.7;
}

.btn-text {
  font-size: 28rpx;
  color: #007AFF;
  font-weight: 500;
}
</style>
