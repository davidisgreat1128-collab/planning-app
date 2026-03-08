<template>
  <!-- 自定义日期选择器弹窗（点击"其他日期"时） -->
  <teleport to="body">
    <view v-if="visible" class="cdp-mask" @tap.stop="handleCancel">
      <view class="cdp-sheet" @tap.stop>
        <!-- 月份导航 -->
        <view class="cdp-nav">
          <view class="cdp-nav-btn" @tap="prevMonth"><text class="cdp-nav-icon">‹</text></view>
          <text class="cdp-nav-title">{{ currentYear }}年{{ currentMonth }}月</text>
          <view class="cdp-nav-btn" @tap="nextMonth"><text class="cdp-nav-icon">›</text></view>
        </view>
        <!-- 星期头 -->
        <view class="cdp-weekrow">
          <text v-for="w in ['一','二','三','四','五','六','日']" :key="w" class="cdp-weekcell">{{ w }}</text>
        </view>
        <!-- 日期格子 -->
        <view class="cdp-grid">
          <view
            v-for="(cell, idx) in dateCells"
            :key="idx"
            class="cdp-cell"
            :class="{
              'cdp-cell-other': cell.otherMonth,
              'cdp-cell-past': cell.isPast,
              'cdp-cell-today': cell.isToday,
              'cdp-cell-selected': cell.isSelected
            }"
            @tap="onCellTap(cell)"
          >
            <text class="cdp-cell-num">{{ cell.day }}</text>
          </view>
        </view>
        <!-- 底部按钮 -->
        <view class="cdp-btns">
          <view class="cdp-btn cdp-cancel" @tap="handleCancel"><text class="cdp-btn-text">取消</text></view>
          <view class="cdp-btn cdp-confirm" @tap="handleConfirm"><text class="cdp-btn-text cdp-confirm-text">确定</text></view>
        </view>
      </view>
    </view>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

/**
 * 自定义日期选择器组件
 *
 * Props:
 * - visible: 是否显示选择器
 * - initialDate: 初始日期 YYYY-MM-DD（可选）
 *
 * Emits:
 * - confirm: 确定选择 payload: { date: 'YYYY-MM-DD' }
 * - cancel: 取消选择
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  initialDate: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['confirm', 'cancel']);

// ============================================================
// 状态管理
// ============================================================

/** 当前显示的年月 */
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

/** 用户临时选中的日期（点击日历格子时更新，点击"确定"才提交） */
const selectedDate = ref(null);

// ============================================================
// 初始化逻辑
// ============================================================

/**
 * 监听 visible 变化，初始化日期选择器
 */
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    const today = new Date();
    if (props.initialDate) {
      // 如果有初始日期，初始化到该日期
      const d = new Date(props.initialDate);
      currentYear.value = d.getFullYear();
      currentMonth.value = d.getMonth() + 1;
      selectedDate.value = new Date(props.initialDate);
    } else {
      // 否则初始化到今天
      currentYear.value = today.getFullYear();
      currentMonth.value = today.getMonth() + 1;
      selectedDate.value = today;
    }
  }
}, { immediate: true });

// ============================================================
// 月份导航
// ============================================================

/** 上一个月 */
function prevMonth() {
  if (currentMonth.value === 1) {
    currentYear.value--;
    currentMonth.value = 12;
  } else {
    currentMonth.value--;
  }
}

/** 下一个月 */
function nextMonth() {
  if (currentMonth.value === 12) {
    currentYear.value++;
    currentMonth.value = 1;
  } else {
    currentMonth.value++;
  }
}

// ============================================================
// 日期格子计算
// ============================================================

/**
 * 获取 YYYY-MM-DD 格式日期字符串
 */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 日历格子数据（包含前后月份填充）
 */
const dateCells = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1);
  const dow = firstDay.getDay(); // 0=周日
  const offset = dow === 0 ? 6 : dow - 1; // 转换为周一开始（周一=0）
  const daysInMonth = new Date(year, month, 0).getDate();

  const today = formatDate(new Date());
  const cells = [];

  // 前一个月的日期（填充前置空格）
  if (offset > 0) {
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const cellDate = new Date(year, month - 2, day);
      cells.push({
        day,
        date: formatDate(cellDate),
        otherMonth: true,
        isToday: false,
        isPast: cellDate < new Date(today),
        isSelected: false
      });
    }
  }

  // 当前月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month - 1, day);
    const cellDateStr = formatDate(cellDate);
    const isToday = cellDateStr === today;
    const isPast = cellDate < new Date(today) && !isToday;
    let isSelected = false;
    if (selectedDate.value) {
      const selDateStr = formatDate(selectedDate.value);
      isSelected = cellDateStr === selDateStr;
    }
    cells.push({
      day,
      date: cellDateStr,
      otherMonth: false,
      isToday,
      isPast,
      isSelected
    });
  }

  // 后一个月的日期（填充后置空格，补齐到42格 = 6周）
  const remain = 42 - cells.length;
  for (let day = 1; day <= remain; day++) {
    const cellDate = new Date(year, month, day);
    cells.push({
      day,
      date: formatDate(cellDate),
      otherMonth: true,
      isToday: false,
      isPast: false,
      isSelected: false
    });
  }

  return cells;
});

// ============================================================
// 用户交互
// ============================================================

/** 点击日历格子 */
function onCellTap(cell) {
  // 禁止点击其他月份或过去的日期
  if (cell.otherMonth || cell.isPast) return;
  selectedDate.value = new Date(cell.date);
}

/** 确定选择 */
function handleConfirm() {
  if (selectedDate.value) {
    emit('confirm', { date: formatDate(selectedDate.value) });
  }
}

/** 取消选择 */
function handleCancel() {
  emit('cancel');
}
</script>

<style scoped>
/* ============================================================
   弹窗遮罩和容器
   ============================================================ */
.cdp-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cdp-sheet {
  width: 70%;
  max-width: 500rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 20rpx 0 0;
  max-height: 65vh;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

/* ============================================================
   月份导航
   ============================================================ */
.cdp-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 20rpx 12rpx;
}

.cdp-nav-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cdp-nav-icon {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.cdp-nav-title {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #333;
  font-weight: bold;
}

/* ============================================================
   星期头
   ============================================================ */
.cdp-weekrow {
  display: flex;
  flex-direction: row;
  padding: 0 10rpx;
  border-bottom: 1rpx solid #F0F0F0;
  padding-bottom: 6rpx;
}

.cdp-weekcell {
  flex: 1;
  text-align: center;
  font-size: 20rpx;
  color: #999;
}

/* ============================================================
   日期格子网格
   ============================================================ */
.cdp-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 4rpx 10rpx;
}

.cdp-cell {
  width: calc(100% / 7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rpx 0;
  border-radius: 50%;
  position: relative;
}

.cdp-cell-num {
  font-size: 24rpx;
  color: #333;
  width: 46rpx;
  height: 46rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  line-height: 46rpx;
  text-align: center;
}

/* 其他月份：灰色 */
.cdp-cell-other .cdp-cell-num {
  color: #CCCCCC;
}

/* 过去的日期：灰色且不可点 */
.cdp-cell-past .cdp-cell-num {
  color: #CCCCCC;
}

/* 今天：黑色实心圆圈 */
.cdp-cell-today .cdp-cell-num {
  background-color: #222222;
  color: #FFFFFF;
  font-weight: bold;
}

/* 选中：黑色实心圆 */
.cdp-cell-selected .cdp-cell-num {
  background-color: #222222;
  color: #FFFFFF;
  font-weight: bold;
}

/* ============================================================
   底部按钮
   ============================================================ */
.cdp-btns {
  display: flex;
  flex-direction: row;
  border-top: 1rpx solid #F0F0F0;
  margin-top: 8rpx;
}

.cdp-btn {
  flex: 1;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cdp-cancel {
  border-right: 1rpx solid #F0F0F0;
}

.cdp-btn-text {
  font-size: 26rpx;
  color: #666;
}

.cdp-confirm-text {
  color: #333;
  font-weight: bold;
}
</style>
