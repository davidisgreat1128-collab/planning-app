<template>
  <!-- 样式1：底部弹窗样式（用于 task-edit.vue） -->
  <view v-if="visible && variant === 'sheet'" class="qp-modal-mask" @tap.self="handleClose">
    <view class="qp-sheet">
      <text class="qp-sheet-title">选择优先级</text>
      <view class="qp-grid">
        <view
          v-for="q in quadrants"
          :key="q.key"
          class="qp-option"
          :class="['qp-option-' + q.key, { 'qp-option-selected': currentQuadrant === q.key }]"
          @tap="handleSelect(q)"
        >
          <text class="qp-badge-icon">{{ q.badgeIcon }}</text>
          <text class="qp-name">{{ q.name }}</text>
          <text class="qp-desc">{{ q.desc }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 样式2：平铺网格样式（用于 AddTaskPanel.vue） -->
  <view v-if="visible && variant === 'grid'" class="qp-picker">
    <view class="qp-picker-inner">
      <!-- 坐标轴 -->
      <view class="qp-axis-h"></view>
      <view class="qp-axis-v"></view>
      <!-- 四个象限 -->
      <view
        v-for="q in quadrants"
        :key="q.key"
        class="qp-cell"
        :class="[q.posClass, { 'qp-cell-selected': isQuadrantSelected(q) }]"
        @tap="handleSelect(q)"
      >
        <text class="qp-cell-label">{{ q.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

// ============================================================
// Props
// ============================================================
const props = defineProps({
  /** 是否显示选择器 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 当前选中的象限（'q1', 'q2', 'q3', 'q4'） */
  modelValue: {
    type: String,
    default: 'q4'
  },
  /** 变体样式：'sheet' = 底部弹窗，'grid' = 平铺网格 */
  variant: {
    type: String,
    default: 'sheet',
    validator: (value) => ['sheet', 'grid'].includes(value)
  }
});

// ============================================================
// Emits
// ============================================================
const emit = defineEmits(['update:visible', 'update:modelValue', 'select']);

// ============================================================
// 数据
// ============================================================

/**
 * 四象限选项
 *
 * 布局顺序（2026-03-14更新）：
 * Q1(重要且紧急)  Q3(紧急不重要)
 * Q2(重要不紧急)  Q4(不急不重要)
 */
const quadrants = [
  {
    key: 'q1',
    name: '重要且紧急',
    desc: '危机处理',
    icon: '🔴',
    badgeIcon: '!!!!',
    posClass: 'qp-top-left',
    isUrgent: true,
    isImportant: true,
    color: '#FF4444'
  },
  {
    key: 'q3',
    name: '紧急不重要',
    desc: '可委托他人',
    icon: '🟡',
    badgeIcon: '!',
    posClass: 'qp-top-right',  // ✅ 从 qp-bot-left 改为 qp-top-right
    isUrgent: true,
    isImportant: false,
    color: '#FFA726'
  },
  {
    key: 'q2',
    name: '重要不紧急',
    desc: '规划成长',
    icon: '🔵',
    badgeIcon: '!!',
    posClass: 'qp-bot-left',  // ✅ 从 qp-top-right 改为 qp-bot-left
    isUrgent: false,
    isImportant: true,
    color: '#5B8CFF'
  },
  {
    key: 'q4',
    name: '不急不重要',
    desc: '减少或消除',
    icon: '🟢',
    badgeIcon: '○',
    posClass: 'qp-bot-right',
    isUrgent: false,
    isImportant: false,
    color: '#4CAF50'
  }
];

// ============================================================
// 计算属性
// ============================================================

/** 当前选中的象限 key */
const currentQuadrant = computed(() => props.modelValue);

/** 判断指定象限是否被选中（grid 样式用） */
function isQuadrantSelected(q) {
  return currentQuadrant.value === q.key;
}

// ============================================================
// 方法
// ============================================================

/** 处理选择象限 */
function handleSelect(q) {
  emit('update:modelValue', q.key);
  emit('select', q);
  // 选择后自动关闭（仅 sheet 样式）
  if (props.variant === 'sheet') {
    handleClose();
  }
}

/** 处理关闭 */
function handleClose() {
  emit('update:visible', false);
}
</script>

<style scoped>
/* ============================================================
   样式1：底部弹窗样式（sheet）
   ============================================================ */

.qp-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.qp-sheet {
  width: 100%;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 48rpx 32rpx 64rpx;
  box-sizing: border-box;
}

.qp-sheet-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 32rpx;
  text-align: center;
}

.qp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.qp-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #E0E0E0;
  background: #FAFAFA;
  transition: all 0.2s ease;
}

.qp-option-selected {
  border-color: #5B8CFF;
  background: #EEF4FF;
}

.qp-option-q1.qp-option-selected {
  border-color: #FF4444;
  background: #FFEBEE;
}

.qp-option-q2.qp-option-selected {
  border-color: #5B8CFF;
  background: #EEF4FF;
}

.qp-option-q3.qp-option-selected {
  border-color: #FFA726;
  background: #FFF3E0;
}

.qp-option-q4.qp-option-selected {
  border-color: #4CAF50;
  background: #E8F5E9;
}

.qp-badge-icon {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  color: #666;
}

.qp-option-q1 .qp-badge-icon {
  color: #FF4444;
}

.qp-option-q2 .qp-badge-icon {
  color: #5B8CFF;
}

.qp-option-q3 .qp-badge-icon {
  color: #FFA726;
}

.qp-option-q4 .qp-badge-icon {
  color: #4CAF50;
}

.qp-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 8rpx;
}

.qp-desc {
  font-size: 24rpx;
  color: #999;
}

/* ============================================================
   样式2：平铺网格样式（grid）
   ============================================================ */

.qp-picker {
  width: 100%;
  padding: 24rpx 0;
}

.qp-picker-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0;
}

/* 坐标轴 */
.qp-axis-h {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2rpx;
  background: #CCCCCC;
  z-index: 1;
  pointer-events: none;
}

.qp-axis-v {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2rpx;
  background: #CCCCCC;
  z-index: 1;
  pointer-events: none;
}

/* 象限单元格 */
.qp-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F6FA;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.qp-cell-selected {
  background: #EEF4FF;
  border-color: #5B8CFF;
  z-index: 2;
}

/* 位置样式 */
.qp-top-left {
  grid-column: 1;
  grid-row: 1;
  border-bottom-right-radius: 24rpx;
}

.qp-top-right {
  grid-column: 2;
  grid-row: 1;
  border-bottom-left-radius: 24rpx;
}

.qp-bot-left {
  grid-column: 1;
  grid-row: 2;
  border-top-right-radius: 24rpx;
}

.qp-bot-right {
  grid-column: 2;
  grid-row: 2;
  border-top-left-radius: 24rpx;
}

.qp-cell-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  text-align: center;
}

/* Q1 重要且紧急 - 红色 */
.qp-top-left.qp-cell-selected {
  background: #FFEBEE;
  border-color: #FF4444;
}

.qp-top-left .qp-cell-label {
  color: #FF4444;
}

/* Q2 重要不紧急 - 蓝色 */
.qp-top-right.qp-cell-selected {
  background: #EEF4FF;
  border-color: #5B8CFF;
}

.qp-top-right .qp-cell-label {
  color: #5B8CFF;
}

/* Q3 紧急不重要 - 橙色 */
.qp-bot-left.qp-cell-selected {
  background: #FFF3E0;
  border-color: #FFA726;
}

.qp-bot-left .qp-cell-label {
  color: #FFA726;
}

/* Q4 不急不重要 - 绿色 */
.qp-bot-right.qp-cell-selected {
  background: #E8F5E9;
  border-color: #4CAF50;
}

.qp-bot-right .qp-cell-label {
  color: #4CAF50;
}
</style>
