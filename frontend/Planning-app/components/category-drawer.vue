<template>
  <view v-if="visible" class="drawer-overlay" @tap="handleOverlayClick">
    <view class="drawer-container" @tap.stop :class="{ 'drawer-open': visible }">
      <!-- 顶部用户信息 -->
      <UserInfoHeader
        :user-avatar="userAvatar"
        :user-nickname="userNickname"
        :persist-days="persistDays"
        :show-completed="showCompleted"
        @toggle-completed="toggleShowCompleted"
      />

      <view class="divider"></view>

      <!-- 滚动内容区 -->
      <scroll-view class="scroll-content" scroll-y>
        <!-- 我的规划 -->
        <PlanList
          :plans="activePlans"
          :selected-id="selectedCategory"
          @select="togglePlanSelection"
          @edit="editPlan"
          @delete="deletePlan"
          @create="handleCreateGoal"
        />

        <!-- 我的分类 -->
        <CategoryList
          :categories="normalCategories"
          :selected-id="selectedCategory"
          @select="selectCategory"
          @edit="editCategory"
          @delete="deleteCategory"
          @clear-all="handleClearAll"
          @clear-uncategorized="handleClearUncategorized"
        />

      </scroll-view>

      <!-- 底部按钮 -->
      <DrawerFooter
        @create-category="showCategoryDialog = true"
        @create-plan="handleCreateGoal"
      />

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

      <!-- 清空所有规划和分类确认弹窗 -->
      <ClearAllDialog
        :visible="showClearAllDialog"
        @confirm="onClearAllConfirm"
        @cancel="showClearAllDialog = false"
      />

      <!-- 清空无分类任务确认弹窗 -->
      <ClearUncategorizedDialog
        :visible="showClearUncategorizedDialog"
        @confirm="onClearUncategorizedConfirm"
        @cancel="showClearUncategorizedDialog = false"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUserStore } from '@/store/user.js';
import { useCategoryStore } from '@/store/category.js';
import { useTaskStore } from '@/store/task.js';
// ⭐ 已废弃：规划现在统一存储在 CategoryRepository（type='plan'）
// import { usePlanStore } from '@/store/plan.js';
import { calculatePersistDays } from '@/utils/planStats.js';
import CategoryDialog from '@/components/planning/CategoryDialog.vue';
import DeleteCategoryDialog from '@/components/planning/DeleteCategoryDialog.vue';
import DeletePlanDialog from '@/components/planning/DeletePlanDialog.vue';
import ClearAllDialog from '@/components/category-drawer/ClearAllDialog.vue';
import ClearUncategorizedDialog from '@/components/category-drawer/ClearUncategorizedDialog.vue';
import UserInfoHeader from '@/components/category-drawer/UserInfoHeader.vue';
import PlanList from '@/components/category-drawer/PlanList.vue';
import CategoryList from '@/components/category-drawer/CategoryList.vue';
import DrawerFooter from '@/components/category-drawer/DrawerFooter.vue';

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
// ⭐ 已废弃：规划现在统一存储在 CategoryRepository（type='plan'）
// const planStore = usePlanStore();

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

// 删除规划相关状态
const showDeletePlanDialog = ref(false); // 删除规划确认弹窗
const deletingPlan = ref(null); // 正在删除的规划

// 清空操作相关状态
const showClearAllDialog = ref(false); // 清空所有规划和分类确认弹窗
const showClearUncategorizedDialog = ref(false); // 清空无分类任务确认弹窗

// ============================================================
// 计算属性
// ============================================================
const userNickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户');
const userAvatar = computed(() => userStore.userInfo?.avatar || '🐣');

/**
 * 获取所有规划（从 CategoryRepository，type='plan'）
 * ⭐ 架构统一：规划现在存储在 CategoryRepository，通过 categoryStore.plans 获取
 */
const activePlans = computed(() => {
  return categoryStore.plans || [];
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
  }
  // 注意：左滑状态由子组件（PlanList、CategoryList）各自管理，
  // 主组件不再需要手动关闭左滑状态
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
  isEditMode.value = true;
  editingCategory.value = category;
  showCategoryDialog.value = true;
  // 注意：左滑状态由 CategoryList 子组件管理，打开弹窗后会自动关闭
}

/**
 * 删除分类（打开确认弹窗）
 */
function deleteCategory(category) {
  deletingCategory.value = category;
  showDeleteDialog.value = true;
  // 注意：左滑状态由 CategoryList 子组件管理，打开弹窗后会自动关闭
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
  // 关闭抽屉
  emit('update:visible', false);

  // 跳转到规划详情页面
  uni.navigateTo({
    url: `/pages/planning/plan/detail?id=${plan.id}`
  });
  // 注意：左滑状态由 PlanList 子组件管理，关闭抽屉后会自动重置
}

/**
 * 删除规划（打开确认弹窗）
 */
function deletePlan(plan) {
  deletingPlan.value = plan;
  showDeletePlanDialog.value = true;
  // 注意：左滑状态由 PlanList 子组件管理，打开弹窗后会自动关闭
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

    // ⭐ 架构统一：规划存储在 CategoryRepository（type='plan'）
    // deleteWithTasks: true=删除关联任务，false=改为无分类
    await categoryStore.deletePlan(planId, deleteWithTasks);

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

/**
 * 处理清空所有规划和分类（打开确认弹窗）
 */
function handleClearAll() {
  showClearAllDialog.value = true;
}

/**
 * 确认清空所有规划和分类
 */
async function onClearAllConfirm(deleteAllTasks) {
  console.log('[CategoryDrawer] 确认清空所有规划和分类，deleteAllTasks:', deleteAllTasks);

  try {
    uni.showLoading({ title: deleteAllTasks ? '删除中...' : '清空中...' });

    // 调用 categoryStore.clearAll()
    await categoryStore.clearAll(deleteAllTasks);

    // 切换到"全部"
    selectCategory('all');

    uni.hideLoading();
    uni.showToast({
      title: deleteAllTasks ? '已删除全部数据' : '已清空，任务已变为无分类',
      icon: 'success'
    });

    showClearAllDialog.value = false;

    // 通知父组件容器已改变，需要刷新任务列表
    emit('container-changed');
  } catch (error) {
    uni.hideLoading();
    console.error('[CategoryDrawer] 清空所有规划和分类失败:', error);
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    });
  }
}

/**
 * 处理清空无分类任务（打开确认弹窗）
 */
function handleClearUncategorized() {
  showClearUncategorizedDialog.value = true;
}

/**
 * 确认清空无分类任务
 */
async function onClearUncategorizedConfirm() {
  console.log('[CategoryDrawer] 确认清空无分类任务');

  try {
    uni.showLoading({ title: '删除中...' });

    // 调用 taskStore.clearUncategorizedTasks()
    const taskStore = useTaskStore();
    await taskStore.clearUncategorizedTasks();

    uni.hideLoading();
    uni.showToast({
      title: '已清空无分类任务',
      icon: 'success'
    });

    showClearUncategorizedDialog.value = false;

    // 通知父组件容器已改变，需要刷新任务列表
    emit('container-changed');
  } catch (error) {
    uni.hideLoading();
    console.error('[CategoryDrawer] 清空无分类任务失败:', error);

    // 根据错误类型显示不同提示
    if (error.message && error.message.includes('进行中')) {
      uni.showToast({
        title: '操作进行中，请稍后重试',
        icon: 'none'
      });
    } else {
      uni.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
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

</style>
