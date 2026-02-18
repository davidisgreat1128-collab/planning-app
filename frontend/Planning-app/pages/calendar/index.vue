<template>
  <view class="calendar-page">
    <!-- 自定义状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部：标题 + 操作栏 -->
    <view class="top-bar">
      <text class="top-title">做计划</text>
      <view class="top-actions">
        <text class="btn-today" @tap="goToday">今</text>
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

    <!-- 日历条（周模式 or 月模式） -->
    <view
      ref="calBarRef"
      class="calendar-bar"
      :class="{ 'month-mode': calendarMode === 'month' }"
      @touchstart="onCalTouchStart"
      @touchmove="onCalTouchMove"
      @touchend="onCalTouchEnd"
    >
      <!-- 星期头 -->
      <view class="week-header">
        <text v-for="d in weekDays" :key="d" class="week-day-name">{{ d }}</text>
      </view>

      <!-- 周模式：只显示1行7天 -->
      <view v-if="calendarMode === 'week'" class="week-dates">
        <view
          v-for="item in currentWeekDates"
          :key="item.dateStr"
          class="date-cell"
          :class="{
            selected: item.dateStr === selectedDate,
            today: item.dateStr === todayStr,
            'has-task': item.hasTask
          }"
          @tap="selectDate(item.dateStr)"
        >
          <text class="lunar-label">{{ item.lunarLabel }}</text>
          <view class="date-circle">
            <text class="date-num">{{ item.day }}</text>
          </view>
          <view v-if="item.hasTask" class="task-dot"></view>
        </view>
      </view>

      <!-- 月模式：6行×7列 = 42天 -->
      <view v-else class="month-grid">
        <view
          v-for="(row, ri) in monthRows"
          :key="ri"
          class="month-row"
        >
          <view
            v-for="item in row"
            :key="item.dateStr"
            class="date-cell month-cell"
            :class="{
              selected: item.dateStr === selectedDate,
              today: item.dateStr === todayStr,
              'has-task': item.hasTask,
              'other-month': item.otherMonth
            }"
            @tap="selectDate(item.dateStr)"
          >
            <text class="lunar-label">{{ item.lunarLabel }}</text>
            <view class="date-circle">
              <text class="date-num">{{ item.day }}</text>
            </view>
            <view v-if="item.hasTask" class="task-dot"></view>
          </view>
        </view>
      </view>

      <!-- 月份/年份标签 -->
      <view class="cal-month-label">
        <text>{{ currentMonthLabel }}</text>
      </view>
    </view>

    <!-- 内容区（可滚动） -->
    <scroll-view
      ref="contentAreaRef"
      class="content-area"
      scroll-y
      :scroll-top="scrollTop"
      @scroll="onContentScroll"
      @touchstart="onContentTouchStart"
      @touchmove="onContentTouchMove"
      @touchend="onContentTouchEnd"
    >
      <!-- 空状态 -->
      <view v-if="!taskStore.loading && taskStore.tasks.length === 0 && logStore.logs.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">今天还没有任何安排</text>
        <text class="empty-hint">点击右下角 + 添加任务</text>
      </view>

      <!-- 时间轴视图 -->
      <view v-if="currentView === 'timeline'" class="timeline-view">
        <!-- 全天任务 -->
        <view v-if="allDayTasks.length > 0" class="allday-section">
          <text class="section-title">全天</text>
          <view
            v-for="task in allDayTasks"
            :key="task.id"
            class="task-item"
            :class="['quad-' + getQuadrant(task), { done: task.status === 'completed' }]"
            @tap="openTask(task)"
          >
            <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
              <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
            </view>
            <text class="task-title">{{ task.title }}</text>
            <view class="task-quad-tag" :class="'tag-' + getQuadrant(task)">
              <text>{{ quadrantLabel(task) }}</text>
            </view>
          </view>
        </view>

        <!-- 时间轴 -->
        <view class="timeline-slots">
          <!-- 当前时间红线（仅今天显示） -->
          <view
            v-if="selectedDate === todayStr"
            class="time-indicator"
            :style="{ top: currentTimeTop + 'rpx' }"
          >
            <view class="time-dot"></view>
            <view class="time-line"></view>
          </view>

          <view v-for="hour in hours" :key="hour" class="hour-slot">
            <text class="hour-label">{{ hour < 10 ? '0' + hour : hour }}:00</text>
            <view class="hour-content">
              <view
                v-for="task in getTasksAtHour(hour)"
                :key="task.id"
                class="timeline-task"
                :class="['quad-' + getQuadrant(task), { done: task.status === 'completed' }]"
                @tap="openTask(task)"
              >
                <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
                  <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
                </view>
                <view class="timeline-task-info">
                  <text class="task-title">{{ task.title }}</text>
                  <text class="task-time-label">{{ task.startTime }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 日志列表 -->
        <view v-if="logStore.logs.length > 0" class="log-section">
          <text class="section-title">日志记录</text>
          <view
            v-for="log in logStore.logs"
            :key="log.id"
            class="log-item"
            @tap="openLog(log)"
          >
            <text class="log-time">{{ formatLogTime(log.logTime) }}</text>
            <text class="log-content">{{ log.content }}</text>
            <text class="log-convert" @tap.stop="convertLog(log.id)">→任务</text>
          </view>
        </view>
      </view>

      <!-- 四象限视图 -->
      <view v-if="currentView === 'quadrant'" class="quadrant-view">
        <view class="quadrant-row">
          <view class="quadrant-cell q1">
            <view class="quad-header">
              <text class="quad-icon">🔴</text>
              <text class="quad-title">紧急重要</text>
              <text class="quad-count">{{ taskStore.urgentImportant.length }}</text>
            </view>
            <view class="quad-tasks">
              <view
                v-for="task in taskStore.urgentImportant"
                :key="task.id"
                class="quad-task-item"
                @tap="openTask(task)"
              >
                <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
                  <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
                </view>
                <text class="task-title">{{ task.title }}</text>
              </view>
              <text v-if="taskStore.urgentImportant.length === 0" class="quad-empty">暂无</text>
            </view>
          </view>
          <view class="quadrant-cell q2">
            <view class="quad-header">
              <text class="quad-icon">🔵</text>
              <text class="quad-title">重要不紧急</text>
              <text class="quad-count">{{ taskStore.notUrgentImportant.length }}</text>
            </view>
            <view class="quad-tasks">
              <view
                v-for="task in taskStore.notUrgentImportant"
                :key="task.id"
                class="quad-task-item"
                @tap="openTask(task)"
              >
                <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
                  <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
                </view>
                <text class="task-title">{{ task.title }}</text>
              </view>
              <text v-if="taskStore.notUrgentImportant.length === 0" class="quad-empty">暂无</text>
            </view>
          </view>
        </view>
        <view class="quadrant-row">
          <view class="quadrant-cell q3">
            <view class="quad-header">
              <text class="quad-icon">🟡</text>
              <text class="quad-title">紧急不重要</text>
              <text class="quad-count">{{ taskStore.urgentNotImportant.length }}</text>
            </view>
            <view class="quad-tasks">
              <view
                v-for="task in taskStore.urgentNotImportant"
                :key="task.id"
                class="quad-task-item"
                @tap="openTask(task)"
              >
                <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
                  <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
                </view>
                <text class="task-title">{{ task.title }}</text>
              </view>
              <text v-if="taskStore.urgentNotImportant.length === 0" class="quad-empty">暂无</text>
            </view>
          </view>
          <view class="quadrant-cell q4">
            <view class="quad-header">
              <text class="quad-icon">🟢</text>
              <text class="quad-title">不急不重要</text>
              <text class="quad-count">{{ taskStore.notUrgentNotImportant.length }}</text>
            </view>
            <view class="quad-tasks">
              <view
                v-for="task in taskStore.notUrgentNotImportant"
                :key="task.id"
                class="quad-task-item"
                @tap="openTask(task)"
              >
                <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
                  <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
                </view>
                <text class="task-title">{{ task.title }}</text>
              </view>
              <text v-if="taskStore.notUrgentNotImportant.length === 0" class="quad-empty">暂无</text>
            </view>
          </view>
        </view>
        <view v-if="taskStore.doneTasks.length > 0" class="done-section">
          <text class="section-title done-title">已完成 ({{ taskStore.doneTasks.length }})</text>
          <view
            v-for="task in taskStore.doneTasks"
            :key="task.id"
            class="task-item done"
            @tap="openTask(task)"
          >
            <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
              <text class="check-icon">✓</text>
            </view>
            <text class="task-title done-text">{{ task.title }}</text>
          </view>
        </view>
      </view>

      <!-- 列表视图 -->
      <view v-if="currentView === 'list'" class="list-view">
        <view class="task-list">
          <view
            v-for="task in taskStore.tasks"
            :key="task.id"
            class="task-item"
            :class="['quad-' + getQuadrant(task), { done: task.status === 'completed' }]"
            @tap="openTask(task)"
          >
            <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
              <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
            </view>
            <view class="task-info">
              <text class="task-title">{{ task.title }}</text>
              <text v-if="task.startTime" class="task-time-label">{{ task.startTime }}</text>
            </view>
            <view class="task-quad-tag" :class="'tag-' + getQuadrant(task)">
              <text>{{ quadrantLabel(task) }}</text>
            </view>
          </view>
          <view v-if="taskStore.tasks.length === 0" class="list-empty">
            <text class="empty-text">当天没有任务</text>
          </view>
        </view>
      </view>

      <view v-if="taskStore.loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view class="bottom-safe" :style="{ height: (tabBarHeight + 20) + 'px' }"></view>
    </scroll-view>

    <!-- 浮动 + 按钮 -->
    <view class="fab-area" :style="{ bottom: (tabBarHeight + 20) + 'px' }">
      <view v-if="fabOpen" class="fab-menu">
        <view class="fab-menu-item" @tap="openCreateLog">
          <view class="fab-menu-icon">📝</view>
          <text class="fab-menu-label">记日志</text>
        </view>
        <view class="fab-menu-item" @tap="openCreateTask">
          <view class="fab-menu-icon">✅</view>
          <text class="fab-menu-label">加任务</text>
        </view>
      </view>
      <view class="fab-btn" :class="{ open: fabOpen }" @tap="fabOpen = !fabOpen">
        <text class="fab-icon">{{ fabOpen ? '×' : '+' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTaskStore } from '@/store/task.js';
import { useLogStore } from '@/store/log.js';
import { getHolidaysByRange, getLunarInfoRange } from '@/api/holiday.js';

// ============================================================
// Store
// ============================================================
const taskStore = useTaskStore();
const logStore = useLogStore();

// ============================================================
// 状态变量
// ============================================================
const statusBarHeight = ref(20);
const tabBarHeight = ref(50);
const currentView = ref('timeline');
const fabOpen = ref(false);
const selectedDate = ref('');

// 日历模式：'week' | 'month'
const calendarMode = ref('week');

// 周模式：当前周的周一
const currentWeekStart = ref(null);

// 月模式：当前月的1号（Date对象）
const currentMonthFirst = ref(null);

// 节日农历缓存 key=YYYY-MM-DD
const holidayMap = ref({});

// 当前时间分钟数（红线）
const currentMinutes = ref(0);
let timeTimer = null;

// scroll-view 当前滚动位置
const contentScrollTop = ref(0);
// 用于重置 scroll-view scrollTop（先设大值再设0达到重置效果时避免触发）
const scrollTop = ref(0);

// H5 鼠标模拟触摸用 DOM ref
const calBarRef = ref(null);
const contentAreaRef = ref(null);

// 触摸追踪
let calTouchStartX = 0;
let calTouchStartY = 0;
let calTouchMoved = false; // 是否已触发方向判断
let calTouchDir = ''; // 'h' | 'v' | ''

let contentTouchStartY = 0;
let contentTouchMoved = false;

// ============================================================
// 常量
// ============================================================
// 周一到周日
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const hours = Array.from({ length: 24 }, (_, i) => i);
const viewModes = [
  { key: 'timeline', label: '时间轴' },
  { key: 'quadrant', label: '四象限' },
  { key: 'list', label: '列表' }
];

// ============================================================
// 工具函数
// ============================================================

/** 格式化日期为 YYYY-MM-DD */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const todayStr = formatDate(new Date());

/**
 * 获取给定日期所在周的周一
 * JS: getDay() 0=周日 1=周一 ... 6=周六
 */
function getWeekMonday(date) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=周日
  // 距周一的偏移：周日=-6，周一=0，周二=-1...
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 获取某月1号 */
function getMonthFirst(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================
// 计算属性
// ============================================================

/** 当前周7天（周一~周日） */
const currentWeekDates = computed(() => {
  if (!currentWeekStart.value) return [];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    const hasTask = taskStore.tasks.some(t => (t.taskDate || '').startsWith(dateStr));
    return {
      dateStr,
      day: d.getDate(),
      lunarLabel: holidayMap.value[dateStr] || '',
      hasTask
    };
  });
});

/**
 * 月模式：42格（6行×7列），以当月1号所在周的周一为起点
 * 返回二维数组 monthRows[6][7]
 */
const monthRows = computed(() => {
  if (!currentMonthFirst.value) return [];

  // 找到本月1号所在周的周一
  const gridStart = getWeekMonday(currentMonthFirst.value);
  const curMonth = currentMonthFirst.value.getMonth();

  const rows = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + r * 7 + c);
      const dateStr = formatDate(d);
      const hasTask = taskStore.tasks.some(t => (t.taskDate || '').startsWith(dateStr));
      row.push({
        dateStr,
        day: d.getDate(),
        lunarLabel: holidayMap.value[dateStr] || '',
        hasTask,
        otherMonth: d.getMonth() !== curMonth
      });
    }
    rows.push(row);
  }
  return rows;
});

/** 月份标签（如 2026年2月） */
const currentMonthLabel = computed(() => {
  if (calendarMode.value === 'month' && currentMonthFirst.value) {
    const d = currentMonthFirst.value;
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }
  if (!currentWeekStart.value) return '';
  // 取周中间日（周四）所在月
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 3);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
});

/** 当前时间红线位置（rpx，每小时120rpx） */
const currentTimeTop = computed(() => {
  return Math.round((currentMinutes.value / 60) * 120);
});

/** 全天任务 */
const allDayTasks = computed(() =>
  taskStore.tasks.filter(t => t.isAllDay && t.status !== 'completed')
);

// ============================================================
// 日历条触摸处理
// ============================================================

function onCalTouchStart(e) {
  calTouchStartX = e.touches[0].clientX;
  calTouchStartY = e.touches[0].clientY;
  calTouchMoved = false;
  calTouchDir = '';
}

function onCalTouchMove(e) {
  if (calTouchMoved) return; // 方向已判断，不重复
  const dx = e.touches[0].clientX - calTouchStartX;
  const dy = e.touches[0].clientY - calTouchStartY;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;

  calTouchMoved = true;
  calTouchDir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
}

function onCalTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - calTouchStartX;
  const dy = e.changedTouches[0].clientY - calTouchStartY;

  if (calTouchDir === 'h' && Math.abs(dx) > 50) {
    // 水平滑动：切周/月
    if (calendarMode.value === 'week') {
      dx < 0 ? nextWeek() : prevWeek();
    } else {
      dx < 0 ? nextMonth() : prevMonth();
    }
  } else if (calTouchDir === 'v') {
    if (calendarMode.value === 'week' && dy > 60) {
      // 周模式下向下拉 → 展开月视图
      expandToMonth();
    } else if (calendarMode.value === 'month' && dy < -60) {
      // 月模式下向上滑 → 折叠回周视图
      collapseToWeek();
    }
  }
}

// ============================================================
// 内容区触摸处理（月模式下在顶部上滑 → 折叠）
// ============================================================

function onContentTouchStart(e) {
  contentTouchStartY = e.touches[0].clientY;
  contentTouchMoved = false;
}

function onContentTouchMove() {
  contentTouchMoved = true;
}

function onContentTouchEnd(e) {
  if (!contentTouchMoved) return;
  const dy = e.changedTouches[0].clientY - contentTouchStartY;
  // 月模式下，内容区在顶部往上滑 → 折叠
  if (calendarMode.value === 'month' && dy < -60 && contentScrollTop.value <= 0) {
    collapseToWeek();
  }
}

function onContentScroll(e) {
  contentScrollTop.value = e.detail.scrollTop;
}

// ============================================================
// 展开 / 折叠
// ============================================================

function expandToMonth() {
  // 以当前选中日期所在月展开
  currentMonthFirst.value = getMonthFirst(selectedDate.value || new Date());
  calendarMode.value = 'month';
  // 加载月视图范围的农历
  loadHolidaysForMonth();
}

function collapseToWeek() {
  calendarMode.value = 'week';
  // 周起始对齐当前选中日期
  currentWeekStart.value = getWeekMonday(selectedDate.value || new Date());
  loadHolidays();
}

// ============================================================
// 切周 / 切月
// ============================================================

function prevWeek() {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() - 7);
  currentWeekStart.value = d;
  loadHolidays();
}

function nextWeek() {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 7);
  currentWeekStart.value = d;
  loadHolidays();
}

function prevMonth() {
  const d = new Date(currentMonthFirst.value);
  d.setMonth(d.getMonth() - 1);
  currentMonthFirst.value = getMonthFirst(d);
  loadHolidaysForMonth();
}

function nextMonth() {
  const d = new Date(currentMonthFirst.value);
  d.setMonth(d.getMonth() + 1);
  currentMonthFirst.value = getMonthFirst(d);
  loadHolidaysForMonth();
}

// ============================================================
// 业务方法
// ============================================================

/** 选中某天 */
async function selectDate(dateStr) {
  selectedDate.value = dateStr;
  taskStore.selectedDate = dateStr;
  // 月模式下点击日期后折叠回周，并对齐到该日期所在周
  if (calendarMode.value === 'month') {
    currentWeekStart.value = getWeekMonday(dateStr);
    calendarMode.value = 'week';
    loadHolidays();
  }
  await Promise.all([
    taskStore.fetchTasksByDate(dateStr),
    logStore.fetchLogsByDate(dateStr)
  ]);
}

/** 回到今天 */
function goToday() {
  calendarMode.value = 'week';
  currentWeekStart.value = getWeekMonday(new Date());
  selectDate(todayStr);
}

/** 获取任务所属象限 */
function getQuadrant(task) {
  if (task.isUrgent && task.isImportant) return 'q1';
  if (!task.isUrgent && task.isImportant) return 'q2';
  if (task.isUrgent && !task.isImportant) return 'q3';
  return 'q4';
}

function quadrantLabel(task) {
  if (task.isUrgent && task.isImportant) return '紧急';
  if (!task.isUrgent && task.isImportant) return '重要';
  if (task.isUrgent && !task.isImportant) return '琐事';
  return '待排';
}

function getTasksAtHour(hour) {
  return taskStore.timelineTasks.filter(t => {
    if (!t.startTime) return false;
    return parseInt(t.startTime.split(':')[0]) === hour;
  });
}

function formatLogTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function openTask(task) {
  fabOpen.value = false;
  uni.navigateTo({ url: `/pages/calendar/task-edit?id=${task.id}&date=${selectedDate.value}` });
}

function openCreateTask() {
  fabOpen.value = false;
  uni.navigateTo({ url: `/pages/calendar/task-edit?date=${selectedDate.value}` });
}

function openCreateLog() {
  fabOpen.value = false;
  uni.navigateTo({ url: `/pages/calendar/log-edit?date=${selectedDate.value}` });
}

function openLog(log) {
  uni.navigateTo({ url: `/pages/calendar/log-edit?id=${log.id}&date=${selectedDate.value}` });
}

async function convertLog(logId) {
  try {
    await logStore.toTask(logId);
    uni.showToast({ title: '已转为任务', icon: 'success' });
    await taskStore.fetchTasksByDate(selectedDate.value);
  } catch (err) {
    uni.showToast({ title: err.message || '转换失败', icon: 'none' });
  }
}

// ============================================================
// 节日农历加载
// ============================================================

/** 加载当前周的节日 + 农历 */
async function loadHolidays() {
  try {
    if (!currentWeekStart.value) return;
    const weekEnd = new Date(currentWeekStart.value);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const start = formatDate(currentWeekStart.value);
    const end = formatDate(weekEnd);
    await _loadHolidayRange(start, end);
  } catch (err) {
    console.warn('[Calendar] 节日农历加载失败:', err);
  }
}

/** 加载当前月（+上下各补位行）的节日 + 农历 */
async function loadHolidaysForMonth() {
  try {
    if (!currentMonthFirst.value) return;
    // 42格的起止范围
    const gridStart = getWeekMonday(currentMonthFirst.value);
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 41);
    await _loadHolidayRange(formatDate(gridStart), formatDate(gridEnd));
  } catch (err) {
    console.warn('[Calendar] 月历农历加载失败:', err);
  }
}

async function _loadHolidayRange(start, end) {
  const [holidayRes, lunarRes] = await Promise.all([
    getHolidaysByRange(start, end),
    getLunarInfoRange(start, end)
  ]);

  // 节日：优先展示法定节假日/节气
  const hMap = holidayRes?.holidayMap || {};
  Object.entries(hMap).forEach(([date, list]) => {
    if (Array.isArray(list) && list.length > 0) {
      const sorted = [...list].sort((a, b) => {
        const order = { public_holiday: 0, solar_term: 1 };
        return (order[a.type] ?? 2) - (order[b.type] ?? 2);
      });
      holidayMap.value[date] = sorted[0].shortName || sorted[0].name;
    }
  });

  // 农历（仅无节日标注时）
  const lMap = lunarRes?.lunarMap || {};
  Object.entries(lMap).forEach(([date, info]) => {
    if (!holidayMap.value[date] && info) {
      holidayMap.value[date] = info.lunarDayName || '';
    }
  });
}

function updateCurrentTime() {
  const now = new Date();
  currentMinutes.value = now.getHours() * 60 + now.getMinutes();
}

// ============================================================
// H5 鼠标模拟触摸（条件编译，仅 H5 端构建时包含）
// ============================================================
// #ifdef H5
/**
 * 把鼠标事件转换为与 touch 事件相同的结构，
 * 复用 onCalTouchStart/Move/End 和 onContentTouchStart/Move/End。
 *
 * 策略：
 * - mousedown 在 calBarEl / contentAreaEl 上时，记录目标并触发对应 TouchStart
 * - mousemove / mouseup 绑定在 document 上，保证鼠标移出元素后仍能触发 End
 * - mouseleave document 视同 mouseup
 */

let _h5MouseTarget = null; // 'cal' | 'content' | null
let _h5Dragging = false;

function _fakeTouch(clientX, clientY) {
  return { touches: [{ clientX, clientY }], changedTouches: [{ clientX, clientY }] };
}

function _onMouseDown(e) {
  if (e.button !== 0) return; // 只处理左键
  const calEl = calBarRef.value?.$el ?? calBarRef.value;
  const contentEl = contentAreaRef.value?.$el ?? contentAreaRef.value;
  if (calEl && calEl.contains(e.target)) {
    _h5MouseTarget = 'cal';
    _h5Dragging = true;
    onCalTouchStart(_fakeTouch(e.clientX, e.clientY));
  } else if (contentEl && contentEl.contains(e.target)) {
    _h5MouseTarget = 'content';
    _h5Dragging = true;
    onContentTouchStart(_fakeTouch(e.clientX, e.clientY));
  }
}

function _onMouseMove(e) {
  if (!_h5Dragging) return;
  if (_h5MouseTarget === 'cal') {
    onCalTouchMove(_fakeTouch(e.clientX, e.clientY));
  } else if (_h5MouseTarget === 'content') {
    onContentTouchMove();
  }
}

function _onMouseUp(e) {
  if (!_h5Dragging) return;
  _h5Dragging = false;
  if (_h5MouseTarget === 'cal') {
    onCalTouchEnd(_fakeTouch(e.clientX, e.clientY));
  } else if (_h5MouseTarget === 'content') {
    onContentTouchEnd(_fakeTouch(e.clientX, e.clientY));
  }
  _h5MouseTarget = null;
}

function h5BindMouseEvents() {
  document.addEventListener('mousedown', _onMouseDown);
  document.addEventListener('mousemove', _onMouseMove);
  document.addEventListener('mouseup', _onMouseUp);
  document.addEventListener('mouseleave', _onMouseUp);
}

function h5UnbindMouseEvents() {
  document.removeEventListener('mousedown', _onMouseDown);
  document.removeEventListener('mousemove', _onMouseMove);
  document.removeEventListener('mouseup', _onMouseUp);
  document.removeEventListener('mouseleave', _onMouseUp);
}
// #endif

// ============================================================
// 生命周期
// ============================================================
onMounted(async () => {
  try {
    const info = uni.getSystemInfoSync();
    statusBarHeight.value = info.statusBarHeight || 20;
    tabBarHeight.value = 50;
  } catch (e) {}

  currentWeekStart.value = getWeekMonday(new Date());
  currentMonthFirst.value = getMonthFirst(new Date());
  selectedDate.value = todayStr;
  taskStore.selectedDate = todayStr;

  updateCurrentTime();
  await Promise.all([
    taskStore.fetchTasksByDate(todayStr),
    logStore.fetchLogsByDate(todayStr),
    loadHolidays()
  ]);

  timeTimer = setInterval(updateCurrentTime, 60000);

  // #ifdef H5
  h5BindMouseEvents();
  // #endif
});

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
  // #ifdef H5
  h5UnbindMouseEvents();
  // #endif
});
</script>

<style scoped>
/* ============================================================
   页面容器
   ============================================================ */
.calendar-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F6FA;
  position: relative;
}

.status-bar {
  background-color: #FFFFFF;
  flex-shrink: 0;
}

/* ============================================================
   顶部操作栏
   ============================================================ */
.top-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #FFFFFF;
  padding: 0 32rpx 16rpx;
  flex-shrink: 0;
}

.top-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1A1A2E;
}

.top-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
}

.btn-today {
  font-size: 26rpx;
  color: #5B8CFF;
  border: 2rpx solid #5B8CFF;
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
}

.view-switch {
  display: flex;
  flex-direction: row;
  background-color: #F0F2F5;
  border-radius: 20rpx;
  padding: 4rpx;
}

.view-btn {
  font-size: 24rpx;
  color: #888;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.view-btn.active {
  background-color: #FFFFFF;
  color: #5B8CFF;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

/* ============================================================
   日历条（周/月通用外壳）
   ============================================================ */
.calendar-bar {
  background-color: #FFFFFF;
  padding: 0 16rpx 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  /* 默认周模式高度不限制，由内容撑开 */
  overflow: hidden;
  transition: height 0.3s ease;
}

/* ============================================================
   星期头（周一到周日）
   ============================================================ */
.week-header {
  display: flex;
  flex-direction: row;
  padding: 8rpx 0 4rpx;
}

.week-day-name {
  flex: 1;
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

/* ============================================================
   周模式：单行7格
   ============================================================ */
.week-dates {
  display: flex;
  flex-direction: row;
}

/* ============================================================
   月模式：6行×7列
   ============================================================ */
.month-grid {
  display: flex;
  flex-direction: column;
}

.month-row {
  display: flex;
  flex-direction: row;
}

/* ============================================================
   日期格（周/月复用）
   ============================================================ */
.date-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rpx 0;
  position: relative;
  min-width: 0;
}

/* 月模式格子稍矮 */
.month-cell {
  padding: 2rpx 0;
}

.lunar-label {
  font-size: 18rpx;
  color: #aaa;
  height: 24rpx;
  line-height: 24rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding: 0 2rpx;
}

.date-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2rpx 0;
}

/* 月模式稍小 */
.month-cell .date-circle {
  width: 52rpx;
  height: 52rpx;
}

.date-num {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.month-cell .date-num {
  font-size: 28rpx;
}

/* 选中 */
.date-cell.selected .date-circle {
  background-color: #5B8CFF;
}
.date-cell.selected .date-num {
  color: #FFFFFF;
  font-weight: bold;
}

/* 今天（未选中） */
.date-cell.today:not(.selected) .date-circle {
  border: 2rpx dashed #5B8CFF;
}
.date-cell.today:not(.selected) .date-num {
  color: #5B8CFF;
}

/* 非本月（月模式补位日期） */
.date-cell.other-month .date-num {
  color: #CCC;
}
.date-cell.other-month .lunar-label {
  color: #DDD;
}

/* 有任务圆点 */
.task-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: #5B8CFF;
  margin-top: 2rpx;
}

/* 月份标签 */
.cal-month-label {
  text-align: center;
  padding: 6rpx 0 2rpx;
}
.cal-month-label text {
  font-size: 22rpx;
  color: #bbb;
}

/* ============================================================
   内容滚动区
   ============================================================ */
.content-area {
  flex: 1;
  overflow: hidden;
}

/* ============================================================
   空状态
   ============================================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.empty-icon { font-size: 100rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 32rpx; color: #999; margin-bottom: 12rpx; }
.empty-hint { font-size: 26rpx; color: #bbb; }

/* ============================================================
   任务项基础样式
   ============================================================ */
.task-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 0 24rpx 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border-left: 8rpx solid #5B8CFF;
}
.task-item.quad-q1 { border-left-color: #FF4444; }
.task-item.quad-q2 { border-left-color: #5B8CFF; }
.task-item.quad-q3 { border-left-color: #FFB300; }
.task-item.quad-q4 { border-left-color: #4CAF50; }
.task-item.done    { border-left-color: #CCC; opacity: 0.7; }

.task-check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid #DDD;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.check-icon { font-size: 24rpx; color: #4CAF50; }

.task-title {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  line-height: 1.4;
}
.task-item.done .task-title { text-decoration: line-through; color: #BBB; }

.task-quad-tag {
  border-radius: 12rpx;
  padding: 4rpx 12rpx;
  margin-left: 16rpx;
}
.task-quad-tag text { font-size: 22rpx; }
.tag-q1 { background-color: #FFE5E5; } .tag-q1 text { color: #FF4444; }
.tag-q2 { background-color: #E8F0FF; } .tag-q2 text { color: #5B8CFF; }
.tag-q3 { background-color: #FFF8E1; } .tag-q3 text { color: #FFB300; }
.tag-q4 { background-color: #E8F5E9; } .tag-q4 text { color: #4CAF50; }

.task-info { flex: 1; display: flex; flex-direction: column; }
.task-time-label { font-size: 24rpx; color: #999; margin-top: 4rpx; }

/* ============================================================
   时间轴视图
   ============================================================ */
.timeline-view { padding-top: 16rpx; }
.allday-section { padding: 0 24rpx 8rpx; }

.section-title {
  font-size: 26rpx;
  color: #999;
  padding: 8rpx 24rpx 12rpx;
  display: block;
}

.timeline-slots { position: relative; padding: 0 24rpx; }

.time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}
.time-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #FF4444;
  margin-left: 80rpx;
  flex-shrink: 0;
}
.time-line { flex: 1; height: 2rpx; background-color: #FF4444; }

.hour-slot {
  display: flex;
  flex-direction: row;
  min-height: 120rpx;
  border-top: 1rpx solid #F0F0F0;
}
.hour-label {
  width: 80rpx;
  font-size: 22rpx;
  color: #CCC;
  padding-top: 8rpx;
  flex-shrink: 0;
}
.hour-content { flex: 1; padding: 8rpx 0; }

.timeline-task {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 8rpx;
  border-left: 6rpx solid #5B8CFF;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}
.timeline-task.quad-q1 { border-left-color: #FF4444; background-color: #FFF5F5; }
.timeline-task.quad-q2 { border-left-color: #5B8CFF; background-color: #F5F8FF; }
.timeline-task.quad-q3 { border-left-color: #FFB300; background-color: #FFFBF0; }
.timeline-task.quad-q4 { border-left-color: #4CAF50; background-color: #F5FBF5; }
.timeline-task.done { opacity: 0.6; }

.timeline-task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 16rpx;
}

/* ============================================================
   日志区域
   ============================================================ */
.log-section { padding: 0 0 24rpx; }
.log-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background-color: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin: 0 24rpx 12rpx;
  border-left: 6rpx solid #9E9E9E;
}
.log-time { font-size: 24rpx; color: #5B8CFF; width: 80rpx; flex-shrink: 0; margin-top: 4rpx; }
.log-content { flex: 1; font-size: 28rpx; color: #555; line-height: 1.5; }
.log-convert {
  font-size: 22rpx;
  color: #5B8CFF;
  padding: 4rpx 8rpx;
  border: 1rpx solid #5B8CFF;
  border-radius: 8rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

/* ============================================================
   四象限视图
   ============================================================ */
.quadrant-view { padding: 16rpx 24rpx; }
.quadrant-row { display: flex; flex-direction: row; gap: 16rpx; margin-bottom: 16rpx; }
.quadrant-cell { flex: 1; border-radius: 16rpx; padding: 20rpx; min-height: 240rpx; }
.q1 { background-color: #FFF5F5; border: 1rpx solid #FFCDD2; }
.q2 { background-color: #F5F8FF; border: 1rpx solid #BBDEFB; }
.q3 { background-color: #FFFBF0; border: 1rpx solid #FFE082; }
.q4 { background-color: #F5FBF5; border: 1rpx solid #C8E6C9; }

.quad-header { display: flex; flex-direction: row; align-items: center; margin-bottom: 16rpx; }
.quad-icon { font-size: 28rpx; margin-right: 8rpx; }
.quad-title { font-size: 24rpx; color: #555; font-weight: bold; flex: 1; }
.quad-count {
  font-size: 24rpx;
  color: #999;
  background-color: rgba(0,0,0,0.06);
  border-radius: 12rpx;
  padding: 2rpx 12rpx;
}
.quad-tasks { display: flex; flex-direction: column; gap: 12rpx; }
.quad-task-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: rgba(255,255,255,0.8);
  border-radius: 10rpx;
  padding: 12rpx 14rpx;
}
.quad-task-item .task-check { width: 36rpx; height: 36rpx; margin-right: 12rpx; }
.quad-task-item .task-title { font-size: 26rpx; }
.quad-empty { font-size: 24rpx; color: #CCC; text-align: center; padding: 20rpx 0; }

.done-section { margin-top: 8rpx; }
.done-title { padding: 8rpx 0 12rpx; }
.done-text { text-decoration: line-through; color: #CCC !important; }

/* ============================================================
   列表视图
   ============================================================ */
.list-view { padding: 16rpx 0; }
.list-empty { text-align: center; padding: 80rpx 0; }

/* ============================================================
   加载状态
   ============================================================ */
.loading-state { display: flex; justify-content: center; padding: 80rpx 0; }
.loading-text { font-size: 28rpx; color: #BBB; }

/* ============================================================
   浮动按钮
   ============================================================ */
.fab-area {
  position: fixed;
  right: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 100;
}
.fab-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.fab-menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 40rpx;
  padding: 16rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.15);
}
.fab-menu-icon { font-size: 36rpx; margin-right: 12rpx; }
.fab-menu-label { font-size: 28rpx; color: #333; }
.fab-btn {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8CFF, #7B5EA7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(91, 140, 255, 0.4);
}
.fab-btn.open {
  background: linear-gradient(135deg, #FF6B6B, #FF4444);
}
.fab-icon { font-size: 60rpx; color: #FFFFFF; line-height: 1; font-weight: 300; }

/* ============================================================
   底部安全区
   ============================================================ */
.bottom-safe { flex-shrink: 0; }
</style>
