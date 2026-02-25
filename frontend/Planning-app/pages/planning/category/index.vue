<template>
  <view class="category-page">
    <!-- 自定义状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部用户信息 -->
    <view class="user-info">
      <text class="user-avatar">{{ userAvatar }}</text>
      <view class="user-details">
        <text class="user-nickname">{{ userNickname }}</text>
        <text class="user-stats">已坚持做计划{{ persistDays }}天</text>
      </view>
      <view class="toggle-completed" @tap="toggleShowCompleted">
        <text class="toggle-icon">{{ showCompleted ? '👁️' : '🚫' }}</text>
        <text class="toggle-text">{{ showCompleted ? '显示已完成' : '隐藏已完成' }}</text>
      </view>
    </view>

    <view class="divider"></view>

    <!-- 我的规划 -->
    <view class="section">
      <text class="section-title">我的规划</text>

      <view class="create-goal-card" @tap="showCreateGoal">
        <text class="create-icon">🔭</text>
        <view class="create-text-wrapper">
          <text class="create-title">+ 创建规划</text>
          <text class="create-desc">收获触手可及的成果</text>
        </view>
      </view>

      <!-- 规划列表 -->
      <view class="plan-list" v-if="userPlans.length > 0">
        <view
          v-for="plan in userPlans"
          :key="plan.id"
          class="plan-item"
          :class="{ active: selectedCategory === plan.id }"
          @tap="selectCategory(plan.id)"
        >
          <!-- 左侧内容区域 -->
          <view class="plan-content">
            <view class="plan-header">
              <text class="plan-icon">{{ plan.iconEmoji || '🔔' }}</text>
              <text class="plan-name">{{ plan.name }}</text>
            </view>
            <text v-if="plan.buff" class="plan-buff">{{ plan.buff }}</text>
            <view class="plan-stats">
              <text class="plan-milestone">里程碑：{{ getPlanCompletedMilestones(plan) }}/{{ getPlanTotalMilestones(plan) }}</text>
              <text class="plan-days">已进行{{ getPlanProgressDays(plan) }}天</text>
            </view>
          </view>

          <!-- 右侧操作按钮区域 -->
          <view class="plan-actions">
            <view class="plan-action-btn" @tap.stop="editCategory(plan)">
              <text class="action-icon">✏️</text>
            </view>
            <view class="plan-action-btn" @tap.stop="deleteCategory(plan)">
              <text class="action-icon">🗑️</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 我的分类 -->
    <view class="section">
      <text class="section-title">我的分类</text>

      <view class="category-list">
        <view
          class="category-item"
          :class="{ active: selectedCategory === 'all' }"
          @tap="selectCategory('all')"
        >
          <text class="category-text">全部</text>
          <text v-if="selectedCategory === 'all'" class="category-check">✓</text>
        </view>

        <view
          class="category-item uncategorized"
          :class="{ active: selectedCategory === 'none' }"
          @tap="selectCategory('none')"
        >
          <text class="category-text">无分类</text>
          <text v-if="selectedCategory === 'none'" class="category-check">✓</text>
        </view>

        <!-- 用户创建的普通分类（不包含规划，支持左滑操作） -->
        <view
          v-for="category in normalCategories"
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
              :class="{ active: selectedCategory === category.id }"
              @tap="selectCategory(category.id)"
            >
              <view class="category-name-wrapper">
                <text class="category-icon">{{ category.iconEmoji }}</text>
                <text class="category-text">{{ category.name }}</text>
              </view>
              <text v-if="selectedCategory === category.id" class="category-check">✓</text>
            </view>

            <!-- 背景：操作按钮 -->
            <view class="swipe-actions">
              <view class="swipe-btn edit-btn" @tap.stop="editCategory(category)">
                <text class="swipe-icon">✏️</text>
              </view>
              <view class="swipe-btn delete-btn" @tap.stop="deleteCategory(category)">
                <text class="swipe-icon">🗑️</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-buttons">
      <view class="bottom-btn" @tap="showCategoryDialog = true">
        <text class="btn-text">新建分类</text>
      </view>
      <view class="bottom-btn" @tap="showCreateGoal">
        <text class="btn-text">新建规划</text>
      </view>
      <view class="bottom-btn icon-btn">
        <text class="btn-icon">📷</text>
      </view>
    </view>

    <!-- 新建/编辑分类弹窗 -->
    <CategoryDialog
      :visible="showCategoryDialog"
      :edit-mode="isEditMode"
      :initial-data="editingCategory"
      @update:visible="showCategoryDialog = $event"
      @save="onSaveCategory"
    />

    <!-- 删除分类确认弹窗 -->
    <DeleteCategoryDialog
      :visible="showDeleteDialog"
      :category-name="deletingCategory?.name"
      @update:visible="showDeleteDialog = $event"
      @confirm="onDeleteConfirm"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user.js';
import { useTaskStore } from '@/store/task.js';
import CategoryDialog from '@/components/planning/CategoryDialog.vue';
import DeleteCategoryDialog from '@/components/planning/DeleteCategoryDialog.vue';

// ============================================================
// Store
// ============================================================
const userStore = useUserStore();
const taskStore = useTaskStore();

// ============================================================
// 状态变量
// ============================================================
const statusBarHeight = ref(20);
const showCompleted = ref(true); // 显示/隐藏已完成
const selectedCategory = ref('all'); // 选中的分类
const showCategoryDialog = ref(false); // 新建/编辑分类弹窗
const isEditMode = ref(false); // 是否为编辑模式
const editingCategory = ref(null); // 正在编辑的分类
const showDeleteDialog = ref(false); // 删除分类确认弹窗
const deletingCategory = ref(null); // 正在删除的分类
const userCategories = ref([]); // 用户创建的分类列表

// 左滑相关状态
const swipeOpenId = ref(null); // 当前左滑打开的分类 ID
const touchStartX = ref(0); // 触摸开始的 X 坐标
const touchStartY = ref(0); // 触摸开始的 Y 坐标

// ============================================================
// 计算属性
// ============================================================
const userNickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户');
const userAvatar = computed(() => userStore.userInfo?.avatar || '🐣');

/**
 * 规划列表（type 为 'plan' 的分类）
 */
const userPlans = computed(() => {
  return userCategories.value.filter(cat => cat.type === 'plan');
});

/**
 * 普通分类列表（type 不为 'plan' 或没有 type 字段的分类）
 */
const normalCategories = computed(() => {
  return userCategories.value.filter(cat => cat.type !== 'plan');
});

/**
 * 计算坚持天数
 * 从首次安装日期到今天的天数（包含首日）
 */
const persistDays = computed(() => {
  const firstInstallDate = uni.getStorageSync('first_install_date');
  if (!firstInstallDate) {
    return 1; // 如果没有记录，默认显示1天
  }

  const startDate = new Date(firstInstallDate);
  const today = new Date();

  // 清除时间部分，只比较日期
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // 计算天数差（毫秒 → 天）
  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 包含首日，所以 +1
  return diffDays + 1;
});

// ============================================================
// 规划统计函数
// ============================================================

/**
 * 获取规划的总里程碑数
 */
function getPlanTotalMilestones(plan) {
  return plan.milestones?.length || 0;
}

/**
 * 获取规划已完成的里程碑数
 */
function getPlanCompletedMilestones(plan) {
  if (!plan.milestones || plan.milestones.length === 0) return 0;
  return plan.milestones.filter(m => m.isCompleted).length;
}

/**
 * 获取规划已进行天数
 * 计算方式：当前日期 - 创建日期 + 1
 */
function getPlanProgressDays(plan) {
  if (!plan.createTime) return 1;

  const createDate = new Date(plan.createTime);
  const today = new Date();

  // 清除时间部分，只比较日期
  createDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // 计算天数差
  const diffTime = today - createDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 包含创建当天，所以 +1
  return diffDays + 1;
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  // 获取状态栏高度
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 20;

  // 加载本地保存的分类
  loadCategories();
});

// ============================================================
// 方法
// ============================================================

/**
 * 切换显示/隐藏已完成
 */
function toggleShowCompleted() {
  showCompleted.value = !showCompleted.value;
  uni.showToast({
    title: showCompleted.value ? '显示已完成' : '隐藏已完成',
    icon: 'none',
    duration: 1500
  });
}

/**
 * 选择分类
 */
function selectCategory(categoryId) {
  selectedCategory.value = categoryId;

  // 保存选中的分类到全局状态
  uni.setStorageSync('selected_category_id', categoryId);

  // 返回主页
  uni.navigateBack({
    success: () => {
      console.log('[Category] 已选择分类:', categoryId);
    }
  });
}

/**
 * 显示创建规划页面
 */
function showCreateGoal() {
  console.log('[Category] 跳转到规划模板列表');
  uni.navigateTo({
    url: '/pages/planning/template/index'
  });
}

/**
 * 加载分类列表
 */
function loadCategories() {
  const savedCategories = uni.getStorageSync('user_categories');
  if (savedCategories) {
    try {
      userCategories.value = JSON.parse(savedCategories);
    } catch (e) {
      console.error('加载分类失败:', e);
      userCategories.value = [];
    }
  }
}

/**
 * 保存分类到本地
 */
function saveCategories() {
  uni.setStorageSync('user_categories', JSON.stringify(userCategories.value));
}

/**
 * 保存新建/编辑分类
 */
function onSaveCategory(data) {
  if (isEditMode.value && editingCategory.value) {
    // 编辑模式：更新现有分类
    const index = userCategories.value.findIndex(c => c.id === editingCategory.value.id);
    if (index !== -1) {
      userCategories.value[index] = {
        ...userCategories.value[index],
        name: data.name,
        icon: data.icon,
        iconEmoji: data.iconEmoji,
        updateTime: new Date().toISOString()
      };

      saveCategories();

      uni.showToast({
        title: '分类更新成功',
        icon: 'success'
      });
    }

    // 重置编辑状态
    isEditMode.value = false;
    editingCategory.value = null;
  } else {
    // 新建模式：创建新分类
    const newCategory = {
      id: Date.now().toString(),
      name: data.name,
      icon: data.icon,
      iconEmoji: data.iconEmoji,
      createTime: new Date().toISOString()
    };

    userCategories.value.push(newCategory);
    saveCategories();

    uni.showToast({
      title: '分类创建成功',
      icon: 'success'
    });
  }
}

/**
 * 编辑分类
 */
function editCategory(category) {
  console.log('[Category] 编辑分类:', category.name);

  // 关闭左滑
  swipeOpenId.value = null;

  // 设置编辑模式
  isEditMode.value = true;
  editingCategory.value = category;

  // 打开编辑弹窗
  showCategoryDialog.value = true;
}

/**
 * 删除分类（打开确认弹窗）
 */
function deleteCategory(category) {
  console.log('[Category] 删除分类:', category.name);

  // 关闭左滑
  swipeOpenId.value = null;

  // 设置正在删除的分类
  deletingCategory.value = category;

  // 打开删除确认弹窗
  showDeleteDialog.value = true;
}

/**
 * 确认删除分类
 * @param {boolean} deleteWithTasks - 是否同时删除分类下的任务
 */
async function onDeleteConfirm(deleteWithTasks) {
  if (!deletingCategory.value) return;

  const category = deletingCategory.value;
  console.log('[Category] 确认删除分类:', category.name, '同时删除任务:', deleteWithTasks);

  try {
    if (deleteWithTasks) {
      // 模式2：删除分类及其所有任务
      await deleteCategoryWithTasks(category.id);
    } else {
      // 模式1：仅删除分类，任务移到"无分类"
      await deleteCategoryOnly(category.id);
    }

    // 从本地分类列表中移除
    const index = userCategories.value.findIndex(c => c.id === category.id);
    if (index !== -1) {
      userCategories.value.splice(index, 1);
      saveCategories();
    }

    // 如果删除的是当前选中的分类，切换到"全部"
    if (selectedCategory.value === category.id) {
      selectedCategory.value = 'all';
      uni.setStorageSync('selected_category_id', 'all');
    }

    uni.showToast({
      title: '分类已删除',
      icon: 'success'
    });

    // 刷新任务列表
    const currentDate = taskStore.selectedDate;
    if (currentDate) {
      await taskStore.fetchTasksByDate(currentDate);
    }
  } catch (error) {
    console.error('[Category] 删除分类失败:', error);
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'none'
    });
  } finally {
    deletingCategory.value = null;
  }
}

/**
 * 模式1：仅删除分类，任务移到"无分类"（设置 categoryId 为 null）
 */
async function deleteCategoryOnly(categoryId) {
  const { uncategorizeTasks } = await import('@/api/task.js');
  const result = await uncategorizeTasks(categoryId);
  console.log('[Category] 仅删除分类，任务移到无分类，影响任务数:', result.count);
}

/**
 * 模式2：删除分类及其所有任务
 */
async function deleteCategoryWithTasks(categoryId) {
  const { deleteCategoryTasks } = await import('@/api/task.js');
  const result = await deleteCategoryTasks(categoryId);
  console.log('[Category] 删除分类及其所有任务，删除任务数:', result.count);
}

/**
 * 触摸开始
 */
function onTouchStart(e, categoryId) {
  // 如果已经有其他项打开，先关闭
  if (swipeOpenId.value && swipeOpenId.value !== categoryId) {
    swipeOpenId.value = null;
  }

  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
}

/**
 * 触摸移动
 */
function onTouchMove(e, categoryId) {
  const touchX = e.touches[0].clientX;
  const touchY = e.touches[0].clientY;
  const deltaX = touchX - touchStartX.value;
  const deltaY = touchY - touchStartY.value;

  // 判断是否为水平滑动（避免垂直滚动时误触发）
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    // 阻止默认滚动行为
    e.preventDefault();
    e.stopPropagation();

    // 向左滑动且滑动距离足够
    if (deltaX < -30) {
      swipeOpenId.value = categoryId;
    }
    // 向右滑动，关闭
    else if (deltaX > 30) {
      swipeOpenId.value = null;
    }
  }
}

/**
 * 触摸结束
 */
function onTouchEnd(e, categoryId) {
  // 重置触摸坐标
  touchStartX.value = 0;
  touchStartY.value = 0;
}
</script>

<style scoped>
/* ============================================================
   页面容器
   ============================================================ */
.category-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 140rpx;
}

.status-bar {
  background-color: #fff;
}

/* ============================================================
   用户信息区域
   ============================================================ */
.user-info {
  background-color: #fff;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.user-avatar {
  font-size: 80rpx;
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 50%;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-nickname {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.user-stats {
  font-size: 24rpx;
  color: #999;
}

.toggle-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 10rpx 20rpx;
  cursor: pointer;
}

.toggle-icon {
  font-size: 32rpx;
}

.toggle-text {
  font-size: 20rpx;
  color: #666;
  white-space: nowrap;
}

.divider {
  height: 2rpx;
  background-color: #e0e0e0;
  margin: 0 30rpx;
}

/* ============================================================
   分区
   ============================================================ */
.section {
  margin-top: 30rpx;
  background-color: #fff;
  padding: 30rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 20rpx;
}

/* ============================================================
   创建规划卡片
   ============================================================ */
.create-goal-card {
  background-color: #f0f0f0;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.create-goal-card:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.create-icon {
  font-size: 64rpx;
}

.create-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.create-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.create-desc {
  font-size: 24rpx;
  color: #999;
}

/* ============================================================
   规划列表
   ============================================================ */
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-top: 20rpx;
}

.plan-item {
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  min-height: auto;
  height: auto;
}

.plan-item.active {
  border-color: #5B8CFF;
  background-color: #f0f7ff;
}

.plan-item:active {
  opacity: 0.8;
}

/* 左侧内容区域 */
.plan-content {
  flex: 1;
  min-width: 0; /* 允许内容缩小 */
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  height: auto;
}

.plan-header {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
  height: auto;
}

.plan-icon {
  font-size: 40rpx;
  flex-shrink: 0;
  line-height: 1;
  height: auto;
}

.plan-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.4;
  height: auto;
}

.plan-buff {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  padding-left: 55rpx; /* 与规划名称对齐（图标40rpx + gap15rpx） */
  height: auto;
}

.plan-stats {
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 24rpx;
  color: #666;
  padding-left: 55rpx; /* 与规划名称对齐 */
  height: auto;
}

.plan-milestone {
  color: #666;
}

.plan-days {
  color: #999;
}

/* 右侧操作按钮区域 */
.plan-actions {
  display: flex;
  flex-direction: row;
  gap: 15rpx;
  flex-shrink: 0;
}

.plan-action-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.plan-action-btn:active {
  background-color: #e0e0e0;
  transform: scale(0.95);
}

.action-icon {
  font-size: 32rpx;
}

/* ============================================================
   分类列表
   ============================================================ */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

/* 左滑容器包装 */
.category-item-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12rpx;
}

/* 左滑主容器 */
.category-item-swipe {
  position: relative;
  display: flex;
  align-items: center;
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.category-item-swipe.swipe-open {
  transform: translateX(-160rpx); /* 左滑露出操作按钮 */
}

/* 分类项本身 */
.category-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  border: 2rpx solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100%;
  box-sizing: border-box;
}

.category-item.active {
  background-color: #f0f0f0;
  border-color: #333;
}

.category-item.uncategorized {
  color: #999;
}

.category-text {
  font-size: 28rpx;
  color: #333;
}

.category-item.uncategorized .category-text {
  color: #999;
}

.category-name-wrapper {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.category-icon {
  font-size: 32rpx;
}

.category-check {
  font-size: 24rpx;
  color: #44AA66;
}

/* 左滑操作按钮 */
.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 0;
}

.swipe-btn {
  width: 80rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.swipe-btn:active {
  opacity: 0.8;
}

.edit-btn {
  background-color: transparent;
  border-radius: 0 0 0 12rpx;
}

.delete-btn {
  background-color: transparent;
  border-radius: 0 12rpx 12rpx 0;
}

.swipe-icon {
  font-size: 36rpx;
}

/* ============================================================
   底部按钮
   ============================================================ */
.bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.bottom-btn {
  flex: 1;
  height: 80rpx;
  background-color: #333;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.bottom-btn:active {
  opacity: 0.8;
  transform: scale(0.96);
}

.bottom-btn.icon-btn {
  flex: 0 0 80rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  border: 2rpx solid #ddd;
}

.btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.btn-icon {
  font-size: 40rpx;
}
</style>
