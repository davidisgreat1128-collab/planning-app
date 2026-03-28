<template>
  <view class="demo-page">
    <!-- 无限日历组件 -->
    <infinite-calendar
      :initial-date="initialDate"
      :enable-task-integration="true"
      @select="handleSelectDate"
      @view-change="handleViewChange"
    />

    <!-- 底部信息面板（演示用） -->
    <view class="info-panel">
      <text class="info-text">当前选中: {{ selectedDateText }}</text>
      <text class="info-text">任务数量: {{ taskCount }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 无限日历使用示例页面
 *
 * 职责：
 * - 演示 InfiniteCalendar 组件的使用
 * - 展示任务集成功能
 * - 提供开发调试参考
 *
 * 架构层级：Page 层
 * 调用链：Page → Component → Composable → Store → Repository
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { ref, computed } from 'vue'
import InfiniteCalendar from '@/components/calendar/InfiniteCalendar.vue'
import { formatDate } from '@/utils/dateCalculator'

// ============================================================
// 数据
// ============================================================

/**
 * 初始日期（默认今天）
 */
const initialDate = ref(new Date())

/**
 * 当前选中日期
 */
const selectedDate = ref(new Date())

/**
 * 当前视图模式
 */
const viewMode = ref('month')

// ============================================================
// 计算属性
// ============================================================

/**
 * 选中日期文本
 */
const selectedDateText = computed(() => {
  return formatDate(selectedDate.value)
})

/**
 * 任务数量（演示数据，实际应从 Store 获取）
 */
const taskCount = computed(() => {
  // 这里可以从 taskStore 获取真实数据
  // const taskStore = useTaskStore()
  // return taskStore.getTasksForDate(selectedDate.value).length
  return 0 // 演示数据
})

// ============================================================
// 事件处理
// ============================================================

/**
 * 处理日期选择
 *
 * @param {Date} date - 选中的日期
 */
function handleSelectDate(date) {
  selectedDate.value = date
  console.log('[Demo] 选中日期:', formatDate(date))

  // 这里可以添加业务逻辑，如：
  // 1. 加载该日期的任务列表
  // 2. 显示任务详情弹窗
  // 3. 更新其他组件状态
}

/**
 * 处理视图模式变化
 *
 * @param {string} mode - 新的视图模式
 */
function handleViewChange(mode) {
  viewMode.value = mode
  console.log('[Demo] 视图模式:', mode)
}

// ============================================================
// 生命周期
// ============================================================

/**
 * 页面加载
 */
onLoad(() => {
  console.log('[Demo] 无限日历示例页面加载')
})
</script>

<style scoped lang="scss">
.demo-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #F5F5F5;
}

/* 信息面板 */
.info-panel {
  padding: 32rpx;
  background-color: #FFFFFF;
  border-top: 1rpx solid #E5E5EA;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info-text {
  font-size: 28rpx;
  color: #666666;
}
</style>
