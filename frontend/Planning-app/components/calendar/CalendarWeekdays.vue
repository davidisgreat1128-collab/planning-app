<template>
  <view class="calendar-weekdays">
    <view
      v-for="(label, index) in weekdayLabels"
      :key="index"
      class="weekday-item"
      :class="{ 'is-weekend': index >= 5 }"
    >
      <text class="weekday-text">{{ label }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 星期标题组件
 *
 * 职责：
 * - 显示周一~周日标题栏
 * - 周末高亮显示
 *
 * 架构层级：Component 层
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { WEEKDAY_LABELS } from '@/utils/calendarConstants'

// ============================================================
// 数据
// ============================================================

const weekdayLabels = WEEKDAY_LABELS // ['一', '二', '三', '四', '五', '六', '日']
</script>

<style scoped lang="scss">
.calendar-weekdays {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  height: 80rpx;
  background-color: #F5F5F5;
  border-bottom: 1rpx solid #E5E5EA;
}

.weekday-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weekday-text {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
}

/* 周末颜色 */
.is-weekend .weekday-text {
  color: #FF3B30;
}
</style>
