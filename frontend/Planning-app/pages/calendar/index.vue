<template>
  <view class="calendar-page">
    <!-- 自定义状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部：标题 + 操作栏 -->
    <view class="top-bar">
      <text class="top-title">做计划</text>
      <view class="top-actions">
        <!-- 今日按钮 -->
        <text class="btn-today" @tap="goToday">今</text>
        <!-- 视图切换按钮 -->
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

    <!-- 周历条 -->
    <view class="week-bar" @touchstart="onWeekTouchStart" @touchend="onWeekTouchEnd">
      <!-- 星期标题行 -->
      <view class="week-header">
        <text v-for="d in weekDays" :key="d" class="week-day-name">{{ d }}</text>
      </view>
      <!-- 7天日期行 -->
      <view class="week-dates">
        <view
          v-for="item in currentWeekDates"
          :key="item.dateStr"
          class="week-date-item"
          :class="{
            selected: item.dateStr === selectedDate,
            today: item.dateStr === todayStr,
            'has-task': item.hasTask
          }"
          @tap="selectDate(item.dateStr)"
        >
          <!-- 农历/节日 -->
          <text class="lunar-label">{{ item.lunarLabel }}</text>
          <!-- 公历日期数字 -->
          <view class="date-circle">
            <text class="date-num">{{ item.day }}</text>
          </view>
          <!-- 有任务圆点 -->
          <view v-if="item.hasTask" class="task-dot"></view>
        </view>
      </view>
      <!-- 月份/年份显示 -->
      <view class="week-month-label">
        <text>{{ currentMonthLabel }}</text>
      </view>
    </view>

    <!-- 内容区（可滚动） -->
    <scroll-view
      class="content-area"
      scroll-y
      @scrolltoupper="onScrollTop"
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
            :class="['quad-' + getQuadrant(task), { done: task.status === 'done' }]"
            @tap="openTask(task)"
          >
            <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
              <text class="check-icon">{{ task.status === 'done' ? '✓' : '' }}</text>
            </view>
            <text class="task-title">{{ task.title }}</text>
            <view class="task-quad-tag" :class="'tag-' + getQuadrant(task)">
              <text>{{ quadrantLabel(task) }}</text>
            </view>
          </view>
        </view>

        <!-- 时间轴 -->
        <view class="timeline-slots">
          <!-- 时间红线（当前时间，仅今天显示） -->
          <view
            v-if="selectedDate === todayStr"
            class="time-indicator"
            :style="{ top: currentTimeTop + 'rpx' }"
          >
            <view class="time-dot"></view>
            <view class="time-line"></view>
          </view>

          <!-- 每小时格子 -->
          <view v-for="hour in hours" :key="hour" class="hour-slot">
            <text class="hour-label">{{ hour < 10 ? '0' + hour : hour }}:00</text>
            <view class="hour-content">
              <!-- 该小时的任务 -->
              <view
                v-for="task in getTasksAtHour(hour)"
                :key="task.id"
                class="timeline-task"
                :class="['quad-' + getQuadrant(task), { done: task.status === 'done' }]"
                @tap="openTask(task)"
              >
                <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
                  <text class="check-icon">{{ task.status === 'done' ? '✓' : '' }}</text>
                </view>
                <view class="timeline-task-info">
                  <text class="task-title">{{ task.title }}</text>
                  <text class="task-time-label">{{ task.dueTime }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 日志列表（时间轴底部） -->
        <view v-if="logStore.logs.length > 0" class="log-section">
          <text class="section-title">日志记录</text>
          <view
            v-for="log in logStore.logs"
            :key="log.id"
            class="log-item"
            @tap="openLog(log)"
          >
            <text class="log-time">{{ formatLogTime(log.loggedAt) }}</text>
            <text class="log-content">{{ log.content }}</text>
            <text class="log-convert" @tap.stop="convertLog(log.id)">→任务</text>
          </view>
        </view>
      </view>

      <!-- 四象限视图 -->
      <view v-if="currentView === 'quadrant'" class="quadrant-view">
        <!-- Q1：紧急+重要（红色） -->
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
                  <text class="check-icon">{{ task.status === 'done' ? '✓' : '' }}</text>
                </view>
                <text class="task-title">{{ task.title }}</text>
              </view>
              <text v-if="taskStore.urgentImportant.length === 0" class="quad-empty">暂无</text>
            </view>
          </view>
          <!-- Q2：重要不紧急（蓝色） -->
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
                  <text class="check-icon">{{ task.status === 'done' ? '✓' : '' }}</text>
                </view>
                <text class="task-title">{{ task.title }}</text>
              </view>
              <text v-if="taskStore.notUrgentImportant.length === 0" class="quad-empty">暂无</text>
            </view>
          </view>
        </view>
        <!-- Q3：紧急不重要（黄色）/ Q4：不紧急不重要（绿色） -->
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
                  <text class="check-icon">{{ task.status === 'done' ? '✓' : '' }}</text>
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
                  <text class="check-icon">{{ task.status === 'done' ? '✓' : '' }}</text>
                </view>
                <text class="task-title">{{ task.title }}</text>
              </view>
              <text v-if="taskStore.notUrgentNotImportant.length === 0" class="quad-empty">暂无</text>
            </view>
          </view>
        </view>

        <!-- 已完成任务 -->
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

      <!-- 列表视图（简单列表，按类型分组） -->
      <view v-if="currentView === 'list'" class="list-view">
        <view class="task-list">
          <view
            v-for="task in taskStore.tasks"
            :key="task.id"
            class="task-item"
            :class="['quad-' + getQuadrant(task), { done: task.status === 'done' }]"
            @tap="openTask(task)"
          >
            <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
              <text class="check-icon">{{ task.status === 'done' ? '✓' : '' }}</text>
            </view>
            <view class="task-info">
              <text class="task-title">{{ task.title }}</text>
              <text v-if="task.dueTime" class="task-time-label">{{ task.dueTime }}</text>
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

      <!-- 加载中 -->
      <view v-if="taskStore.loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 底部安全区占位 -->
      <view class="bottom-safe" :style="{ height: (tabBarHeight + 20) + 'px' }"></view>
    </scroll-view>

    <!-- 浮动 + 按钮（新建任务/日志） -->
    <view class="fab-area" :style="{ bottom: (tabBarHeight + 20) + 'px' }">
      <!-- 展开菜单 -->
      <view v-if="fabOpen" class="fab-menu">
        <view class="fab-menu-item" @tap="openCreateLog">
          <view class="fab-menu-icon log-icon">📝</view>
          <text class="fab-menu-label">记日志</text>
        </view>
        <view class="fab-menu-item" @tap="openCreateTask">
          <view class="fab-menu-icon task-icon">✅</view>
          <text class="fab-menu-label">加任务</text>
        </view>
      </view>
      <!-- 主按钮 -->
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
/** 状态栏高度 */
const statusBarHeight = ref(20);
/** TabBar 高度（rpx转px用于底部计算） */
const tabBarHeight = ref(50);
/** 当前视图模式 */
const currentView = ref('timeline');
/** fab 展开状态 */
const fabOpen = ref(false);
/** 当前选中日期 */
const selectedDate = ref('');
/** 当前周的起始日（周一） */
const currentWeekStart = ref(null);
/** 节日节气缓存 key=YYYY-MM-DD value=label */
const holidayMap = ref({});
/** 当前时间分钟数（用于红线位置） */
const currentMinutes = ref(0);
/** 计时器 */
let timeTimer = null;
/** 触摸开始位置（周历左右滑动切换周） */
let touchStartX = 0;

// ============================================================
// 常量
// ============================================================
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23
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

/** 今日日期字符串 */
const todayStr = formatDate(new Date());

/** 获取本周（或给定日期所在周）的周日作为起点 */
function getWeekStart(date) {
  const d = new Date(date);
  // 以周日为一周开始
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 当前周7天数组 */
const currentWeekDates = computed(() => {
  if (!currentWeekStart.value) return [];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    const hasTask = taskStore.tasks.some(t =>
      (t.dueDate || '').startsWith(dateStr)
    );
    return {
      dateStr,
      day: d.getDate(),
      lunarLabel: holidayMap.value[dateStr] || '',
      hasTask
    };
  });
});

/** 当前月份标签（如 2026年2月） */
const currentMonthLabel = computed(() => {
  if (!currentWeekStart.value) return '';
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 3); // 取周中间日期
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
});

/** 当前时间红线的位置（rpx，基于1小时=120rpx） */
const currentTimeTop = computed(() => {
  // 每小时 120rpx，从 0:00 开始
  const mins = currentMinutes.value;
  return Math.round((mins / 60) * 120);
});

/** 全天任务（无 dueTime 的任务） */
const allDayTasks = computed(() =>
  taskStore.tasks.filter(t => !t.dueTime && t.status !== 'done')
);

/** 获取某小时的任务 */
function getTasksAtHour(hour) {
  return taskStore.timelineTasks.filter(t => {
    if (!t.dueTime) return false;
    const h = parseInt(t.dueTime.split(':')[0]);
    return h === hour;
  });
}

/** 获取任务所属象限 key */
function getQuadrant(task) {
  if (task.isUrgent && task.isImportant) return 'q1';
  if (!task.isUrgent && task.isImportant) return 'q2';
  if (task.isUrgent && !task.isImportant) return 'q3';
  return 'q4';
}

/** 象限文字标签 */
function quadrantLabel(task) {
  if (task.isUrgent && task.isImportant) return '紧急';
  if (!task.isUrgent && task.isImportant) return '重要';
  if (task.isUrgent && !task.isImportant) return '琐事';
  return '待排';
}

/** 格式化日志时间显示（HH:mm） */
function formatLogTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ============================================================
// 操作方法
// ============================================================

/** 选中某天 */
async function selectDate(dateStr) {
  selectedDate.value = dateStr;
  taskStore.selectedDate = dateStr;
  await Promise.all([
    taskStore.fetchTasksByDate(dateStr),
    logStore.fetchLogsByDate(dateStr)
  ]);
}

/** 回到今天 */
function goToday() {
  currentWeekStart.value = getWeekStart(new Date());
  selectDate(todayStr);
}

/** 切换到上一周 */
function prevWeek() {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() - 7);
  currentWeekStart.value = d;
  // 切换周后重新加载节日农历
  loadHolidays();
}

/** 切换到下一周 */
function nextWeek() {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 7);
  currentWeekStart.value = d;
  // 切换周后重新加载节日农历
  loadHolidays();
}

/** 周历触摸开始 */
function onWeekTouchStart(e) {
  touchStartX = e.touches[0].clientX;
}

/** 周历触摸结束（左右滑动切换周） */
function onWeekTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) {
    if (dx < 0) nextWeek();
    else prevWeek();
  }
}

/** 滚动到顶部触发事件（预留：展开月历） */
function onScrollTop() {
  // TODO: 上滑展开月历
}

/** 打开任务详情/编辑 */
function openTask(task) {
  fabOpen.value = false;
  uni.navigateTo({
    url: `/pages/calendar/task-edit?id=${task.id}&date=${selectedDate.value}`
  });
}

/** 打开新建任务 */
function openCreateTask() {
  fabOpen.value = false;
  uni.navigateTo({
    url: `/pages/calendar/task-edit?date=${selectedDate.value}`
  });
}

/** 打开新建日志 */
function openCreateLog() {
  fabOpen.value = false;
  uni.navigateTo({
    url: `/pages/calendar/log-edit?date=${selectedDate.value}`
  });
}

/** 打开日志详情 */
function openLog(log) {
  uni.navigateTo({
    url: `/pages/calendar/log-edit?id=${log.id}&date=${selectedDate.value}`
  });
}

/** 日志转任务 */
async function convertLog(logId) {
  try {
    await logStore.toTask(logId);
    uni.showToast({ title: '已转为任务', icon: 'success' });
    await taskStore.fetchTasksByDate(selectedDate.value);
  } catch (err) {
    uni.showToast({ title: err.message || '转换失败', icon: 'none' });
  }
}

/** 加载当前周的节日节气 + 农历信息 */
async function loadHolidays() {
  try {
    if (!currentWeekStart.value) return;
    // 计算当前周的起止日期（周日到周六）
    const weekEnd = new Date(currentWeekStart.value);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const start = formatDate(currentWeekStart.value);
    const end = formatDate(weekEnd);

    // 并行请求节日 + 农历
    const [holidayRes, lunarRes] = await Promise.all([
      getHolidaysByRange(start, end),
      getLunarInfoRange(start, end)
    ]);

    // 解析节日：holidayMap 结构为 { "YYYY-MM-DD": [{ name, type, ... }] }
    const hMap = holidayRes?.holidayMap || {};
    Object.entries(hMap).forEach(([date, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        // 优先展示法定节假日，其次节气，其次其他
        const sorted = [...list].sort((a, b) => {
          const order = { public_holiday: 0, solar_term: 1 };
          return (order[a.type] ?? 2) - (order[b.type] ?? 2);
        });
        holidayMap.value[date] = sorted[0].shortName || sorted[0].name;
      }
    });

    // 解析农历：lunarMap 结构为 { "YYYY-MM-DD": { lunarDay, lunarMonth, ... } }
    const lMap = lunarRes?.lunarMap || {};
    Object.entries(lMap).forEach(([date, info]) => {
      // 只有没有节日标注的日期才显示农历
      if (!holidayMap.value[date] && info) {
        holidayMap.value[date] = info.lunarDay || '';
      }
    });
  } catch (err) {
    console.warn('[Calendar] 节日农历加载失败:', err);
  }
}

/** 更新当前时间分钟数（用于红线） */
function updateCurrentTime() {
  const now = new Date();
  currentMinutes.value = now.getHours() * 60 + now.getMinutes();
}

// ============================================================
// 生命周期
// ============================================================
onMounted(async () => {
  // 获取设备信息
  try {
    const info = uni.getSystemInfoSync();
    statusBarHeight.value = info.statusBarHeight || 20;
    tabBarHeight.value = 50; // TabBar 固定高度 50px
  } catch (e) {
    // 降级处理
  }

  // 初始化周历（以本周开始）
  currentWeekStart.value = getWeekStart(new Date());
  selectedDate.value = todayStr;
  taskStore.selectedDate = todayStr;

  // 加载数据
  updateCurrentTime();
  await Promise.all([
    taskStore.fetchTasksByDate(todayStr),
    logStore.fetchLogsByDate(todayStr),
    loadHolidays()
  ]);

  // 每分钟更新一次当前时间红线
  timeTimer = setInterval(updateCurrentTime, 60000);
});

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
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
  transition: all 0.2s;
}

.view-btn.active {
  background-color: #FFFFFF;
  color: #5B8CFF;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

/* ============================================================
   周历条
   ============================================================ */
.week-bar {
  background-color: #FFFFFF;
  padding: 0 16rpx 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.week-header {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 8rpx 0;
}

.week-day-name {
  font-size: 24rpx;
  color: #999;
  width: 80rpx;
  text-align: center;
}

.week-dates {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.week-date-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80rpx;
  padding: 8rpx 0;
  position: relative;
}

.lunar-label {
  font-size: 18rpx;
  color: #aaa;
  height: 26rpx;
  line-height: 26rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 76rpx;
  text-align: center;
}

.date-circle {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4rpx 0;
}

.week-date-item.selected .date-circle {
  background-color: #5B8CFF;
}

.week-date-item.today:not(.selected) .date-circle {
  background-color: #E8F0FF;
}

.date-num {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.week-date-item.selected .date-num {
  color: #FFFFFF;
  font-weight: bold;
}

.week-date-item.today:not(.selected) .date-num {
  color: #5B8CFF;
}

.task-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #5B8CFF;
  margin-top: 4rpx;
}

.week-month-label {
  text-align: center;
  margin-top: 8rpx;
}

.week-month-label text {
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

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #bbb;
}

/* ============================================================
   任务项基础样式
   ============================================================ */
.task-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx 24rpx;
  margin: 0 24rpx 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border-left: 8rpx solid #5B8CFF;
}

/* 四象限左边颜色 */
.task-item.quad-q1 { border-left-color: #FF4444; }
.task-item.quad-q2 { border-left-color: #5B8CFF; }
.task-item.quad-q3 { border-left-color: #FFB300; }
.task-item.quad-q4 { border-left-color: #4CAF50; }
.task-item.done { border-left-color: #CCC; opacity: 0.7; }

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

.check-icon {
  font-size: 24rpx;
  color: #4CAF50;
}

.task-title {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  line-height: 1.4;
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: #BBB;
}

.task-quad-tag {
  border-radius: 12rpx;
  padding: 4rpx 12rpx;
  margin-left: 16rpx;
}

.task-quad-tag text {
  font-size: 22rpx;
}

.tag-q1 { background-color: #FFE5E5; }
.tag-q1 text { color: #FF4444; }
.tag-q2 { background-color: #E8F0FF; }
.tag-q2 text { color: #5B8CFF; }
.tag-q3 { background-color: #FFF8E1; }
.tag-q3 text { color: #FFB300; }
.tag-q4 { background-color: #E8F5E9; }
.tag-q4 text { color: #4CAF50; }

.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.task-time-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

/* ============================================================
   时间轴视图
   ============================================================ */
.timeline-view {
  padding-top: 16rpx;
}

.allday-section {
  padding: 0 24rpx 8rpx;
}

.section-title {
  font-size: 26rpx;
  color: #999;
  padding: 8rpx 24rpx 12rpx;
  display: block;
}

.timeline-slots {
  position: relative;
  padding: 0 24rpx;
}

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

.time-line {
  flex: 1;
  height: 2rpx;
  background-color: #FF4444;
}

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

.hour-content {
  flex: 1;
  padding: 8rpx 0;
}

.timeline-task {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 12rpx;
  padding: 16rpx 16rpx;
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
.log-section {
  padding: 0 0 24rpx;
}

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

.log-time {
  font-size: 24rpx;
  color: #5B8CFF;
  width: 80rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.log-content {
  flex: 1;
  font-size: 28rpx;
  color: #555;
  line-height: 1.5;
}

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
.quadrant-view {
  padding: 16rpx 24rpx;
}

.quadrant-row {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.quadrant-cell {
  flex: 1;
  border-radius: 16rpx;
  padding: 20rpx;
  min-height: 240rpx;
}

.q1 { background-color: #FFF5F5; border: 1rpx solid #FFCDD2; }
.q2 { background-color: #F5F8FF; border: 1rpx solid #BBDEFB; }
.q3 { background-color: #FFFBF0; border: 1rpx solid #FFE082; }
.q4 { background-color: #F5FBF5; border: 1rpx solid #C8E6C9; }

.quad-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
}

.quad-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.quad-title {
  font-size: 24rpx;
  color: #555;
  font-weight: bold;
  flex: 1;
}

.quad-count {
  font-size: 24rpx;
  color: #999;
  background-color: rgba(0,0,0,0.06);
  border-radius: 12rpx;
  padding: 2rpx 12rpx;
}

.quad-tasks {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.quad-task-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: rgba(255,255,255,0.8);
  border-radius: 10rpx;
  padding: 12rpx 14rpx;
}

.quad-task-item .task-check {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
}

.quad-task-item .task-title {
  font-size: 26rpx;
}

.quad-empty {
  font-size: 24rpx;
  color: #CCC;
  text-align: center;
  padding: 20rpx 0;
}

.done-section {
  margin-top: 8rpx;
}

.done-title {
  padding: 8rpx 0 12rpx;
}

.done-text {
  text-decoration: line-through;
  color: #CCC !important;
}

/* ============================================================
   列表视图
   ============================================================ */
.list-view {
  padding: 16rpx 0;
}

.list-empty {
  text-align: center;
  padding: 80rpx 0;
}

/* ============================================================
   加载状态
   ============================================================ */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #BBB;
}

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

.fab-menu-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.fab-menu-label {
  font-size: 28rpx;
  color: #333;
}

.fab-btn {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8CFF, #7B5EA7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(91, 140, 255, 0.4);
  transition: transform 0.2s;
}

.fab-btn.open {
  transform: rotate(45deg);
  background: linear-gradient(135deg, #FF6B6B, #FF4444);
}

.fab-icon {
  font-size: 60rpx;
  color: #FFFFFF;
  line-height: 1;
  font-weight: 300;
}

/* ============================================================
   底部安全区
   ============================================================ */
.bottom-safe {
  flex-shrink: 0;
}
</style>
