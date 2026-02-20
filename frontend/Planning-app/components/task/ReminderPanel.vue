<template>
  <!--
    ReminderPanel - 提醒设置面板
    32.jpg: 主面板（提醒时间行 + 强力提醒区）
    33-36.jpg: 三列滚轮弹窗（按天/按周提前 + 时 + 分）
  -->
  <view v-if="visible" class="rmd-wrap">

    <!-- ① 提醒时间行 -->
    <view class="rmd-row" @tap="openPicker">
      <view class="rmd-row-left">
        <text class="rmd-row-icon">⏰</text>
        <text class="rmd-row-label">提醒时间</text>
      </view>
      <view class="rmd-row-right">
        <template v-if="reminderSet">
          <text class="rmd-time-result">{{ reminderLabel }}</text>
          <view class="rmd-clear" @tap.stop="clearReminder">
            <text class="rmd-clear-icon">✕</text>
          </view>
        </template>
        <template v-else>
          <text class="rmd-placeholder">未开启</text>
          <text class="rmd-arrow">›</text>
        </template>
      </view>
    </view>

    <!-- ② 强力提醒标题行 -->
    <view class="rmd-divider"></view>
    <view class="rmd-row rmd-strong-row">
      <view class="rmd-row-left">
        <text class="rmd-row-icon">⏱</text>
        <text class="rmd-row-label">强力提醒</text>
      </view>
    </view>

    <!-- ③ 强力提醒选项卡 -->
    <view class="rmd-card">
      <!-- 持续提醒 -->
      <view class="rmd-card-row">
        <view class="rmd-card-left">
          <text class="rmd-card-title">持续提醒</text>
          <text class="rmd-card-sub">任务将持续提醒，直到你响应</text>
        </view>
        <switch
          :checked="persistent"
          color="#333333"
          @change="e => { persistent = e.detail.value; emitData(); }"
        />
      </view>
      <view class="rmd-card-divider"></view>
      <!-- 微信辅助提醒 -->
      <view class="rmd-card-row rmd-card-row-tap" @tap="onWechatTap">
        <text class="rmd-card-title">微信辅助提醒</text>
        <view class="rmd-card-right">
          <text class="rmd-card-value">未绑定</text>
          <text class="rmd-card-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- ④ 底部 取消/确定 -->
    <view class="rmd-footer">
      <view class="rmd-footer-cancel" @tap="onCancel">
        <text class="rmd-footer-text">取消</text>
      </view>
      <view class="rmd-footer-confirm" @tap="onConfirm">
        <text class="rmd-footer-text rmd-footer-confirm-text">确定</text>
      </view>
    </view>

    <!-- ⑤ 时间选择弹窗 -->
    <view v-if="showPicker" class="rmd-picker-mask" @tap.stop="closePicker">
      <view class="rmd-picker-sheet" @tap.stop>

        <!-- Tab：按天提前 / 按周提前 -->
        <view class="rmd-picker-tabs">
          <view
            class="rmd-picker-tab"
            :class="{ 'rmd-picker-tab-active': pickerMode === 'day' }"
            @tap="switchPickerMode('day')"
          >
            <text class="rmd-picker-tab-text" :class="{ 'rmd-picker-tab-text-active': pickerMode === 'day' }">按天提前</text>
            <view v-if="pickerMode === 'day'" class="rmd-picker-tab-line"></view>
          </view>
          <view
            class="rmd-picker-tab"
            :class="{ 'rmd-picker-tab-active': pickerMode === 'week' }"
            @tap="switchPickerMode('week')"
          >
            <text class="rmd-picker-tab-text" :class="{ 'rmd-picker-tab-text-active': pickerMode === 'week' }">按周提前</text>
            <view v-if="pickerMode === 'week'" class="rmd-picker-tab-line"></view>
          </view>
        </view>

        <!-- 三列滚轮区 -->
        <!-- #ifdef H5 -->
        <view class="rmd-picker-wheels-h5">
          <picker
            mode="selector"
            :range="currentOffsetLabels"
            :value="tempOffset"
            @change="e => { tempOffset = Number(e.detail.value); checkValid(); }"
            class="rmd-wheel-picker-h5"
          >
            <view class="rmd-wheel-h5-display">
              <view class="rmd-wheel-h5-selected-bg"></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-fade">{{ currentOffsetLabels[tempOffset - 2] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-near">{{ currentOffsetLabels[tempOffset - 1] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-active">{{ currentOffsetLabels[tempOffset] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-near">{{ currentOffsetLabels[tempOffset + 1] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-fade">{{ currentOffsetLabels[tempOffset + 2] || '' }}</text></view>
            </view>
          </picker>

          <text class="rmd-wheel-label">时</text>

          <picker
            mode="selector"
            :range="hourLabels"
            :value="tempHour"
            @change="e => { tempHour = Number(e.detail.value); checkValid(); }"
            class="rmd-wheel-picker-h5"
          >
            <view class="rmd-wheel-h5-display">
              <view class="rmd-wheel-h5-selected-bg"></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-fade">{{ hourLabels[tempHour - 2] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-near">{{ hourLabels[tempHour - 1] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-active">{{ hourLabels[tempHour] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-near">{{ hourLabels[tempHour + 1] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-fade">{{ hourLabels[tempHour + 2] || '' }}</text></view>
            </view>
          </picker>

          <text class="rmd-wheel-label">分</text>

          <picker
            mode="selector"
            :range="minuteLabels"
            :value="tempMinute"
            @change="e => { tempMinute = Number(e.detail.value); checkValid(); }"
            class="rmd-wheel-picker-h5"
          >
            <view class="rmd-wheel-h5-display">
              <view class="rmd-wheel-h5-selected-bg"></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-fade">{{ minuteLabels[tempMinute - 2] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-near">{{ minuteLabels[tempMinute - 1] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-active">{{ minuteLabels[tempMinute] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-near">{{ minuteLabels[tempMinute + 1] || '' }}</text></view>
              <view class="rmd-wheel-h5-item"><text class="rmd-wheel-h5-text rmd-wheel-fade">{{ minuteLabels[tempMinute + 2] || '' }}</text></view>
            </view>
          </picker>
        </view>
        <!-- #endif -->

        <!-- #ifndef H5 -->
        <view class="rmd-picker-wheels-app">
          <!-- 选中行灰底 -->
          <view class="rmd-wheels-selected-bg"></view>

          <!-- ▶ 指示器 -->
          <text class="rmd-wheel-pointer">▶</text>

          <!-- 第1列：提前量 -->
          <view class="rmd-wheel-col">
            <scroll-view
              class="rmd-wheel-scroll"
              scroll-y
              :scroll-top="offsetScrollTop"
              @scroll="e => onWheelScroll(e, 'offset')"
              @scrollend="e => onWheelScrollEnd(e, 'offset')"
            >
              <view class="rmd-wheel-pad"></view>
              <view class="rmd-wheel-pad"></view>
              <view
                v-for="(label, idx) in currentOffsetLabels"
                :key="idx"
                class="rmd-wheel-item"
              >
                <text class="rmd-wheel-item-text" :class="getItemClass(idx, tempOffset)">{{ label }}</text>
              </view>
              <view class="rmd-wheel-pad"></view>
              <view class="rmd-wheel-pad"></view>
            </scroll-view>
          </view>

          <text class="rmd-wheel-label">时</text>

          <!-- 第2列：小时 -->
          <view class="rmd-wheel-col">
            <scroll-view
              class="rmd-wheel-scroll"
              scroll-y
              :scroll-top="hourScrollTop"
              @scroll="e => onWheelScroll(e, 'hour')"
              @scrollend="e => onWheelScrollEnd(e, 'hour')"
            >
              <view class="rmd-wheel-pad"></view>
              <view class="rmd-wheel-pad"></view>
              <view
                v-for="(h, idx) in hourLabels"
                :key="idx"
                class="rmd-wheel-item"
              >
                <text class="rmd-wheel-item-text" :class="getItemClass(idx, tempHour)">{{ h }}</text>
              </view>
              <view class="rmd-wheel-pad"></view>
              <view class="rmd-wheel-pad"></view>
            </scroll-view>
          </view>

          <text class="rmd-wheel-label">分</text>

          <!-- 第3列：分钟 -->
          <view class="rmd-wheel-col">
            <scroll-view
              class="rmd-wheel-scroll"
              scroll-y
              :scroll-top="minuteScrollTop"
              @scroll="e => onWheelScroll(e, 'minute')"
              @scrollend="e => onWheelScrollEnd(e, 'minute')"
            >
              <view class="rmd-wheel-pad"></view>
              <view class="rmd-wheel-pad"></view>
              <view
                v-for="(m, idx) in minuteLabels"
                :key="idx"
                class="rmd-wheel-item"
              >
                <text class="rmd-wheel-item-text" :class="getItemClass(idx, tempMinute)">{{ m }}</text>
              </view>
              <view class="rmd-wheel-pad"></view>
              <view class="rmd-wheel-pad"></view>
            </scroll-view>
          </view>
        </view>
        <!-- #endif -->

        <!-- 底部提示：无效 or 有效预览 -->
        <view class="rmd-picker-hint-row">
          <view v-if="!pickerValid" class="rmd-picker-hint-invalid">
            <text class="rmd-picker-hint-invalid-text">鸭~这个提醒时间无效哦</text>
          </view>
          <text v-else class="rmd-picker-hint-valid">{{ pickerPreviewLabel }}</text>
        </view>

        <!-- 弹窗底部取消/确定 -->
        <view class="rmd-picker-btns">
          <view class="rmd-picker-btn-cancel" @tap="closePicker">
            <text class="rmd-picker-btn-text">取消</text>
          </view>
          <view class="rmd-picker-btn-confirm" :class="{ 'rmd-picker-btn-confirm-disabled': !pickerValid }" @tap="confirmPicker">
            <text class="rmd-picker-btn-text rmd-picker-btn-confirm-text">确定</text>
          </view>
        </view>

      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// ============================================================
// Props & Emits
// ============================================================
const props = defineProps({
  visible: { type: Boolean, default: false },
  /** 任务日期 YYYY-MM-DD，用于计算提醒绝对时间 */
  taskDate: { type: String, default: '' }
});

const emit = defineEmits(['update:reminderData', 'cancel', 'confirm']);

// ============================================================
// 主面板状态
// ============================================================
/** 是否已设置提醒 */
const reminderSet  = ref(false);
/** 持续提醒开关 */
const persistent   = ref(true);
/** 已确认的提醒绝对时间（Date对象） */
const reminderTime = ref(null);

/** 已设置时显示的标签，如"当天 11:33" */
const reminderLabel = computed(() => {
  if (!reminderTime.value) return '';
  const d = reminderTime.value;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}月${day}日 ${hh}:${mm}`;
});

function clearReminder() {
  reminderSet.value  = false;
  reminderTime.value = null;
  emitData();
}

function onWechatTap() {
  uni.showToast({ title: '微信绑定功能开发中', icon: 'none' });
}

// ============================================================
// 滚轮弹窗状态
// ============================================================
const showPicker  = ref(false);
const pickerMode  = ref('day'); // 'day' | 'week'

/** 临时选中：提前量索引 */
const tempOffset  = ref(0);
/** 临时选中：小时索引（0-23） */
const tempHour    = ref(0);
/** 临时选中：分钟索引（0-59） */
const tempMinute  = ref(0);

/** 每项高度 px（88rpx @ 750rpx基准 ≈ 44px） */
const ITEM_H = 44;

// scroll-top（App端）
const offsetScrollTop  = ref(0);
const hourScrollTop    = ref(0);
const minuteScrollTop  = ref(0);

// ============================================================
// 列表数据
// ============================================================
/** 按天提前选项 */
const dayOffsetLabels  = ['当天', ...Array.from({ length: 30 }, (_, i) => `提前${i + 1}天`)];
/** 按周提前选项 */
const weekOffsetLabels = ['当天', ...Array.from({ length: 8 },  (_, i) => `提前${i + 1}周`)];
/** 当前模式对应的提前量列表 */
const currentOffsetLabels = computed(() =>
  pickerMode.value === 'day' ? dayOffsetLabels : weekOffsetLabels
);

const hourLabels   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteLabels = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ============================================================
// 打开 / 关闭弹窗
// ============================================================
function openPicker() {
  // 默认：当天 + 当前时刻（精确到分）
  const now = new Date();
  pickerMode.value  = 'day';
  tempOffset.value  = 0;
  tempHour.value    = now.getHours();
  tempMinute.value  = now.getMinutes();
  showPicker.value  = true;

  // App端：延迟设置 scrollTop
  setTimeout(() => {
    offsetScrollTop.value  = tempOffset.value  * ITEM_H;
    hourScrollTop.value    = tempHour.value    * ITEM_H;
    minuteScrollTop.value  = tempMinute.value  * ITEM_H;
  }, 50);
}

function closePicker() {
  showPicker.value = false;
}

// ============================================================
// 模式切换
// ============================================================
function switchPickerMode(mode) {
  pickerMode.value = mode;
  tempOffset.value = 0;
  setTimeout(() => {
    offsetScrollTop.value = 0;
  }, 50);
  checkValid();
}

// ============================================================
// 计算提醒绝对时间（用于有效性判断和预览）
// ============================================================
function calcReminderDate() {
  // 任务基准日期：优先用 props.taskDate，否则今天
  const base = props.taskDate ? new Date(props.taskDate + 'T00:00:00') : new Date();
  base.setHours(0, 0, 0, 0);

  const offsetVal = tempOffset.value;
  if (pickerMode.value === 'day') {
    base.setDate(base.getDate() - offsetVal);
  } else {
    base.setDate(base.getDate() - offsetVal * 7);
  }

  base.setHours(tempHour.value, tempMinute.value, 0, 0);
  return base;
}

/** 是否有效（提醒时间严格大于当前时间，精确到分） */
const pickerValid = ref(false);

/** 有效时的预览文字 */
const pickerPreviewLabel = ref('');

function checkValid() {
  const target = calcReminderDate();
  const now = new Date();
  // 精确到分：截断秒
  now.setSeconds(0, 0);
  target.setSeconds(0, 0);

  if (target.getTime() > now.getTime()) {
    pickerValid.value = true;
    const m   = target.getMonth() + 1;
    const d   = target.getDate();
    const hh  = String(target.getHours()).padStart(2, '0');
    const mm  = String(target.getMinutes()).padStart(2, '0');
    pickerPreviewLabel.value = `将于${m}月${d}日，${hh}:${mm}提醒你`;
  } else {
    pickerValid.value = false;
    pickerPreviewLabel.value = '';
  }
}

// 弹窗打开后立即检查一次
watch(showPicker, (val) => {
  if (val) checkValid();
});

// ============================================================
// App端：scroll-view 滚动处理
// ============================================================
const scrollTimers = { offset: null, hour: null, minute: null };

function onWheelScroll(e, col) {
  const top = e.detail.scrollTop;
  clearTimeout(scrollTimers[col]);
  scrollTimers[col] = setTimeout(() => {
    snapWheel(top, col);
  }, 150);
}

function onWheelScrollEnd(e, col) {
  snapWheel(e.detail.scrollTop, col);
}

function snapWheel(top, col) {
  const maxIdx = {
    offset: currentOffsetLabels.value.length - 1,
    hour:   23,
    minute: 59
  };
  const idx = Math.max(0, Math.min(maxIdx[col], Math.round(top / ITEM_H)));
  if (col === 'offset') {
    tempOffset.value      = idx;
    offsetScrollTop.value = idx * ITEM_H;
  } else if (col === 'hour') {
    tempHour.value        = idx;
    hourScrollTop.value   = idx * ITEM_H;
  } else {
    tempMinute.value      = idx;
    minuteScrollTop.value = idx * ITEM_H;
  }
  checkValid();
}

/** 文字样式：根据距离选中项的差值 */
function getItemClass(idx, selected) {
  const diff = Math.abs(idx - selected);
  if (diff === 0) return 'rmd-wheel-active';
  if (diff === 1) return 'rmd-wheel-near';
  return 'rmd-wheel-fade';
}

// ============================================================
// 确定
// ============================================================
function confirmPicker() {
  if (!pickerValid.value) return;
  reminderTime.value = calcReminderDate();
  reminderSet.value  = true;
  showPicker.value   = false;
  emitData();
}

// ============================================================
// 向父组件同步数据
// ============================================================
function emitData() {
  emit('update:reminderData', {
    enabled:    reminderSet.value,
    time:       reminderTime.value ? reminderTime.value.toISOString() : null,
    persistent: persistent.value
  });
}

// ============================================================
// 取消 / 确定（主面板）
// ============================================================
function onCancel() {
  emit('cancel');
}

function onConfirm() {
  emitData();
  emit('confirm');
}

// ============================================================
// 面板打开时重置
// ============================================================
watch(() => props.visible, (val) => {
  if (!val) return;
  reminderSet.value  = false;
  reminderTime.value = null;
  persistent.value   = true;
  showPicker.value   = false;
});
</script>

<style scoped>
/* ============================================================
   主面板容器
   ============================================================ */
.rmd-wrap {
  background-color: #FFFFFF;
  border-top: 1rpx solid #F0F0F0;
}

/* ============================================================
   通用行
   ============================================================ */
.rmd-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 88rpx;
  padding: 16rpx 24rpx;
}

.rmd-row-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
}

.rmd-row-icon {
  font-size: 34rpx;
  color: #666;
  margin-right: 16rpx;
  width: 36rpx;
  text-align: center;
}

.rmd-row-label {
  font-size: 30rpx;
  color: #333;
}

.rmd-row-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
}

.rmd-placeholder {
  font-size: 28rpx;
  color: #999;
}

.rmd-arrow {
  font-size: 36rpx;
  color: #AAAAAA;
}

.rmd-time-result {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.rmd-clear {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rmd-clear-icon {
  font-size: 20rpx;
  color: #FFFFFF;
}

.rmd-divider {
  height: 1rpx;
  background-color: #F5F5F5;
  margin: 0 24rpx;
}

/* ============================================================
   强力提醒区
   ============================================================ */
.rmd-strong-row {
  padding-bottom: 8rpx;
}

.rmd-card {
  margin: 0 24rpx 16rpx;
  background-color: #F7F7F7;
  border-radius: 16rpx;
  overflow: hidden;
}

.rmd-card-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx 24rpx;
  min-height: 88rpx;
}

.rmd-card-row-tap {
  /* 可点击行 */
}

.rmd-card-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.rmd-card-title {
  font-size: 30rpx;
  color: #222;
  font-weight: bold;
}

.rmd-card-sub {
  font-size: 24rpx;
  color: #999;
}

.rmd-card-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4rpx;
}

.rmd-card-value {
  font-size: 28rpx;
  color: #999;
}

.rmd-card-arrow {
  font-size: 36rpx;
  color: #AAAAAA;
}

.rmd-card-divider {
  height: 1rpx;
  background-color: #EFEFEF;
  margin: 0 24rpx;
}

/* ============================================================
   底部取消/确定
   ============================================================ */
.rmd-footer {
  display: flex;
  flex-direction: row;
  border-top: 1rpx solid #F0F0F0;
  margin-top: 8rpx;
}

.rmd-footer-cancel {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid #F0F0F0;
}

.rmd-footer-confirm {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rmd-footer-text {
  font-size: 32rpx;
  color: #666;
}

.rmd-footer-confirm-text {
  color: #222222;
  font-weight: bold;
}

/* ============================================================
   弹窗遮罩
   ============================================================ */
.rmd-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1300;
  display: flex;
  align-items: flex-end;
}

.rmd-picker-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
}

/* ============================================================
   弹窗 Tab
   ============================================================ */
.rmd-picker-tabs {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 80rpx;
  padding: 32rpx 0 0;
}

.rmd-picker-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding-bottom: 8rpx;
}

.rmd-picker-tab-text {
  font-size: 30rpx;
  color: #999;
}

.rmd-picker-tab-text-active {
  color: #222222;
  font-weight: bold;
  font-size: 32rpx;
}

.rmd-picker-tab-line {
  height: 4rpx;
  width: 100%;
  background-color: #222222;
  border-radius: 2rpx;
}

/* ============================================================
   App端：三列滚轮
   ============================================================ */
.rmd-picker-wheels-app {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 440rpx;
  position: relative;
  padding: 0 24rpx;
  margin-top: 16rpx;
}

/* 选中行灰底（绝对定位居中） */
.rmd-wheels-selected-bg {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  height: 88rpx;
  background-color: #F0F0F0;
  border-radius: 12rpx;
  pointer-events: none;
  z-index: 0;
}

.rmd-wheel-pointer {
  font-size: 26rpx;
  color: #333;
  margin-right: 8rpx;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.rmd-wheel-col {
  position: relative;
  z-index: 1;
  overflow: hidden;
  height: 440rpx;
}

/* 第1列（提前量）稍宽 */
.rmd-wheel-col:first-of-type {
  width: 180rpx;
}
/* 第2、3列（时/分）较窄 */
.rmd-wheel-col:not(:first-of-type) {
  width: 100rpx;
}

.rmd-wheel-scroll {
  width: 100%;
  height: 440rpx;
}

.rmd-wheel-pad {
  height: 88rpx;
}

.rmd-wheel-item {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rmd-wheel-item-text {
  text-align: center;
  transition: font-size 0.1s, color 0.1s;
}

.rmd-wheel-label {
  font-size: 30rpx;
  color: #555;
  margin: 0 8rpx;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

/* 文字级别样式（共用于 App 和 H5） */
.rmd-wheel-active {
  font-size: 52rpx;
  color: #111111;
  font-weight: bold;
}

.rmd-wheel-near {
  font-size: 34rpx;
  color: #888888;
}

.rmd-wheel-fade {
  font-size: 26rpx;
  color: #CCCCCC;
}

/* ============================================================
   H5端：三列 picker 布局
   ============================================================ */
.rmd-picker-wheels-h5 {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 440rpx;
  padding: 0 24rpx;
  margin-top: 16rpx;
  gap: 0;
}

.rmd-wheel-picker-h5 {
  height: 440rpx;
}

/* 第1列稍宽 */
.rmd-picker-wheels-h5 .rmd-wheel-picker-h5:nth-child(1) {
  width: 180rpx;
}
/* 第2、3列 */
.rmd-picker-wheels-h5 .rmd-wheel-picker-h5:nth-child(3),
.rmd-picker-wheels-h5 .rmd-wheel-picker-h5:nth-child(5) {
  width: 100rpx;
}

.rmd-wheel-h5-display {
  position: relative;
  width: 100%;
  height: 440rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.rmd-wheel-h5-selected-bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 88rpx;
  background-color: #F0F0F0;
  border-radius: 12rpx;
  pointer-events: none;
  z-index: 0;
}

.rmd-wheel-h5-item {
  height: 88rpx;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.rmd-wheel-h5-text {
  text-align: center;
}

/* ============================================================
   底部提示行
   ============================================================ */
.rmd-picker-hint-row {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32rpx;
}

.rmd-picker-hint-invalid {
  background-color: #FFF0F0;
  border-radius: 32rpx;
  padding: 12rpx 32rpx;
}

.rmd-picker-hint-invalid-text {
  font-size: 26rpx;
  color: #E05050;
}

.rmd-picker-hint-valid {
  font-size: 26rpx;
  color: #333333;
}

/* ============================================================
   弹窗底部取消/确定
   ============================================================ */
.rmd-picker-btns {
  display: flex;
  flex-direction: row;
  border-top: 1rpx solid #F0F0F0;
}

.rmd-picker-btn-cancel {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid #F0F0F0;
}

.rmd-picker-btn-confirm {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rmd-picker-btn-confirm-disabled {
  opacity: 0.35;
}

.rmd-picker-btn-text {
  font-size: 32rpx;
  color: #666;
}

.rmd-picker-btn-confirm-text {
  color: #222222;
  font-weight: bold;
}
</style>
