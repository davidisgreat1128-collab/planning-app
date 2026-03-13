<template>
  <view class="calendar-page">
    <!-- 自定义状态栏占位 -->
    <!-- #ifdef APP-PLUS -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- #endif -->

    <!-- 顶部：标题 + 操作栏 -->
    <view class="top-bar">
      <text class="top-title">做计划</text>
      <view class="top-actions">
        <text class="btn-today" @tap="calendarComposable.goToday">今</text>
        <view class="view-switch">
          <text
            v-for="v in viewModes"
            :key="v.key"
            class="view-btn"
            :class="{ active: currentView === v.key }"
            @tap="currentView = v.key"
          >{{ v.label }}</text>
        </view>
      </view>
    </view>

    <!-- 日历条组件 -->
    <calendar-bar
      :mode="calendarComposable.calendarMode.value"
      :selected-date="calendarComposable.selectedDate.value"
      :current-week-dates="calendarComposable.currentWeekDates.value"
      :month-rows="calendarComposable.monthRows.value"
      :today-str="todayStr"
      :week-days="weekDays"
      :month-label="calendarComposable.currentMonthLabel.value"
      @date-click="calendarComposable.selectDate"
      @swipe-left="handleCalendarSwipeLeft"
      @swipe-right="handleCalendarSwipeRight"
      @expand="calendarComposable.expandToMonth"
      @collapse="calendarComposable.collapseToWeek"
    />

    <!-- 内容区（可滚动） -->
    <scroll-view
      class="content-area"
      scroll-y
      :scroll-top="scrollTop"
      @scroll="onContentScroll"
      @touchstart="onContentTouchStart"
      @touchmove="onContentTouchMove"
      @touchend="onContentTouchEnd"
    >
      <!-- 时间轴视图 -->
      <timeline-view
        v-if="currentView === 'timeline'"
        :selected-date="calendarComposable.selectedDate.value"
        :all-day-tasks-pending="allDayTasksPending"
        :all-day-tasks-done="allDayTasksDone"
        :timed-tasks="timelineTasks"
        :container-name="taskFilterComposable.containerName.value"
        @task-click="openTask"
        @drag-start="dragDropComposable.startDrag"
        @goals-click="goToPlanningCategory"
      />

      <!-- 四象限视图 -->
      <task-quadrant-view
        v-if="currentView === 'quadrant'"
        :urgent-important="urgentImportant"
        :urgent-important-done="urgentImportantDone"
        :not-urgent-important="notUrgentImportant"
        :not-urgent-important-done="notUrgentImportantDone"
        :urgent-not-important="urgentNotImportant"
        :urgent-not-important-done="urgentNotImportantDone"
        :not-urgent-not-important="notUrgentNotImportant"
        :not-urgent-not-important-done="notUrgentNotImportantDone"
        :container-name="taskFilterComposable.containerName.value"
        @task-click="openTask"
        @checkbox-click="toggleTaskDone"
        @drag-start="dragDropComposable.startDrag"
        @mouse-drag-start="dragDropComposable.handleTaskMouseDown"
        @goals-click="goToPlanningCategory"
      />

      <!-- 列表视图 -->
      <view v-if="currentView === 'list'" class="list-view">
        <view class="list-section" v-if="urgentImportant.length > 0">
          <text class="list-section-title">重要且紧急</text>
          <task-card
            v-for="task in urgentImportant"
            :key="task.id"
            :task="task"
            @task-click="openTask"
            @checkbox-click="toggleTaskDone"
          />
        </view>
        <view class="list-section" v-if="notUrgentImportant.length > 0">
          <text class="list-section-title">重要不紧急</text>
          <task-card
            v-for="task in notUrgentImportant"
            :key="task.id"
            :task="task"
            @task-click="openTask"
            @checkbox-click="toggleTaskDone"
          />
        </view>
        <view class="list-section" v-if="urgentNotImportant.length > 0">
          <text class="list-section-title">紧急不重要</text>
          <task-card
            v-for="task in urgentNotImportant"
            :key="task.id"
            :task="task"
            @task-click="openTask"
            @checkbox-click="toggleTaskDone"
          />
        </view>
        <view class="list-section" v-if="notUrgentNotImportant.length > 0">
          <text class="list-section-title">不重要不紧急</text>
          <task-card
            v-for="task in notUrgentNotImportant"
            :key="task.id"
            :task="task"
            @task-click="openTask"
            @checkbox-click="toggleTaskDone"
          />
        </view>
      </view>
    </scroll-view>

    <!-- FAB 悬浮按钮 -->
    <view class="fab-container">
      <view v-if="fabExpanded" class="fab-menu">
        <view class="fab-item" @tap="addTask">
          <text class="fab-item-icon">✓</text>
          <text class="fab-item-label">任务</text>
        </view>
        <view class="fab-item" @tap="addLog">
          <text class="fab-item-icon">📝</text>
          <text class="fab-item-label">日志</text>
        </view>
      </view>
      <view class="fab-btn" :class="{ expanded: fabExpanded }" @tap="toggleFab">
        <text class="fab-icon">{{ fabExpanded ? '×' : '+' }}</text>
      </view>
    </view>

    <!-- 子任务弹窗 -->
    <view v-if="showSubtaskPopup" class="modal-overlay" @tap="closeSubtaskPopup">
      <view class="subtask-popup" @tap.stop>
        <!-- 父任务 -->
        <view class="subtask-parent">
          <view
            class="task-checkbox"
            :style="{ borderColor: getTaskQuadrantColor(currentSubtaskParent) }"
            @tap="toggleTaskDone(currentSubtaskParent)"
          >
            <text v-if="currentSubtaskParent.status === 'completed'" class="check-icon">✓</text>
          </view>
          <text class="task-title">{{ currentSubtaskParent.title }}</text>
        </view>

        <!-- 分隔线 -->
        <view class="subtask-divider"></view>

        <!-- 子任务列表 -->
        <view class="subtask-list">
          <view
            v-for="(sub, idx) in currentSubtaskParent.subtasks"
            :key="idx"
            class="subtask-item"
            @tap="toggleSubtask(sub)"
          >
            <view class="subtask-checkbox" :class="{ checked: sub.isDone }">
              <text v-if="sub.isDone" class="check-icon">✓</text>
            </view>
            <text class="subtask-text" :class="{ done: sub.isDone }">{{ sub.text }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 拖拽蒙层组件（包含拖拽UI、删除区域、对话框） -->
    <DragOverlay
      ref="dragOverlayRef"
      :drag-state="dragDropComposable.dragState.value"
      :show-change-quadrant-dialog="quadrantComposable.showChangeQuadrantDialog.value"
      :change-quadrant-option="quadrantComposable.changeQuadrantOption.value"
      @update:changeQuadrantOption="quadrantComposable.changeQuadrantOption.value = $event"
      @close-change-quadrant-dialog="quadrantComposable.closeChangeQuadrantDialog"
      @confirm-change-quadrant="confirmChangeQuadrant"
      @confirm-delete="handleDeleteTaskConfirm"
    />

    <!-- 新建任务底部弹窗 -->
    <AddTaskPanel
      :visible="showAddTaskPanel"
      :preset-date="calendarComposable.selectedDate.value"
      :category-id="taskFilterComposable.selectedContainer.value.id === 'all' || taskFilterComposable.selectedContainer.value.id === 'none' ? null : taskFilterComposable.selectedContainer.value.id"
      @close="showAddTaskPanel = false"
      @submitted="handleTaskSubmitted"
    />

    <!-- 规划和分类侧边抽屉 -->
    <CategoryDrawer
      v-model:visible="showCategoryDrawer"
      @container-changed="handleContainerChanged"
    />
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTaskStore } from '@/store/task';
import { useCalendar } from '@/composables/useCalendar';
import { useDragDrop } from '@/composables/useDragDrop';
import { useTaskQuadrant } from '@/composables/useTaskQuadrant';
import { useTaskFilter } from '@/composables/useTaskFilter';
import { getQuadrant, getQuadrantColor } from '@/utils/quadrant';
import { formatDate, getToday } from '@/utils/date';
import CalendarBar from '@/components/calendar/CalendarBar.vue';
import TaskQuadrantView from '@/components/calendar/TaskQuadrantView.vue';
import TimelineView from '@/components/calendar/TimelineView.vue';
import TaskCard from '@/components/calendar/TaskCard.vue';
import DragOverlay from '@/components/calendar/DragOverlay.vue';
import AddTaskPanel from '@/components/task/AddTaskPanel.vue';
import CategoryDrawer from '@/components/category-drawer.vue';

// Store
const taskStore = useTaskStore();

// Composables
const calendarComposable = useCalendar();
const dragDropComposable = useDragDrop({
  onDragEnd: handleDragEnd
});
const quadrantComposable = useTaskQuadrant();
const taskFilterComposable = useTaskFilter();

// 状态
const statusBarHeight = ref(0);
const currentView = ref('quadrant'); // 'timeline' | 'quadrant' | 'list'
const fabExpanded = ref(false);
const scrollTop = ref(0);
const showSubtaskPopup = ref(false);
const currentSubtaskParent = ref(null);
const showAddTaskPanel = ref(false);
const showCategoryDrawer = ref(false);

// DragOverlay组件ref
const dragOverlayRef = ref(null);

// 内容区触摸状态
const contentTouchStartY = ref(0);
const contentScrollTop = ref(0);

// 常量
const viewModes = [
  { key: 'timeline', label: '时间轴' },
  { key: 'quadrant', label: '四象限' },
  { key: 'list', label: '列表' }
];

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 计算属性
const todayStr = computed(() => getToday());

// 四象限任务分组（从 taskStore 获取，然后应用容器过滤）
const urgentImportant = computed(() =>
  taskFilterComposable.filterTasks(taskStore.urgentImportant)
);
const urgentImportantDone = computed(() =>
  taskFilterComposable.filterTasks(
    taskStore.doneTasks.filter(t => t.isUrgent && t.isImportant)
  )
);
const notUrgentImportant = computed(() =>
  taskFilterComposable.filterTasks(taskStore.notUrgentImportant)
);
const notUrgentImportantDone = computed(() =>
  taskFilterComposable.filterTasks(
    taskStore.doneTasks.filter(t => !t.isUrgent && t.isImportant)
  )
);
const urgentNotImportant = computed(() =>
  taskFilterComposable.filterTasks(taskStore.urgentNotImportant)
);
const urgentNotImportantDone = computed(() =>
  taskFilterComposable.filterTasks(
    taskStore.doneTasks.filter(t => t.isUrgent && !t.isImportant)
  )
);
const notUrgentNotImportant = computed(() =>
  taskFilterComposable.filterTasks(taskStore.notUrgentNotImportant)
);
const notUrgentNotImportantDone = computed(() =>
  taskFilterComposable.filterTasks(
    taskStore.doneTasks.filter(t => !t.isUrgent && !t.isImportant)
  )
);

// 时间轴任务分组（也应用容器过滤）
const allDayTasksPending = computed(() =>
  taskFilterComposable.filterTasks(
    taskStore.tasks.filter(t => t.isAllDay && t.status !== 'completed')
  )
);
const allDayTasksDone = computed(() =>
  taskFilterComposable.filterTasks(
    taskStore.tasks.filter(t => t.isAllDay && t.status === 'completed')
  )
);
const timelineTasks = computed(() =>
  taskFilterComposable.filterTasks(
    taskStore.tasks.filter(t => !t.isAllDay && t.startTime)
  )
);

// 方法
function handleCalendarSwipeLeft() {
  if (calendarComposable.calendarMode.value === 'week') {
    calendarComposable.nextWeek();
  } else {
    calendarComposable.nextMonth();
  }
}

function handleCalendarSwipeRight() {
  if (calendarComposable.calendarMode.value === 'week') {
    calendarComposable.prevWeek();
  } else {
    calendarComposable.prevMonth();
  }
}

function onContentScroll(e) {
  contentScrollTop.value = e.detail.scrollTop;
}

function onContentTouchStart(e) {
  contentTouchStartY.value = e.touches[0].clientY;
}

function onContentTouchMove(e) {
  // 在月视图模式下，如果向上滑动且已滚动到顶部，触发折叠
  if (calendarComposable.calendarMode.value === 'month' && contentScrollTop.value === 0) {
    const dy = e.touches[0].clientY - contentTouchStartY.value;
    if (dy < -50) {
      calendarComposable.collapseToWeek();
    }
  }
}

function onContentTouchEnd() {
  // 清理状态
  contentTouchStartY.value = 0;
}

function toggleFab() {
  fabExpanded.value = !fabExpanded.value;
}

function addTask() {
  // 打开 AddTaskPanel 底部弹窗
  showAddTaskPanel.value = true;
  fabExpanded.value = false;
}

function addLog() {
  uni.navigateTo({
    url: '/pages/calendar/log-edit?date=' + calendarComposable.selectedDate.value
  });
  fabExpanded.value = false;
}

function openTask(task) {
  // 如果有子任务，打开弹窗
  if (task.subtasks && task.subtasks.length > 0) {
    currentSubtaskParent.value = task;
    showSubtaskPopup.value = true;
  } else {
    // 否则跳转到编辑页
    uni.navigateTo({
      url: '/pages/calendar/task-edit?id=' + task.id
    });
  }
}

function closeSubtaskPopup() {
  showSubtaskPopup.value = false;
  currentSubtaskParent.value = null;
}

async function toggleTaskDone(task) {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  await taskStore.updateTask(task.id, { status: newStatus });
}

async function toggleSubtask(subtask) {
  subtask.isDone = !subtask.isDone;
  // 更新父任务的子任务列表
  await taskStore.updateTask(currentSubtaskParent.value.id, {
    subtasks: currentSubtaskParent.value.subtasks
  });
}

/**
 * 拖拽结束处理 (由useDragDrop回调)
 * @param {object} task - 被拖拽的任务
 * @param {string} fromQuadrant - 来源象限
 * @param {string|null} toQuadrant - 目标象限 (null表示删除)
 * @param {object} options - 附加选项 { shouldDelete: boolean }
 */
async function handleDragEnd(task, fromQuadrant, toQuadrant, options = {}) {
  console.log('[index.vue] handleDragEnd - 任务:', task?.title, ', 从:', fromQuadrant, ', 到:', toQuadrant, ', 选项:', options);

  // 场景1: 拖拽到删除区域
  if (options.shouldDelete || toQuadrant === null) {
    console.log('[index.vue] handleDragEnd - 触发删除流程');
    dragOverlayRef.value?.showDeleteDialog();
    return;
  }

  // 场景2: 回到原象限或无效移动
  if (!toQuadrant || fromQuadrant === toQuadrant) {
    console.log('[index.vue] handleDragEnd - 无效移动,取消');
    return;
  }

  // 场景3: 象限切换
  console.log('[index.vue] handleDragEnd - 触发象限切换');
  await quadrantComposable.changeTaskQuadrant(
    task,
    fromQuadrant,
    toQuadrant,
    calendarComposable.selectedDate.value
  );
}

/**
 * 确认象限切换 (重复任务对话框)
 */
async function confirmChangeQuadrant() {
  await quadrantComposable.confirmChangeQuadrant();
  await taskStore.fetchTasksByDate(calendarComposable.selectedDate.value); // 刷新任务列表
}

/**
 * 处理删除任务确认 (删除对话框)
 * @param {number} option - 1=仅删除当天, 2=完整清空, 3=删除当天及未来
 */
async function handleDeleteTaskConfirm(option) {
  const task = dragDropComposable.dragState.value.task;

  if (!task) {
    console.error('[index.vue] handleDeleteTaskConfirm - task为空');
    return;
  }

  console.log('[index.vue] handleDeleteTaskConfirm - 删除选项:', option, ', 任务:', task.title);

  try {
    if (option === 1) {
      // 仅删除当天计划
      console.log('[index.vue] 仅删除当天任务:', task.id);
      await taskStore.removeTask(task.id);
    } else if (option === 2) {
      // 完整清空此条重复计划 (删除整个重复系列)
      console.log('[index.vue] 完整清空重复任务:', task.id);
      // TODO: 调用后端API删除重复任务的所有实例
      await taskStore.removeTask(task.id);
    } else if (option === 3) {
      // 删除当天及未来计划
      console.log('[index.vue] 删除当天及未来任务:', task.id);
      // TODO: 调用后端API删除指定日期之后的所有实例
      await taskStore.removeTask(task.id);
    }

    // 刷新任务列表
    await taskStore.fetchTasksByDate(calendarComposable.selectedDate.value);

    uni.showToast({
      title: '已删除',
      icon: 'success'
    });
  } catch (err) {
    console.error('[index.vue] handleDeleteTaskConfirm - 删除失败:', err);
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    });
  }
}

/**
 * 打开规划和分类侧边抽屉
 */
function goToPlanningCategory() {
  showCategoryDrawer.value = true;
}

/**
 * 处理容器变更事件（来自 CategoryDrawer）
 * @param {object} container - 容器信息 { type, id }
 */
async function handleContainerChanged(container) {
  console.log('[Index] 容器变更:', container);
  // 使用 Composable 的方法设置选中容器
  taskFilterComposable.setSelectedContainer(container);

  // ⭐ 强制刷新任务列表（重新从 Repository 加载数据）
  if (calendarComposable.selectedDate.value) {
    console.log('[Index] 强制刷新任务列表，日期:', calendarComposable.selectedDate.value);
    await taskStore.fetchTasksByDate(calendarComposable.selectedDate.value);
  }
}

/**
 * 处理任务提交成功事件（来自 AddTaskPanel）
 */
async function handleTaskSubmitted() {
  // 关闭弹窗
  showAddTaskPanel.value = false;
  // 刷新当前日期的任务列表
  await taskStore.fetchTasksByDate(calendarComposable.selectedDate.value);
}

function getTaskQuadrantColor(task) {
  const quadrant = getQuadrant(task);
  return getQuadrantColor(quadrant);
}

// 监听选中日期变化，加载任务
watch(
  () => calendarComposable.selectedDate.value,
  async (newDate) => {
    if (newDate) {
      await taskStore.fetchTasksByDate(newDate);
    }
  },
  { immediate: true }
);

// 生命周期
onMounted(async () => {
  //console.log('[index.vue] ========== onMounted 开始 ==========');

  try {
    // 获取状态栏高度
    // #ifdef APP-PLUS
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 0;
    //console.log('[index.vue] APP状态栏高度:', statusBarHeight.value);
    // #endif

    // 恢复选中的容器（分类/规划）
    taskFilterComposable.restoreSelectedContainer();
    console.log('[index.vue] 容器已恢复:', taskFilterComposable.selectedContainer.value);

    // 初始化日历（这会设置 currentWeekStart、selectedDate，并触发 loadHolidays）
    //console.log('[index.vue] 开始初始化日历...');
    calendarComposable.init();
    //console.log('[index.vue] 日历初始化完成');
    //console.log('[index.vue] 当前选中日期:', calendarComposable.selectedDate.value);
    //console.log('[index.vue] 日历模式:', calendarComposable.calendarMode.value);
    //console.log('[index.vue] 当周日期数据:', calendarComposable.currentWeekDates.value);

    //console.log('[index.vue] ========== onMounted 完成 ==========');
  } catch (error) {
    console.error('[index.vue] onMounted 执行出错:', error);
    console.error('[index.vue] 错误堆栈:', error.stack);
  }
});
</script>

<style scoped>
.calendar-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F5F5;
}

.status-bar {
  background: #FFFFFF;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #E8E8E8;
}

.top-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
}

.top-actions {
  display: flex;
  align-items: center;
}

.btn-today {
  padding: 8rpx 20rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #597EF7;
  border: 1rpx solid #597EF7;
  border-radius: 8rpx;
}

.view-switch {
  display: flex;
  background: #F0F0F0;
  border-radius: 8rpx;
  padding: 4rpx;
}

.view-btn {
  padding: 8rpx 16rpx;
  font-size: 26rpx;
  color: #666666;
  border-radius: 6rpx;
  transition: all 0.2s;
}

.view-btn.active {
  background: #FFFFFF;
  color: #333333;
  font-weight: 500;
}

/* 内容区域 */
.content-area {
  flex: 1;
  background: #F5F5F5;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666666;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999999;
}

/* 列表视图 */
.list-view {
  padding: 20rpx 32rpx;
}

.list-section {
  margin-bottom: 40rpx;
}

.list-section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

/* FAB 悬浮按钮 */
.fab-container {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  z-index: 100;
}

.fab-menu {
  margin-bottom: 20rpx;
}

.fab-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  background: #FFFFFF;
  padding: 16rpx 24rpx;
  border-radius: 48rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.fab-item-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.fab-item-label {
  font-size: 28rpx;
  color: #333333;
}

.fab-btn {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667EEA 0%, #597EF7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(89, 126, 247, 0.4);
  transition: all 0.3s;
}

.fab-btn.expanded {
  transform: rotate(45deg);
}

.fab-icon {
  font-size: 64rpx;
  color: #FFFFFF;
  line-height: 1;
}

/* 子任务弹窗蒙层（保留，非拖拽相关） */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 子任务弹窗 */
.subtask-popup {
  width: 640rpx;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  overflow-y: auto;
}

.subtask-parent {
  display: flex;
  align-items: center;
  padding-bottom: 24rpx;
}

.task-checkbox {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.check-icon {
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: bold;
}

.task-title {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
}

.subtask-divider {
  height: 2rpx;
  background: #E8E8E8;
  margin-bottom: 24rpx;
}

.subtask-list {
  /* 样式 */
}

.subtask-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.subtask-checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.subtask-checkbox.checked {
  background: #597EF7;
  border-color: #597EF7;
}

.subtask-text {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.subtask-text.done {
  text-decoration: line-through;
  color: #999999;
}
</style>
