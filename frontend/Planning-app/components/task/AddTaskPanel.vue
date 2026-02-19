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

    <!-- ④ 时间段展开卡片区（点击时间段按钮后显示） -->
    <view v-if="showTimePanel" class="time-panel">
      <!-- 上部：两卡片横排 -->
      <view class="time-cards-row">
        <!-- 左卡片：开始日期 -->
        <view class="time-card time-card-left" @tap="onTimeCardLeftTap">
          <text class="time-card-label">{{ timeToggle ? '日期' : '开始' }}</text>
          <text class="time-card-main">{{ timeCardLeftMain }}</text>
          <text class="time-card-sub">{{ timeCardLeftSub }}</text>
        </view>
        <!-- 右卡片：结束时间 / 天数选择入口 -->
        <view class="time-card time-card-right" @tap="onTimeCardRightTap">
          <!-- 已设置时间（开关开） -->
          <template v-if="timeToggle && timeStart">
            <text class="time-card-label">时间</text>
            <view class="time-card-result-row">
              <text class="time-card-main time-card-result-text">{{ timeStart }}-{{ timeEnd }}</text>
              <view class="time-card-clear" @tap.stop="clearTimeRange">
                <text class="time-card-clear-icon">✕</text>
              </view>
            </view>
            <text class="time-card-sub">持续时间：{{ timeDuration }}</text>
          </template>
          <!-- 未设置（开关开） -->
          <template v-else-if="timeToggle && !timeStart">
            <text class="time-card-label">时间</text>
            <text class="time-card-main time-card-placeholder">选择开始/结束时间</text>
            <text class="time-card-sub">持续时间</text>
          </template>
          <!-- 开关关：天数选择入口 -->
          <template v-else>
            <text class="time-card-label">结束</text>
            <text class="time-card-main" :class="{ 'time-card-placeholder': !endDayCount }">
              {{ endDayCount ? endDateDisplay : '选择计划所需天数' }}
            </text>
            <text class="time-card-sub">{{ endDayCount ? '共 ' + endDayCount + ' 天' : '持续时间' }}</text>
          </template>
        </view>
      </view>
      <!-- 设置时间段开关行 -->
      <view class="time-toggle-row">
        <view class="time-toggle-left">
          <text class="time-toggle-icon">⏱</text>
          <view>
            <text class="time-toggle-title">设置时间段</text>
            <text class="time-toggle-desc">设置后计划将显示在时间轴</text>
          </view>
        </view>
        <switch
          class="time-toggle-switch"
          :checked="timeToggle"
          color="#FFB300"
          @change="onTimeToggleChange"
        />
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

      <!-- 时间段 -->
      <view class="toolbar-item" @tap="onTimeTap">
        <text class="toolbar-icon-text" :class="{ 'icon-active': showTimePanel }">🕐</text>
        <text class="toolbar-label" :class="{ 'label-active': showTimePanel }">时间段</text>
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

    <!-- ⑥ 天数日历弹窗（开关关闭时，选择结束天） -->
    <view v-if="showDayPicker" class="tp-mask" @tap.stop="closeDayPicker">
      <view class="tp-sheet" @tap.stop>
        <!-- 顶部标题 -->
        <text class="dp-title">设置期限：在 <text class="dp-days">{{ endDayCount || 1 }}</text> 天内完成</text>
        <!-- 月份导航 -->
        <view class="dp-nav">
          <view class="dp-nav-btn" @tap="prevMonth"><text class="dp-nav-icon">‹</text></view>
          <text class="dp-nav-title">{{ dpYear }}年{{ dpMonth }}月</text>
          <view class="dp-nav-btn" @tap="nextMonth"><text class="dp-nav-icon">›</text></view>
          <text class="dp-lunar-toggle">隐藏农历</text>
        </view>
        <!-- 星期头 -->
        <view class="dp-weekrow">
          <text v-for="w in ['一','二','三','四','五','六','日']" :key="w" class="dp-weekcell">{{ w }}</text>
        </view>
        <!-- 日期格子 -->
        <view class="dp-grid">
          <view
            v-for="(cell, idx) in dpCells"
            :key="idx"
            class="dp-cell"
            :class="{
              'dp-cell-other': cell.otherMonth,
              'dp-cell-past': cell.isPast,
              'dp-cell-today': cell.isToday,
              'dp-cell-selected': cell.isSelected,
              'dp-cell-in-range': cell.inRange
            }"
            @tap="onDpCellTap(cell)"
          >
            <text class="dp-cell-num">{{ cell.day }}</text>
            <text v-if="cell.lunar" class="dp-cell-lunar">{{ cell.lunar }}</text>
          </view>
        </view>
        <!-- 底部按钮 -->
        <view class="tp-btns">
          <view class="tp-btn tp-cancel" @tap="closeDayPicker"><text class="tp-btn-text">取消</text></view>
          <view class="tp-btn tp-confirm" @tap="confirmDayPicker"><text class="tp-btn-text tp-confirm-text">确定</text></view>
        </view>
      </view>
    </view>

    <!-- ⑦ 时间滚轮弹窗（开关开启时，选择开始/结束时间） -->
    <view v-if="showTimePicker" class="tp-mask" @tap.stop="closeTimePicker">
      <view class="tp-sheet" @tap.stop>
        <!-- 顶部日期标题 -->
        <text class="tp-date-title">{{ timePickerDateLabel }}</text>
        <!-- 双列滚轮 -->
        <view class="tp-wheels">
          <!-- 开始时间列 -->
          <view class="tp-wheel-group">
            <text class="tp-wheel-label">开始时间</text>
            <view class="tp-scroll-wrap">
              <!-- 小时 -->
              <scroll-view class="tp-scroll" scroll-y :scroll-top="startHourScrollTop" @scroll="onStartHourScroll">
                <view class="tp-scroll-pad"></view>
                <view
                  v-for="h in hours"
                  :key="'sh'+h"
                  class="tp-item"
                  :class="{ 'tp-item-selected': startHour === h }"
                >
                  <text class="tp-item-text">{{ String(h).padStart(2,'0') }}</text>
                </view>
                <view class="tp-scroll-pad"></view>
              </scroll-view>
              <text class="tp-colon">:</text>
              <!-- 分钟 -->
              <scroll-view class="tp-scroll" scroll-y :scroll-top="startMinScrollTop" @scroll="onStartMinScroll">
                <view class="tp-scroll-pad"></view>
                <view
                  v-for="m in minutes"
                  :key="'sm'+m"
                  class="tp-item"
                  :class="{ 'tp-item-selected': startMin === m }"
                >
                  <text class="tp-item-text">{{ String(m).padStart(2,'0') }}</text>
                </view>
                <view class="tp-scroll-pad"></view>
              </scroll-view>
            </view>
          </view>
          <!-- 箭头 -->
          <text class="tp-arrow">>></text>
          <!-- 结束时间列 -->
          <view class="tp-wheel-group">
            <text class="tp-wheel-label">结束时间</text>
            <view class="tp-scroll-wrap">
              <scroll-view class="tp-scroll" scroll-y :scroll-top="endHourScrollTop" @scroll="onEndHourScroll">
                <view class="tp-scroll-pad"></view>
                <view
                  v-for="h in hours"
                  :key="'eh'+h"
                  class="tp-item"
                  :class="{ 'tp-item-selected': endHour === h }"
                >
                  <text class="tp-item-text">{{ String(h).padStart(2,'0') }}</text>
                </view>
                <view class="tp-scroll-pad"></view>
              </scroll-view>
              <text class="tp-colon">:</text>
              <scroll-view class="tp-scroll" scroll-y :scroll-top="endMinScrollTop" @scroll="onEndMinScroll">
                <view class="tp-scroll-pad"></view>
                <view
                  v-for="m in minutes"
                  :key="'em'+m"
                  class="tp-item"
                  :class="{ 'tp-item-selected': endMin === m }"
                >
                  <text class="tp-item-text">{{ String(m).padStart(2,'0') }}</text>
                </view>
                <view class="tp-scroll-pad"></view>
              </scroll-view>
            </view>
          </view>
        </view>
        <!-- 选中高亮条 -->
        <view class="tp-highlight-bar"></view>
        <!-- 底部按钮 -->
        <view class="tp-btns">
          <view class="tp-btn tp-cancel" @tap="closeTimePicker"><text class="tp-btn-text">取消</text></view>
          <view class="tp-btn tp-confirm" @tap="confirmTimePicker"><text class="tp-btn-text tp-confirm-text">确定</text></view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
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
  showSubtasks.value = true;
}

/** 删除子计划 */
function removeSubtask(index) {
  subtasks.value.splice(index, 1);
}

// ============================================================
// 时间段功能
// ============================================================

/** 时间段卡片面板是否展开 */
const showTimePanel = ref(false);

/** 时间段开关：false=选天数 / true=选具体时间 */
const timeToggle = ref(false);

/** 已设置的开始时间字符串 HH:MM */
const timeStart = ref('');

/** 已设置的结束时间字符串 HH:MM */
const timeEnd = ref('');

/** 已选结束天（仅开关关时有效），相对开始日期的天数 */
const endDayCount = ref(0);

/** 已选结束日期对象（仅开关关时有效） */
const endDate = ref(null);

// ----- 左卡片显示 -----
const timeCardLeftMain = computed(() => {
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const weekNames = ['周日','周一','周二','周三','周四','周五','周六'];
  const w = weekNames[today.getDay()];
  return `${m}月${d}日，${w}`;
});

const timeCardLeftSub = computed(() => {
  // 判断是否为今天
  return '今天';
});

// ----- 右卡片：结束日期显示 -----
const endDateDisplay = computed(() => {
  if (!endDate.value) return '';
  const m = endDate.value.getMonth() + 1;
  const d = endDate.value.getDate();
  const weekNames = ['周日','周一','周二','周三','周四','周五','周六'];
  const w = weekNames[endDate.value.getDay()];
  return `${m}月${d}日，${w}`;
});

// ----- 持续时间计算 -----
const timeDuration = computed(() => {
  if (!timeStart.value || !timeEnd.value) return '';
  const [sh, sm] = timeStart.value.split(':').map(Number);
  const [eh, em] = timeEnd.value.split(':').map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin <= 0) return '';
  if (totalMin < 60) return `${totalMin}分钟`;
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `${h}小时${min}分钟` : `${h}小时`;
});

/** 点击工具栏时间段按钮 */
function onTimeTap() {
  showQuadrantPicker.value = false;
  showTimePanel.value = !showTimePanel.value;
}

/** 开关切换 */
function onTimeToggleChange(e) {
  timeToggle.value = e.detail.value;
  // 切换时清空已设置的值
  timeStart.value = '';
  timeEnd.value = '';
  endDayCount.value = 0;
  endDate.value = null;
}

/** 点击左卡片（开关关=选择结束天日历；开关开=无操作，左卡片只读） */
function onTimeCardLeftTap() {
  if (timeToggle.value) return; // 开关开时左卡片只读
  openDayPicker();
}

/** 点击右卡片（开关关=选择结束天日历；开关开=选择开始/结束时间） */
function onTimeCardRightTap() {
  if (timeToggle.value) {
    openTimePicker();
  } else {
    openDayPicker();
  }
}

/** 清除已设置的时间范围 */
function clearTimeRange() {
  timeStart.value = '';
  timeEnd.value = '';
}

// ============================================================
// 天数日历弹窗（开关关）
// ============================================================

const showDayPicker = ref(false);

/** 日历当前显示的年月 */
const dpYear = ref(new Date().getFullYear());
const dpMonth = ref(new Date().getMonth() + 1); // 1-12

/** 临时选中的结束日期 */
const dpSelectedDate = ref(null);

/** 打开天数日历 */
function openDayPicker() {
  // 初始化到今天
  const today = new Date();
  dpYear.value = today.getFullYear();
  dpMonth.value = today.getMonth() + 1;
  // 恢复已选值
  dpSelectedDate.value = endDate.value ? new Date(endDate.value) : new Date(today);
  showDayPicker.value = true;
}

function closeDayPicker() {
  showDayPicker.value = false;
}

function confirmDayPicker() {
  if (dpSelectedDate.value) {
    endDate.value = new Date(dpSelectedDate.value);
    // 计算天数差（含首尾）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(dpSelectedDate.value);
    sel.setHours(0, 0, 0, 0);
    const diff = Math.round((sel - today) / (1000 * 60 * 60 * 24));
    endDayCount.value = diff + 1; // 从今天算，今天=1天
  }
  showDayPicker.value = false;
}

/** 切换到上个月 */
function prevMonth() {
  if (dpMonth.value === 1) {
    dpMonth.value = 12;
    dpYear.value--;
  } else {
    dpMonth.value--;
  }
}

/** 切换到下个月 */
function nextMonth() {
  if (dpMonth.value === 12) {
    dpMonth.value = 1;
    dpYear.value++;
  } else {
    dpMonth.value++;
  }
}

/** 生成日历格子 */
const dpCells = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = dpYear.value;
  const month = dpMonth.value; // 1-12

  // 当月第一天是星期几（0=周日，1=周一...）
  const firstDay = new Date(year, month - 1, 1);
  // 转换成周一为起点（0=周一，6=周日）
  let startDow = firstDay.getDay(); // 0=周日
  startDow = startDow === 0 ? 6 : startDow - 1; // 0=周一

  // 当月总天数
  const daysInMonth = new Date(year, month, 0).getDate();

  // 上个月补位天数
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const cells = [];

  // 上月补位
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    cells.push({
      day: d,
      date: new Date(prevY, prevM - 1, d),
      otherMonth: true,
      isPast: true,
      isToday: false,
      isSelected: false,
      inRange: false,
      lunar: ''
    });
  }

  // 当月日期
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month - 1, d);
    cellDate.setHours(0, 0, 0, 0);
    const isPast = cellDate < today;
    const isToday = cellDate.getTime() === today.getTime();

    // 选中态
    let isSelected = false;
    if (dpSelectedDate.value) {
      const sel = new Date(dpSelectedDate.value);
      sel.setHours(0, 0, 0, 0);
      isSelected = cellDate.getTime() === sel.getTime();
    }

    // 范围高亮（今天到选中日期之间）
    let inRange = false;
    if (dpSelectedDate.value && !isSelected && !isToday) {
      const sel = new Date(dpSelectedDate.value);
      sel.setHours(0, 0, 0, 0);
      inRange = cellDate > today && cellDate < sel;
    }

    cells.push({
      day: d,
      date: cellDate,
      otherMonth: false,
      isPast: isPast && !isToday,
      isToday,
      isSelected,
      inRange,
      lunar: getLunarLabel(year, month, d)
    });
  }

  // 下月补位（凑满42格）
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    cells.push({
      day: d,
      date: new Date(nextY, nextM - 1, d),
      otherMonth: true,
      isPast: false,
      isToday: false,
      isSelected: false,
      inRange: false,
      lunar: ''
    });
  }

  return cells;
});

/** 简单农历标签（节气/节日等，暂用简易版） */
function getLunarLabel(year, month, day) {
  // 简易版：仅返回空，后续可接入 lunar-javascript
  return '';
}

/** 点击日历格子 */
function onDpCellTap(cell) {
  if (cell.otherMonth || cell.isPast) return;
  dpSelectedDate.value = new Date(cell.date);
}

// ============================================================
// 时间滚轮弹窗（开关开）
// ============================================================

const showTimePicker = ref(false);

/** 小时数组 0-23 */
const hours = Array.from({ length: 24 }, (_, i) => i);

/** 分钟数组 0-59 */
const minutes = Array.from({ length: 60 }, (_, i) => i);

/** 每个滚轮项高度（rpx 转 px 需要在运行时计算，这里用固定值） */
const ITEM_H_PX = 44; // 约88rpx / 2（750rpx基准）

/** 开始时间 */
const startHour = ref(new Date().getHours());
const startMin = ref(new Date().getMinutes());

/** 结束时间（默认开始+30分钟） */
const endHour = ref(0);
const endMin = ref(0);

/** 滚轮 scroll-top（通过 computed 驱动） */
const startHourScrollTop = computed(() => startHour.value * ITEM_H_PX);
const startMinScrollTop  = computed(() => startMin.value  * ITEM_H_PX);
const endHourScrollTop   = computed(() => endHour.value   * ITEM_H_PX);
const endMinScrollTop    = computed(() => endMin.value    * ITEM_H_PX);

/** 时间选择弹窗顶部日期标签 */
const timePickerDateLabel = computed(() => {
  return timeCardLeftMain.value;
});

/** 打开时间选择弹窗 */
function openTimePicker() {
  // 初始化为当前时间
  const now = new Date();
  startHour.value = now.getHours();
  startMin.value  = now.getMinutes();
  // 结束时间 = 开始 + 30分钟
  const endTotal = startHour.value * 60 + startMin.value + 30;
  endHour.value = Math.min(23, Math.floor(endTotal / 60));
  endMin.value  = endTotal % 60;
  showTimePicker.value = true;
}

function closeTimePicker() {
  showTimePicker.value = false;
}

function confirmTimePicker() {
  const sh = String(startHour.value).padStart(2, '0');
  const sm = String(startMin.value).padStart(2, '0');
  const eh = String(endHour.value).padStart(2, '0');
  const em = String(endMin.value).padStart(2, '0');
  timeStart.value = `${sh}:${sm}`;
  timeEnd.value   = `${eh}:${em}`;
  showTimePicker.value = false;
}

/** 滚轮滚动监听（snap to item） */
function onStartHourScroll(e) {
  const top = e.detail.scrollTop;
  startHour.value = Math.round(top / ITEM_H_PX);
}
function onStartMinScroll(e) {
  const top = e.detail.scrollTop;
  startMin.value = Math.round(top / ITEM_H_PX);
}
function onEndHourScroll(e) {
  const top = e.detail.scrollTop;
  endHour.value = Math.round(top / ITEM_H_PX);
}
function onEndMinScroll(e) {
  const top = e.detail.scrollTop;
  endMin.value = Math.round(top / ITEM_H_PX);
}

// ============================================================
// 工具栏占位功能
// ============================================================
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

    // 判断是否有时间段设置
    const hasTimeRange = timeToggle.value && timeStart.value && timeEnd.value;
    const hasDayRange  = !timeToggle.value && endDayCount.value > 1;

    const payload = {
      title:       form.value.title.trim(),
      isUrgent:    form.value.isUrgent,
      isImportant: form.value.isImportant,
      isAllDay:    !hasTimeRange,
      dateType:    hasDayRange ? 'range' : 'single',
      taskDate:    resolvedDate.value || getTodayStr(),
      isRecurring: false
    };

    // 有具体时间段时，附加 startTime / endTime
    if (hasTimeRange) {
      payload.startTime = timeStart.value;
      payload.endTime   = timeEnd.value;
    }

    // 有天数跨越时，附加结束日期
    if (hasDayRange && endDate.value) {
      payload.endDate = formatDate(endDate.value);
    }

    await taskStore.addTask(payload);

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
  // 重置时间段
  showTimePanel.value = false;
  timeToggle.value = false;
  timeStart.value = '';
  timeEnd.value = '';
  endDayCount.value = 0;
  endDate.value = null;
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
   ④ 时间段展开面板
   ============================================================ */
.time-panel {
  margin: 0 24rpx 16rpx;
  border-radius: 20rpx;
  overflow: hidden;
  background-color: #F9F9F9;
  display: flex;
  flex-direction: column;
}

/* 卡片横排容器 */
.time-cards-row {
  display: flex;
  flex-direction: row;
}

/* 卡片公共样式 */
.time-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 左卡片 */
.time-card-left {
  flex: 1;
  margin: 16rpx 8rpx 8rpx 16rpx;
  border-radius: 16rpx;
  background-color: #EDEDED;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  min-height: 120rpx;
}

/* 右卡片 */
.time-card-right {
  flex: 1;
  margin: 16rpx 16rpx 8rpx 8rpx;
  border-radius: 16rpx;
  background-color: #EDEDED;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  min-height: 120rpx;
}

/* 让两卡片横排 —— 直接设置 time-panel 的直接子 view 布局 */
/* 由于 UniApp 限制，使用明确的 flex 容器包裹 */

.time-card-label {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.time-card-main {
  font-size: 30rpx;
  color: #222;
  font-weight: bold;
  line-height: 1.4;
}

.time-card-placeholder {
  font-size: 28rpx;
  color: #AAAAAA;
  font-weight: normal;
}

.time-card-sub {
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
}

.time-card-result-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.time-card-result-text {
  flex: 1;
  font-size: 28rpx;
}

.time-card-clear {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background-color: #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
  flex-shrink: 0;
}

.time-card-clear-icon {
  font-size: 22rpx;
  color: #FFFFFF;
  line-height: 1;
}

/* 开关行 */
.time-toggle-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 20rpx 20rpx;
  justify-content: space-between;
}

.time-toggle-left {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.time-toggle-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.time-toggle-title {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.time-toggle-desc {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.time-toggle-switch {
  transform: scale(0.85);
}

/* ============================================================
   ⑤ 底部工具栏
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

.icon-active {
  opacity: 0.7;
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
  margin-left: 4rpx;
}

/* ============================================================
   ⑥ 四象限浮层
   ============================================================ */
.quadrant-picker {
  position: absolute;
  left: 24rpx;
  bottom: 160rpx;
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

.axis-h {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2rpx;
  background-color: #E0E0E0;
}

.axis-v {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2rpx;
  background-color: #E0E0E0;
}

.qp-cell {
  position: absolute;
  width: 50%;
  height: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qp-top-left  { top: 0;    left: 0; }
.qp-top-right { top: 0;    right: 0; }
.qp-bot-left  { bottom: 0; left: 0; }
.qp-bot-right { bottom: 0; right: 0; }

.qp-label {
  font-size: 24rpx;
  color: #555;
  text-align: center;
}

.qp-top-left.qp-selected  { background-color: rgba(255, 179, 0,  0.12); }
.qp-top-right.qp-selected { background-color: rgba(255, 68,  68, 0.12); }
.qp-bot-left.qp-selected  { background-color: rgba(76,  175, 80, 0.12); }
.qp-bot-right.qp-selected { background-color: rgba(91,  140, 255, 0.12); }

.qp-top-left.qp-selected  .qp-label { color: #FFB300; font-weight: bold; }
.qp-top-right.qp-selected .qp-label { color: #FF4444; font-weight: bold; }
.qp-bot-left.qp-selected  .qp-label { color: #4CAF50; font-weight: bold; }
.qp-bot-right.qp-selected .qp-label { color: #5B8CFF; font-weight: bold; }

/* ============================================================
   ⑦ 通用弹窗遮罩 + 弹窗卡片
   ============================================================ */
.tp-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.tp-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 0 0;
  max-height: 90vh;
  overflow: hidden;
}

/* 底部按钮行 */
.tp-btns {
  display: flex;
  flex-direction: row;
  border-top: 1rpx solid #F0F0F0;
  margin-top: 16rpx;
}

.tp-btn {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tp-cancel {
  border-right: 1rpx solid #F0F0F0;
}

.tp-btn-text {
  font-size: 32rpx;
  color: #666;
}

.tp-confirm-text {
  color: #333;
  font-weight: bold;
}

/* ============================================================
   ⑧ 天数日历弹窗样式
   ============================================================ */

/* 顶部标题 */
.dp-title {
  font-size: 30rpx;
  color: #333;
  text-align: center;
  display: block;
  padding: 0 40rpx 24rpx;
}

.dp-days {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-decoration: underline;
  text-underline-offset: 4rpx;
}

/* 月份导航 */
.dp-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 32rpx 20rpx;
}

.dp-nav-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dp-nav-icon {
  font-size: 40rpx;
  color: #333;
  font-weight: bold;
}

.dp-nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.dp-lunar-toggle {
  font-size: 24rpx;
  color: #999;
}

/* 星期头 */
.dp-weekrow {
  display: flex;
  flex-direction: row;
  padding: 0 16rpx;
  border-bottom: 1rpx solid #F0F0F0;
  padding-bottom: 12rpx;
}

.dp-weekcell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #999;
}

/* 日期格子网格 */
.dp-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 8rpx 16rpx;
}

.dp-cell {
  width: calc(100% / 7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12rpx 0;
  border-radius: 50%;
  position: relative;
}

.dp-cell-num {
  font-size: 30rpx;
  color: #333;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  line-height: 64rpx;
  text-align: center;
}

.dp-cell-lunar {
  font-size: 18rpx;
  color: #999;
  margin-top: 2rpx;
}

/* 其他月份：灰色 */
.dp-cell-other .dp-cell-num {
  color: #CCCCCC;
}

/* 过去的日期：灰色且不可点 */
.dp-cell-past .dp-cell-num {
  color: #CCCCCC;
}

/* 今天：黑色实心圆圈 */
.dp-cell-today .dp-cell-num {
  background-color: #222222;
  color: #FFFFFF;
  font-weight: bold;
}

/* 选中：黑色实心圆 */
.dp-cell-selected .dp-cell-num {
  background-color: #222222;
  color: #FFFFFF;
  font-weight: bold;
}

/* 范围内：灰色背景条（矩形） */
.dp-cell-in-range {
  background-color: #EEEEEE;
  border-radius: 0;
}

/* ============================================================
   ⑨ 时间滚轮弹窗样式
   ============================================================ */

/* 顶部日期标题 */
.tp-date-title {
  font-size: 30rpx;
  color: #333;
  text-align: center;
  display: block;
  padding-bottom: 24rpx;
}

/* 双列滚轮容器 */
.tp-wheels {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0 16rpx;
  height: 340rpx;
  position: relative;
}

/* 中间 >> 箭头 */
.tp-arrow {
  font-size: 28rpx;
  color: #999;
  padding: 0 16rpx;
  flex-shrink: 0;
}

/* 单组（时 + 分） */
.tp-wheel-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tp-wheel-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

/* 时+分横排 */
.tp-scroll-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 264rpx; /* 3个可见项 × 88rpx */
  overflow: hidden;
  position: relative;
}

.tp-colon {
  font-size: 40rpx;
  color: #333;
  font-weight: bold;
  padding: 0 8rpx;
  flex-shrink: 0;
}

.tp-scroll {
  width: 88rpx;
  height: 264rpx;
}

/* 上下填充，让首尾项能滚到中间 */
.tp-scroll-pad {
  height: 88rpx;
}

.tp-item {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tp-item-text {
  font-size: 36rpx;
  color: #CCCCCC;
}

.tp-item-selected .tp-item-text {
  font-size: 48rpx;
  color: #222222;
  font-weight: bold;
}

/* 选中高亮横条 */
.tp-highlight-bar {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  height: 88rpx;
  border-top: 2rpx solid #DDDDDD;
  border-bottom: 2rpx solid #DDDDDD;
  pointer-events: none;
  margin-top: 36rpx; /* 微调，抵消 label 高度 */
}
</style>
