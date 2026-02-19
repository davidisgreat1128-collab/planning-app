<template>
  <!-- 遮罩层 -->
  <view v-if="visible" class="panel-mask" @tap="onMaskTap"></view>

  <!-- 底部面板 -->
  <view class="add-task-panel" :class="{ visible: visible }">

    <!-- ① 顶部日期 Tab -->
    <view class="date-tabs">
      <view
        v-for="tab in dateTabs"
        :key="tab.key"
        class="date-tab"
        :class="{ active: activeDateTab === tab.key }"
        @tap="selectDateTab(tab)"
      >
        <text class="date-tab-text">{{ tab.label }}</text>
        <view v-if="activeDateTab === tab.key" class="date-tab-line"></view>
      </view>
    </view>

    <!-- ② 任务标题输入行 -->
    <view class="title-row">
      <!-- 四象限颜色圆圈 -->
      <view
        class="quadrant-dot"
        :style="{ backgroundColor: currentQuadrantColor }"
        @tap="toggleQuadrantPicker"
      >
        <text v-if="!form.isUrgent && !form.isImportant" class="quadrant-dot-label">无</text>
      </view>
      <view class="title-divider"></view>
      <input
        class="title-input"
        placeholder="我准备做..."
        placeholder-class="title-placeholder"
        :value="form.title"
        @input="form.title = $event.detail.value"
        :focus="visible"
        maxlength="100"
        confirm-type="done"
        @confirm="submit"
      />
    </view>

    <!-- ③ 子计划区域（展开时显示） -->
    <view v-if="showSubtasks" class="subtask-area">
      <!-- 已添加的子计划列表 -->
      <view
        v-for="(item, index) in subtasks"
        :key="index"
        class="subtask-item"
      >
        <text class="subtask-dot">·</text>
        <text class="subtask-text">{{ item }}</text>
        <view class="subtask-remove" @tap="removeSubtask(index)">
          <text class="subtask-remove-icon">—</text>
        </view>
      </view>
      <!-- 子计划输入行 -->
      <view v-if="subtasks.length < 100" class="subtask-input-row">
        <view class="subtask-icon-placeholder"></view>
        <input
          class="subtask-input"
          placeholder="添加子计划"
          placeholder-class="subtask-placeholder"
          :value="subtaskDraft"
          @input="subtaskDraft = $event.detail.value"
          confirm-type="done"
          @confirm="addSubtask"
        />
        <view class="subtask-add-btn" @tap="addSubtask">
          <text class="subtask-add-icon">+</text>
        </view>
      </view>
      <view v-else class="subtask-limit-tip">
        <text class="subtask-limit-text">已达上限（100条）</text>
      </view>
    </view>

    <!-- ④ 底部工具栏 -->
    <view class="toolbar">
      <!-- 四象限 -->
      <view class="toolbar-item" @tap="toggleQuadrantPicker">
        <view class="toolbar-icon quadrant-icon" :style="{ color: currentQuadrantIconColor }">
          <text class="quadrant-exclaim">!!!!</text>
        </view>
        <text class="toolbar-label" :style="{ color: currentQuadrantIconColor }">四象限</text>
      </view>

      <!-- 子计划 -->
      <view class="toolbar-item" @tap="toggleSubtasks">
        <view class="toolbar-icon-wrap">
          <text class="toolbar-icon-text">☰</text>
          <view v-if="subtasks.length > 0" class="toolbar-badge">
            <text class="toolbar-badge-text">{{ subtasks.length }}</text>
          </view>
        </view>
        <text class="toolbar-label" :class="{ 'label-active': showSubtasks }">子计划</text>
      </view>

      <!-- 时间段（占位） -->
      <view class="toolbar-item" @tap="onTimeTap">
        <text class="toolbar-icon-text">🕐</text>
        <text class="toolbar-label">时间段</text>
      </view>

      <!-- 重复（占位） -->
      <view class="toolbar-item" @tap="onRepeatTap">
        <text class="toolbar-icon-text">🔁</text>
        <text class="toolbar-label">重复</text>
      </view>

      <!-- 提醒（占位） -->
      <view class="toolbar-item" @tap="onReminderTap">
        <text class="toolbar-icon-text">⏰</text>
        <text class="toolbar-label">提醒</text>
      </view>

      <!-- 发送按钮 -->
      <view class="send-btn" :class="{ 'send-btn-active': form.title.trim() }" @tap="submit">
        <text class="send-icon">➤</text>
      </view>
    </view>

    <!-- ⑤ 四象限浮层 -->
    <view v-if="showQuadrantPicker" class="quadrant-picker">
      <view class="quadrant-picker-inner">
        <!-- 坐标轴 -->
        <view class="axis-h"></view>
        <view class="axis-v"></view>
        <!-- 四个象限 -->
        <view
          v-for="q in quadrants"
          :key="q.key"
          class="qp-cell"
          :class="[q.posClass, { 'qp-selected': isQuadrantSelected(q) }]"
          @tap="selectQuadrant(q)"
        >
          <text class="qp-label">{{ q.name }}</text>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTaskStore } from '@/store/task.js';

// ============================================================
// Props & Emits
// ============================================================
const props = defineProps({
  /** 面板是否可见 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 预设日期 YYYY-MM-DD */
  presetDate: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'submitted']);

// ============================================================
// Store
// ============================================================
const taskStore = useTaskStore();

// ============================================================
// 表单数据
// ============================================================
const form = ref({
  title: '',
  isUrgent: false,
  isImportant: false
});

/** 子计划草稿（输入中） */
const subtaskDraft = ref('');

/** 子计划列表（最多100条） */
const subtasks = ref([]);

/** 子计划区域是否展开 */
const showSubtasks = ref(false);

/** 四象限选择器是否展开 */
const showQuadrantPicker = ref(false);

// ============================================================
// 日期 Tab
// ============================================================

/** 获取 YYYY-MM-DD 格式日期 */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 获取今天、明天的日期字符串 */
function getTodayStr() {
  return formatDate(new Date());
}
function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

const dateTabs = [
  { key: 'today',    label: '今天',   date: getTodayStr() },
  { key: 'tomorrow', label: '明天',   date: getTomorrowStr() },
  { key: 'other',    label: '其他日期', date: '' },
  { key: 'inbox',    label: '收集箱',  date: '' }
];

/** 当前选中的日期 Tab */
const activeDateTab = ref('today');

/** 选择日期 Tab */
function selectDateTab(tab) {
  if (tab.key === 'other') {
    // 调起日期选择器
    uni.showToast({ title: '日期选择开发中', icon: 'none' });
    return;
  }
  activeDateTab.value = tab.key;
}

/** 根据 Tab 获取最终提交日期 */
const resolvedDate = computed(() => {
  if (activeDateTab.value === 'today') return getTodayStr();
  if (activeDateTab.value === 'tomorrow') return getTomorrowStr();
  if (activeDateTab.value === 'inbox') return '';
  // other 日期：优先用预设日期
  return props.presetDate || getTodayStr();
});

// ============================================================
// 四象限
// ============================================================

/** 四象限配置 */
const quadrants = [
  { key: 'q3', name: '紧急不重要', posClass: 'qp-top-left',    isUrgent: true,  isImportant: false, color: '#FFB300' },
  { key: 'q1', name: '重要且紧急', posClass: 'qp-top-right',   isUrgent: true,  isImportant: true,  color: '#FF4444' },
  { key: 'q4', name: '不重要不紧急', posClass: 'qp-bot-left',  isUrgent: false, isImportant: false, color: '#4CAF50' },
  { key: 'q2', name: '重要不紧急', posClass: 'qp-bot-right',   isUrgent: false, isImportant: true,  color: '#5B8CFF' }
];

/** 当前选中的四象限颜色（圆圈颜色） */
const currentQuadrantColor = computed(() => {
  if (!form.value.isUrgent && !form.value.isImportant) return '#E0E0E0';
  const q = quadrants.find(q => q.isUrgent === form.value.isUrgent && q.isImportant === form.value.isImportant);
  return q ? q.color : '#E0E0E0';
});

/** 当前四象限图标颜色（工具栏用） */
const currentQuadrantIconColor = computed(() => {
  if (!form.value.isUrgent && !form.value.isImportant) return '#FF4444';
  return currentQuadrantColor.value;
});

/** 是否选中指定象限 */
function isQuadrantSelected(q) {
  return q.isUrgent === form.value.isUrgent && q.isImportant === form.value.isImportant;
}

/** 展开/折叠四象限选择器 */
function toggleQuadrantPicker() {
  showQuadrantPicker.value = !showQuadrantPicker.value;
}

/** 选择象限 */
function selectQuadrant(q) {
  form.value.isUrgent = q.isUrgent;
  form.value.isImportant = q.isImportant;
  showQuadrantPicker.value = false;
}

// ============================================================
// 子计划
// ============================================================

/** 展开/折叠子计划区域 */
function toggleSubtasks() {
  showSubtasks.value = !showSubtasks.value;
}

/** 添加子计划 */
function addSubtask() {
  const text = subtaskDraft.value.trim();
  if (!text) return;
  if (subtasks.value.length >= 100) {
    uni.showToast({ title: '子计划最多100条', icon: 'none' });
    return;
  }
  subtasks.value.push(text);
  subtaskDraft.value = '';
  // 自动展开子计划区域
  showSubtasks.value = true;
}

/** 删除子计划 */
function removeSubtask(index) {
  subtasks.value.splice(index, 1);
}

// ============================================================
// 工具栏占位功能
// ============================================================
function onTimeTap() {
  uni.showToast({ title: '时间段功能开发中', icon: 'none' });
}
function onRepeatTap() {
  uni.showToast({ title: '重复功能开发中', icon: 'none' });
}
function onReminderTap() {
  uni.showToast({ title: '提醒功能开发中', icon: 'none' });
}

// ============================================================
// 提交
// ============================================================
async function submit() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请填写任务内容', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '保存中...' });

    const payload = {
      title:       form.value.title.trim(),
      isUrgent:    form.value.isUrgent,
      isImportant: form.value.isImportant,
      isAllDay:    true,
      dateType:    activeDateTab.value === 'inbox' ? 'single' : 'single',
      taskDate:    resolvedDate.value || getTodayStr(),
      isRecurring: false
    };

    await taskStore.addTask(payload);

    // 重置面板状态
    resetPanel();
    emit('submitted');
    closePanel();

    uni.showToast({ title: '已添加', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}

// ============================================================
// 面板控制
// ============================================================

/** 重置所有状态 */
function resetPanel() {
  form.value = { title: '', isUrgent: false, isImportant: false };
  subtasks.value = [];
  subtaskDraft.value = '';
  showSubtasks.value = false;
  showQuadrantPicker.value = false;
  activeDateTab.value = 'today';
}

/** 关闭面板 */
function closePanel() {
  emit('close');
}

/** 点击遮罩关闭 */
function onMaskTap() {
  showQuadrantPicker.value = false;
  closePanel();
}
</script>

<style scoped>
/* ============================================================
   遮罩层
   ============================================================ */
.panel-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 900;
}

/* ============================================================
   底部面板主体
   ============================================================ */
.add-task-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 901;
  padding-bottom: 0;
  /* 默认隐藏在屏幕底部以外 */
  transform: translateY(100%);
  transition: transform 0.25s ease;
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.12);
}

.add-task-panel.visible {
  transform: translateY(0);
}

/* ============================================================
   ① 日期 Tab 栏
   ============================================================ */
.date-tabs {
  display: flex;
  flex-direction: row;
  padding: 32rpx 40rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.date-tab {
  position: relative;
  margin-right: 48rpx;
  padding-bottom: 20rpx;
}

.date-tab-text {
  font-size: 30rpx;
  color: #999;
}

.date-tab.active .date-tab-text {
  color: #333;
  font-weight: bold;
}

.date-tab-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background-color: #333;
  border-radius: 2rpx;
}

/* ============================================================
   ② 标题输入行
   ============================================================ */
.title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 32rpx;
}

/* 四象限颜色圆圈 */
.quadrant-dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.quadrant-dot-label {
  font-size: 20rpx;
  color: #999;
  line-height: 1;
}

.title-divider {
  width: 2rpx;
  height: 40rpx;
  background-color: #E0E0E0;
  margin: 0 20rpx;
  flex-shrink: 0;
}

.title-input {
  flex: 1;
  font-size: 32rpx;
  color: #333;
  line-height: 1.5;
}

.title-placeholder {
  color: #BDBDBD;
  font-size: 32rpx;
}

/* ============================================================
   ③ 子计划区域
   ============================================================ */
.subtask-area {
  padding: 0 32rpx 16rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.subtask-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14rpx 0;
  margin-left: 8rpx;
}

.subtask-dot {
  font-size: 32rpx;
  color: #999;
  width: 28rpx;
  flex-shrink: 0;
}

.subtask-text {
  flex: 1;
  font-size: 28rpx;
  color: #555;
  margin-left: 8rpx;
}

.subtask-remove {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.subtask-remove-icon {
  font-size: 28rpx;
  color: #BDBDBD;
}

/* 子计划输入行 */
.subtask-input-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14rpx 0;
}

.subtask-icon-placeholder {
  width: 36rpx;
  flex-shrink: 0;
}

.subtask-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  margin-left: 8rpx;
}

.subtask-placeholder {
  color: #BDBDBD;
}

.subtask-add-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 2rpx solid #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.subtask-add-icon {
  font-size: 36rpx;
  color: #BDBDBD;
  line-height: 1;
}

.subtask-limit-tip {
  padding: 12rpx 0;
}

.subtask-limit-text {
  font-size: 24rpx;
  color: #BDBDBD;
}

/* ============================================================
   ④ 底部工具栏
   ============================================================ */
.toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 24rpx 60rpx;
  /* 60rpx 为安全区底部预留（H5端加高，防止被浏览器底栏遮住） */
}

/* #ifdef APP-PLUS */
.toolbar {
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}
/* #endif */

.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 8rpx;
  min-width: 88rpx;
  position: relative;
}

.toolbar-icon {
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quadrant-icon .quadrant-exclaim {
  font-size: 22rpx;
  font-weight: bold;
  letter-spacing: -2rpx;
}

.toolbar-icon-text {
  font-size: 40rpx;
  line-height: 1;
}

.toolbar-icon-wrap {
  position: relative;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-badge {
  position: absolute;
  top: -8rpx;
  right: -16rpx;
  background-color: #FF4444;
  border-radius: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

.toolbar-badge-text {
  font-size: 20rpx;
  color: #FFFFFF;
  font-weight: bold;
}

.toolbar-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
}

.label-active {
  color: #5B8CFF;
}

/* 发送按钮 — 右侧推到最右 */
.send-btn {
  margin-left: auto;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.send-btn-active {
  background-color: #5B8CFF;
}

.send-icon {
  font-size: 32rpx;
  color: #FFFFFF;
  margin-left: 4rpx; /* 视觉居中微调 */
}

/* ============================================================
   ⑤ 四象限浮层
   ============================================================ */
.quadrant-picker {
  position: absolute;
  left: 24rpx;
  bottom: 160rpx; /* 浮在工具栏上方 */
  z-index: 10;
}

.quadrant-picker-inner {
  position: relative;
  width: 380rpx;
  height: 220rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

/* 水平坐标轴 */
.axis-h {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2rpx;
  background-color: #E0E0E0;
}

/* 垂直坐标轴 */
.axis-v {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2rpx;
  background-color: #E0E0E0;
}

/* 象限单元 */
.qp-cell {
  position: absolute;
  width: 50%;
  height: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qp-top-left  { top: 0;   left: 0; }
.qp-top-right { top: 0;   right: 0; }
.qp-bot-left  { bottom: 0; left: 0; }
.qp-bot-right { bottom: 0; right: 0; }

.qp-label {
  font-size: 24rpx;
  color: #555;
  text-align: center;
}

/* 选中态：显示背景色 */
.qp-top-left.qp-selected  { background-color: rgba(255, 179, 0,  0.12); }
.qp-top-right.qp-selected { background-color: rgba(255, 68,  68, 0.12); }
.qp-bot-left.qp-selected  { background-color: rgba(76,  175, 80, 0.12); }
.qp-bot-right.qp-selected { background-color: rgba(91,  140, 255, 0.12); }

.qp-top-left.qp-selected  .qp-label { color: #FFB300; font-weight: bold; }
.qp-top-right.qp-selected .qp-label { color: #FF4444; font-weight: bold; }
.qp-bot-left.qp-selected  .qp-label { color: #4CAF50; font-weight: bold; }
.qp-bot-right.qp-selected .qp-label { color: #5B8CFF; font-weight: bold; }
</style>
