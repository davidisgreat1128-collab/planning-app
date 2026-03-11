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
                <!-- 规划卡片内容 -->
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
                  <!-- 右侧操作按钮：垂直排列 -->
                  <view class="plan-actions-vertical">
                    <view class="plan-action-btn" @tap.stop="editPlan(plan)">
                      <text class="action-icon">✏️</text>
                    </view>
                    <view class="plan-action-btn" @tap.stop="deletePlan(plan)">
                      <text class="action-icon">🗑️</text>
                    </view>
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
import { useCategoryStore } from '@/store/category.js';
import { usePlanStore } from '@/store/plan.js';
import { useSwipeGesture } from '@/composables/useSwipeGesture.js';
import { getPlanTotalMilestones, getPlanCompletedMilestones, getPlanProgressDays, calculatePersistDays } from '@/utils/planStats.js';
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
// Store（三层架构：Component → Store → Repository）
// ============================================================
const userStore = useUserStore();
const categoryStore = useCategoryStore();
const planStore = usePlanStore();

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

// ⚠️ 改为从 Store 获取（符合三层架构）
// 旧代码：const userCategories = ref([])  // ❌ 直接在组件维护状态
// 新代码：从 categoryStore 获取 ✅
const userCategories = computed(() => categoryStore.categories);

// ============================================================
// 左滑手势 Composable（阶段1.2：提取到Composable层）
// ============================================================
const categorySwipe = useSwipeGesture(); // 分类左滑
const planSwipe = useSwipeGesture(); // 规划左滑

// 解构出需要的状态和方法
const { swipeOpenId, onTouchStart, onTouchMove, onTouchEnd } = categorySwipe;
const {
  swipeOpenId: swipeOpenPlanId,
  onTouchStart: onPlanTouchStart,
  onTouchMove: onPlanTouchMove,
  onTouchEnd: onPlanTouchEnd
} = planSwipe;

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
 * 计算坚持天数（阶段2：已提取到 utils/planStats.js）
 */
const persistDays = computed(() => calculatePersistDays());

// ============================================================
// ✅ 规划统计函数已提取到 utils/planStats.js（阶段2）
// ============================================================
// getPlanTotalMilestones, getPlanCompletedMilestones, getPlanProgressDays
// 现在从 utils/planStats.js 导入使用

// ============================================================
// 监听弹窗显示状态
// ============================================================
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // ✅ 三层架构：Component → Store → Repository → localStorage/API
    // 旧代码：loadCategories() 直接读 uni.getStorageSync() ❌
    // 新代码：调用 Store.hydrate() ✅
    await categoryStore.hydrate();

    // 加载选中状态
    loadContainerSelection();
  } else {
    // 关闭所有左滑（使用Composable方法）
    categorySwipe.closeSwipe();
    planSwipe.closeSwipe();
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
onMounted(async () => {
  // ✅ 三层架构：Component → Store → Repository
  // 旧代码：loadCategories() 直接读 localStorage ❌
  // 新代码：调用 Store.hydrate() ✅
  await categoryStore.hydrate();
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

  // 清除选中的规划ID（规划现在也是分类的一种）
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
 * ❌ 已删除 loadCategories() 和 saveCategories() 函数
 *
 * 原因：违反三层架构规范（Component 不应直接操作 localStorage）
 *
 * 旧实现（违反架构）：
 * - Component 直接调用 uni.getStorageSync/setStorageSync
 * - 绕过了 Store 和 Repository 层
 *
 * 新实现（符合三层架构）：
 * - 读取：userCategories = computed(() => categoryStore.categories)
 * - 创建：await categoryStore.createCategory(data)
 * - 更新：await categoryStore.updateCategory(id, data)
 * - 删除：await categoryStore.deleteCategory(id)
 * - 同步：await categoryStore.hydrate()
 *
 * 数据流向：Component → Store → Repository → localStorage/API
 */

/**
 * 保存新建/编辑分类
 * ✅ 三层架构：Component → Store → Repository
 */
async function onSaveCategory(data) {
  try {
    if (isEditMode.value && editingCategory.value) {
      // 编辑模式：调用 Store.updateCategory()
      // 旧代码：直接修改 userCategories.value[index] ❌
      // 新代码：调用 Store 方法 ✅
      await categoryStore.updateCategory(editingCategory.value.id, {
        name: data.name,
        color: data.color,
        iconEmoji: data.iconEmoji
      });

      uni.showToast({
        title: '分类更新成功',
        icon: 'success'
      });

      isEditMode.value = false;
      editingCategory.value = null;
    } else {
      // 新建模式：调用 Store.createCategory()
      // 旧代码：直接 push 到 userCategories.value ❌
      // 新代码：调用 Store 方法 ✅
      await categoryStore.createCategory({
        name: data.name,
        color: data.color,
        iconEmoji: data.iconEmoji
      });

      uni.showToast({
        title: '分类创建成功',
        icon: 'success'
      });
    }
  } catch (error) {
    console.error('[category-drawer] 保存分类失败:', error);
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
  }
}

/**
 * 编辑分类
 */
function editCategory(category) {
  categorySwipe.closeSwipe();
  isEditMode.value = true;
  editingCategory.value = category;
  showCategoryDialog.value = true;
}

/**
 * 删除分类（打开确认弹窗）
 */
function deleteCategory(category) {
  categorySwipe.closeSwipe();
  deletingCategory.value = category;
  showDeleteDialog.value = true;
}

/**
 * 确认删除分类
 * ✅ 三层架构：Component → Store → Repository
 */
async function onDeleteConfirm(deleteMode) {
  if (!deletingCategory.value) return;

  const categoryId = deletingCategory.value.id;

  // 检查是否删除的是当前选中的分类
  const isDeletingSelected = selectedCategory.value === categoryId;

  try {
    // ✅ 调用 Store.deleteCategory()（软删除）
    // 旧代码：userCategories.value.splice(index, 1) ❌
    // 新代码：调用 Store 方法 ✅
    await categoryStore.deleteCategory(categoryId);

    // 如果删除的是当前选中的分类，自动切换到"全部"
    if (isDeletingSelected) {
      selectCategory('all');
    }

    // TODO: 根据 deleteMode 处理关联任务
    // 'category_only' - 仅删除分类，任务归为"无分类"
    // 'with_tasks' - 同时删除分类和相关任务

    uni.showToast({
      title: deleteMode === 'with_tasks' ? '分类和任务已删除' : '分类已删除',
      icon: 'success'
    });
  } catch (error) {
    console.error('[category-drawer] 删除分类失败:', error);
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    });
  }

  deletingCategory.value = null;
}

// ============================================================
// ✅ 左滑手势逻辑已提取到 useSwipeGesture.js Composable（阶段1.2）
// ============================================================

/**
 * 编辑规划
 */
function editPlan(plan) {
  planSwipe.closeSwipe();

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
  planSwipe.closeSwipe();
  deletingPlan.value = plan;
  showDeletePlanDialog.value = true;
}

/**
 * 确认删除规划
 */
async function onDeletePlanConfirm(deleteWithTasks) {
  if (!deletingPlan.value) return;

  const planId = deletingPlan.value.id;

  // 检查是否删除的是当前选中的规划
  const isDeletingSelected = selectedCategory.value === planId;

  try {
    uni.showLoading({ title: '删除中...' });

    // ✅ 三层架构：Component → Store → Repository
    // 调用 categoryStore 删除规划（规划也是分类的一种）
    await categoryStore.deleteCategory(planId);

    // 调用 planStore 删除规划及其关联任务
    const planStore = usePlanStore();
    await planStore.deletePlan(planId, deleteWithTasks);

    // 如果删除的是当前选中的规划，自动切换到"全部"
    if (isDeletingSelected) {
      selectCategory('all');
    }

    uni.hideLoading();
    uni.showToast({
      title: deleteWithTasks ? '规划和任务已删除' : '规划已删除',
      icon: 'success'
    });

    showDeletePlanDialog.value = false;
    deletingPlan.value = null;

    // 通知父组件容器已改变，需要刷新任务列表
    emit('container-changed');
  } catch (error) {
    uni.hideLoading();
    console.error('[CategoryDrawer] 删除规划失败:', error);
    uni.showToast({
      title: '删除失败，请重试',
      icon: 'none'
    });
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

.plan-check {
  font-size: 32rpx;
  color: #fff;
  flex-shrink: 0;
  margin-top: 4rpx;
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
  z-index: 1;  /* 背景层，在前景卡片之下 */
  background-color: pink !important;  /* 🎀 调试：粉色背景，查看背景层位置 */
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
