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
      <!-- 空状态 -->
      <view v-if="!taskStore.loading && taskStore.tasks.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">今天还没有任何安排</text>
        <text class="empty-hint">点击右下角 + 添加任务</text>
      </view>

      <!-- 时间轴视图 -->
      <timeline-view
        v-if="currentView === 'timeline'"
        :selected-date="calendarComposable.selectedDate.value"
        :all-day-tasks-pending="allDayTasksPending"
        :all-day-tasks-done="allDayTasksDone"
        :timed-tasks="timelineTasks"
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
        @task-click="openTask"
        @checkbox-click="toggleTaskDone"
        @drag-start="dragDropComposable.startDrag"
        @drop="handleDrop"
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

    <!-- 拖拽中的任务浮层 -->
    <view
      v-if="dragDropComposable.dragState.value.dragging"
      class="drag-overlay"
      :style="{
        left: dragDropComposable.dragState.value.x + 'px',
        top: dragDropComposable.dragState.value.y + 'px'
      }"
    >
      <text class="drag-text">{{ dragDropComposable.dragState.value.task?.title }}</text>
    </view>

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

    <!-- 象限切换弹窗 -->
    <view
      v-if="quadrantComposable.showChangeQuadrantDialog.value"
      class="modal-overlay"
      @tap="quadrantComposable.closeChangeQuadrantDialog"
    >
      <view class="modal-content" @tap.stop>
        <text class="modal-title">选择更改范围</text>
        <view class="modal-options">
          <view
            class="modal-option"
            :class="{ active: quadrantComposable.changeQuadrantOption.value === 1 }"
            @tap="quadrantComposable.changeQuadrantOption.value = 1"
          >
            <text class="option-text">全部更改</text>
          </view>
          <view
            class="modal-option"
            :class="{ active: quadrantComposable.changeQuadrantOption.value === 2 }"
            @tap="quadrantComposable.changeQuadrantOption.value = 2"
          >
            <text class="option-text">仅当天及未来</text>
          </view>
        </view>
        <view class="modal-actions">
          <text class="modal-btn modal-btn-cancel" @tap="quadrantComposable.closeChangeQuadrantDialog">取消</text>
          <text class="modal-btn modal-btn-confirm" @tap="confirmChangeQuadrant">确定</text>
        </view>
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
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTaskStore } from '@/store/task';
import { useCalendar } from '@/composables/useCalendar';
import { useDragDrop } from '@/composables/useDragDrop';
import { useTaskQuadrant } from '@/composables/useTaskQuadrant';
import { getQuadrant, getQuadrantColor } from '@/utils/quadrant';
import { formatDate, getToday } from '@/utils/date';
import CalendarBar from '@/components/calendar/CalendarBar.vue';
import TaskQuadrantView from '@/components/calendar/TaskQuadrantView.vue';
import TimelineView from '@/components/calendar/TimelineView.vue';
import TaskCard from '@/components/calendar/TaskCard.vue';

// Store
const taskStore = useTaskStore();

// Composables
const calendarComposable = useCalendar();
const dragDropComposable = useDragDrop({
  onDrop: handleDrop
});
const quadrantComposable = useTaskQuadrant();

// 状态
const statusBarHeight = ref(0);
const currentView = ref('quadrant'); // 'timeline' | 'quadrant' | 'list'
const fabExpanded = ref(false);
const scrollTop = ref(0);
const showSubtaskPopup = ref(false);
const currentSubtaskParent = ref(null);

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

// 四象限任务分组（使用 taskStore 的计算属性）
const urgentImportant = computed(() => taskStore.urgentImportant);
const urgentImportantDone = computed(() =>
  taskStore.doneTasks.filter(t => t.isUrgent && t.isImportant)
);
const notUrgentImportant = computed(() => taskStore.notUrgentImportant);
const notUrgentImportantDone = computed(() =>
  taskStore.doneTasks.filter(t => !t.isUrgent && t.isImportant)
);
const urgentNotImportant = computed(() => taskStore.urgentNotImportant);
const urgentNotImportantDone = computed(() =>
  taskStore.doneTasks.filter(t => t.isUrgent && !t.isImportant)
);
const notUrgentNotImportant = computed(() => taskStore.notUrgentNotImportant);
const notUrgentNotImportantDone = computed(() =>
  taskStore.doneTasks.filter(t => !t.isUrgent && !t.isImportant)
);

// 时间轴任务分组
const allDayTasksPending = computed(() =>
  taskStore.tasks.filter(t => t.isAllDay && t.status !== 'completed')
);
const allDayTasksDone = computed(() =>
  taskStore.tasks.filter(t => t.isAllDay && t.status === 'completed')
);
const timelineTasks = computed(() =>
  taskStore.tasks.filter(t => !t.isAllDay && t.startTime)
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
  uni.navigateTo({
    url: '/pages/calendar/task-edit?date=' + calendarComposable.selectedDate.value
  });
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

async function handleDrop(e, toQuadrant) {
  const { task, fromQuadrant } = dragDropComposable.dragState.value;

  if (!task || fromQuadrant === toQuadrant) {
    dragDropComposable.cancelDrag();
    return;
  }

  // 调用 Composable 的象限切换逻辑
  await quadrantComposable.changeTaskQuadrant(
    task,
    fromQuadrant,
    toQuadrant,
    calendarComposable.selectedDate.value
  );

  dragDropComposable.cancelDrag();
}

async function confirmChangeQuadrant() {
  await quadrantComposable.confirmChangeQuadrant();
}

function goToPlanningCategory() {
  uni.showToast({
    title: '规划分类功能开发中',
    icon: 'none'
  });
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
  console.log('[index.vue] ========== onMounted 开始 ==========');
  console.log('[index.vue] 当前选中日期:', calendarComposable.selectedDate.value);
  console.log('[index.vue] 日历模式:', calendarComposable.calendarMode.value);
  console.log('[index.vue] 当周日期数据:', calendarComposable.currentWeekDates.value);

  try {
    // 获取状态栏高度
    // #ifdef APP-PLUS
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 0;
    console.log('[index.vue] APP状态栏高度:', statusBarHeight.value);
    // #endif

    // 加载节日数据
    console.log('[index.vue] 开始加载节日数据...');
    await calendarComposable.loadHolidays();
    console.log('[index.vue] 节日数据加载完成, holidayMap:', calendarComposable.holidayMap.value);

    // 加载今日任务
    console.log('[index.vue] 开始加载任务数据...');
    await taskStore.fetchTasksByDate(calendarComposable.selectedDate.value);
    console.log('[index.vue] 任务数据加载完成, 任务数量:', taskStore.tasks.length);
    console.log('[index.vue] 任务列表:', taskStore.tasks);

    console.log('[index.vue] ========== onMounted 完成 ==========');
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

/* 拖拽浮层 */
.drag-overlay {
  position: fixed;
  z-index: 9999;
  padding: 16rpx 24rpx;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12rpx;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.drag-text {
  font-size: 28rpx;
  color: #FFFFFF;
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

/* 弹窗 */
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

.modal-content {
  width: 600rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 32rpx;
  display: block;
  text-align: center;
}

.modal-options {
  margin-bottom: 32rpx;
}

.modal-option {
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.modal-option.active {
  background: #E6F0FF;
  border-color: #597EF7;
}

.option-text {
  font-size: 28rpx;
  color: #333333;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
}

.modal-btn {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  border-radius: 12rpx;
}

.modal-btn-cancel {
  background: #F0F0F0;
  color: #666666;
  margin-right: 16rpx;
}

.modal-btn-confirm {
  background: #597EF7;
  color: #FFFFFF;
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
