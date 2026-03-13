<template>
  <view class="goal-detail-page">
    <!-- 顶部黑色导航栏 -->
    <view class="top-header">
      <view class="header-left" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-center">
        <text class="header-title">规划详情</text>
        <text class="header-hint">↓ 下拉查看更多</text>
      </view>
      <view class="header-right" @tap="showMenu">
        <text class="menu-icon">⋯</text>
      </view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view class="scroll-content" scroll-y>
      <!-- 目标标题卡片 -->
      <view class="goal-title-card">
        <text class="decoration-left">🌿</text>
        <view class="title-content">
          <text class="goal-title">{{ goalData.title }}</text>
          <text class="goal-buff">{{ goalData.buff }}</text>
        </view>
        <text class="decoration-right">🌿</text>
      </view>

      <view class="divider-line"></view>

      <!-- 规划详情数据 -->
      <view class="goal-stats-section">
        <text class="section-title">规划详情数据</text>

        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">{{ goalData.endDate }}截止</text>
            <text class="stat-value">共{{ goalData.totalDays }}天</text>
          </view>
          <view class="stat-item stat-item-completion">
            <text class="stat-label">计划完成率</text>
            <text class="stat-value">{{ goalData.completionRate }}%</text>
            <!-- 规划完成印章 -->
            <view v-if="goalData.isCompleted" class="completion-stamp">
              <text class="stamp-text">目标完成</text>
            </view>
            <!-- 规划放弃印章 (72.jpg) -->
            <view v-if="goalData.isAbandoned" class="abandon-stamp">
              <text class="stamp-text">目标放弃</text>
            </view>
          </view>
          <view class="stat-item">
            <text class="stat-label">完成计划</text>
            <text class="stat-value">{{ goalData.completedCount }}次</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">累计专注</text>
            <text class="stat-value">{{ goalData.focusTime }}分钟</text>
          </view>
        </view>
      </view>

      <!-- 里程碑 -->
      <view class="milestones-section">
        <view class="section-header">
          <text class="section-title">里程碑</text>
          <text class="add-btn" @tap="addMilestone">+添加里程碑</text>
        </view>

        <view
          v-for="(milestone, index) in goalData.milestones"
          :key="index"
          class="milestone-card"
          @tap="toggleMilestone(index)"
        >
          <view class="milestone-header">
            <view class="milestone-title-row">
              <view class="milestone-number">{{ index + 1 }}</view>
              <text class="milestone-title">{{ milestone.title }}</text>
            </view>
            <text class="milestone-flag">🚩</text>
          </view>

          <view v-if="expandedMilestones[index]" class="milestone-content">
            <text class="milestone-desc">{{ milestone.description }}</text>
            <text class="milestone-date">{{ milestone.date }} · {{ milestone.days }}</text>
          </view>
        </view>
      </view>

      <!-- 任务规划 -->
      <view class="plans-section">
        <view class="section-header">
          <text class="section-title">任务规划</text>
          <text class="help-link" @tap="showPlanHelp">如何正确分配规划?</text>
        </view>

        <view class="plan-status">
          <text class="status-item">已完成{{ completedTasks.length }}</text>
          <text class="status-item">未完成{{ incompleteTasks.length }}</text>
        </view>

        <!-- 按日期分组显示未完成任务 -->
        <view v-for="dateGroup in tasksByDate" :key="dateGroup.date" class="date-group">
          <view class="plan-category">
            <text class="category-title">{{ dateGroup.dateDisplay }}</text>
          </view>

          <view class="plan-list">
            <view
              v-for="task in dateGroup.tasks"
              :key="task.id"
              class="plan-item"
              :class="getTaskPriorityClass(task)"
            >
              <view class="plan-icon-wrapper">
                <text class="plan-icon">⭕</text>
                <text class="plan-emoji">{{ task.iconEmoji || '🔔' }}</text>
              </view>
              <view class="plan-content">
                <text class="plan-title">{{ task.title }}</text>
                <view class="plan-meta">
                  <text v-if="task.isRecurring" class="plan-repeat">重复事件</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 底部新建任务按钮 -->
    <view class="bottom-action">
      <view class="new-plan-btn" @tap="createNewTask">
        <text class="btn-text">+新建任务</text>
      </view>
    </view>

    <!-- 里程碑弹窗 -->
    <milestone-modal
      v-model:visible="showMilestoneModal"
      :milestone-number="goalData.milestones.length + 1"
      @save="handleMilestoneSave"
    />

    <!-- 任务创建面板 -->
    <add-task-panel
      :visible="showTaskPanel"
      :category-id="currentPlanId"
      @close="showTaskPanel = false"
      @submitted="onTaskCreated"
    />

    <!-- 菜单弹窗 -->
    <view v-if="showMenuPopup" class="menu-overlay" @tap="closeMenu">
      <view class="menu-popup" @tap.stop>
        <view class="menu-header">
          <text class="menu-title">规划</text>
        </view>
        <view class="menu-buttons">
          <!-- 未完成且未放弃状态：显示4个按钮 -->
          <template v-if="!goalData.isCompleted && !goalData.isAbandoned">
            <view class="menu-btn" @tap="handleCompleteGoal">
              <text class="menu-btn-text">完成规划</text>
            </view>
            <view class="menu-btn" @tap="handleAdjustGoal">
              <text class="menu-btn-text">调整规划</text>
            </view>
            <view class="menu-btn" @tap="handleAbandonGoal">
              <text class="menu-btn-text">放弃规划</text>
            </view>
            <view class="menu-btn" @tap="handleDeleteGoal">
              <text class="menu-btn-text">删除规划</text>
            </view>
          </template>

          <!-- 已完成或已放弃状态：只显示删除按钮 -->
          <template v-else>
            <view class="menu-btn" @tap="handleDeleteGoal">
              <text class="menu-btn-text">删除规划</text>
            </view>
          </template>
        </view>
      </view>
    </view>

    <!-- 放弃规划确认弹窗 (70.jpg/71.jpg) -->
    <view v-if="showAbandonDialog" class="abandon-modal-mask" @tap="closeAbandonDialog">
      <view class="abandon-dialog" @tap.stop>
        <text class="abandon-title">确认放弃规划吗?</text>
        <text class="abandon-hint">放弃规划后将不可恢复</text>

        <view class="abandon-actions">
          <view class="abandon-cancel-btn" @tap="closeAbandonDialog">
            <text class="abandon-cancel-text">取消</text>
          </view>
          <view
            class="abandon-confirm-btn"
            :class="{ 'abandon-confirm-disabled': abandonCountdown > 0 }"
            @tap="handleConfirmAbandon"
          >
            <text class="abandon-confirm-text">
              {{ abandonCountdown > 0 ? `确定（${abandonCountdown}）` : '确定' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 删除规划确认弹窗 (67.jpg/68.jpg/69.jpg) -->
    <DeletePlanDialog
      v-model:visible="showDeleteDialog"
      :plan-title="goalData.title"
      @confirm="onConfirmDelete"
    />
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { usePlanStore } from '@/store/plan.js';
import { useTaskStore } from '@/store/task.js';
import MilestoneModal from '@/components/milestone-modal.vue';
import AddTaskPanel from '@/components/task/AddTaskPanel.vue';
import DeletePlanDialog from '@/components/planning/DeletePlanDialog.vue';
import { useTaskGrouping } from '@/composables/useTaskGrouping.js';
import { useAbandonConfirm } from '@/composables/useAbandonConfirm.js';
import { usePlanTasks } from '@/composables/usePlanTasks.js';

// 获取 stores
const planStore = usePlanStore();
const taskStore = useTaskStore();

// 使用任务加载Composable
const { loadTasks } = usePlanTasks();

// 当前规划ID
const currentPlanId = ref(null);

// 展开的里程碑索引
const expandedMilestones = reactive({});

// 里程碑弹窗显示状态
const showMilestoneModal = ref(false);

// 任务创建面板显示状态
const showTaskPanel = ref(false);

// 菜单弹窗显示状态
const showMenuPopup = ref(false);

// 删除规划确认弹窗显示状态
const showDeleteDialog = ref(false);

/**
 * 使用放弃确认Composable
 * 管理放弃规划弹窗显示、3秒倒计时、确认逻辑
 */
const {
  showAbandonDialog,
  abandonCountdown,
  showDialog: showAbandonConfirmDialog,
  closeDialog: closeAbandonDialog,
  confirmAbandon: handleConfirmAbandon
} = useAbandonConfirm(async () => {
  // 确认放弃规划后的回调
  goalData.value.isAbandoned = true;
  uni.showToast({ title: '规划已放弃', icon: 'success' });
  // TODO: 调用API更新规划状态
});

/**
 * 规划详情数据
 * 从 planStore 和 API 加载，不使用示例数据
 */
const goalData = ref({
  title: '',
  buff: '',
  endDate: '',
  totalDays: 0,
  completionRate: 0,
  completedCount: 0,
  focusTime: 0,
  isCompleted: false,
  isAbandoned: false,
  milestones: []
});

// 计算属性：获取属于当前规划的任务
const planTasks = computed(() => {
  if (!currentPlanId.value) return [];

  // 从 taskStore 获取所有任务，筛选出属于当前规划的任务
  // 支持 categoryId 或 planId 匹配
  return taskStore.tasks.filter(task => {
    return task.categoryId === currentPlanId.value || task.planId === currentPlanId.value;
  });
});

// 计算属性：未完成的任务
const incompleteTasks = computed(() => {
  return planTasks.value.filter(task => task.status !== 'completed');
});

// 计算属性：已完成的任务
const completedTasks = computed(() => {
  return planTasks.value.filter(task => task.status === 'completed');
});

/**
 * 使用任务分组Composable
 * 自动按日期分组未完成任务，按日期和时间排序
 */
const { tasksByDate } = useTaskGrouping(incompleteTasks);

// 切换里程碑展开/折叠
function toggleMilestone(index) {
  expandedMilestones[index] = !expandedMilestones[index];
}

// 添加里程碑
function addMilestone() {
  showMilestoneModal.value = true;
}

// 保存里程碑
function handleMilestoneSave(milestoneData) {

  // 计算第几天（基于规划开始日期）
  const days = '第X天'; // TODO: 根据实际规划时间计算

  // 添加到里程碑列表
  goalData.value.milestones.push({
    title: milestoneData.title,
    description: milestoneData.description,
    date: milestoneData.date,
    days: days
  });

  uni.showToast({
    title: '添加成功',
    icon: 'success'
  });
}

// 显示计划帮助
function showPlanHelp() {
  uni.navigateTo({
    url: '/pages/planning/plan/guide'
  });
}

// 创建新任务/计划
function createNewTask() {
  showTaskPanel.value = true;
}

// 任务创建成功后的回调
async function onTaskCreated() {
  // 重新加载整个规划容器的数据（包括所有日期的任务）
  try {
    await loadPlanData(currentPlanId.value);
  } catch (err) {
    console.error('[GoalDetail] 刷新容器任务列表失败:', err);
  }
}

// 显示菜单
function showMenu() {
  showMenuPopup.value = true;
}

// 关闭菜单
function closeMenu() {
  showMenuPopup.value = false;
}

// 处理完成规划
function handleCompleteGoal() {
  closeMenu();
  goalData.value.isCompleted = true;
  uni.showToast({ title: '规划已完成', icon: 'success' });
  // TODO: 调用API更新规划状态
}

// 处理调整规划
function handleAdjustGoal() {
  closeMenu();
  // 跳转到编辑规划页面，传递当前规划ID
  uni.navigateTo({
    url: `/pages/planning/plan/create?id=${currentPlanId.value}&mode=edit`
  });
}

/**
 * 处理放弃规划
 * 使用 useAbandonConfirm 提供的 showDialog 方法
 */
function handleAbandonGoal() {
  closeMenu();
  showAbandonConfirmDialog();
}

// 处理删除规划
function handleDeleteGoal() {
  closeMenu();
  showDeleteDialog.value = true;
}

// 确认删除规划
async function onConfirmDelete(deleteWithTasks) {
  try {
    uni.showLoading({ title: '删除中...' });

    if (deleteWithTasks) {
      // 同时删除规划下的所有任务
      console.log('[PlanDetail] 删除规划及所有任务');
      // TODO: 调用API删除规划及其任务
    } else {
      // 只删除规划，任务变为无分类
      console.log('[PlanDetail] 删除规划，任务变为无分类');
      // TODO: 调用API删除规划，任务保留
    }

    uni.hideLoading();
    uni.showToast({ title: '规划已删除', icon: 'success' });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    uni.hideLoading();
    console.error('[PlanDetail] 删除规划失败:', error);
    uni.showToast({ title: '删除失败', icon: 'error' });
  }
}

// 获取任务优先级样式类
function getTaskPriorityClass(task) {
  if (task.isUrgent && task.isImportant) {
    return 'priority-high'; // 红色 - 紧急且重要
  } else if (!task.isUrgent && task.isImportant) {
    return 'priority-medium'; // 蓝色 - 重要不紧急
  } else if (task.isUrgent && !task.isImportant) {
    return 'priority-low'; // 黄色 - 紧急不重要
  } else {
    return ''; // 绿色 - 不紧急不重要
  }
}

// 获取任务日期显示文本
function getTaskDateText(task) {
  // 如果是今天的任务
  const today = new Date().toISOString().split('T')[0];
  if (task.date === today || task.occurDate === today) {
    return '今天';
  }

  // 如果是明天的任务
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  if (task.date === tomorrowStr || task.occurDate === tomorrowStr) {
    return '明天';
  }

  // 其他日期显示具体日期
  const taskDate = task.occurDate || task.date;
  if (taskDate) {
    const date = new Date(taskDate);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return '未设置';
}

// 返回
function goBack() {
  uni.navigateBack();
}

/**
 * 从 planStore 加载规划数据
 * 使用 usePlanTasks Composable 加载任务
 */
async function loadPlanData(planId) {
  // 先加载所有规划
  planStore.loadPlans()

  // 从 store 获取规划
  const plan = planStore.getPlanById(planId)

  if (!plan) {
    console.error('[GoalDetail] 未找到规划:', planId)
    uni.showToast({
      title: '规划不存在',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  // 更新目标数据
  goalData.value.title = plan.title
  goalData.value.buff = plan.buff

  // 格式化结束日期：从 2026/07/16 转为 2026年7月16日
  if (plan.endDate) {
    const dateParts = plan.endDate.split('/')
    goalData.value.endDate = `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`
  }

  // 使用 store 中的统计数据
  goalData.value.totalDays = plan.stats.totalDays

  // 更新里程碑
  if (plan.milestones && plan.milestones.length > 0) {
    goalData.value.milestones = plan.milestones
  }

  // 使用 Composable 加载任务数据
  await loadTasks(plan.startDate, plan.endDate)
}

// 页面加载时接收传递的数据
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  // 优先使用 planId 或 id 从 store 加载
  if (options.planId || options.id) {
    currentPlanId.value = options.planId || options.id;
    loadPlanData(currentPlanId.value);
  }
  // 兼容旧方式：通过 planData 参数传递（向后兼容）
  else if (options.planData) {
    try {
      const planData = JSON.parse(decodeURIComponent(options.planData));

      // 更新目标数据
      goalData.value.title = planData.title;
      goalData.value.buff = planData.buff;

      // 格式化结束日期：从 2026/07/16 转为 2026年7月16日
      if (planData.endDate) {
        const dateParts = planData.endDate.split('/');
        goalData.value.endDate = `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`;
      }

      // 提取持续天数：从 "持续142天" 提取 142
      if (planData.duration) {
        const daysMatch = planData.duration.match(/\d+/);
        if (daysMatch) {
          goalData.value.totalDays = parseInt(daysMatch[0]);
        }
      }

      // 更新里程碑
      if (planData.milestones && planData.milestones.length > 0) {
        goalData.value.milestones = planData.milestones;
      }

    } catch (error) {
      console.error('[GoalDetail] 解析规划数据失败:', error);
    }
  }
});

// 页面每次显示时重新加载数据（从编辑页面返回时会触发）
onShow(() => {
  if (currentPlanId.value) {
    console.log('[PlanDetail] 页面显示，重新加载规划数据');
    loadPlanData(currentPlanId.value);
  }
});
</script>

<style scoped>
.goal-detail-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* ============================================================
   顶部黑色导航栏
   ============================================================ */
.top-header {
  background-color: #000;
  padding: 60rpx 30rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  width: 80rpx;
  cursor: pointer;
}

.back-icon {
  font-size: 48rpx;
  color: #fff;
}

.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.header-title {
  font-size: 36rpx;
  color: #fff;
  font-weight: 600;
}

.header-hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.header-right {
  width: 80rpx;
  display: flex;
  justify-content: flex-end;
  cursor: pointer;
}

.menu-icon {
  font-size: 48rpx;
  color: #fff;
}

/* ============================================================
   滚动内容区
   ============================================================ */
.scroll-content {
  flex: 1;
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  margin-top: -20rpx;
  padding: 40rpx 20rpx 140rpx;
  width: 100%;
  box-sizing: border-box;
}

/* ============================================================
   目标标题卡片
   ============================================================ */
.goal-title-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx 20rpx;
  gap: 20rpx;
}

.decoration-left,
.decoration-right {
  font-size: 48rpx;
}

.title-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.goal-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
}

.goal-buff {
  font-size: 26rpx;
  color: #666;
  text-align: center;
}

.divider-line {
  height: 2rpx;
  background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
  margin: 20rpx 0;
}

/* ============================================================
   目标详情数据
   ============================================================ */
.goal-stats-section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.stat-item {
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 25rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
  box-sizing: border-box;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.stat-value {
  font-size: 32rpx;
  color: #333;
  font-weight: 600;
}

/* ============================================================
   里程碑
   ============================================================ */
.milestones-section {
  margin-bottom: 40rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.add-btn {
  font-size: 26rpx;
  color: #5B8CFF;
  cursor: pointer;
}

.milestone-card {
  background-color: #f8f8f8;
  border-radius: 16rpx;
  padding: 25rpx 20rpx;
  margin-bottom: 15rpx;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.milestone-card:active {
  transform: scale(0.98);
}

.milestone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.milestone-title-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15rpx;
  min-width: 0;
}

.milestone-number {
  width: 48rpx;
  height: 48rpx;
  background-color: #333;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.milestone-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.milestone-flag {
  font-size: 32rpx;
  flex-shrink: 0;
}

.milestone-content {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx dashed #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.milestone-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.milestone-date {
  font-size: 24rpx;
  color: #999;
}

/* ============================================================
   目标计划
   ============================================================ */
.plans-section {
  margin-bottom: 40rpx;
}

.help-link {
  font-size: 26rpx;
  color: #5B8CFF;
  cursor: pointer;
}

.plan-status {
  display: flex;
  gap: 30rpx;
  margin-bottom: 20rpx;
}

.status-item {
  font-size: 26rpx;
  color: #666;
}

.plan-category {
  margin-bottom: 20rpx;
}

.category-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.plan-item {
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 25rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.plan-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8rpx;
  border-radius: 16rpx 0 0 16rpx;
  background-color: #6BCB77; /* 绿色 - 不紧急不重要（默认） */
}

.plan-item.priority-high::before {
  background-color: #FF6B6B; /* 红色 - 紧急且重要 */
}

.plan-item.priority-medium::before {
  background-color: #5B8CFF; /* 蓝色 - 重要不紧急 */
}

.plan-item.priority-low::before {
  background-color: #FFD93D; /* 黄色 - 紧急不重要 */
}

.plan-icon-wrapper {
  position: relative;
  width: 60rpx;
  height: 60rpx;
  flex-shrink: 0;
}

.plan-icon {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 60rpx;
  color: #e0e0e0;
}

.plan-emoji {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32rpx;
}

.plan-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.plan-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  word-break: break-word;
}

.plan-meta {
  display: flex;
  gap: 20rpx;
}

.plan-date,
.plan-repeat {
  font-size: 24rpx;
  color: #FF9800;
}

/* ============================================================
   底部按钮
   ============================================================ */
.bottom-spacer {
  height: 40rpx;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 60rpx 40rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.new-plan-btn {
  width: 100%;
  height: 90rpx;
  background-color: #333;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.new-plan-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}

/* ============================================================
   菜单弹窗
   ============================================================ */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 100rpx 30rpx 0 0;
  z-index: 1000;
}

.menu-popup {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
  min-width: 300rpx;
}

.menu-header {
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.menu-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.menu-btn {
  padding: 20rpx 30rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-btn:active {
  background-color: #e0e0e0;
  transform: scale(0.98);
}

.menu-btn-text {
  font-size: 28rpx;
  color: #333;
}

/* ============================================================
   规划完成印章样式
   ============================================================ */
.stat-item-completion {
  position: relative;
  overflow: visible;
}

.completion-stamp {
  position: absolute;
  top: 50%;
  right: -30rpx;
  transform: translate(0, -50%) rotate(15deg);
  width: 140rpx;
  height: 140rpx;
  border: 8rpx solid #D32F2F;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(211, 47, 47, 0.1);
  z-index: 10;
}

.stamp-text {
  font-size: 28rpx;
  color: #D32F2F;
  font-weight: 700;
  letter-spacing: 4rpx;
}

/* ============================================================
   规划放弃印章样式 (72.jpg)
   ============================================================ */
.abandon-stamp {
  position: absolute;
  top: 50%;
  right: -30rpx;
  transform: translate(0, -50%) rotate(15deg);
  width: 140rpx;
  height: 140rpx;
  border: 8rpx solid #999999;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(153, 153, 153, 0.1);
  z-index: 10;
}

/* ============================================================
   放弃规划确认弹窗样式 (70.jpg/71.jpg)
   ============================================================ */
.abandon-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.abandon-dialog {
  position: relative;
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 50rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.abandon-title {
  font-size: 36rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 20rpx;
  text-align: center;
}

.abandon-hint {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 50rpx;
  text-align: center;
}

.abandon-actions {
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 24rpx;
}

.abandon-cancel-btn {
  flex: 1;
  background-color: #FFFFFF;
  border: 3rpx solid #333333;
  border-radius: 60rpx;
  padding: 24rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.abandon-cancel-btn:active {
  background-color: #F5F5F5;
}

.abandon-cancel-text {
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
}

.abandon-confirm-btn {
  flex: 1;
  background-color: #333333;
  border-radius: 60rpx;
  padding: 24rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.abandon-confirm-btn:active {
  opacity: 0.8;
}

/* 倒计时中的确定按钮（灰色禁用状态，70.jpg） */
.abandon-confirm-disabled {
  background-color: #CCCCCC;
  cursor: not-allowed;
  opacity: 1;
}

.abandon-confirm-disabled:active {
  opacity: 1;
}

.abandon-confirm-text {
  font-size: 30rpx;
  color: #FFFFFF;
  font-weight: 500;
}
</style>
