<template>
  <!-- 分类/规划选择器弹窗 -->
  <view v-if="visible" class="cp-mask" @tap="handleCancel">
    <view class="cp-sheet" @tap.stop>
      <!-- 顶部操作按钮 -->
      <view class="cp-header">
        <view class="cp-create-action" @tap="handleCreateCategory">
          <text class="cp-create-plus">+</text>
          <text class="cp-create-label">新建分类</text>
        </view>
        <view class="cp-create-action" @tap="handleCreatePlan">
          <text class="cp-create-plus">+</text>
          <text class="cp-create-label">新建目标</text>
        </view>
      </view>

      <!-- 统一列表：无分类 + 分类（包含规划） -->
      <scroll-view class="cp-scroll" scroll-y>
        <!-- 无分类选项 -->
        <view
          class="cp-item"
          :class="{ 'cp-item-selected': selectedId === null }"
          @tap="handleSelect(null)"
        >
          <view class="cp-icon-wrapper">
            <text class="cp-icon">无</text>
          </view>
          <text class="cp-item-name">无分类</text>
          <text v-if="selectedId === null" class="cp-check">✓</text>
        </view>

        <!-- 分类列表（包含普通分类和规划） -->
        <view
          v-for="category in categories"
          :key="category.id"
          class="cp-item"
          :class="{ 'cp-item-selected': selectedId === category.id }"
          @tap="handleSelect(category.id)"
        >
          <view class="cp-icon-wrapper">
            <text class="cp-icon">{{ category.iconEmoji || category.name.charAt(0) }}</text>
          </view>
          <view v-if="category.type === 'plan'" class="cp-item-content">
            <text class="cp-item-name">{{ category.name }}</text>
            <text class="cp-item-tag">规划</text>
          </view>
          <text v-else class="cp-item-name">{{ category.name }}</text>
          <text v-if="selectedId === category.id" class="cp-check">✓</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
/**
 * 分类/规划选择器组件
 *
 * Props:
 * - visible: 是否显示选择器
 * - categories: 分类列表（包含普通分类和规划）
 * - selectedId: 当前选中的分类ID
 *
 * Emits:
 * - select: 选择分类 payload: { categoryId } (null表示无分类)
 * - create-category: 点击"新建分类"
 * - create-plan: 点击"新建目标"
 * - cancel: 取消选择
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['select', 'create-category', 'create-plan', 'cancel']);

// ============================================================
// 事件处理
// ============================================================

/**
 * 选择分类
 */
function handleSelect(categoryId) {
  emit('select', { categoryId });
}

/**
 * 新建分类
 */
function handleCreateCategory() {
  emit('create-category');
}

/**
 * 新建目标（规划）
 */
function handleCreatePlan() {
  emit('create-plan');
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
.cp-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.cp-sheet {
  width: 100%;
  max-height: 85vh;
  background-color: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
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
   顶部操作按钮区域
   ============================================================ */
.cp-header {
  display: flex;
  padding: 30rpx 40rpx 20rpx;
  gap: 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
  flex-shrink: 0;
}

.cp-create-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cp-create-action:active {
  opacity: 0.6;
}

.cp-create-plus {
  font-size: 32rpx;
  color: #5B8CFF;
  font-weight: 300;
  line-height: 1;
}

.cp-create-label {
  font-size: 28rpx;
  color: #5B8CFF;
  font-weight: 500;
}

/* ============================================================
   滚动区域
   ============================================================ */
.cp-scroll {
  flex: 1;
  padding: 10rpx 0;
  overflow-y: auto;
  min-height: 200rpx;
  max-height: calc(85vh - 120rpx);
}

/* ============================================================
   列表项
   ============================================================ */
.cp-item {
  display: flex;
  align-items: center;
  padding: 24rpx 40rpx;
  transition: background-color 0.2s;
  cursor: pointer;
}

.cp-item:active {
  background-color: #F8F8F8;
}

.cp-item-selected {
  background-color: transparent;
}

/* ============================================================
   图标容器
   ============================================================ */
.cp-icon-wrapper {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background-color: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.cp-icon {
  font-size: 32rpx;
  color: #333;
  line-height: 1;
}

/* ============================================================
   列表项内容
   ============================================================ */
.cp-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.cp-item-name {
  font-size: 30rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 目标标签 */
.cp-item-tag {
  font-size: 24rpx;
  color: #999;
  background-color: #F5F5F5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

/* 勾选标记 */
.cp-check {
  font-size: 36rpx;
  color: #5B8CFF;
  flex-shrink: 0;
  margin-left: 10rpx;
  font-weight: 600;
}
</style>
