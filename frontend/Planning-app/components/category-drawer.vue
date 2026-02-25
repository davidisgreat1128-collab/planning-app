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

          <!-- 规划列表 -->
          <view v-if="activePlans.length > 0" class="plans-list">
            <view
              v-for="plan in activePlans"
              :key="plan.id"
              class="plan-card-wrapper"
            >
              <!-- 左滑容器 -->
              <view
                class="plan-card-swipe"
                :class="{ 'swipe-open': swipeOpenPlanId === plan.id }"
                @touchstart="onPlanTouchStart($event, plan.id)"
                @touchmove="onPlanTouchMove($event, plan.id)"
                @touchend="onPlanTouchEnd($event, plan.id)"
              >
                <!-- 前景：规划卡片内容 -->
                <view class="plan-card" :class="{ active: selectedCategory === plan.id }" @tap="togglePlanSelection(plan.id)">
                  <text class="plan-icon">{{ plan.iconEmoji || '🔔' }}</text>
                  <view class="plan-content">
                    <text class="plan-title">{{ plan.name }}</text>
                    <text class="plan-buff">{{ plan.buff }}</text>
                    <text class="plan-stats">
                      里程碑：{{ getPlanCompletedMilestones(plan) }}/{{ getPlanTotalMilestones(plan) }}
                      已进行{{ getPlanProgressDays(plan) }}天
                    </text>
                  </view>
                  <text v-if="selectedCategory === plan.id" class="plan-check">✓</text>
                </view>

                <!-- 背景：操作按钮 -->
                <view class="swipe-actions plan-swipe-actions">
                  <view class="swipe-btn edit-btn" @tap.stop="editPlan(plan)">
                    <text class="swipe-icon">✏️</text>
                  </view>
                  <view class="swipe-btn delete-btn" @tap.stop="deletePlan(plan)">
                    <text class="swipe-icon">🗑️</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 创建规划卡片 -->
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

      <!-- 删除规划确认弹窗 -->
      <DeletePlanDialog
        :visible="showDeletePlanDialog"
        :plan-title="deletingPlan?.title"
        @update:visible="showDeletePlanDialog = $event"
        @confirm="onDeletePlanConfirm"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUserStore } from '@/store/user.js';
import CategoryDialog from '@/components/planning/CategoryDialog.vue';
import DeleteCategoryDialog from '@/components/planning/DeleteCategoryDialog.vue';
import DeletePlanDialog from '@/components/planning/DeletePlanDialog.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'create-goal', 'container-changed']);

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

// 左滑相关状态（分类）
const swipeOpenId = ref(null); // 当前左滑打开的分类 ID
const touchStartX = ref(0); // 触摸开始的 X 坐标
const touchStartY = ref(0); // 触摸开始的 Y 坐标

// 左滑相关状态（规划）
const swipeOpenPlanId = ref(null); // 当前左滑打开的规划 ID
const planTouchStartX = ref(0); // 规划触摸开始的 X 坐标
const planTouchStartY = ref(0); // 规划触摸开始的 Y 坐标

// 删除规划相关状态
const showDeletePlanDialog = ref(false); // 删除规划确认弹窗
const deletingPlan = ref(null); // 正在删除的规划

// ============================================================
// 计算属性
// ============================================================
const userNickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户');
const userAvatar = computed(() => userStore.userInfo?.avatar || '🐣');

/**
 * 获取所有规划（从 userCategories 中过滤 type='plan'）
 */
const activePlans = computed(() => {
  return userCategories.value.filter(cat => cat.type === 'plan');
});

/**
 * 获取普通分类（从 userCategories 中过滤非规划）
 */
const normalCategories = computed(() => {
  return userCategories.value.filter(cat => cat.type !== 'plan');
});

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
// 监听弹窗显示状态
// ============================================================
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadCategories(); // 加载分类（包含规划）

    // 加载选中状态
    loadContainerSelection();
  } else {
    // 关闭所有左滑
    swipeOpenId.value = null;
    swipeOpenPlanId.value = null;
  }
});

/**
 * 加载容器选中状态（分类，包含规划类型的分类）
 */
function loadContainerSelection() {
  const savedCategory = uni.getStorageSync('selected_category_id');
  if (savedCategory) {
    selectedCategory.value = savedCategory;
  } else {
    selectedCategory.value = 'all'; // 默认为"全部"
  }
}

// ============================================================
// 组件挂载时加载数据
// ============================================================
onMounted(() => {
  loadCategories(); // 加载分类（包含规划）
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

  // 取消所有规划的选中状态
  planStore.deselectPlan();

  // 保存选中的分类到全局状态
  uni.setStorageSync('selected_category_id', categoryId);

  // 清除选中的规划ID
  uni.removeStorageSync('selected_plan_id');

  // 发出容器变更事件，通知父页面更新
  emit('container-changed', { type: 'category', id: categoryId });

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
  // 关闭抽屉
  emit('update:visible', false);

  // 跳转到规划模板页面
  uni.navigateTo({
    url: '/pages/planning/template/index'
  });
}

/**
 * 切换规划选中状态（规划现在是分类的一种，直接使用分类选择逻辑）
 */
function togglePlanSelection(planId) {
  // 如果点击的是已选中的规划，则取消选中
  if (selectedCategory.value === planId) {
    // 恢复为"全部"
    selectedCategory.value = 'all';
    uni.setStorageSync('selected_category_id', 'all');

    // 发出容器变更事件（恢复为"全部"）
    emit('container-changed', { type: 'category', id: 'all' });

    uni.showToast({
      title: '已取消选择',
      icon: 'none',
      duration: 1500
    });

    // 关闭抽屉
    setTimeout(() => {
      emit('update:visible', false);
    }, 500);
    return;
  }

  // 选中规划（规划也是分类，使用 categoryId）
  selectedCategory.value = planId;

  // 保存选中的分类ID（规划ID也存在这里）
  uni.setStorageSync('selected_category_id', planId);

  // 发出容器变更事件，通知父页面更新
  emit('container-changed', { type: 'category', id: planId });

  uni.showToast({
    title: '已选择规划',
    icon: 'success',
    duration: 1500
  });

  // 关闭抽屉
  setTimeout(() => {
    emit('update:visible', false);
  }, 500);
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

// ============================================================
// 规划左滑手势
// ============================================================

/**
 * 规划触摸开始
 */
function onPlanTouchStart(event, planId) {
  planTouchStartX.value = event.touches[0].pageX;
  planTouchStartY.value = event.touches[0].pageY;
}

/**
 * 规划触摸移动
 */
function onPlanTouchMove(event, planId) {
  const touchX = event.touches[0].pageX;
  const touchY = event.touches[0].pageY;
  const deltaX = touchX - planTouchStartX.value;
  const deltaY = touchY - planTouchStartY.value;

  // 判断是否是横向滑动
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    // 阻止默认滚动行为
    event.preventDefault?.();
  }
}

/**
 * 规划触摸结束
 */
function onPlanTouchEnd(event, planId) {
  const touchX = event.changedTouches[0].pageX;
  const deltaX = touchX - planTouchStartX.value;

  // 左滑阈值：滑动距离超过 50px
  if (deltaX < -50) {
    // 左滑，打开操作按钮
    swipeOpenPlanId.value = planId;
  } else if (deltaX > 50) {
    // 右滑，关闭操作按钮
    swipeOpenPlanId.value = null;
  } else if (swipeOpenPlanId.value === planId && Math.abs(deltaX) < 10) {
    // 点击已打开的项，关闭
    swipeOpenPlanId.value = null;
  }
}

/**
 * 编辑规划
 */
function editPlan(plan) {
  console.log('[CategoryDrawer] 编辑规划:', plan.title);

  swipeOpenPlanId.value = null;

  // 关闭抽屉
  emit('update:visible', false);

  // 跳转到规划详情页面
  uni.navigateTo({
    url: `/pages/planning/plan/detail?id=${plan.id}`
  });
}

/**
 * 删除规划（打开确认弹窗）
 */
function deletePlan(plan) {
  console.log('[CategoryDrawer] 删除规划:', plan.title);

  swipeOpenPlanId.value = null;
  deletingPlan.value = plan;
  showDeletePlanDialog.value = true;
}

/**
 * 确认删除规划
 */
function onDeletePlanConfirm(deleteWithTasks) {
  if (!deletingPlan.value) return;

  console.log('[CategoryDrawer] 确认删除规划:', deletingPlan.value.name, '是否同时删除任务:', deleteWithTasks);

  // 从 userCategories 中删除规划
  const index = userCategories.value.findIndex(c => c.id === deletingPlan.value.id);
  if (index !== -1) {
    userCategories.value.splice(index, 1);
    saveCategories();
  }

  // TODO: 如果 deleteWithTasks 为 true，还需要删除关联的任务
  // 这需要调用后端API或者更新本地任务列表

  uni.showToast({
    title: deleteWithTasks ? '规划和计划已删除' : '规划已删除',
    icon: 'success'
  });

  showDeletePlanDialog.value = false;
  deletingPlan.value = null;
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
  align-items: flex-start;  /* 改为顶部对齐，支持文字换行 */
  gap: 15rpx;
  background-color: #fff;
  border: 5rpx solid #ff0000 !important;  /* 🔴 调试：红色粗边框 */
  border-radius: 16rpx;
  padding: 20rpx;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s;
  height: auto;  /* 高度自适应 */
  min-height: auto;
}

.plan-card.active {
  background-color: #7CA1FF;
  border-color: #ff0000 !important;  /* 🔴 调试：激活状态也保持红色边框 */
}

.plan-icon {
  font-size: 40rpx;
  flex-shrink: 0;
  line-height: 1;
  height: auto;
  background-color: yellow !important;  /* 🟡 调试：黄色背景 */
  padding: 5rpx;
}

.plan-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;  /* 允许内容缩小，实现换行 */
  height: auto;
  background-color: rgba(0, 255, 0, 0.2) !important;  /* 🟢 调试：绿色半透明背景 */
  border: 3rpx dashed blue !important;  /* 🔵 调试：蓝色虚线边框 */
  padding: 5rpx;
}

.plan-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  word-wrap: break-word;  /* 允许单词内换行 */
  word-break: break-all;  /* 允许任意位置换行 */
  line-height: 1.4;
  height: auto;
  background-color: rgba(0, 255, 255, 0.3) !important;  /* 💠 调试：青色背景 */
  padding: 3rpx;
}

.plan-card.active .plan-title {
  color: #333 !important;  /* 调试时保持深色文字 */
}

.plan-buff {
  font-size: 24rpx;
  color: #666;
  word-wrap: break-word;  /* 允许单词内换行 */
  word-break: break-all;  /* 允许任意位置换行 */
  line-height: 1.5;
  white-space: normal;  /* 允许正常换行 */
  height: auto;
  background-color: rgba(255, 0, 255, 0.3) !important;  /* 🟣 调试：紫色背景 */
  border: 2rpx solid purple !important;  /* 🟣 调试：紫色边框 */
  padding: 3rpx;
}

.plan-card.active .plan-buff {
  color: #666 !important;  /* 调试时保持深色文字 */
}

.plan-stats {
  font-size: 22rpx;
  color: #999;
  word-wrap: break-word;
  height: auto;
  background-color: rgba(255, 165, 0, 0.3) !important;  /* 🟠 调试：橙色背景 */
  border: 2rpx solid orange !important;  /* 🟠 调试：橙色边框 */
  padding: 3rpx;
}

.plan-card.active .plan-stats {
  color: #999 !important;  /* 调试时保持深色文字 */
}

.plan-check {
  font-size: 32rpx;
  color: #fff;
  flex-shrink: 0;
  margin-top: 4rpx;  /* 稍微向下偏移，视觉上更平衡 */
  background-color: red !important;  /* 🔴 调试：红色背景 */
  padding: 5rpx;
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

/* 规划左滑操作按钮 */
.plan-swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  gap: 10rpx;
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
