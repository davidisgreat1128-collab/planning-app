<template>
  <view class="section">
    <text class="section-title">我的规划</text>

    <!-- 规划列表 -->
    <view v-if="plans.length > 0" class="plans-list">
      <view
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card-wrapper"
      >
        <!-- 左滑容器 -->
        <view
          class="plan-card-swipe"
          :class="{ 'swipe-open': swipeOpenId === plan.id }"
          @touchstart="onTouchStart($event, plan.id)"
          @touchmove="onTouchMove($event, plan.id)"
          @touchend="onTouchEnd($event, plan.id)"
        >
          <!-- 规划卡片内容 -->
          <view class="plan-card" :class="{ active: selectedId === plan.id }" @tap="handleSelect(plan.id)">
            <text class="plan-icon">{{ plan.iconEmoji || '🔔' }}</text>
            <view class="plan-content">
              <text class="plan-title">{{ plan.name }}</text>
              <text class="plan-buff">{{ plan.buff }}</text>
              <text class="plan-stats">
                里程碑：{{ getCompletedMilestones(plan) }}/{{ getTotalMilestones(plan) }}
                已进行{{ getProgressDays(plan) }}天
              </text>
            </view>
            <!-- 右侧操作按钮：垂直排列 -->
            <view class="plan-actions-vertical">
              <view class="plan-action-btn" @tap.stop="handleEdit(plan)">
                <text class="action-icon">✏️</text>
              </view>
              <view class="plan-action-btn" @tap.stop="handleDelete(plan)">
                <text class="action-icon">🗑️</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 创建规划卡片 -->
    <view class="create-goal-card" @tap="handleCreate">
      <text class="create-icon">🔭</text>
      <view class="create-text-wrapper">
        <text class="create-title">+ 创建规划</text>
        <text class="create-desc">收获触手可及的成果</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * PlanList - 规划列表组件
 *
 * 职责:
 * - 显示规划列表
 * - 支持左滑操作（编辑/删除）
 * - 支持规划选择
 * - 显示创建规划入口
 */

import { getPlanTotalMilestones, getPlanCompletedMilestones, getPlanProgressDays } from '@/utils/planStats.js';
import { useSwipeGesture } from '@/composables/useSwipeGesture.js';

const props = defineProps({
  /** 规划列表 */
  plans: {
    type: Array,
    default: () => []
  },
  /** 当前选中的ID */
  selectedId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select', 'edit', 'delete', 'create']);

// 使用左滑手势Composable
const { swipeOpenId, onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture();

/**
 * 获取总里程碑数
 */
function getTotalMilestones(plan) {
  return getPlanTotalMilestones(plan);
}

/**
 * 获取已完成里程碑数
 */
function getCompletedMilestones(plan) {
  return getPlanCompletedMilestones(plan);
}

/**
 * 获取已进行天数
 */
function getProgressDays(plan) {
  return getPlanProgressDays(plan);
}

/**
 * 选择规划
 */
function handleSelect(planId) {
  emit('select', planId);
}

/**
 * 编辑规划
 */
function handleEdit(plan) {
  emit('edit', plan);
}

/**
 * 删除规划
 */
function handleDelete(plan) {
  emit('delete', plan);
}

/**
 * 创建规划
 */
function handleCreate() {
  emit('create');
}
</script>

<style scoped>
.section {
  padding: 30rpx 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

/* 规划列表 */
.plans-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.plan-card-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.plan-card-swipe {
  position: relative;
  transition: transform 0.3s ease-out;
  width: 100%;
}

.plan-card-swipe.swipe-open {
  transform: translateX(-160rpx);
}

.plan-card {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s;
  height: auto;
  min-height: auto;
  justify-content: space-between;
}

.plan-card.active {
  background-color: #7CA1FF;
  border-color: #7CA1FF;
}

.plan-icon {
  font-size: 40rpx;
  flex-shrink: 0;
  line-height: 1;
  height: auto;
}

.plan-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
  height: auto;
}

.plan-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.4;
  height: auto;
}

.plan-card.active .plan-title {
  color: #fff;
}

.plan-buff {
  font-size: 24rpx;
  color: #666;
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.5;
  white-space: normal;
  height: auto;
}

.plan-card.active .plan-buff {
  color: rgba(255, 255, 255, 0.9);
}

.plan-stats {
  font-size: 22rpx;
  color: #999;
  word-wrap: break-word;
  height: auto;
}

.plan-card.active .plan-stats {
  color: rgba(255, 255, 255, 0.8);
}

/* 规划卡片右侧操作按钮：垂直排列 */
.plan-actions-vertical {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex-shrink: 0;
}

.plan-action-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 10rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.plan-action-btn:active {
  background-color: #e0e0e0;
  transform: scale(0.95);
}

.action-icon {
  font-size: 36rpx;
}

/* 创建规划卡片 */
.create-goal-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: linear-gradient(135deg, #8B9FEE 0%, #9B7BC2 100%);
  border-radius: 16rpx;
  padding: 30rpx 25rpx;
  cursor: pointer;
  transition: transform 0.2s;
}

.create-goal-card:active {
  transform: scale(0.98);
}

.create-icon {
  font-size: 48rpx;
}

.create-text-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.create-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.create-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}
</style>
