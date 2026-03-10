<template>
  <!-- 日历选择器弹窗 -->
  <view v-if="visible" class="dp-mask" @tap.self="handleCancel">
    <view class="dp-sheet">
      <!-- 标题行（显示天数统计） -->
      <view v-if="showDaysCount" class="dp-title-row">
        <text class="dp-title-text">{{ title }}</text>
        <text v-if="daysCount > 0" class="dp-days-count">{{ daysCount }}</text>
        <text v-if="daysCount > 0" class="dp-title-text">天内完成</text>
      </view>

      <!-- 月份导航 -->
      <view class="dp-header">
        <text class="dp-nav" @tap="prevMonth">‹</text>
        <text class="dp-month-title">{{ currentYear }}年{{ currentMonth + 1 }}月</text>
        <text class="dp-nav" @tap="nextMonth">›</text>
      </view>

      <!-- 星期头 -->
      <view class="dp-week-row">
        <text v-for="day in weekLabels" :key="day" class="dp-week-cell">{{ day }}</text>
      </view>

      <!-- 日期格子（6×7） -->
      <view class="dp-body">
        <view v-for="(week, weekIndex) in calendarRows" :key="weekIndex" class="dp-row">
          <view
            v-for="(cell, cellIndex) in week"
            :key="cellIndex"
            class="dp-cell"
            :class="getCellClass(cell)"
            @tap="onCellTap(cell)"
          >
            <text class="dp-cell-num">{{ cell.day }}</text>
            <text v-if="showLunar && cell.lunar" class="dp-cell-lunar">{{ cell.lunar }}</text>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="dp-btns">
        <text class="dp-btn dp-cancel" @tap="handleCancel">取消</text>
        <text class="dp-btn dp-confirm" @tap="handleConfirm">确定</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

/**
 * DayPicker - 日历日期选择器组件
 *
 * 支持两种模式：
 * - 'single': 单选模式（选择一个日期）
 * - 'range': 范围选择模式（从开始日期到结束日期）
 *
 * @example
 * // 范围选择模式（task-edit.vue场景）
 * <DayPicker
 *   v-model:visible="showPicker"
 *   :startDate="taskDate"
 *   :initialEndDate="endDate"
 *   title="设置期限：在"
 *   :showDaysCount="true"
 *   mode="range"
 *   @confirm="handleConfirm"
 * />
 *
 * // 单选模式（AddTaskPanel.vue场景）
 * <DayPicker
 *   v-model:visible="showPicker"
 *   :initialEndDate="selectedDate"
 *   title="选择日期"
 *   :showDaysCount="false"
 *   mode="single"
 *   @confirm="handleConfirm"
 * />
 */

// ============================================================
// Props 和 Emits
// ============================================================

const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 开始日期（YYYY-MM-DD），用于范围选择的起点 */
  startDate: {
    type: String,
    default: ''
  },
  /** 初始选中的结束日期（YYYY-MM-DD） */
  initialEndDate: {
    type: String,
    default: ''
  },
  /** 标题文本 */
  title: {
    type: String,
    default: '设置期限：在'
  },
  /** 是否显示天数计数 */
  showDaysCount: {
    type: Boolean,
    default: true
  },
  /** 是否显示农历 */
  showLunar: {
    type: Boolean,
    default: true
  },
  /** 选择模式：'single'单选 | 'range'范围选择 */
  mode: {
    type: String,
    default: 'range',
    validator: (value) => ['single', 'range'].includes(value)
  }
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

// ============================================================
// 状态管理
// ============================================================

/** 日历当前显示的年月 */
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth()); // 0-11

/** 临时选中的日期 */
const selectedDate = ref('');

/** 星期标签 */
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

// ============================================================
// 工具函数
// ============================================================

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 计算两个日期之间的天数（含首尾）
 */
function calcDays(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

/**
 * 获取农历信息（简化版）
 * TODO: 接入真实农历库
 */
function getLunarLabel(year, month, day) {
  if (!props.showLunar) return '';
  // 这里应该调用真实的农历转换库
  // 暂时返回空字符串
  return '';
}

// ============================================================
// 计算属性
// ============================================================

/**
 * 天数计数（从开始日期到选中日期）
 */
const daysCount = computed(() => {
  if (!props.showDaysCount) return 0;
  const start = props.startDate || formatDate(new Date());
  const end = selectedDate.value || start;
  return calcDays(start, end);
});

/**
 * 日历格子数据（6×7 = 42格）
 */
const calendarRows = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  // 当月第一天
  const firstDay = new Date(year, month, 1);
  const dow = firstDay.getDay(); // 0=周日, 1=周一...
  const offset = dow === 0 ? 6 : dow - 1; // 转换为周一为起点（0=周一, 6=周日）

  // 当月天数
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 今天
  const today = formatDate(new Date());

  // 开始日期（用于范围选择）
  const start = props.startDate || today;

  const cells = [];

  // 上月补位
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < offset; i++) {
    const day = prevMonthDays - offset + 1 + i;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const dateStr = formatDate(new Date(prevYear, prevMonth, day));
    cells.push({
      day,
      dateStr,
      otherMonth: true,
      isPast: dateStr < start,
      isToday: false,
      isStart: false,
      isEnd: false,
      inRange: false,
      lunar: ''
    });
  }

  // 当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(new Date(year, month, day));
    const isToday = dateStr === today;
    const isStart = dateStr === start;
    const isEnd = dateStr === selectedDate.value;
    const isPast = dateStr < start;

    // 范围高亮（开始日期和结束日期之间）
    let inRange = false;
    if (props.mode === 'range' && selectedDate.value) {
      inRange = dateStr > start && dateStr < selectedDate.value;
    }

    cells.push({
      day,
      dateStr,
      otherMonth: false,
      isPast,
      isToday,
      isStart,
      isEnd,
      inRange,
      lunar: getLunarLabel(year, month + 1, day)
    });
  }

  // 下月补位（凑满42格）
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const dateStr = formatDate(new Date(nextYear, nextMonth, day));
    cells.push({
      day,
      dateStr,
      otherMonth: true,
      isPast: false,
      isToday: false,
      isStart: false,
      isEnd: false,
      inRange: false,
      lunar: ''
    });
  }

  // 分组为6行
  const rows = [];
  for (let i = 0; i < 6; i++) {
    rows.push(cells.slice(i * 7, i * 7 + 7));
  }
  return rows;
});

// ============================================================
// 方法
// ============================================================

/**
 * 获取日历格子的CSS class
 */
function getCellClass(cell) {
  const classes = [];
  if (cell.otherMonth) classes.push('dp-cell-other');
  if (cell.isPast) classes.push('dp-cell-past');
  if (cell.isToday) classes.push('dp-cell-today');
  if (cell.isStart) classes.push('dp-cell-start');
  if (cell.isEnd) classes.push('dp-cell-end');
  if (cell.inRange) classes.push('dp-cell-in-range');
  return classes;
}

/**
 * 点击日历格子
 */
function onCellTap(cell) {
  // 过去的日期和其他月份不可选
  if (cell.isPast || cell.otherMonth) return;

  selectedDate.value = cell.dateStr;
}

/**
 * 上一个月
 */
function prevMonth() {
  const today = new Date();
  const start = props.startDate ? new Date(props.startDate) : today;

  // 不能回退到开始日期所在月之前
  if (currentYear.value === start.getFullYear() && currentMonth.value === start.getMonth()) {
    return;
  }

  if (currentMonth.value === 0) {
    currentYear.value--;
    currentMonth.value = 11;
  } else {
    currentMonth.value--;
  }
}

/**
 * 下一个月
 */
function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++;
    currentMonth.value = 0;
  } else {
    currentMonth.value++;
  }
}

/**
 * 确定选择
 */
function handleConfirm() {
  if (!selectedDate.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' });
    return;
  }

  emit('confirm', {
    date: selectedDate.value,
    daysCount: daysCount.value
  });
  emit('update:visible', false);
}

/**
 * 取消选择
 */
function handleCancel() {
  emit('cancel');
  emit('update:visible', false);
}

// ============================================================
// 监听 visible 变化，初始化状态
// ============================================================

watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 初始化显示月份
    const initDate = props.initialEndDate ? new Date(props.initialEndDate) : new Date();
    currentYear.value = initDate.getFullYear();
    currentMonth.value = initDate.getMonth();

    // 初始化选中日期
    selectedDate.value = props.initialEndDate || '';
  }
});
</script>

<style scoped>
/* ============================================================
   日历选择器样式
   ============================================================ */

.dp-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dp-sheet {
  width: 90%;
  max-width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

/* 标题行 */
.dp-title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.dp-title-text {
  font-size: 28rpx;
  color: #333333;
}

.dp-days-count {
  font-size: 40rpx;
  font-weight: bold;
  color: #1A1A2E;
  margin: 0 8rpx;
}

/* 月份导航 */
.dp-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 16rpx;
}

.dp-nav {
  font-size: 36rpx;
  color: #1A1A2E;
  font-weight: bold;
  padding: 8rpx 16rpx;
  cursor: pointer;
}

.dp-month-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A2E;
}

/* 星期头 */
.dp-week-row {
  display: flex;
  flex-direction: row;
  margin-bottom: 16rpx;
}

.dp-week-cell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #999999;
  padding: 8rpx 0;
}

/* 日期格子 */
.dp-body {
  margin-bottom: 24rpx;
}

.dp-row {
  display: flex;
  flex-direction: row;
}

.dp-cell {
  flex: 1;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

.dp-cell-num {
  font-size: 28rpx;
  color: #333333;
  position: relative;
  z-index: 2;
}

.dp-cell-lunar {
  font-size: 20rpx;
  color: #999999;
  margin-top: 4rpx;
  position: relative;
  z-index: 2;
}

/* 日期格子状态样式 */
.dp-cell-other .dp-cell-num {
  color: #CCCCCC;
}

.dp-cell-past {
  opacity: 0.3;
  cursor: not-allowed;
}

.dp-cell-today .dp-cell-num {
  color: #1A1A2E;
  font-weight: bold;
}

.dp-cell-today::before {
  content: '';
  position: absolute;
  bottom: 8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: #1A1A2E;
  z-index: 1;
}

.dp-cell-start,
.dp-cell-end {
  background-color: #1A1A2E;
}

.dp-cell-start .dp-cell-num,
.dp-cell-end .dp-cell-num,
.dp-cell-start .dp-cell-lunar,
.dp-cell-end .dp-cell-lunar {
  color: #FFFFFF;
}

.dp-cell-in-range {
  background-color: rgba(26, 26, 46, 0.1);
}

/* 底部按钮 */
.dp-btns {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16rpx;
}

.dp-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  cursor: pointer;
}

.dp-cancel {
  background-color: #F5F5F5;
  color: #666666;
}

.dp-confirm {
  background-color: #1A1A2E;
  color: #FFFFFF;
}
</style>
