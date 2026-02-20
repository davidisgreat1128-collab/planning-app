<template>
  <!--
    RepeatPanel - 重复设置面板（完整版：每日/每周/每月/每年）
-->
  <view v-if="visible" class="rp-wrap">

    <!-- ① 模式 Tab：不重复 / 每日 / 每周 / 每月 / 每年 -->
    <view class="rp-tabs">
      <view
        v-for="tab in modeTabs"
        :key="tab.key"
        class="rp-tab"
        :class="{ 'rp-tab-active': mode === tab.key }"
        @tap="selectMode(tab.key)"
      >
        <text class="rp-tab-text" :class="{ 'rp-tab-text-active': mode === tab.key }">{{ tab.label }}</text>
      </view>
    </view>

    <!-- ② 不重复：无内容 -->

    <!-- ③ 每日内容 -->
    <view v-if="mode === 'daily'" class="rp-content">
      <!-- 重复日期行 -->
      <view class="rp-row">
        <view class="rp-row-left">
          <text class="rp-row-icon">⊙</text>
          <text class="rp-row-label">重复日期</text>
        </view>
        <view class="rp-row-right">
          <text class="rp-row-unit">每</text>
          <view class="rp-interval-box">
            <input
              class="rp-interval-input"
              type="number"
              :value="String(interval)"
              @input="onIntervalInput"
              maxlength="3"
            />
          </view>
          <text class="rp-row-unit">天重复</text>
        </view>
      </view>
      <!-- 结束重复行 -->
      <view class="rp-divider"></view>
      <view class="rp-row" @tap="openEndPicker">
        <view class="rp-row-left">
          <text class="rp-row-icon">⏻</text>
          <text class="rp-row-label">结束重复</text>
        </view>
        <view class="rp-row-right rp-end-right">
          <template v-if="endDate">
            <text class="rp-end-date">{{ endDate }}</text>
            <view class="rp-end-clear" @tap.stop="clearEndDate">
              <text class="rp-end-clear-icon">✕</text>
            </view>
          </template>
          <template v-else>
            <text class="rp-end-placeholder">未设置结束时间</text>
            <text class="rp-end-arrow">›</text>
          </template>
        </view>
      </view>
    </view>

    <!-- ④ 每周内容 -->
    <view v-if="mode === 'weekly'" class="rp-content">
      <!-- 重复日期（七天圆圈） -->
      <view class="rp-row rp-row-wrap">
        <view class="rp-row-left">
          <text class="rp-row-icon">⊙</text>
          <text class="rp-row-label">重复日期</text>
        </view>
        <view class="rp-weekdays">
          <view
            v-for="(w, idx) in weekDayLabels"
            :key="idx"
            class="rp-weekday-btn"
            :class="{ 'rp-weekday-active': weekDays.includes(idx) }"
            @tap="toggleWeekDay(idx)"
          >
            <text
              class="rp-weekday-text"
              :class="{ 'rp-weekday-text-active': weekDays.includes(idx) }"
            >{{ w }}</text>
          </view>
        </view>
      </view>
      <!-- 重复间隔行 -->
      <view class="rp-divider"></view>
      <view class="rp-row">
        <view class="rp-row-left">
          <text class="rp-row-icon">⊙</text>
          <text class="rp-row-label">重复间隔</text>
        </view>
        <view class="rp-row-right">
          <text class="rp-row-unit">每</text>
          <view class="rp-interval-box">
            <input
              class="rp-interval-input"
              type="number"
              :value="String(interval)"
              @input="onIntervalInput"
              maxlength="2"
            />
          </view>
          <text class="rp-row-unit">周重复</text>
        </view>
      </view>
      <!-- 结束重复行 -->
      <view class="rp-divider"></view>
      <view class="rp-row" @tap="openEndPicker">
        <view class="rp-row-left">
          <text class="rp-row-icon">⏻</text>
          <text class="rp-row-label">结束重复</text>
        </view>
        <view class="rp-row-right rp-end-right">
          <template v-if="endDate">
            <text class="rp-end-date">{{ endDate }}</text>
            <view class="rp-end-clear" @tap.stop="clearEndDate">
              <text class="rp-end-clear-icon">✕</text>
            </view>
          </template>
          <template v-else>
            <text class="rp-end-placeholder">未设置结束时间</text>
            <text class="rp-end-arrow">›</text>
          </template>
        </view>
      </view>
    </view>

    <!-- ⑤ 每月 -->
    <view v-if="mode === 'monthly'" class="rp-content">
      <!-- 日期/星期 子 Tab -->
      <view class="rp-sub-tabs">
        <view class="rp-sub-tab" :class="{ 'rp-sub-tab-active': monthlySubMode === 'date' }" @tap="monthlySubMode = 'date'">
          <text class="rp-sub-tab-text" :class="{ 'rp-sub-tab-text-active': monthlySubMode === 'date' }">日期</text>
        </view>
        <view class="rp-sub-tab" :class="{ 'rp-sub-tab-active': monthlySubMode === 'week' }" @tap="monthlySubMode = 'week'">
          <text class="rp-sub-tab-text" :class="{ 'rp-sub-tab-text-active': monthlySubMode === 'week' }">星期</text>
        </view>
      </view>

      <!-- 每月-日期：1-31 网格多选（10.jpg / 28.jpg） -->
      <view v-if="monthlySubMode === 'date'" class="rp-month-grid">
        <view
          v-for="d in 31" :key="d"
          class="rp-month-day"
          :class="{ 'rp-month-day-active': monthDays.includes(d) }"
          @tap="toggleMonthDay(d)"
        >
          <text class="rp-month-day-text" :class="{ 'rp-month-day-text-active': monthDays.includes(d) }">{{ d }}</text>
        </view>
      </view>

      <!-- 每月-星期：双列 picker（第几个 + 星期几）（26.jpg / 27.jpg） -->
      <view v-if="monthlySubMode === 'week'" class="rp-monthly-week-row">
        <!-- #ifdef H5 -->
        <picker mode="selector" :range="weekOrdinalLabels" :value="monthWeekOrdinal" @change="onMonthOrdinalChange" class="rp-monthly-picker">
          <view class="rp-monthly-picker-display">
            <text class="rp-monthly-picker-value">{{ weekOrdinalLabels[monthWeekOrdinal] }}</text>
          </view>
        </picker>
        <picker mode="selector" :range="weekDayFullLabels" :value="monthWeekDay" @change="onMonthWeekDayChange" class="rp-monthly-picker">
          <view class="rp-monthly-picker-display">
            <text class="rp-monthly-picker-value">{{ weekDayFullLabels[monthWeekDay] }}</text>
          </view>
        </picker>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="rp-monthly-picker" @tap="showMonthOrdinalWheel = true">
          <view class="rp-monthly-picker-display">
            <text class="rp-monthly-picker-value">{{ weekOrdinalLabels[monthWeekOrdinal] }}</text>
          </view>
        </view>
        <view class="rp-monthly-picker" @tap="showMonthWeekDayWheel = true">
          <view class="rp-monthly-picker-display">
            <text class="rp-monthly-picker-value">{{ weekDayFullLabels[monthWeekDay] }}</text>
          </view>
        </view>
        <!-- #endif -->
      </view>

      <view class="rp-divider"></view>
      <view class="rp-row">
        <view class="rp-row-left"><text class="rp-row-icon">⊙</text><text class="rp-row-label">重复间隔</text></view>
        <view class="rp-row-right">
          <text class="rp-row-unit">每</text>
          <view class="rp-interval-box"><input class="rp-interval-input" type="number" :value="String(interval)" @input="onIntervalInput" maxlength="2" /></view>
          <text class="rp-row-unit">月重复</text>
        </view>
      </view>
      <view class="rp-divider"></view>
      <view class="rp-row" @tap="openEndPicker">
        <view class="rp-row-left"><text class="rp-row-icon">⏻</text><text class="rp-row-label">结束重复</text></view>
        <view class="rp-row-right rp-end-right">
          <template v-if="endDate"><text class="rp-end-date">{{ endDate }}</text><view class="rp-end-clear" @tap.stop="clearEndDate"><text class="rp-end-clear-icon">✕</text></view></template>
          <template v-else><text class="rp-end-placeholder">未设置结束时间</text><text class="rp-end-arrow">›</text></template>
        </view>
      </view>
    </view>

    <!-- ⑥ 每年（12.jpg / 29.jpg / 30.jpg / 31.jpg） -->
    <view v-if="mode === 'yearly'" class="rp-content">
      <!-- 重复日期：每年 [月]月 [日]日重复 -->
      <view class="rp-row">
        <view class="rp-row-left"><text class="rp-row-icon">⊙</text><text class="rp-row-label">重复日期</text></view>
        <view class="rp-row-right rp-yearly-date-right">
          <text class="rp-row-unit">每年</text>
          <view class="rp-yearly-block" @tap="showYearlyMonthWheel = true">
            <text class="rp-yearly-block-text">{{ yearlyMonth }}</text>
          </view>
          <text class="rp-row-unit">月</text>
          <view class="rp-yearly-block" @tap="showYearlyDayWheel = true">
            <text class="rp-yearly-block-text">{{ yearlyDay }}</text>
          </view>
          <text class="rp-row-unit">日重复</text>
        </view>
      </view>
      <view class="rp-divider"></view>
      <!-- 重复间隔：每 [N]年重复 -->
      <view class="rp-row">
        <view class="rp-row-left"><text class="rp-row-icon">⊙</text><text class="rp-row-label">重复间隔</text></view>
        <view class="rp-row-right">
          <text class="rp-row-unit">每</text>
          <view class="rp-yearly-block" @tap="showYearlyIntervalWheel = true">
            <text class="rp-yearly-block-text">{{ interval }}</text>
          </view>
          <text class="rp-row-unit">年重复</text>
        </view>
      </view>
      <view class="rp-divider"></view>
      <view class="rp-row" @tap="openEndPicker">
        <view class="rp-row-left"><text class="rp-row-icon">⏻</text><text class="rp-row-label">结束重复</text></view>
        <view class="rp-row-right rp-end-right">
          <template v-if="endDate"><text class="rp-end-date">{{ endDate }}</text><view class="rp-end-clear" @tap.stop="clearEndDate"><text class="rp-end-clear-icon">✕</text></view></template>
          <template v-else><text class="rp-end-placeholder">未设置结束时间</text><text class="rp-end-arrow">›</text></template>
        </view>
      </view>
    </view>

    <!-- ⑦ 底部 取消/确定 -->
    <view class="rp-footer">
      <view class="rp-footer-cancel" @tap="onCancel">
        <text class="rp-footer-text">取消</text>
      </view>
      <view class="rp-footer-confirm" @tap="onConfirm">
        <text class="rp-footer-text rp-footer-confirm-text">确定</text>
      </view>
    </view>

    <!-- ⑧ 结束重复日历 -->
    <repeat-end-picker :visible="showEndPicker" :value="endDate" @confirm="onEndPickerConfirm" @cancel="showEndPicker = false" />

    <!-- ⑨-⑩ 每月-星期：App端滚轮 -->
    <wheel-picker :visible="showMonthOrdinalWheel" :items="weekOrdinalLabels" :value="monthWeekOrdinal" suffix="" @confirm="onMonthOrdinalWheelConfirm" @cancel="showMonthOrdinalWheel = false" />
    <wheel-picker :visible="showMonthWeekDayWheel" :items="weekDayFullLabels" :value="monthWeekDay" suffix="" @confirm="onMonthWeekDayWheelConfirm" @cancel="showMonthWeekDayWheel = false" />

    <!-- ⑪-⑬ 每年：月/日/间隔滚轮 -->
    <wheel-picker :visible="showYearlyMonthWheel"    :items="monthItems"    :value="yearlyMonth - 1" suffix="月"    @confirm="onYearlyMonthConfirm"    @cancel="showYearlyMonthWheel = false" />
    <wheel-picker :visible="showYearlyDayWheel"      :items="dayItems"      :value="yearlyDay - 1"   suffix="日"    @confirm="onYearlyDayConfirm"      @cancel="showYearlyDayWheel = false" />
    <wheel-picker :visible="showYearlyIntervalWheel" :items="intervalItems" :value="interval - 1"    prefix="每" suffix="年重复" @confirm="onYearlyIntervalConfirm" @cancel="showYearlyIntervalWheel = false" />

  </view>
</template>

<script setup>
import { ref, watch } from 'vue';
import RepeatEndPicker from './RepeatEndPicker.vue';
import WheelPicker from './WheelPicker.vue';

// ============================================================
// Props & Emits
// ============================================================
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  /** 当天是星期几（0=周一,...,6=周日），用于每周默认选中 */
  todayWeekIndex: {
    type: Number,
    default: () => {
      const dow = new Date().getDay(); // 0=周日
      return dow === 0 ? 6 : dow - 1; // 转为周一=0
    }
  }
});

const emit = defineEmits(['update:repeatData', 'cancel', 'confirm']);

// ============================================================
// 模式 Tab
// ============================================================
const modeTabs = [
  { key: 'none',    label: '不重复' },
  { key: 'daily',   label: '每日' },
  { key: 'weekly',  label: '每周' },
  { key: 'monthly', label: '每月' },
  { key: 'yearly',  label: '每年' }
];

/** 当前模式 */
const mode = ref('none');

/** 切换模式时重置相关状态 */
function selectMode(key) {
  mode.value = key;
  interval.value = 1;
  endDate.value = '';

  // 每周：默认选当天
  weekDays.value = key === 'weekly' ? [props.todayWeekIndex] : [];

  // 每月：默认当天日期 + 星期信息
  if (key === 'monthly') {
    const t = new Date();
    monthDays.value = [t.getDate()];
    monthlySubMode.value = 'date';
    const dow = t.getDay();
    monthWeekDay.value = dow === 0 ? 6 : dow - 1;
    monthWeekOrdinal.value = Math.min(4, Math.ceil(t.getDate() / 7) - 1);
  }

  // 每年：默认当天月/日
  if (key === 'yearly') {
    const t = new Date();
    yearlyMonth.value = t.getMonth() + 1;
    yearlyDay.value = t.getDate();
  }

  emitData();
}

// ============================================================
// 每日/每月/每年：间隔数
// ============================================================
const interval = ref(1);

function onIntervalInput(e) {
  const v = parseInt(e.detail.value) || 1;
  interval.value = Math.max(1, Math.min(999, v));
  emitData();
}

// ============================================================
// 每周：选择星期
// ============================================================
const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];

/** 当前选中的星期索引数组（0=周一,...,6=周日） */
const weekDays = ref([]);

function toggleWeekDay(idx) {
  const i = weekDays.value.indexOf(idx);
  if (i === -1) {
    weekDays.value.push(idx);
    weekDays.value.sort();
  } else {
    // 至少保留1天
    if (weekDays.value.length > 1) {
      weekDays.value.splice(i, 1);
    }
  }
  emitData();
}

// ============================================================
// 每月：日期多选 + 星期子模式
// ============================================================

/** 每月-日期：选中的日期数组（1-31） */
const monthDays = ref([]);

function toggleMonthDay(d) {
  const i = monthDays.value.indexOf(d);
  if (i === -1) {
    monthDays.value.push(d);
    monthDays.value.sort((a, b) => a - b);
  } else {
    if (monthDays.value.length > 1) {
      monthDays.value.splice(i, 1);
    }
  }
  emitData();
}

/** 每月子模式：date=日期 / week=星期 */
const monthlySubMode = ref('date');

/** 每月-星期：第几个（0=第一个,...,4=最后一个） */
const monthWeekOrdinal = ref(0);
/** 每月-星期：星期几（0=周一,...,6=周日） */
const monthWeekDay = ref(0);

const weekOrdinalLabels = ['第一个', '第二个', '第三个', '第四个', '最后一个'];
const weekDayFullLabels = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

/** 每月-星期 App端 WheelPicker 显示控制 */
const showMonthOrdinalWheel  = ref(false);
const showMonthWeekDayWheel  = ref(false);

/** H5端 picker change */
function onMonthOrdinalChange(e) {
  monthWeekOrdinal.value = e.detail.value;
  emitData();
}
function onMonthWeekDayChange(e) {
  monthWeekDay.value = e.detail.value;
  emitData();
}

/** App端 WheelPicker confirm */
function onMonthOrdinalWheelConfirm(idx) {
  monthWeekOrdinal.value = idx;
  showMonthOrdinalWheel.value = false;
  emitData();
}
function onMonthWeekDayWheelConfirm(idx) {
  monthWeekDay.value = idx;
  showMonthWeekDayWheel.value = false;
  emitData();
}

// ============================================================
// 每年：月份 / 日期 / 间隔
// ============================================================
const yearlyMonth = ref(new Date().getMonth() + 1); // 1-12
const yearlyDay   = ref(new Date().getDate());        // 1-31

/** WheelPicker 数据列表（显示字符串，索引对应实际值-1） */
const monthItems    = Array.from({ length: 12  }, (_, i) => String(i + 1));
const dayItems      = Array.from({ length: 31  }, (_, i) => String(i + 1));
const intervalItems = Array.from({ length: 99  }, (_, i) => String(i + 1));

/** 每年 WheelPicker 显示控制 */
const showYearlyMonthWheel    = ref(false);
const showYearlyDayWheel      = ref(false);
const showYearlyIntervalWheel = ref(false);

function onYearlyMonthConfirm(idx) {
  yearlyMonth.value = idx + 1;
  showYearlyMonthWheel.value = false;
  emitData();
}
function onYearlyDayConfirm(idx) {
  yearlyDay.value = idx + 1;
  showYearlyDayWheel.value = false;
  emitData();
}
function onYearlyIntervalConfirm(idx) {
  interval.value = idx + 1;
  showYearlyIntervalWheel.value = false;
  emitData();
}

// ============================================================
// 结束重复日期
// ============================================================
const endDate = ref('');
const showEndPicker = ref(false);

function openEndPicker() {
  showEndPicker.value = true;
}

function clearEndDate() {
  endDate.value = '';
  emitData();
}

function onEndPickerConfirm(dateStr) {
  endDate.value = dateStr;
  showEndPicker.value = false;
  emitData();
}

// ============================================================
// 向父组件同步数据
// ============================================================
function emitData() {
  emit('update:repeatData', {
    mode:             mode.value,
    interval:         interval.value,
    weekDays:         [...weekDays.value],
    monthDays:        [...monthDays.value],
    monthlySubMode:   monthlySubMode.value,
    monthWeekOrdinal: monthWeekOrdinal.value,
    monthWeekDay:     monthWeekDay.value,
    yearlyMonth:      yearlyMonth.value,
    yearlyDay:        yearlyDay.value,
    endDate:          endDate.value
  });
}

// ============================================================
// 取消 / 确定
// ============================================================
function onCancel() {
  emit('cancel');
}

function onConfirm() {
  emitData();
  emit('confirm');
}

// ============================================================
// 面板打开时初始化
// ============================================================
watch(() => props.visible, (val) => {
  if (!val) return;
  // 重置为不重复
  mode.value = 'none';
  interval.value = 1;
  weekDays.value = [];
  monthDays.value = [];
  monthlySubMode.value = 'date';
  monthWeekOrdinal.value = 0;
  monthWeekDay.value = 0;
  yearlyMonth.value = new Date().getMonth() + 1;
  yearlyDay.value = new Date().getDate();
  endDate.value = '';
});
</script>

<style scoped>
/* ============================================================
   面板容器
   ============================================================ */
.rp-wrap {
  background-color: #FFFFFF;
  border-top: 1rpx solid #F0F0F0;
}

/* ============================================================
   ① 模式 Tab 行
   ============================================================ */
.rp-tabs {
  display: flex;
  flex-direction: row;
  padding: 20rpx 20rpx 16rpx;
  gap: 12rpx;
}

.rp-tab {
  flex: 1;
  height: 64rpx;
  border-radius: 32rpx;
  border: 2rpx solid #DDDDDD;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-tab-active {
  border-color: #222222;
  border-width: 3rpx;
}

.rp-tab-text {
  font-size: 26rpx;
  color: #999;
}

.rp-tab-text-active {
  color: #222222;
  font-weight: bold;
}

/* ============================================================
   ② 内容区
   ============================================================ */
.rp-content {
  padding: 0 24rpx;
}

/* 通用行 */
.rp-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 88rpx;
  padding: 16rpx 0;
}

/* 左侧：图标+文字 */
.rp-row-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
}

.rp-row-icon {
  font-size: 34rpx;
  color: #666;
  margin-right: 16rpx;
  width: 36rpx;
  text-align: center;
}

.rp-row-label {
  font-size: 30rpx;
  color: #333;
}

/* 右侧 */
.rp-row-right {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.rp-row-unit {
  font-size: 28rpx;
  color: #555;
}

/* 间隔数输入框 */
.rp-interval-box {
  width: 80rpx;
  height: 64rpx;
  border: 2rpx solid #333;
  border-radius: 8rpx;
  margin: 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-interval-input {
  width: 64rpx;
  height: 56rpx;
  text-align: center;
  font-size: 30rpx;
  color: #222;
  font-weight: bold;
}

/* 结束重复右侧 */
.rp-end-right {
  gap: 8rpx;
}

.rp-end-placeholder {
  font-size: 28rpx;
  color: #999;
}

.rp-end-arrow {
  font-size: 36rpx;
  color: #AAAAAA;
  line-height: 1;
}

.rp-end-date {
  font-size: 28rpx;
  color: #333;
}

.rp-end-clear {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-end-clear-icon {
  font-size: 20rpx;
  color: #FFFFFF;
  line-height: 1;
}

/* 分割线 */
.rp-divider {
  height: 1rpx;
  background-color: #F5F5F5;
}

/* ============================================================
   每周：星期圆圈
   ============================================================ */
.rp-row-wrap {
  flex-wrap: wrap;
}

.rp-weekdays {
  display: flex;
  flex-direction: row;
  gap: 10rpx;
  flex-wrap: nowrap;
}

.rp-weekday-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2rpx solid #DDDDDD;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rp-weekday-active {
  background-color: #222222;
  border-color: #222222;
}

.rp-weekday-text {
  font-size: 26rpx;
  color: #555;
}

.rp-weekday-text-active {
  color: #FFFFFF;
  font-weight: bold;
}

/* ============================================================
   底部 取消/确定
   ============================================================ */
.rp-footer {
  display: flex;
  flex-direction: row;
  border-top: 1rpx solid #F0F0F0;
  margin-top: 8rpx;
}

.rp-footer-cancel {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid #F0F0F0;
}

.rp-footer-confirm {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-footer-text {
  font-size: 32rpx;
  color: #666;
}

.rp-footer-confirm-text {
  color: #222222;
  font-weight: bold;
}

/* ============================================================
   每月：日期/星期 子 Tab
   ============================================================ */
.rp-sub-tabs {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 16rpx 0 8rpx;
}

.rp-sub-tab {
  height: 56rpx;
  padding: 0 28rpx;
  border-radius: 28rpx;
  border: 2rpx solid #DDDDDD;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-sub-tab-active {
  border-color: #222222;
  background-color: #222222;
}

.rp-sub-tab-text {
  font-size: 26rpx;
  color: #999;
}

.rp-sub-tab-text-active {
  color: #FFFFFF;
  font-weight: bold;
}

/* ============================================================
   每月：1-31 日期网格
   ============================================================ */
.rp-month-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 12rpx 0 16rpx;
}

.rp-month-day {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 2rpx solid #DDDDDD;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-month-day-active {
  background-color: #222222;
  border-color: #222222;
}

.rp-month-day-text {
  font-size: 26rpx;
  color: #555;
}

.rp-month-day-text-active {
  color: #FFFFFF;
  font-weight: bold;
}

/* ============================================================
   每月-星期：双列 picker 行
   ============================================================ */
.rp-monthly-week-row {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 12rpx 0 16rpx;
}

.rp-monthly-picker {
  flex: 1;
  height: 80rpx;
  border: 2rpx solid #DDDDDD;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-monthly-picker-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-monthly-picker-value {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

/* ============================================================
   每年：黑色方块按钮
   ============================================================ */
.rp-yearly-date-right {
  gap: 6rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rp-yearly-block {
  min-width: 56rpx;
  height: 60rpx;
  padding: 0 14rpx;
  background-color: #222222;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-yearly-block-text {
  font-size: 30rpx;
  color: #FFFFFF;
  font-weight: bold;
}
</style>
