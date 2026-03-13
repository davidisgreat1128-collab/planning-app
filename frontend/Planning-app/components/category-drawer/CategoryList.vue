<template>
  <view class="section">
    <text class="section-title">我的分类</text>

    <view class="category-list">
      <!-- 全部 -->
      <view
        class="category-item"
        :class="{ active: selectedId === 'all' }"
        @tap="handleSelect('all')"
      >
        <text class="category-text">全部</text>
        <!-- ⭐ 删除勾选图标，添加删除图标 -->
        <view class="delete-icon-btn" @tap.stop="handleClearAll">
          <text class="delete-icon">🗑️</text>
        </view>
      </view>

      <!-- 无分类 -->
      <view
        class="category-item uncategorized"
        :class="{ active: selectedId === 'none' }"
        @tap="handleSelect('none')"
      >
        <text class="category-text">无分类</text>
        <!-- ⭐ 删除勾选图标，添加删除图标 -->
        <view class="delete-icon-btn" @tap.stop="handleClearUncategorized">
          <text class="delete-icon">🗑️</text>
        </view>
      </view>

      <!-- 用户创建的普通分类（支持左滑操作） -->
      <view
        v-for="category in categories"
        :key="category.id"
        class="category-item-wrapper"
      >
        <!-- 左滑容器 -->
        <view
          class="category-item-swipe"
          :class="{ 'swipe-open': swipeOpenId === category.id }"
          @touchstart="onTouchStart($event, category.id)"
          @touchmove="onTouchMove($event, category.id)"
          @touchend="onTouchEnd($event, category.id)"
        >
          <!-- 前景：分类内容 -->
          <view
            class="category-item"
            :class="{ active: selectedId === category.id }"
            @tap="handleSelect(category.id)"
          >
            <view class="category-name-wrapper">
              <text class="category-icon">{{ category.iconEmoji }}</text>
              <text class="category-text">{{ category.name }}</text>
            </view>
            <text v-if="selectedId === category.id" class="category-check">✓</text>
          </view>

          <!-- 背景：操作按钮 -->
          <view class="swipe-actions">
            <view class="swipe-btn edit-btn" @tap.stop="handleEdit(category)">
              <text class="swipe-icon">✏️</text>
            </view>
            <view class="swipe-btn delete-btn" @tap.stop="handleDelete(category)">
              <text class="swipe-icon">🗑️</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * CategoryList - 分类列表组件
 *
 * 职责:
 * - 显示"全部"和"无分类"选项
 * - 显示用户创建的分类列表
 * - 支持左滑操作（编辑/删除）
 * - 支持分类选择
 */

import { useSwipeGesture } from '@/composables/useSwipeGesture.js';

const props = defineProps({
  /** 分类列表（普通分类，不包含规划） */
  categories: {
    type: Array,
    default: () => []
  },
  /** 当前选中的ID（可以是'all'、'none'或分类ID） */
  selectedId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select', 'edit', 'delete', 'clearAll', 'clearUncategorized']);

// 使用左滑手势Composable
const { swipeOpenId, onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture();

/**
 * 选择分类
 */
function handleSelect(categoryId) {
  emit('select', categoryId);
}

/**
 * 编辑分类
 */
function handleEdit(category) {
  emit('edit', category);
}

/**
 * 删除分类
 */
function handleDelete(category) {
  emit('delete', category);
}

/**
 * 清空所有规划和分类
 */
function handleClearAll() {
  emit('clearAll');
}

/**
 * 清空所有无分类的任务
 */
function handleClearUncategorized() {
  emit('clearUncategorized');
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

/* 分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.category-item-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.category-item-swipe {
  position: relative;
  transition: transform 0.3s ease-out;
  width: 100%;
}

.category-item-swipe.swipe-open {
  transform: translateX(-160rpx);
}

.category-item {
  background-color: #fafafa;
  border-radius: 12rpx;
  padding: 20rpx 25rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.category-item.active {
  background-color: #7CA1FF;
}

.category-item.uncategorized {
  background-color: #fff;
  border: 2rpx dashed #ccc;
}

.category-item.uncategorized.active {
  background-color: #7CA1FF;
  border-color: #7CA1FF;
}

.category-name-wrapper {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.category-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}

.category-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-item.active .category-text {
  color: #fff;
}

.category-check {
  font-size: 32rpx;
  color: #fff;
  flex-shrink: 0;
}

/* 删除图标按钮（全部/无分类） */
.delete-icon-btn {
  padding: 0 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.delete-icon {
  font-size: 36rpx;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-icon-btn:active .delete-icon {
  opacity: 1;
}

/* 左滑操作按钮 */
.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  gap: 10rpx;
}

.swipe-btn {
  width: 75rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: transparent;
}

.edit-btn {
  border-radius: 12rpx 0 0 12rpx;
}

.delete-btn {
  border-radius: 0 12rpx 12rpx 0;
}

.swipe-icon {
  font-size: 36rpx;
}
</style>
