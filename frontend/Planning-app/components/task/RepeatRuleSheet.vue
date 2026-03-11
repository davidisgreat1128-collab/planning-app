<template>
  <!-- 重复规则底部弹窗 -->
  <view v-if="visible" class="tep-modal-mask-bottom" @tap.self="handleCancel">
    <view class="repeat-new-sheet">

      <!-- 顶部5个模式切换标签 -->
      <view class="repeat-tabs">
        <view
          v-for="opt in repeatOptions"
          :key="opt.value"
          class="repeat-tab"
          :class="{ 'repeat-tab-active': repeatMode === opt.value }"
          @tap="repeatMode = opt.value"
        >
          <text class="repeat-tab-text">{{ opt.label }}</text>
        </view>
      </view>

      <!-- 配置内容区域 -->
      <view class="repeat-content">

        <!-- 不重复：无额外配置 -->
        <view v-if="repeatMode === 'none'" class="repeat-empty">
          <!-- 空白区域 -->
        </view>

        <!-- 每日重复 -->
        <view v-if="repeatMode === 'daily'" class="repeat-config-list">
          <view class="repeat-row">
            <view class="repeat-row-left">
              <text class="repeat-icon">○</text>
              <text class="repeat-label">重复日期</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-text">每</text>
              <picker mode="selector" :range="Array.from({length: 30}, (_, i) => i + 1)" :value="repeatInterval - 1" @change="onIntervalChange">
                <view class="repeat-num-box">
                  <text>{{ repeatInterval }}</text>
                </view>
              </picker>
              <text class="repeat-text">天重复</text>
            </view>
          </view>

          <view class="repeat-row" @tap="openEndDatePicker">
            <view class="repeat-row-left">
              <text class="repeat-icon">☒</text>
              <text class="repeat-label">结束重复</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-end-hint">{{ repeatEndDate || '未设置结束时间' }}</text>
              <text class="repeat-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 每周重复 -->
        <view v-if="repeatMode === 'weekly'" class="repeat-config-list">
          <view class="repeat-row-col">
            <view class="repeat-row-left">
              <text class="repeat-icon">○</text>
              <text class="repeat-label">重复星期</text>
            </view>
            <view class="repeat-weekdays">
              <view
                v-for="(label, idx) in weekDayLabels"
                :key="idx"
                class="repeat-weekday-btn"
                :class="{ 'repeat-weekday-active': repeatWeekDays.includes(idx + 1) }"
                @tap="toggleWeekDay(idx + 1)"
              >
                <text>{{ label }}</text>
              </view>
            </view>
          </view>

          <view class="repeat-row">
            <view class="repeat-row-left">
              <text class="repeat-icon">○</text>
              <text class="repeat-label">重复间隔</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-text">每</text>
              <picker mode="selector" :range="Array.from({length: 30}, (_, i) => i + 1)" :value="repeatInterval - 1" @change="onIntervalChange">
                <view class="repeat-num-box">
                  <text>{{ repeatInterval }}</text>
                </view>
              </picker>
              <text class="repeat-text">周重复</text>
            </view>
          </view>

          <view class="repeat-row" @tap="openEndDatePicker">
            <view class="repeat-row-left">
              <text class="repeat-icon">☒</text>
              <text class="repeat-label">结束重复</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-end-hint">{{ repeatEndDate || '未设置结束时间' }}</text>
              <text class="repeat-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 每月重复 -->
        <view v-if="repeatMode === 'monthly'" class="repeat-config-list">
          <!-- 日期/星期子标签 -->
          <view class="repeat-sub-tabs">
            <view
              class="repeat-sub-tab"
              :class="{ 'repeat-sub-tab-active': monthlySubMode === 'day' }"
              @tap="monthlySubMode = 'day'; repeatRuleManager.loadFromRrule(form.rrule || '')"
            >
              <text>日期</text>
            </view>
            <view
              class="repeat-sub-tab"
              :class="{ 'repeat-sub-tab-active': monthlySubMode === 'weekday' }"
              @tap="monthlySubMode = 'weekday'; repeatRuleManager.loadFromRrule(form.rrule || '')"
            >
              <text>星期</text>
            </view>
          </view>

          <!-- 日期网格 -->
          <view v-if="monthlySubMode === 'day'" class="repeat-date-grid">
            <view
              v-for="day in 31"
              :key="day"
              class="repeat-date-cell"
              :class="{ 'repeat-date-active': monthlyDays.includes(day) }"
              @tap="toggleMonthlyDay(day)"
            >
              <text>{{ day }}</text>
            </view>
          </view>

          <view class="repeat-row">
            <view class="repeat-row-left">
              <text class="repeat-icon">○</text>
              <text class="repeat-label">重复间隔</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-text">每</text>
              <picker mode="selector" :range="Array.from({length: 12}, (_, i) => i + 1)" :value="repeatInterval - 1" @change="onIntervalChange">
                <view class="repeat-num-box">
                  <text>{{ repeatInterval }}</text>
                </view>
              </picker>
              <text class="repeat-text">月重复</text>
            </view>
          </view>

          <view class="repeat-row" @tap="openEndDatePicker">
            <view class="repeat-row-left">
              <text class="repeat-icon">☒</text>
              <text class="repeat-label">结束重复</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-end-hint">{{ repeatEndDate || '未设置结束时间' }}</text>
              <text class="repeat-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 每年重复 -->
        <view v-if="repeatMode === 'yearly'" class="repeat-config-list">
          <view class="repeat-row">
            <view class="repeat-row-left">
              <text class="repeat-icon">○</text>
              <text class="repeat-label">重复日期</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-text">每年</text>
              <picker mode="selector" :range="Array.from({length: 12}, (_, i) => i + 1)" :value="yearlyMonth - 1" @change="onYearlyMonthChange">
                <view class="repeat-num-box">
                  <text>{{ yearlyMonth }}</text>
                </view>
              </picker>
              <text class="repeat-text">月</text>
              <picker mode="selector" :range="Array.from({length: 31}, (_, i) => i + 1)" :value="yearlyDay - 1" @change="onYearlyDayChange">
                <view class="repeat-num-box">
                  <text>{{ yearlyDay }}</text>
                </view>
              </picker>
              <text class="repeat-text">日重复</text>
            </view>
          </view>

          <view class="repeat-row">
            <view class="repeat-row-left">
              <text class="repeat-icon">○</text>
              <text class="repeat-label">重复间隔</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-text">每</text>
              <picker mode="selector" :range="Array.from({length: 10}, (_, i) => i + 1)" :value="repeatInterval - 1" @change="onIntervalChange">
                <view class="repeat-num-box">
                  <text>{{ repeatInterval }}</text>
                </view>
              </picker>
              <text class="repeat-text">年重复</text>
            </view>
          </view>

          <view class="repeat-row" @tap="openEndDatePicker">
            <view class="repeat-row-left">
              <text class="repeat-icon">☒</text>
              <text class="repeat-label">结束重复</text>
            </view>
            <view class="repeat-row-right">
              <text class="repeat-end-hint">{{ repeatEndDate || '未设置结束时间' }}</text>
              <text class="repeat-arrow">›</text>
            </view>
          </view>
        </view>

      </view>

      <!-- 底部按钮 -->
      <view class="repeat-bottom-btns">
        <view class="repeat-btn repeat-btn-cancel" @tap="handleCancel">
          <text>取消</text>
        </view>
        <view class="repeat-btn repeat-btn-confirm" @tap="handleConfirm">
          <text>确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 重复规则底部弹窗组件
 *
 * Props:
 * - visible: Boolean - 弹窗是否可见
 * - repeatRuleManager: Object - 重复规则管理器（来自 useTaskForm）
 * - form: Object - 表单对象（用于获取 rrule 字段）
 *
 * Emits:
 * - update:visible - 更新弹窗状态
 * - confirm - 确认按钮
 * - cancel - 取消按钮
 * - open-end-date-picker - 打开结束日期选择器
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  repeatRuleManager: {
    type: Object,
    required: true
  },
  form: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'open-end-date-picker'])

// ============================================================
// 从 repeatRuleManager 解构状态和方法
// ============================================================

const {
  repeatMode,
  repeatInterval,
  repeatWeekDays,
  repeatEndDate,
  monthlySubMode,
  monthlyDays,
  monthlyWeekNum,
  monthlyWeekday,
  yearlyMonth,
  yearlyDay,
  toggleWeekDay,
  toggleMonthlyDay
} = props.repeatRuleManager

// ============================================================
// 常量定义
// ============================================================

/** 重复规则选项（胶囊按钮） */
const repeatOptions = [
  { label: '不重复', value: 'none'    },
  { label: '每日',   value: 'daily'   },
  { label: '每周',   value: 'weekly'  },
  { label: '每月',   value: 'monthly' },
  { label: '每年',   value: 'yearly'  }
]

/** 周几标签（一~日） */
const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日']

// ============================================================
// 事件处理
// ============================================================

/** 处理重复间隔选择器变化 */
function onIntervalChange(e) {
  repeatInterval.value = parseInt(e.detail.value) + 1
  props.repeatRuleManager.loadFromRrule(props.form.rrule || '')
}

/** 处理年度月份选择器变化 */
function onYearlyMonthChange(e) {
  yearlyMonth.value = parseInt(e.detail.value) + 1
  props.repeatRuleManager.loadFromRrule(props.form.rrule || '')
}

/** 处理年度日期选择器变化 */
function onYearlyDayChange(e) {
  yearlyDay.value = parseInt(e.detail.value) + 1
  props.repeatRuleManager.loadFromRrule(props.form.rrule || '')
}

/** 打开结束日期选择器 */
function openEndDatePicker() {
  if (repeatMode.value === 'none') return
  emit('open-end-date-picker')
}

/** 取消按钮 */
function handleCancel() {
  emit('update:visible', false)
  emit('cancel')
}

/** 确认按钮 */
function handleConfirm() {
  emit('update:visible', false)
  emit('confirm')
}
</script>

<style scoped>
/* ============================================================
   重复规则弹窗样式
   ============================================================ */

.tep-modal-mask-bottom {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.repeat-new-sheet {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部5个模式切换标签 */
.repeat-tabs {
  display: flex;
  border-bottom: 2rpx solid #eee;
  flex-shrink: 0;
}

.repeat-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s;
}

.repeat-tab-active {
  border-bottom-color: #07c160;
}

.repeat-tab-text {
  font-size: 28rpx;
  color: #999;
}

.repeat-tab-active .repeat-tab-text {
  color: #07c160;
  font-weight: 500;
}

/* 配置内容区域 */
.repeat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx 32rpx;
}

.repeat-empty {
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.repeat-config-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 配置行 */
.repeat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #f7f7f7;
  border-radius: 16rpx;
  min-height: 88rpx;
}

.repeat-row-col {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 24rpx;
  background: #f7f7f7;
  border-radius: 16rpx;
}

.repeat-row-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.repeat-icon {
  font-size: 32rpx;
  color: #999;
}

.repeat-label {
  font-size: 28rpx;
  color: #333;
}

.repeat-row-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.repeat-text {
  font-size: 26rpx;
  color: #666;
}

.repeat-num-box {
  padding: 8rpx 20rpx;
  background: #fff;
  border-radius: 8rpx;
  min-width: 60rpx;
  text-align: center;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid #ddd;
}

.repeat-end-hint {
  font-size: 26rpx;
  color: #666;
}

.repeat-arrow {
  font-size: 36rpx;
  color: #999;
}

/* 星期选择 */
.repeat-weekdays {
  display: flex;
  gap: 16rpx;
}

.repeat-weekday-btn {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.2s;
}

.repeat-weekday-active {
  background: #07c160;
  border-color: #07c160;
  color: #fff;
}

/* 每月子标签 */
.repeat-sub-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.repeat-sub-tab {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.2s;
}

.repeat-sub-tab-active {
  background: #07c160;
  border-color: #07c160;
  color: #fff;
}

/* 日期网格 */
.repeat-date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.repeat-date-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.2s;
}

.repeat-date-active {
  background: #07c160;
  border-color: #07c160;
  color: #fff;
}

/* 底部按钮 */
.repeat-bottom-btns {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  border-top: 2rpx solid #eee;
  flex-shrink: 0;
}

.repeat-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 28rpx;
  transition: all 0.2s;
}

.repeat-btn-cancel {
  background: #f7f7f7;
  color: #666;
}

.repeat-btn-confirm {
  background: #07c160;
  color: #fff;
}

.repeat-btn:active {
  opacity: 0.8;
}
</style>
