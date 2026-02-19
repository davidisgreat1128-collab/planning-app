<template>
  <!--
    RepeatPanel - 重复设置面板
    嵌入 AddTaskPanel 时间段下方，点击工具栏"重复"按钮展开/折叠
    Props:
      visible  Boolean  面板是否展开
    Emits:
      update:repeatData(data)  重复数据变更
        data = {
          mode: 'none'|'daily'|'weekly'|'monthly'|'yearly',
          interval: Number,           // 间隔（每N天/周/月/年）
          weekDays: Number[],         // 每周重复的星期（0=一,1=二,...,6=日）
          endDate: String,            // 结束日期 YYYY-MM-DD，'' = 未设置
        }
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

    <!-- ⑤ 每月内容（后续完善，先占位） -->
    <view v-if="mode === 'monthly'" class="rp-content">
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
              maxlength="2"
            />
          </view>
          <text class="rp-row-unit">月重复</text>
        </view>
      </view>
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

    <!-- ⑥ 每年内容（后续完善，先占位） -->
    <view v-if="mode === 'yearly'" class="rp-content">
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
              maxlength="2"
            />
          </view>
          <text class="rp-row-unit">年重复</text>
        </view>
      </view>
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

    <!-- ⑦ 底部 取消/确定 -->
    <view class="rp-footer">
      <view class="rp-footer-cancel" @tap="onCancel">
        <text class="rp-footer-text">取消</text>
      </view>
      <view class="rp-footer-confirm" @tap="onConfirm">
        <text class="rp-footer-text rp-footer-confirm-text">确定</text>
      </view>
    </view>

    <!-- ⑧ RepeatEndPicker：结束重复日历（复用组件） -->
    <repeat-end-picker
      :visible="showEndPicker"
      :value="endDate"
      @confirm="onEndPickerConfirm"
      @cancel="showEndPicker = false"
    />

  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import RepeatEndPicker from './RepeatEndPicker.vue';

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
  if (key === 'weekly') {
    weekDays.value = [props.todayWeekIndex];
  } else {
    weekDays.value = [];
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

/** 初始化时默认选当天 */
watch(() => props.visible, (val) => {
  if (val && mode.value === 'weekly' && weekDays.value.length === 0) {
    weekDays.value = [props.todayWeekIndex];
  }
});

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
// 结束重复日期
// ============================================================
const endDate = ref('');

/** 结束重复日历弹窗 */
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
    mode:     mode.value,
    interval: interval.value,
    weekDays: [...weekDays.value],
    endDate:  endDate.value
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
</style>
