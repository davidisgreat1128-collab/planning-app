<template>
  <view v-if="visible" class="drawer-overlay" @tap="handleOverlayClick">
    <view class="drawer-container" @tap.stop :class="{ 'drawer-open': visible }">
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

      <!-- 滚动内容区 -->
      <scroll-view class="scroll-content" scroll-y>
        <!-- 我的规划 -->
        <view class="section">
          <text class="section-title">我的规划</text>

          <view class="create-goal-card" @tap="handleCreateGoal">
            <text class="create-icon">🔭</text>
            <view class="create-text-wrapper">
              <text class="create-title">+ 创建规划</text>
              <text class="create-desc">收获触手可及的成果</text>
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

            <!-- 用户创建的分类（支持左滑操作） -->
            <view
              v-for="category in userCategories"
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

        <!-- 底部占位 -->
        <view class="bottom-spacer"></view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="bottom-buttons">
        <view class="bottom-btn" @tap="showCategoryDialog = true">
          <text class="btn-text">新建分类</text>
        </view>
        <view class="bottom-btn" @tap="handleCreateGoal">
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
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/store/user.js';
import CategoryDialog from '@/components/planning/CategoryDialog.vue';
import DeleteCategoryDialog from '@/components/planning/DeleteCategoryDialog.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'create-goal']);

// ============================================================
// Store
// ============================================================
const userStore = useUserStore();

// ============================================================
// 状态变量
// ============================================================
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
 * 计算坚持天数
 */
const persistDays = computed(() => {
  const firstInstallDate = uni.getStorageSync('first_install_date');
  if (!firstInstallDate) {
    return 1;
  }

  const startDate = new Date(firstInstallDate);
  const today = new Date();

  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1;
});

// ============================================================
// 监听弹窗显示状态
// ============================================================
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadCategories();
    // 加载上次选中的分类
    const savedCategory = uni.getStorageSync('selected_category_id');
    if (savedCategory) {
      selectedCategory.value = savedCategory;
    }
  } else {
    // 关闭所有左滑
    swipeOpenId.value = null;
  }
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

  // 关闭抽屉
  emit('update:visible', false);

  uni.showToast({
    title: '已选择分类',
    icon: 'success',
    duration: 1500
  });
}

/**
 * 处理创建规划
 */
function handleCreateGoal() {
  console.log('[CategoryDrawer] 跳转到规划模板列表');

  // 关闭抽屉
  emit('update:visible', false);

  // 跳转到规划模板页面
  uni.navigateTo({
    url: '/pages/planning/template/index'
  });
}

/**
 * 点击遮罩层关闭
 */
function handleOverlayClick() {
  emit('update:visible', false);
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
  console.log('[CategoryDrawer] 编辑分类:', category.name);

  swipeOpenId.value = null;
  isEditMode.value = true;
  editingCategory.value = category;
  showCategoryDialog.value = true;
}

/**
 * 删除分类（打开确认弹窗）
 */
function deleteCategory(category) {
  console.log('[CategoryDrawer] 删除分类:', category.name);

  swipeOpenId.value = null;
  deletingCategory.value = category;
  showDeleteDialog.value = true;
}

/**
 * 确认删除分类
 */
function onDeleteConfirm(deleteMode) {
  if (!deletingCategory.value) return;

  const categoryId = deletingCategory.value.id;

  // 从列表中删除分类
  const index = userCategories.value.findIndex(c => c.id === categoryId);
  if (index !== -1) {
    userCategories.value.splice(index, 1);
    saveCategories();
  }

  // TODO: 根据 deleteMode 处理关联任务
  // 'category_only' - 仅删除分类，任务归为"无分类"
  // 'with_tasks' - 同时删除分类和相关任务

  uni.showToast({
    title: deleteMode === 'with_tasks' ? '分类和任务已删除' : '分类已删除',
    icon: 'success'
  });

  deletingCategory.value = null;
}

// ============================================================
// 左滑手势
// ============================================================

/**
 * 触摸开始
 */
function onTouchStart(event, categoryId) {
  touchStartX.value = event.touches[0].pageX;
  touchStartY.value = event.touches[0].pageY;
}

/**
 * 触摸移动
 */
function onTouchMove(event, categoryId) {
  const touchX = event.touches[0].pageX;
  const touchY = event.touches[0].pageY;
  const deltaX = touchX - touchStartX.value;
  const deltaY = touchY - touchStartY.value;

  // 判断是否是横向滑动
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    // 阻止默认滚动行为
    event.preventDefault?.();
  }
}

/**
 * 触摸结束
 */
function onTouchEnd(event, categoryId) {
  const touchX = event.changedTouches[0].pageX;
  const deltaX = touchX - touchStartX.value;

  // 左滑阈值：滑动距离超过 50px
  if (deltaX < -50) {
    // 左滑，打开操作按钮
    swipeOpenId.value = categoryId;
  } else if (deltaX > 50) {
    // 右滑，关闭操作按钮
    swipeOpenId.value = null;
  } else if (swipeOpenId.value === categoryId && Math.abs(deltaX) < 10) {
    // 点击已打开的项，关闭
    swipeOpenId.value = null;
  }
}
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.drawer-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: -80%;
  width: 80%;
  max-width: 600rpx;
  background-color: #fff;
  transition: left 0.3s ease-out;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.drawer-container.drawer-open {
  left: 0;
}

/* ============================================================
   用户信息
   ============================================================ */
.user-info {
  display: flex;
  align-items: center;
  padding: 30rpx 20rpx;
  gap: 15rpx;
  background-color: #fff;
  box-sizing: border-box;
}

.user-avatar {
  font-size: 60rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5rpx;
  min-width: 0;
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
  align-items: center;
  gap: 5rpx;
  padding: 10rpx 15rpx;
  background-color: #f9f9f9;
  border-radius: 30rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle-icon {
  font-size: 24rpx;
}

.toggle-text {
  font-size: 22rpx;
  color: #666;
  white-space: nowrap;
}

.divider {
  height: 1rpx;
  background-color: #e0e0e0;
}

/* ============================================================
   滚动内容区
   ============================================================ */
.scroll-content {
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
}

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

.category-name-wrapper {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.category-icon {
  font-size: 32rpx;
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

.bottom-spacer {
  height: 40rpx;
}

/* ============================================================
   底部按钮
   ============================================================ */
.bottom-buttons {
  display: flex;
  gap: 15rpx;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #e0e0e0;
  box-sizing: border-box;
}

.bottom-btn {
  flex: 1;
  height: 80rpx;
  background-color: #7CA1FF;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.bottom-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.bottom-btn.icon-btn {
  flex: none;
  width: 80rpx;
  background-color: #f9f9f9;
}

.btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.btn-icon {
  font-size: 36rpx;
}
</style>
