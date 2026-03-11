<template>
  <!-- 结束日期日历选择器弹窗 -->
  <view v-if="visible" class="tep-modal-mask" @tap.self="handleCancel">
    <view class="tep-modal-sheet">
      <text class="tep-sheet-title">选择结束日期</text>

      <!-- 月份导航 -->
      <view class="cal-header">
        <text class="cal-nav" @tap="prevMonth">‹</text>
        <text class="cal-month-title">{{ currentYear }}年{{ currentMonth + 1 }}月</text>
        <text class="cal-nav" @tap="nextMonth">›</text>
      </view>

      <!-- 星期头 -->
      <view class="cal-week-row">
        <text v-for="d in weekLabels" :key="d" class="cal-week-cell">{{ d }}</text>
      </view>

      <!-- 日历格子（6×7） -->
      <view class="cal-body">
        <view v-for="(week, wi) in calendarRows" :key="wi" class="cal-row">
          <view
            v-for="(cell, di) in week"
            :key="di"
            class="cal-cell"
            :class="getCellClass(cell)"
            @tap="onSelectDate(cell)"
          >
            <text class="cal-cell-num">{{ cell.day }}</text>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="tep-modal-btns">
        <text class="tep-modal-cancel" @tap="handleCancel">取消</text>
        <text class="tep-modal-cancel" @tap="handleClear">清除</text>
        <text class="tep-modal-confirm" @tap="handleConfirm">确定</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatDate } from '@/utils/date.js'

/**
 * 结束日期日历选择器组件
 *
 * Props:
 * - visible: Boolean - 弹窗是否可见
 * - startDate: String - 开始日期（用于禁用早于开始日期的日期）
 * - initialEndDate: String - 初始结束日期
 * - showLunar: Boolean - 是否显示农历（暂未实现）
 *
 * Emits:
 * - update:visible - 更新弹窗状态
 * - confirm - 确认选择的日期 { date: String }
 * - cancel - 取消按钮
 * - clear - 清除按钮
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: String,
    default: ''
  },
  initialEndDate: {
    type: String,
    default: ''
  },
  showLunar: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'clear'])

// ============================================================
// 日历状态
// ============================================================

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const tempSelectedDate = ref('')

// ============================================================
// 监听弹窗打开，初始化日历
// ============================================================

watch(() => props.visible, (newVal) => {
  if (newVal) {
    const today = formatDate(new Date())
    const base = props.initialEndDate || today
    const d = new Date(base)
    currentYear.value = d.getFullYear()
    currentMonth.value = d.getMonth()
    tempSelectedDate.value = props.initialEndDate || ''
  }
})

// ============================================================
// 常量
// ============================================================

const weekLabels = ['一', '二', '三', '四', '五', '六', '日']

// ============================================================
// 计算属性
// ============================================================

/** 日历格子数据（6×7） */
const calendarRows = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const dow = firstDay.getDay()
  const offset = dow === 0 ? 6 : dow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = formatDate(new Date())

  const cells = []

  // 前补位（上个月的日期）
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = 0; i < offset; i++) {
    const d = prevMonthDays - offset + 1 + i
    const py = month === 0 ? year - 1 : year
    const pm = month === 0 ? 11 : month - 1
    const dateStr = formatDate(new Date(py, pm, d))
    cells.push({ day: d, dateStr, otherMonth: true, isPast: dateStr < today })
  }

  // 当月日期
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d))
    cells.push({
      day: d,
      dateStr,
      otherMonth: false,
      isToday: dateStr === today,
      isPast: dateStr < today,
      lunar: '' // 暂不显示农历（后续可接入 lunar-javascript 库）
    })
  }

  // 后补位（下个月的日期）
  const remain = 42 - cells.length
  for (let d = 1; d <= remain; d++) {
    const ny = month === 11 ? year + 1 : year
    const nm = month === 11 ? 0 : month + 1
    const dateStr = formatDate(new Date(ny, nm, d))
    cells.push({ day: d, dateStr, otherMonth: true, isPast: dateStr < today })
  }

  // 分割成6行×7列
  const rows = []
  for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7))
  return rows
})

// ============================================================
// 方法
// ============================================================

/**
 * 获取日历格子的CSS类名
 */
function getCellClass(cell) {
  const cls = []
  if (cell.otherMonth) cls.push('other-month')
  if (cell.isPast) cls.push('is-past')
  if (cell.isToday) cls.push('is-today')
  if (cell.dateStr === tempSelectedDate.value) cls.push('is-end')
  return cls
}

/**
 * 选择日期
 */
function onSelectDate(cell) {
  if (cell.isPast || cell.otherMonth) return
  tempSelectedDate.value = cell.dateStr
}

/**
 * 上个月
 */
function prevMonth() {
  const today = new Date()
  if (currentYear.value === today.getFullYear() && currentMonth.value === today.getMonth()) return
  if (currentMonth.value === 0) {
    currentYear.value--
    currentMonth.value = 11
  } else {
    currentMonth.value--
  }
}

/**
 * 下个月
 */
function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++
    currentMonth.value = 0
  } else {
    currentMonth.value++
  }
}

/**
 * 取消按钮
 */
function handleCancel() {
  emit('update:visible', false)
  emit('cancel')
}

/**
 * 清除按钮
 */
function handleClear() {
  tempSelectedDate.value = ''
  emit('update:visible', false)
  emit('clear')
}

/**
 * 确认按钮
 */
function handleConfirm() {
  if (tempSelectedDate.value) {
    emit('confirm', { date: tempSelectedDate.value })
  }
  emit('update:visible', false)
}
</script>

<style scoped>
/* ============================================================
   结束日期日历选择器样式
   ============================================================ */

.tep-modal-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tep-modal-sheet {
  width: 85%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.tep-sheet-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a2e;
  text-align: center;
}

/* 月份导航 */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.cal-nav {
  font-size: 48rpx;
  color: #666;
  cursor: pointer;
  padding: 0 16rpx;
  transition: all 0.2s;
}

.cal-nav:active {
  color: #1a1a2e;
}

.cal-month-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 星期头 */
.cal-week-row {
  display: flex;
  gap: 8rpx;
}

.cal-week-cell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 12rpx 0;
}

/* 日历格子 */
.cal-body {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cal-row {
  display: flex;
  gap: 8rpx;
}

.cal-cell {
  flex: 1;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f7f7f7;
  cursor: pointer;
  transition: all 0.2s;
}

.cal-cell-num {
  font-size: 26rpx;
  color: #333;
}

.cal-cell.other-month {
  background: transparent;
}

.cal-cell.other-month .cal-cell-num {
  color: #ccc;
}

.cal-cell.is-past {
  background: #f7f7f7;
  cursor: not-allowed;
}

.cal-cell.is-past .cal-cell-num {
  color: #ddd;
}

.cal-cell.is-today {
  border: 2rpx solid #07c160;
}

.cal-cell.is-end {
  background: #1a1a2e;
}

.cal-cell.is-end .cal-cell-num {
  color: #fff;
  font-weight: bold;
}

.cal-cell:not(.is-past):not(.other-month):active {
  background: #e5e5e5;
}

/* 底部按钮 */
.tep-modal-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}

.tep-modal-cancel,
.tep-modal-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  transition: all 0.2s;
}

.tep-modal-cancel {
  background: #f5f6fa;
  color: #666;
}

.tep-modal-cancel:active {
  background: #e5e5e5;
}

.tep-modal-confirm {
  background: #07c160;
  color: #fff;
}

.tep-modal-confirm:active {
  opacity: 0.8;
}
</style>
