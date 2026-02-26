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
          <view class="stat-item">
            <text class="stat-label">计划完成率</text>
            <text class="stat-value">{{ goalData.completionRate }}%</text>
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
          <view class="menu-btn" @tap="handleMenuAction('action1')">
            <text class="menu-btn-text">按钮1</text>
          </view>
          <view class="menu-btn" @tap="handleMenuAction('action2')">
            <text class="menu-btn-text">按钮2</text>
          </view>
          <view class="menu-btn" @tap="handleMenuAction('action3')">
            <text class="menu-btn-text">按钮3</text>
          </view>
          <view class="menu-btn" @tap="handleMenuAction('action4')">
            <text class="menu-btn-text">按钮4</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { usePlanStore } from '@/store/plan.js';
import { useTaskStore } from '@/store/task.js';
import MilestoneModal from '@/components/milestone-modal.vue';
import AddTaskPanel from '@/components/task/AddTaskPanel.vue';

// 获取 stores
const planStore = usePlanStore();
const taskStore = useTaskStore();

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

// 目标数据
const goalData = ref({
  title: '循序渐进养成良好作息',
  buff: '月亮不睡你得睡，不当秃头小宝贝。',
  endDate: '2026年3月23日',
  totalDays: 30,
  completionRate: 0,
  completedCount: 0,
  focusTime: 0,
  completedPlans: 0,
  uncompletedPlans: 5,
  milestones: [
    {
      title: '建立健康观念，健康永远是第一位的',
      description: '注意是要时刻记得。如果你希望养成良好作息，那么你先要做到的事，做任何选择时都不应该以牺牲健康为代价。',
      date: '2026/03/02',
      days: '第10天'
    },
    {
      title: '锚定一日三餐的时间点',
      description: '根据个人的实际生活和工作情况，确定每天的一日三餐时间点。一日三餐的时间往往是休息的时间，保持它尽可能不被客观环境所打破，在休息日吃早饭会帮助你完成早起，按时晚饭也可以让你拒绝夜宵。',
      date: '2026/03/12',
      days: '第20天'
    },
    {
      title: '养成自己的助眠习惯',
      description: '喝牛奶、保持一定的运动量、睡前阅读都有助于提升睡眠质量，选择最适合你的方式养成这个习惯。注意运动不要在睡前半个小时内进行。',
      date: '2026/02/21',
      days: '第0天'
    },
    {
      title: '养成按时上床的习惯',
      description: '这意味着你需要将每天的计划尽可能早的完成，以免挤占睡眠前的时间。如果当日有计划没有完成，你也需要坚持按时上床睡觉。健康睡眠的前提是不要打破属于自己的睡眠规律。',
      date: '2026/03/18',
      days: '第25天'
    },
    {
      title: '保持每晚至少7小时睡眠',
      description: '科学研究表明，睡得太少和太多都不好，保持7~8个小时的睡眠最有利于健康。结合前面按时上床的习惯，只要拥有充足的睡眠，规律早起的习惯会轻松的保持下来。',
      date: '2026/03/23',
      days: '第30天'
    }
  ],
  plans: [
    { title: '查资料，了解缺少睡眠的危害', emoji: '🔔', priority: 'high', isRepeat: true },
    { title: '22:00按时上床', emoji: '🔔', priority: 'high', isRepeat: true },
    { title: '每天按时吃三餐', emoji: '🔔', priority: 'medium', isRepeat: true },
    { title: '完成助眠活动，喝牛奶或看书', emoji: '🔔', priority: 'medium', isRepeat: true },
    { title: '完成今日的累积7小时睡眠', emoji: '🔔', priority: 'medium', isRepeat: true }
  ]
});

// 计算属性：获取属于当前规划的任务
const planTasks = computed(() => {
  if (!currentPlanId.value) return [];

  // 从 taskStore 获取所有任务，筛选出属于当前规划的任务
  return taskStore.tasks.filter(task => task.categoryId === currentPlanId.value);
});

// 计算属性：未完成的任务
const incompleteTasks = computed(() => {
  return planTasks.value.filter(task => task.status !== 'completed');
});

// 计算属性：已完成的任务
const completedTasks = computed(() => {
  return planTasks.value.filter(task => task.status === 'completed');
});

// 计算属性：按日期分组的未完成任务
const tasksByDate = computed(() => {
  const grouped = {};

  incompleteTasks.value.forEach(task => {
    const date = task.date || task.occurDate;
    if (!date) return;

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(task);
  });

  // 转换为数组并按日期排序
  return Object.keys(grouped)
    .sort() // 日期升序排序
    .map(date => ({
      date,
      dateDisplay: formatDateDisplay(date),
      // 每个日期内的任务也按时间排序（有startTime的在前，按时间升序；无时间的在后）
      tasks: grouped[date].sort((a, b) => {
        const aHasTime = !!a.startTime;
        const bHasTime = !!b.startTime;

        // 都有时间：按时间排序
        if (aHasTime && bHasTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        // 有时间的排在前面
        if (aHasTime) return -1;
        if (bHasTime) return 1;
        // 都没有时间：保持原顺序（或按创建时间）
        return 0;
      })
    }));
});

// 格式化日期显示
function formatDateDisplay(dateStr) {
  // dateStr格式: 2026/02/27
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;

  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  return `${month}月${day}日`;
}

// 切换里程碑展开/折叠
function toggleMilestone(index) {
  expandedMilestones[index] = !expandedMilestones[index];
}

// 添加里程碑
function addMilestone() {
  console.log('[GoalDetail] 添加里程碑');
  showMilestoneModal.value = true;
}

// 保存里程碑
function handleMilestoneSave(milestoneData) {
  console.log('[GoalDetail] 保存里程碑:', milestoneData);

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
  console.log('[GoalDetail] 显示规划帮助');
  uni.navigateTo({
    url: '/pages/planning/plan/guide'
  });
}

// 创建新任务/计划
function createNewTask() {
  console.log('[GoalDetail] 创建新任务');
  showTaskPanel.value = true;
}

// 任务创建成功后的回调
async function onTaskCreated() {
  console.log('[GoalDetail] 任务创建成功，刷新任务列表');

  // 重新加载当前日期的任务数据（包括新创建的任务）
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  try {
    await taskStore.fetchTasksByDate(dateStr);

    // 同时加载 localStorage 中的任务（模板创建的任务）
    const savedTasks = uni.getStorageSync('tasks');
    if (savedTasks) {
      const allLocalTasks = JSON.parse(savedTasks);
      // 筛选出当前规划的任务
      const planLocalTasks = allLocalTasks.filter(t => t.categoryId === currentPlanId.value);

      // 合并到 taskStore（避免重复）
      const existingIds = new Set(taskStore.tasks.map(t => t.id));
      const newTasks = planLocalTasks.filter(t => !existingIds.has(t.id));

      if (newTasks.length > 0) {
        taskStore.tasks = [...taskStore.tasks, ...newTasks];
      }
    }

    console.log('[GoalDetail] 任务列表已刷新，当前任务数:', planTasks.value.length);
  } catch (err) {
    console.error('[GoalDetail] 刷新任务列表失败:', err);
  }
}

// 显示菜单
function showMenu() {
  console.log('[GoalDetail] 显示菜单');
  showMenuPopup.value = true;
}

// 关闭菜单
function closeMenu() {
  showMenuPopup.value = false;
}

// 菜单按钮操作（待实现）
function handleMenuAction(action) {
  console.log('[GoalDetail] 菜单操作:', action);
  closeMenu();
  // TODO: 实现具体的菜单操作
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
 */
async function loadPlanData(planId) {
  console.log('[GoalDetail] 加载规划数据:', planId);

  // 先加载所有规划
  planStore.loadPlans();

  // 从 store 获取规划
  const plan = planStore.getPlanById(planId);

  if (!plan) {
    console.error('[GoalDetail] 未找到规划:', planId);
    uni.showToast({
      title: '规划不存在',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return;
  }

  console.log('[GoalDetail] 规划数据:', plan);

  // 更新目标数据
  goalData.value.title = plan.title;
  goalData.value.buff = plan.buff;

  // 格式化结束日期：从 2026/07/16 转为 2026年7月16日
  if (plan.endDate) {
    const dateParts = plan.endDate.split('/');
    goalData.value.endDate = `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`;
  }

  // 使用 store 中的统计数据
  goalData.value.totalDays = plan.stats.totalDays;

  // 更新里程碑
  if (plan.milestones && plan.milestones.length > 0) {
    goalData.value.milestones = plan.milestones;
  }

  // 直接从localStorage加载所有任务（包括属于该规划的所有任务）
  try {
    const savedTasks = uni.getStorageSync('tasks');
    if (savedTasks) {
      const allTasks = JSON.parse(savedTasks);
      // 手动更新taskStore的tasks
      taskStore.tasks = allTasks;
      console.log('[GoalDetail] 从localStorage加载了', allTasks.length, '个任务');
      console.log('[GoalDetail] 属于当前规划的任务:', planTasks.value.length, '个');
    }
  } catch (e) {
    console.error('[GoalDetail] 加载任务失败:', e);
  }

  console.log('[GoalDetail] 显示数据:', goalData.value);
  console.log('[GoalDetail] 任务数据:', planTasks.value);
}

// 页面加载时接收传递的数据
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  console.log('[GoalDetail] onMounted 接收参数:', options);

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

      console.log('[GoalDetail] 接收到规划数据（旧方式）:', goalData.value);
    } catch (error) {
      console.error('[GoalDetail] 解析规划数据失败:', error);
    }
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
}

.plan-item.priority-high::before {
  background-color: #FF6B6B;
}

.plan-item.priority-medium::before {
  background-color: #5B8CFF;
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
</style>
