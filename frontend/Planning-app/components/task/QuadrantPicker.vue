<template>
  <!-- 四象限选择器弹窗 -->
  <view v-if="visible" class="qp-mask" @tap.self="handleCancel">
    <view class="qp-sheet">
      <text class="qp-title">选择优先级</text>
      <view class="qp-grid">
        <view
          v-for="q in quadrants"
          :key="q.key"
          class="qp-option"
          :class="['qp-' + q.key, { 'qp-selected': isSelected(q) }]"
          @tap="handleSelect(q)"
        >
          <text class="qp-icon">{{ q.badgeIcon }}</text>
          <text class="qp-name">{{ q.name }}</text>
          <text class="qp-desc">{{ q.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

/**
 * 四象限选择器组件
 *
 * Props:
 * - visible: 是否显示选择器
 * - isUrgent: 当前是否紧急
 * - isImportant: 当前是否重要
 *
 * Emits:
 * - select: 选择象限 payload: { isUrgent, isImportant, key, name, color }
 * - cancel: 取消选择
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  isImportant: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'cancel']);

// ============================================================
// 四象限配置
// ============================================================

/** 四象限选项配置 */
const quadrants = [
  {
    key: 'q1',
    name: '重要且紧急',
    desc: '危机处理',
    badgeIcon: '!!!!',
    isUrgent: true,
    isImportant: true,
    color: '#FF4444'
  },
  {
    key: 'q2',
    name: '重要不紧急',
    desc: '规划成长',
    badgeIcon: '!!',
    isUrgent: false,
    isImportant: true,
    color: '#5B8CFF'
  },
  {
    key: 'q3',
    name: '紧急不重要',
    desc: '可委托他人',
    badgeIcon: '!',
    isUrgent: true,
    isImportant: false,
    color: '#FFB300'
  },
  {
    key: 'q4',
    name: '不急不重要',
    desc: '减少或消除',
    badgeIcon: '○',
    isUrgent: false,
    isImportant: false,
    color: '#4CAF50'
  }
];

// ============================================================
// 计算属性和方法
// ============================================================

/**
 * 判断指定象限是否为当前选中
 */
function isSelected(q) {
  return q.isUrgent === props.isUrgent && q.isImportant === props.isImportant;
}

/**
 * 选择象限
 */
function handleSelect(q) {
  emit('select', {
    isUrgent: q.isUrgent,
    isImportant: q.isImportant,
    key: q.key,
    name: q.name,
    color: q.color
  });
}

/**
 * 取消选择
 */
function handleCancel() {
  emit('cancel');
}
</script>

<style scoped>
/* ============================================================
   弹窗遮罩和容器
   ============================================================ */
.qp-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.qp-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 28rpx 28rpx 0 0;
  padding: 32rpx 24rpx 48rpx;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* ============================================================
   标题
   ============================================================ */
.qp-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A2E;
  text-align: center;
  margin-bottom: 32rpx;
}

/* ============================================================
   象限网格（2x2布局）
   ============================================================ */
.qp-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20rpx;
}

.qp-option {
  flex: 0 0 calc(50% - 10rpx);
  border-radius: 16rpx;
  padding: 24rpx 20rpx;
  border: 3rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s;
}

/* 四象限背景色 */
.qp-q1 {
  background-color: #FFF0F0;
}

.qp-q2 {
  background-color: #F0F4FF;
}

.qp-q3 {
  background-color: #FFFBF0;
}

.qp-q4 {
  background-color: #F0FFF4;
}

/* 选中状态 */
.qp-selected {
  border-color: #333;
}

/* ============================================================
   象限内容
   ============================================================ */
.qp-icon {
  font-size: 28rpx;
  font-weight: bold;
  color: #555;
  margin-bottom: 8rpx;
}

.qp-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #222;
  margin-bottom: 4rpx;
}

.qp-desc {
  font-size: 22rpx;
  color: #999;
}
</style>
