<template>
  <view class="tep-page">

    <!-- ① 顶部导航：返回 + 分类标题 + 菜单 -->
    <view class="tep-nav">
      <view class="tep-nav-back" @tap="goBack">
        <text class="tep-nav-back-icon">←</text>
      </view>
      <view class="tep-nav-center" @tap="pickPlan">
        <text v-if="selectedPlanName" class="tep-plan-icon">📋</text>
        <text class="tep-nav-title">{{ selectedPlanName || '无分类' }}</text>
        <text class="tep-nav-arrow">∨</text>
      </view>
      <view class="tep-nav-more">
        <text class="tep-nav-more-icon">···</text>
      </view>
    </view>

    <!-- ② 日期 Tab 栏 -->
    <view class="tep-date-tabs">
      <view
        class="tep-date-tab"
        :class="{ 'tep-date-tab-active': activeDateTab === 'today' }"
        @tap="onDateTab('today')"
      >
        <text class="tep-date-tab-text">今天</text>
        <view v-if="activeDateTab === 'today'" class="tep-date-tab-line"></view>
      </view>
      <view
        class="tep-date-tab"
        :class="{ 'tep-date-tab-active': activeDateTab === 'tomorrow' }"
        @tap="onDateTab('tomorrow')"
      >
        <text class="tep-date-tab-text">明天</text>
        <view v-if="activeDateTab === 'tomorrow'" class="tep-date-tab-line"></view>
      </view>
      <view
        class="tep-date-tab"
        :class="{ 'tep-date-tab-active': activeDateTab === 'other' }"
        @tap="onDateTab('other')"
      >
        <text class="tep-date-tab-text">其他日期</text>
        <view v-if="activeDateTab === 'other'" class="tep-date-tab-line"></view>
      </view>
      <view
        class="tep-date-tab"
        :class="{ 'tep-date-tab-active': activeDateTab === 'inbox' }"
        @tap="onDateTab('inbox')"
      >
        <text class="tep-date-tab-text">收集箱</text>
        <view v-if="activeDateTab === 'inbox'" class="tep-date-tab-line"></view>
      </view>
    </view>

    <scroll-view class="tep-scroll" scroll-y>

      <!-- ③ 任务卡片（标题 + 子计划列表） -->
      <view class="tep-task-card">
        <!-- 父任务行：圆形勾选 + 标题输入 -->
        <view class="tep-task-main">
          <view
            class="tep-check"
            :class="taskDone ? 'tep-check-done' : 'tep-check-' + currentQuadrant"
            @tap="taskDone = !taskDone"
          >
            <text v-if="taskDone" class="tep-check-mark">✓</text>
          </view>
          <input
            class="tep-title-input"
            :class="{ 'tep-title-done': taskDone }"
            placeholder="添加任务名称"
            placeholder-class="tep-title-placeholder"
            :value="form.title"
            @input="form.title = $event.detail.value"
            maxlength="100"
          />
        </view>

        <!-- 子计划区域（左竖线 + 列表） -->
        <view class="tep-subtask-wrap">
          <view class="tep-subtask-line"></view>
          <view class="tep-subtask-body">
            <!-- "继续添加下一条子计划" 输入行 -->
            <view class="tep-subtask-add-row" @tap="focusSubtaskInput">
              <input
                ref="subtaskInputRef"
                class="tep-subtask-add-input"
                :placeholder="subtasks.length > 0 ? '继续添加下一条子计划' : '添加子计划'"
                placeholder-class="tep-subtask-placeholder"
                :value="newSubtaskText"
                @input="newSubtaskText = $event.detail.value"
                @confirm="addSubtask"
              />
            </view>
            <!-- 已有子计划列表 -->
            <view
              v-for="(sub, idx) in subtasks"
              :key="idx"
              class="tep-subtask-row"
            >
              <view
                class="tep-subtask-check"
                :class="{ 'tep-subtask-check-done': sub.done }"
                @tap="sub.done = !sub.done"
              >
                <text v-if="sub.done" class="tep-check-mark">✓</text>
              </view>
              <text
                class="tep-subtask-text"
                :class="{ 'tep-subtask-text-done': sub.done }"
              >{{ sub.title }}</text>
              <view class="tep-subtask-del" @tap="removeSubtask(idx)">
                <text class="tep-subtask-del-icon">⊖</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- ④ 描述文本框 -->
      <view class="tep-desc-card">
        <textarea
          class="tep-desc-input"
          placeholder="选填：简单描述一下想做的事..."
          placeholder-class="tep-desc-placeholder"
          :value="form.description"
          @input="form.description = $event.detail.value"
          maxlength="500"
          auto-height
        />
      </view>

      <!-- ⑤ 属性行列表 -->
      <view class="tep-props-card">

        <!-- 优先级 -->
        <view class="tep-prop-row" @tap="showQuadrantPicker = true">
          <view class="tep-prop-left">
            <view class="tep-prop-icon-dots">
              <view class="dot dot-red"></view>
              <view class="dot dot-yellow"></view>
              <view class="dot dot-blue"></view>
              <view class="dot dot-green"></view>
            </view>
            <text class="tep-prop-label">优先级</text>
          </view>
          <view class="tep-prop-right">
            <view class="tep-quadrant-badge" :class="'badge-' + currentQuadrant">
              <text class="tep-quadrant-badge-icon">{{ quadrantBadgeIcon }}</text>
              <text class="tep-quadrant-badge-text">{{ quadrantBadgeText }}</text>
            </view>
            <text class="tep-prop-arrow">›</text>
          </view>
        </view>
        <view class="tep-prop-divider"></view>

        <!-- 提醒 -->
        <view class="tep-prop-row" @tap="openReminderPicker">
          <view class="tep-prop-left">
            <text class="tep-prop-icon-text">⏰</text>
            <text class="tep-prop-label">提醒</text>
          </view>
          <view class="tep-prop-right">
            <template v-if="form.reminderEnabled">
              <text class="tep-prop-value-on">当天{{ String(form.reminderHour).padStart(2,'0') }}:{{ String(form.reminderMin).padStart(2,'0') }}</text>
              <view class="tep-reminder-clear" @tap.stop="form.reminderEnabled = false">
                <text class="tep-reminder-clear-icon">✕</text>
              </view>
              <view class="tep-reminder-add" @tap.stop="openReminderPicker">
                <text class="tep-reminder-add-icon">⊕</text>
              </view>
            </template>
            <template v-else>
              <text class="tep-prop-value-gray">未开启</text>
              <text class="tep-prop-arrow">›</text>
            </template>
          </view>
        </view>
        <view class="tep-prop-divider"></view>

        <!-- 完成期限 -->
        <view class="tep-prop-row" @tap="onClickEndCard">
          <view class="tep-prop-left">
            <text class="tep-prop-icon-text">📅</text>
            <text class="tep-prop-label">完成期限</text>
          </view>
          <view class="tep-prop-right">
            <text class="tep-prop-value-gray">{{ deadlineText }}</text>
            <text class="tep-prop-arrow">›</text>
          </view>
        </view>
        <view class="tep-prop-divider"></view>

        <!-- 重复 -->
        <view class="tep-prop-row" @tap="showRepeatSheet = true">
          <view class="tep-prop-left">
            <text class="tep-prop-icon-text">🔁</text>
            <text class="tep-prop-label">重复</text>
          </view>
          <view class="tep-prop-right">
            <text class="tep-prop-value-gray">{{ repeatMode === 'none' ? '未开启' : repeatModeLabel }}</text>
            <text class="tep-prop-arrow">›</text>
          </view>
        </view>
        <view class="tep-prop-divider"></view>

        <!-- 专注 -->
        <view class="tep-prop-row" @tap="goFocus">
          <view class="tep-prop-left">
            <text class="tep-prop-icon-text">⏳</text>
            <text class="tep-prop-label">专注</text>
          </view>
          <view class="tep-prop-right">
            <text class="tep-prop-value-gray">前往专注</text>
            <text class="tep-prop-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- ⑥ 装饰分隔线 -->
      <view class="tep-divider-deco">
        <text class="tep-divider-dot">·</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-deco-icon">🌿</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-deco-icon">🌿</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-deco-icon">🌿</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-deco-icon">🌿</text>
        <text class="tep-divider-dot">·</text>
        <text class="tep-divider-dot">·</text>
      </view>

      <!-- ⑦ 时间信息（编辑模式显示） -->
      <view v-if="isEdit" class="tep-meta-card">
        <view class="tep-meta-row">
          <text class="tep-meta-label">创建时间：</text>
          <text class="tep-meta-value">{{ createdAtText }}</text>
        </view>
        <view class="tep-meta-row">
          <text class="tep-meta-label">完成时间：</text>
          <text class="tep-meta-value">{{ completedAtText }}</text>
        </view>
      </view>

      <view style="height: 180rpx;"></view>
    </scroll-view>

    <!-- ⑧ 底部按钮区 -->
    <view class="tep-bottom-bar">
      <view
        v-if="selectedPlanName"
        class="tep-btn-outline"
        @tap="viewGoal"
      >
        <text class="tep-btn-outline-text">查看目标</text>
      </view>
      <view
        class="tep-btn-save"
        :class="{ 'tep-btn-save-full': !selectedPlanName }"
        @tap="save"
      >
        <text class="tep-btn-save-text">保存</text>
      </view>
    </view>

    <!-- ======================================================
         优先级（四象限）选择器弹窗
         ====================================================== -->
    <view v-if="showQuadrantPicker" class="tep-modal-mask" @tap.self="showQuadrantPicker = false">
      <view class="tep-quadrant-sheet">
        <text class="tep-sheet-title">选择优先级</text>
        <view class="tep-quadrant-grid">
          <view
            v-for="q in quadrants"
            :key="q.key"
            class="tep-quad-option"
            :class="['tep-quad-' + q.key, { 'tep-quad-selected': currentQuadrant === q.key }]"
            @tap="selectQuadrant(q); showQuadrantPicker = false"
          >
            <text class="tep-quad-badge-icon">{{ q.badgeIcon }}</text>
            <text class="tep-quad-name">{{ q.name }}</text>
            <text class="tep-quad-desc">{{ q.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ======================================================
         重复规则底部弹窗
         ====================================================== -->
    <view v-if="showRepeatSheet" class="tep-modal-mask" @tap.self="showRepeatSheet = false">
      <view class="tep-repeat-sheet">
        <text class="tep-sheet-title">重复规则</text>
        <view class="tep-repeat-options">
          <view
            v-for="opt in repeatOptions"
            :key="opt.value"
            class="tep-repeat-opt"
            :class="{ 'tep-repeat-opt-active': repeatMode === opt.value }"
            @tap="onSelectRepeatMode(opt.value); showRepeatSheet = false"
          >
            <text class="tep-repeat-opt-text">{{ opt.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 弹窗：选择完成期限（日历） -->
    <view v-if="showDaysPicker" class="tep-modal-mask" @tap.self="closeDaysPicker">
      <view class="tep-modal-sheet">
        <view class="days-title-row">
          <text class="days-title-text">设置期限：在</text>
          <text class="days-count">{{ daysCount }}</text>
          <text class="days-title-text">天内完成</text>
        </view>
        <view class="cal-header">
          <text class="cal-nav" @tap="prevMonth">‹</text>
          <text class="cal-month-title">{{ calYear }}年{{ calMonth + 1 }}月</text>
          <text class="cal-nav" @tap="nextMonth">›</text>
        </view>
        <view class="cal-week-row">
          <text v-for="d in weekLabels" :key="d" class="cal-week-cell">{{ d }}</text>
        </view>
        <view class="cal-body">
          <view v-for="(week, wi) in calRows" :key="wi" class="cal-row">
            <view
              v-for="(cell, di) in week"
              :key="di"
              class="cal-cell"
              :class="getCellClass(cell)"
              @tap="onSelectEndDate(cell)"
            >
              <text class="cal-cell-num">{{ cell.day }}</text>
            </view>
          </view>
        </view>
        <view class="tep-modal-btns">
          <text class="tep-modal-cancel" @tap="closeDaysPicker">取消</text>
          <text class="tep-modal-confirm" @tap="confirmDays">确定</text>
        </view>
      </view>
    </view>

    <!-- 弹窗：提醒时间选择 -->
    <view v-if="showReminderPicker" class="tep-modal-mask" @tap.self="closeReminderPicker">
      <view class="tep-modal-sheet">
        <view class="reminder-tabs">
          <view
            class="reminder-tab"
            :class="{ 'reminder-tab-active': reminderTempMode === 'day' }"
            @tap="reminderTempMode = 'day'"
          >
            <text class="reminder-tab-text">按天提前</text>
          </view>
          <view
            class="reminder-tab"
            :class="{ 'reminder-tab-active': reminderTempMode === 'week' }"
            @tap="reminderTempMode = 'week'"
          >
            <text class="reminder-tab-text">按周提前</text>
          </view>
        </view>
        <view class="reminder-wheels">
          <scroll-view class="reminder-wheel" scroll-y :scroll-top="reminderDayScrollTop" scroll-with-animation>
            <view class="reminder-wheel-padding"></view>
            <view
              v-for="item in reminderDayItems"
              :key="item.value"
              class="reminder-wheel-item"
              :class="{ 'reminder-wheel-item-sel': reminderTempDays === item.value }"
              @tap="reminderTempDays = item.value"
            >
              <text class="reminder-wheel-item-text">{{ item.label }}</text>
            </view>
            <view class="reminder-wheel-padding"></view>
          </scroll-view>
          <scroll-view class="reminder-wheel reminder-wheel-num" scroll-y :scroll-top="reminderHourScrollTop" scroll-with-animation>
            <view class="reminder-wheel-padding"></view>
            <view
              v-for="h in 24"
              :key="h - 1"
              class="reminder-wheel-item"
              :class="{ 'reminder-wheel-item-sel': reminderTempHour === h - 1 }"
              @tap="reminderTempHour = h - 1"
            >
              <text class="reminder-wheel-item-text">{{ String(h - 1).padStart(2, '0') }}</text>
            </view>
            <view class="reminder-wheel-padding"></view>
          </scroll-view>
          <text class="reminder-wheel-unit">时</text>
          <scroll-view class="reminder-wheel reminder-wheel-num" scroll-y :scroll-top="reminderMinScrollTop" scroll-with-animation>
            <view class="reminder-wheel-padding"></view>
            <view
              v-for="m in 60"
              :key="m - 1"
              class="reminder-wheel-item"
              :class="{ 'reminder-wheel-item-sel': reminderTempMin === m - 1 }"
              @tap="reminderTempMin = m - 1"
            >
              <text class="reminder-wheel-item-text">{{ String(m - 1).padStart(2, '0') }}</text>
            </view>
            <view class="reminder-wheel-padding"></view>
          </scroll-view>
          <text class="reminder-wheel-unit">分</text>
        </view>
        <view class="reminder-hint-row">
          <view v-if="reminderIsInvalid" class="reminder-hint-invalid">
            <text class="reminder-hint-text">鸭~这个提醒时间无效哦</text>
          </view>
          <text v-else class="reminder-hint-valid">{{ reminderHintText }}</text>
        </view>
        <view class="tep-modal-btns">
          <text class="tep-modal-cancel" @tap="closeReminderPicker">取消</text>
          <text class="tep-modal-confirm" @tap="confirmReminderPicker">确定</text>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from '@/store/task.js';

// ============================================================
// Store
// ============================================================
const taskStore = useTaskStore();

/** 任务ID（编辑模式时有值） */
const taskId = ref(null);
/** 预设日期（从日历页传入） */
const presetDate = ref('');

// ============================================================
// 新增：新 UI 所需状态
// ============================================================

/** 当前任务是否已完成（页面内直接切换） */
const taskDone = ref(false);

/** 日期 Tab：today / tomorrow / other / inbox */
const activeDateTab = ref('today');

/** 子计划列表 */
const subtasks = ref([]);

/** 新增子计划输入框内容 */
const newSubtaskText = ref('');

/** 弹窗：四象限选择器 */
const showQuadrantPicker = ref(false);

/** 弹窗：重复规则底部弹窗 */
const showRepeatSheet = ref(false);

/** 当前任务的创建时间（编辑模式从任务数据读取） */
const createdAt = ref('');
const completedAt = ref('');

/** 创建时间显示文本 */
const createdAtText = computed(() => {
  if (!createdAt.value) return '暂无';
  const d = new Date(createdAt.value);
  if (isNaN(d.getTime())) return createdAt.value;
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${Y}.${M}.${D}  ${hh}:${mm}`;
});

/** 完成时间显示文本（43.jpg：已完成时有具体时间） */
const completedAtText = computed(() => {
  if (!completedAt.value) return '暂无';
  const d = new Date(completedAt.value);
  if (isNaN(d.getTime())) return completedAt.value;
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${Y}.${M}.${D}  ${hh}:${mm}`;
});

/** 完成期限显示文本 */
const deadlineText = computed(() => {
  if (form.value.endDate) {
    const d = new Date(form.value.endDate);
    const today = formatDate(new Date());
    const tomorrow = formatDate(new Date(Date.now() + 86400000));
    if (form.value.endDate === today) return '当天';
    if (form.value.endDate === tomorrow) return '明天';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  const d = new Date(form.value.taskDate || new Date());
  const today = formatDate(new Date());
  if ((form.value.taskDate || today) === today) return '当天';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
});

/** 重复模式显示文本 */
const repeatModeLabel = computed(() => {
  const map = { none: '未开启', daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年' };
  return map[repeatMode.value] || '未开启';
});

// ============================================================
// 新增方法
// ============================================================

/** 点击日期 Tab，更新 taskDate */
function onDateTab(tab) {
  activeDateTab.value = tab;
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  if (tab === 'today') {
    form.value.taskDate = today;
  } else if (tab === 'tomorrow') {
    form.value.taskDate = tomorrow;
  } else if (tab === 'other') {
    // 打开日历选择器
    const startDate = form.value.taskDate || today;
    const d = new Date(startDate);
    calYear.value  = d.getFullYear();
    calMonth.value = d.getMonth();
    tempEndDate.value = form.value.endDate || startDate;
    showDaysPicker.value = true;
  } else if (tab === 'inbox') {
    form.value.taskDate = '';
  }
}

/** 添加子计划（回车确认） */
function addSubtask() {
  const text = newSubtaskText.value.trim();
  if (!text) return;
  subtasks.value.unshift({ title: text, done: false });
  newSubtaskText.value = '';
}

/** 删除子计划 */
function removeSubtask(idx) {
  subtasks.value.splice(idx, 1);
}

/** 聚焦子任务输入框 */
function focusSubtaskInput() {
  // UniApp 中 ref 聚焦通过 focus 属性控制，这里简单实现
}

/** 跳转查看目标 */
function viewGoal() {
  uni.showToast({ title: '查看目标功能开发中', icon: 'none' });
}

/** 跳转专注页面 */
function goFocus() {
  uni.showToast({ title: '正在跳转专注页面...', icon: 'none' });
}

/** 是否编辑模式 */
const isEdit = computed(() => !!taskId.value);

// ============================================================
// 表单数据（字段名与后端对齐）
// ============================================================
const form = ref({
  title: '',
  description: '',
  isUrgent: false,
  isImportant: false,
  isAllDay: true,        // 全天任务
  hasTimeRange: false,   // 是否设置时间段（开关）
  taskDate: '',          // 开始日期 YYYY-MM-DD
  endDate: '',           // 结束日期 YYYY-MM-DD（hasTimeRange=false 多天范围时用）
  startTime: '',         // 开始时间 HH:mm（hasTimeRange=true 时使用）
  endTime: '',           // 结束时间 HH:mm（hasTimeRange=true 时使用）
  rrule: '',             // 重复规则 RRULE 字符串
  planId: null,
  reminderEnabled: false,    // 是否开启提醒
  reminderOffset: null,      // 提醒偏移分钟数（负=提前，0=当天当时）
  reminderAdvanceMode: 'day', // 'day' | 'week'
  reminderAdvanceDays: 0,    // 按天提前：0=当天, 1=提前1天...
  reminderHour: 0,           // 提醒小时
  reminderMin: 0,            // 提醒分钟
  strongReminder: false,     // 强力提醒（持续提醒开关）
  wechatReminder: false      // 微信辅助提醒
});

// ============================================================
// 计算属性：显示逻辑
// ============================================================

// minDate 保留供后续 picker 扩展使用（当前日历弹窗通过 isPast 逻辑控制）
// const minDate = computed(() => formatDate(new Date()));

/** 当前四象限 key */
const currentQuadrant = computed(() => {
  if (form.value.isUrgent && form.value.isImportant) return 'q1';
  if (!form.value.isUrgent && form.value.isImportant) return 'q2';
  if (form.value.isUrgent && !form.value.isImportant) return 'q3';
  return 'q4';
});

/** 选中的规划名称（显示用） */
const selectedPlanName = ref('');

/** 左卡片：开始日期显示 */
const startDateDisplay = computed(() => {
  if (!form.value.taskDate) return formatDateDisplay(new Date());
  const d = new Date(form.value.taskDate);
  return `${d.getMonth() + 1}月${d.getDate()}日，${getWeekdayName(d)}`;
});

/** 左卡片：副标题（今天/明天/后天） */
const startDateSub = computed(() => {
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  const dayAfter = formatDate(new Date(Date.now() + 86400000 * 2));
  const d = form.value.taskDate || today;
  if (d === today) return '今天';
  if (d === tomorrow) return '明天';
  if (d === dayAfter) return '后天';
  return '';
});

/** 右卡片是否有值 */
const hasEndValue = computed(() => {
  if (form.value.hasTimeRange) {
    return !!(form.value.startTime && form.value.endTime);
  } else {
    return !!form.value.endDate;
  }
});

/** 右卡片占位文字 */
const endCardPlaceholder = computed(() => {
  return form.value.hasTimeRange ? '选择开始/结束时间' : '选择计划所需天数';
});

/** 右卡片已设置时的主显示值 */
const endValueDisplay = computed(() => {
  if (form.value.hasTimeRange) {
    return `${form.value.startTime}-${form.value.endTime}`;
  } else {
    // 结束日期：显示 X月X日，周X
    const d = new Date(form.value.endDate);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
});

/** 右卡片已设置时的副标题 */
const endValueSub = computed(() => {
  if (form.value.hasTimeRange) {
    // 计算持续时间
    if (form.value.startTime && form.value.endTime) {
      const mins = timeDiffMinutes(form.value.startTime, form.value.endTime);
      if (mins > 0) return `持续时间：${formatDuration(mins)}`;
    }
    return '持续时间';
  } else {
    // 计算天数
    const days = calcDays(form.value.taskDate, form.value.endDate);
    return `持续时间：${days}天`;
  }
});

/** 开始日期对应的星期名（用于时间选择弹窗标题） */
const startDateWeekday = computed(() => {
  const d = form.value.taskDate ? new Date(form.value.taskDate) : new Date();
  return getWeekdayName(d);
});

// ============================================================
// 常量
// ============================================================

/** 四象限选项 */
const quadrants = [
  { key: 'q1', name: '重要且紧急', desc: '危机处理',   icon: '🔴', badgeIcon: '!!!!', cls: 'opt-q1', isUrgent: true,  isImportant: true  },
  { key: 'q2', name: '重要不紧急', desc: '规划成长',   icon: '🔵', badgeIcon: '!!',   cls: 'opt-q2', isUrgent: false, isImportant: true  },
  { key: 'q3', name: '紧急不重要', desc: '可委托他人', icon: '🟡', badgeIcon: '!',    cls: 'opt-q3', isUrgent: true,  isImportant: false },
  { key: 'q4', name: '不急不重要', desc: '减少或消除', icon: '🟢', badgeIcon: '○',    cls: 'opt-q4', isUrgent: false, isImportant: false }
];

/** 优先级徽章：icon 文字（需在 quadrants 定义后） */
const quadrantBadgeIcon = computed(() => {
  const q = quadrants.find(item => item.key === currentQuadrant.value);
  return q ? q.badgeIcon : '';
});

/** 优先级徽章：名称 */
const quadrantBadgeText = computed(() => {
  const q = quadrants.find(item => item.key === currentQuadrant.value);
  return q ? q.name : '未设置';
});

/** 重复规则选项（胶囊按钮） */
const repeatOptions = [
  { label: '不重复', value: 'none'    },
  { label: '每日',   value: 'daily'   },
  { label: '每周',   value: 'weekly'  },
  { label: '每月',   value: 'monthly' },
  { label: '每年',   value: 'yearly'  }
];

/** 当前选中的重复模式 */
const repeatMode = ref('none');

/** 重复间隔（每N天/每N周） */
const repeatInterval = ref(1);

/** 每周重复：选中的周几（1=周一 … 7=周日） */
const repeatWeekDays = ref([]);

/** 结束重复日期（YYYY-MM-DD，为空表示未设置） */
const repeatEndDate = ref('');

/** 周几标签（一~日） */
const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];

const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

// ============================================================
// 每月模式：子模式 + 日期多选 + 星期位置
// ============================================================

/** 每月子模式：'day'=按日期  'weekday'=按星期 */
const monthlySubMode = ref('day');

/** 每月-日期模式：选中的日期数组（1~31，可多选） */
const monthlyDays = ref([]);

/** 每月-星期模式：第N个（1=第一个…5=最后一个） */
const monthlyWeekNum = ref(1);

/** 每月-星期模式：星期几（1=周一…7=周日） */
const monthlyWeekday = ref(1);

/** 第N个 标签 */
const weekNumLabels = ['第一个', '第二个', '第三个', '第四个', '最后一个'];

/** 星期全称标签（用于每月星期模式滚轮） */
const weekdayFullLabels = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

// ============================================================
// 每年模式：月和日
// ============================================================

/** 每年重复的月份（1~12） */
const yearlyMonth = ref(1);

/** 每年重复的日期（1~31） */
const yearlyDay = ref(1);

// ============================================================
// 通用滚轮选择器弹窗
// ============================================================

/** 当前弹出的滚轮类型 */
const wheelPickerType = ref('');

const showWheelPicker = ref(false);

/** 滚轮选项列表 */
const wheelItems = ref([]);

/** 滚轮右侧单位文字 */
const wheelUnit = ref('');

/** 滚轮当前临时选中值 */
const wheelTempValue = ref(1);

/** 滚轮 scroll-top（每项高度 ~120rpx ≈ 60px，用 tap 选择为主） */
const WHEEL_ITEM_H = 60;
const wheelScrollTop = computed(() => {
  const idx = wheelItems.value.findIndex(i => i.value === wheelTempValue.value);
  return Math.max(0, (idx >= 0 ? idx : 0) * WHEEL_ITEM_H);
});

function onWheelScroll() {}

function onWheelSelect(val) {
  wheelTempValue.value = val;
}

/**
 * 打开通用滚轮弹窗
 * type: 'dailyInterval' | 'weeklyInterval' | 'monthlyInterval' | 'yearlyInterval'
 *     | 'yearlyMonth' | 'yearlyDay'
 *     | 'monthlyWeekNum' | 'monthlyWeekday'
 */
function openWheelPicker(type) {
  wheelPickerType.value = type;
  switch (type) {
    case 'dailyInterval':
      wheelItems.value = Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      wheelUnit.value = '天';
      wheelTempValue.value = repeatInterval.value;
      break;
    case 'weeklyInterval':
      wheelItems.value = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      wheelUnit.value = '周';
      wheelTempValue.value = repeatInterval.value;
      break;
    case 'monthlyInterval':
      wheelItems.value = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      wheelUnit.value = '月';
      wheelTempValue.value = repeatInterval.value;
      break;
    case 'yearlyInterval':
      wheelItems.value = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      wheelUnit.value = '年重复';
      wheelTempValue.value = repeatInterval.value;
      break;
    case 'yearlyMonth':
      wheelItems.value = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      wheelUnit.value = '月';
      wheelTempValue.value = yearlyMonth.value;
      break;
    case 'yearlyDay':
      wheelItems.value = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      wheelUnit.value = '日';
      wheelTempValue.value = yearlyDay.value;
      break;
    case 'monthlyWeekNum':
      wheelItems.value = weekNumLabels.map((l, i) => ({ value: i + 1, label: l }));
      wheelUnit.value = '';
      wheelTempValue.value = monthlyWeekNum.value;
      break;
    case 'monthlyWeekday':
      wheelItems.value = weekdayFullLabels.map((l, i) => ({ value: i + 1, label: l }));
      wheelUnit.value = '';
      wheelTempValue.value = monthlyWeekday.value;
      break;
    default:
      break;
  }
  showWheelPicker.value = true;
}

function closeWheelPicker() {
  showWheelPicker.value = false;
}

function confirmWheelPicker() {
  const val = wheelTempValue.value;
  const type = wheelPickerType.value;
  if (type === 'dailyInterval' || type === 'weeklyInterval' || type === 'monthlyInterval' || type === 'yearlyInterval') {
    repeatInterval.value = val;
  } else if (type === 'yearlyMonth') {
    yearlyMonth.value = val;
  } else if (type === 'yearlyDay') {
    yearlyDay.value = val;
  } else if (type === 'monthlyWeekNum') {
    monthlyWeekNum.value = val;
  } else if (type === 'monthlyWeekday') {
    monthlyWeekday.value = val;
  }
  showWheelPicker.value = false;
  syncRrule();
}

/** 切换每月子模式 */
function onSelectMonthlySubMode(mode) {
  monthlySubMode.value = mode;
  syncRrule();
}

/** 切换每月日期（多选） */
function toggleMonthlyDay(d) {
  const idx = monthlyDays.value.indexOf(d);
  if (idx >= 0) {
    if (monthlyDays.value.length > 1) monthlyDays.value.splice(idx, 1);
  } else {
    monthlyDays.value.push(d);
    monthlyDays.value.sort((a, b) => a - b);
  }
  syncRrule();
}

// ============================================================
// 重复模式：设置结束重复日历弹窗
// ============================================================

const showRepeatEndPicker = ref(false);
const repeatCalYear  = ref(new Date().getFullYear());
const repeatCalMonth = ref(new Date().getMonth());
const showRepeatLunar = ref(true);
/** 弹窗内临时选中的结束日期 */
const tempRepeatEndDate = ref('');

/** 结束重复日历格子数据（6×7） */
const repeatCalRows = computed(() => {
  const year  = repeatCalYear.value;
  const month = repeatCalMonth.value;
  const firstDay = new Date(year, month, 1);
  const dow = firstDay.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = formatDate(new Date());

  const cells = [];
  // 前补位
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < offset; i++) {
    const d = prevMonthDays - offset + 1 + i;
    const py = month === 0 ? year - 1 : year;
    const pm = month === 0 ? 11 : month - 1;
    const dateStr = formatDate(new Date(py, pm, d));
    cells.push({ day: d, dateStr, otherMonth: true, isPast: dateStr < today });
  }
  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d));
    cells.push({
      day: d, dateStr, otherMonth: false,
      isToday: dateStr === today,
      isPast: dateStr < today,
      lunar: showRepeatLunar.value ? getLunarSimple(new Date(year, month, d)) : ''
    });
  }
  // 后补位
  const remain = 42 - cells.length;
  for (let d = 1; d <= remain; d++) {
    const ny = month === 11 ? year + 1 : year;
    const nm = month === 11 ? 0 : month + 1;
    const dateStr = formatDate(new Date(ny, nm, d));
    cells.push({ day: d, dateStr, otherMonth: true, isPast: dateStr < today });
  }
  const rows = [];
  for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));
  return rows;
});

function getRepeatEndCellClass(cell) {
  const cls = [];
  if (cell.otherMonth) cls.push('other-month');
  if (cell.isPast)     cls.push('is-past');
  if (cell.isToday)    cls.push('is-today');
  if (cell.dateStr === tempRepeatEndDate.value) cls.push('is-end');
  return cls;
}

function onSelectRepeatEndDate(cell) {
  if (cell.isPast || cell.otherMonth) return;
  tempRepeatEndDate.value = cell.dateStr;
}

function openEndDatePicker() {
  if (repeatMode.value === 'none') return;
  const today = formatDate(new Date());
  const base = repeatEndDate.value || today;
  const d = new Date(base);
  repeatCalYear.value  = d.getFullYear();
  repeatCalMonth.value = d.getMonth();
  tempRepeatEndDate.value = repeatEndDate.value || '';
  showRepeatEndPicker.value = true;
}

function closeRepeatEndPicker() {
  showRepeatEndPicker.value = false;
}

function confirmRepeatEndDate() {
  if (tempRepeatEndDate.value) {
    repeatEndDate.value = tempRepeatEndDate.value;
  }
  showRepeatEndPicker.value = false;
}

function clearRepeatEndDate() {
  repeatEndDate.value = '';
}

function repeatCalPrevMonth() {
  const today = new Date();
  if (repeatCalYear.value === today.getFullYear() && repeatCalMonth.value === today.getMonth()) return;
  if (repeatCalMonth.value === 0) { repeatCalYear.value--; repeatCalMonth.value = 11; }
  else { repeatCalMonth.value--; }
}

function repeatCalNextMonth() {
  if (repeatCalMonth.value === 11) { repeatCalYear.value++; repeatCalMonth.value = 0; }
  else { repeatCalMonth.value++; }
}

/** 选择重复模式（切换时设置合理默认值） */
function onSelectRepeatMode(mode) {
  repeatMode.value = mode;
  repeatInterval.value = 1;

  const today = new Date();
  const dow = today.getDay();           // 0=周日
  const isoDay = dow === 0 ? 7 : dow;  // 1=周一…7=周日

  if (mode === 'weekly') {
    // 默认选中当天周几
    if (repeatWeekDays.value.length === 0) repeatWeekDays.value = [isoDay];
  }

  if (mode === 'monthly') {
    // 默认子模式：日期，默认当天日期
    monthlySubMode.value = 'day';
    if (monthlyDays.value.length === 0) monthlyDays.value = [today.getDate()];
    // 默认星期模式：当月第几个 + 星期几
    const weekOfMonth = Math.ceil(today.getDate() / 7);
    monthlyWeekNum.value = Math.min(weekOfMonth, 5);
    monthlyWeekday.value = isoDay;
  }

  if (mode === 'yearly') {
    // 默认当天的月和日
    yearlyMonth.value = today.getMonth() + 1;
    yearlyDay.value   = today.getDate();
  }

  syncRrule();
}

/** 切换周几选择 */
function toggleWeekDay(dayNum) {
  const idx = repeatWeekDays.value.indexOf(dayNum);
  if (idx >= 0) {
    if (repeatWeekDays.value.length > 1) repeatWeekDays.value.splice(idx, 1);
  } else {
    repeatWeekDays.value.push(dayNum);
    repeatWeekDays.value.sort((a, b) => a - b);
  }
  syncRrule();
}

/** 将 UI 状态同步为 RRULE 字符串存入 form.rrule */
function syncRrule() {
  if (repeatMode.value === 'none') { form.value.rrule = ''; return; }

  const freqMap = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' };
  const freq = freqMap[repeatMode.value];
  let parts = [`FREQ=${freq}`];

  if (repeatInterval.value > 1) parts.push(`INTERVAL=${repeatInterval.value}`);

  if (repeatMode.value === 'weekly' && repeatWeekDays.value.length > 0) {
    const dayMap = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' };
    parts.push(`BYDAY=${repeatWeekDays.value.map(d => dayMap[d]).join(',')}`);
  }

  if (repeatMode.value === 'monthly') {
    if (monthlySubMode.value === 'day' && monthlyDays.value.length > 0) {
      parts.push(`BYMONTHDAY=${monthlyDays.value.join(',')}`);
    } else if (monthlySubMode.value === 'weekday') {
      const dayMap = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' };
      const pos = monthlyWeekNum.value === 5 ? -1 : monthlyWeekNum.value;
      parts.push(`BYDAY=${pos}${dayMap[monthlyWeekday.value]}`);
    }
  }

  if (repeatMode.value === 'yearly') {
    parts.push(`BYMONTH=${yearlyMonth.value}`);
    parts.push(`BYMONTHDAY=${yearlyDay.value}`);
  }

  if (repeatEndDate.value) parts.push(`UNTIL=${repeatEndDate.value.replace(/-/g, '')}T235959Z`);

  form.value.rrule = parts.join(';');
}

// ============================================================
// 提醒：弹窗5 —— 三列滚轮（提前天数/周数 + 小时 + 分钟）
// ============================================================

const showReminderPicker = ref(false);

/** 弹窗内临时值 */
const reminderTempMode  = ref('day');  // 'day' | 'week'
const reminderTempDays  = ref(0);      // 按天：0=当天,1=提前1天…  按周：0=当天,1=提前1周…
const reminderTempHour  = ref(0);
const reminderTempMin   = ref(0);

/** 按天/按周的选项列表 */
const reminderDayItems = computed(() => {
  if (reminderTempMode.value === 'day') {
    return [
      { value: 0, label: '当天' },
      ...Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: `提前${i + 1}天` }))
    ];
  } else {
    return [
      { value: 0, label: '当天' },
      ...Array.from({ length: 7 }, (_, i) => ({ value: i + 1, label: `提前${i + 1}周` }))
    ];
  }
});

/** scroll-top 辅助（每项高度 120rpx ≈ 60px） */
const REMINDER_ITEM_H = 60;
const reminderDayScrollTop  = computed(() => Math.max(0, reminderTempDays.value * REMINDER_ITEM_H));
const reminderHourScrollTop = computed(() => Math.max(0, reminderTempHour.value * REMINDER_ITEM_H));
const reminderMinScrollTop  = computed(() => Math.max(0, reminderTempMin.value  * REMINDER_ITEM_H));

/**
 * 计算当前弹窗选中的绝对提醒时间（Date 对象）
 * 基准 = 任务日期（form.taskDate）+ 当天时间；提前N天/周 = 任务日期 - N天/周
 */
const reminderAbsoluteTime = computed(() => {
  const taskDateStr = form.value.taskDate || formatDate(new Date());
  const taskDate = new Date(taskDateStr);

  let offsetDays = reminderTempDays.value;
  if (reminderTempMode.value === 'week') offsetDays = reminderTempDays.value * 7;

  const reminderDate = new Date(taskDate);
  reminderDate.setDate(reminderDate.getDate() - offsetDays);
  reminderDate.setHours(reminderTempHour.value, reminderTempMin.value, 0, 0);
  return reminderDate;
});

/** 提醒时间是否无效（≤ 当前时刻） */
const reminderIsInvalid = computed(() => {
  return reminderAbsoluteTime.value <= new Date();
});

/** 底部提示文字（有效时显示） */
const reminderHintText = computed(() => {
  const d = reminderAbsoluteTime.value;
  const month = d.getMonth() + 1;
  const day   = d.getDate();
  const hh    = String(d.getHours()).padStart(2, '0');
  const mm    = String(d.getMinutes()).padStart(2, '0');
  return `将于${month}月${day}日，${hh}:${mm}提醒你`;
});

/** 主区域显示文字（已设置后显示） */
const reminderDisplayText = computed(() => {
  if (!form.value.reminderEnabled) return '';
  const hh = String(form.value.reminderHour).padStart(2, '0');
  const mm = String(form.value.reminderMin).padStart(2, '0');
  const taskDateStr = form.value.taskDate || formatDate(new Date());
  const taskDate = new Date(taskDateStr);
  let offsetDays = form.value.reminderAdvanceDays;
  if (form.value.reminderAdvanceMode === 'week') offsetDays *= 7;
  const reminderDate = new Date(taskDate);
  reminderDate.setDate(reminderDate.getDate() - offsetDays);
  const month = reminderDate.getMonth() + 1;
  const day   = reminderDate.getDate();
  return `${month}月${day}日 ${hh}:${mm}`;
});

function openReminderPicker() {
  // 初始化临时值
  reminderTempMode.value  = form.value.reminderAdvanceMode || 'day';
  reminderTempDays.value  = form.value.reminderAdvanceDays || 0;
  // 若尚未设置，默认当前时刻（触发无效提示）
  if (!form.value.reminderEnabled) {
    const now = new Date();
    reminderTempHour.value = now.getHours();
    reminderTempMin.value  = now.getMinutes();
  } else {
    reminderTempHour.value = form.value.reminderHour;
    reminderTempMin.value  = form.value.reminderMin;
  }
  showReminderPicker.value = true;
}

function closeReminderPicker() {
  showReminderPicker.value = false;
}

function confirmReminderPicker() {
  if (reminderIsInvalid.value) {
    // 无效时不能确定
    uni.showToast({ title: '提醒时间无效，请选择未来时间', icon: 'none' });
    return;
  }
  form.value.reminderEnabled     = true;
  form.value.reminderAdvanceMode = reminderTempMode.value;
  form.value.reminderAdvanceDays = reminderTempDays.value;
  form.value.reminderHour        = reminderTempHour.value;
  form.value.reminderMin         = reminderTempMin.value;
  showReminderPicker.value = false;
}

function onTapWechatReminder() {
  uni.showToast({ title: '微信提醒绑定功能开发中', icon: 'none' });
}

// ============================================================
// 弹窗1：日历选择结束日期（多天模式）
// ============================================================

const showDaysPicker = ref(false);

/** 日历当前显示年月 */
const calYear  = ref(new Date().getFullYear());
const calMonth = ref(new Date().getMonth()); // 0-indexed

/** 是否显示农历 */
const showLunar = ref(true);

/** 临时选中的结束日期（日历弹窗内） */
const tempEndDate = ref('');

/** 计算天数（从开始日到结束日，含两端） */
const daysCount = computed(() => {
  const start = form.value.taskDate || formatDate(new Date());
  const end = tempEndDate.value || start;
  return calcDays(start, end);
});

/** 日历格子数据（6×7） */
const calRows = computed(() => {
  const year = calYear.value;
  const month = calMonth.value;
  const firstDay = new Date(year, month, 1);
  // 周一为第一列，getDay() 0=周日
  const dow = firstDay.getDay();
  const offset = dow === 0 ? 6 : dow - 1; // 周一=0, 周日=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = formatDate(new Date());
  const startDate = form.value.taskDate || today;

  const cells = [];
  // 前补位（上月）
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < offset; i++) {
    const d = prevMonthDays - offset + 1 + i;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const dateStr = formatDate(new Date(prevYear, prevMonth, d));
    cells.push({ day: d, dateStr, otherMonth: true, isPast: dateStr < today });
  }
  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d));
    cells.push({
      day: d,
      dateStr,
      otherMonth: false,
      isToday: dateStr === today,
      isStart: dateStr === startDate,
      isPast: dateStr < startDate,
      lunar: showLunar.value ? getLunarSimple(new Date(year, month, d)) : ''
    });
  }
  // 后补位
  const remain = 42 - cells.length;
  for (let d = 1; d <= remain; d++) {
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const dateStr = formatDate(new Date(nextYear, nextMonth, d));
    cells.push({ day: d, dateStr, otherMonth: true, isPast: dateStr < today });
  }

  // 分组为6行
  const rows = [];
  for (let i = 0; i < 6; i++) {
    rows.push(cells.slice(i * 7, i * 7 + 7));
  }
  return rows;
});

/** 获取日历格子的CSS class */
function getCellClass(cell) {
  const start = form.value.taskDate || formatDate(new Date());
  const end = tempEndDate.value;
  const cls = [];

  if (cell.otherMonth) cls.push('other-month');
  if (cell.isPast)     cls.push('is-past');
  if (cell.isToday)    cls.push('is-today');
  if (cell.dateStr === start)         cls.push('is-start');
  if (end && cell.dateStr === end)    cls.push('is-end');
  if (end && cell.dateStr > start && cell.dateStr < end) cls.push('in-range');

  return cls;
}

/** 点击日历格子 */
function onSelectEndDate(cell) {
  // 过去的日期不可选
  if (cell.isPast || cell.otherMonth) return;
  tempEndDate.value = cell.dateStr;
  // 如果切换到其他月份的格子则不操作（otherMonth 已过滤）
}

/** 确定选择结束日期 */
function confirmDays() {
  if (tempEndDate.value) {
    form.value.endDate = tempEndDate.value;
    // 多天任务，isAllDay=true，dateType=range
    form.value.isAllDay = true;
    form.value.startTime = '';
    form.value.endTime = '';
  }
  showDaysPicker.value = false;
}

function closeDaysPicker() {
  showDaysPicker.value = false;
}

function prevMonth() {
  const today = new Date();
  // 不能回退到当前月之前
  if (calYear.value === today.getFullYear() && calMonth.value === today.getMonth()) return;
  if (calMonth.value === 0) {
    calYear.value--;
    calMonth.value = 11;
  } else {
    calMonth.value--;
  }
}

function nextMonth() {
  if (calMonth.value === 11) {
    calYear.value++;
    calMonth.value = 0;
  } else {
    calMonth.value++;
  }
}

// ============================================================
// 弹窗2：滚轮选时间（当日时间段）
// ============================================================

const showTimePicker = ref(false);

const hours   = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

/** 滚轮选择：临时值 */
const tempStartHour = ref(9);
const tempStartMin  = ref(0);
const tempEndHour   = ref(10);
const tempEndMin    = ref(0);

/** 滚轮 scroll-top 计算（每格72rpx ≈ 48px，需在 onMounted 后确定，这里用像素近似） */
const ITEM_HEIGHT = 48; // rpx->px 近似值（设计稿750rpx=375px，1rpx≈0.5px，72rpx≈36px）
// 实际上在 scroll-view 里用 scroll-top 控制较难精确，改用 tap 选择 + 高亮显示
const startHourScrollTop = computed(() => tempStartHour.value * ITEM_HEIGHT);
const startMinScrollTop  = computed(() => tempStartMin.value  * ITEM_HEIGHT);
const endHourScrollTop   = computed(() => tempEndHour.value   * ITEM_HEIGHT);
const endMinScrollTop    = computed(() => tempEndMin.value    * ITEM_HEIGHT);

function selectStartHour(h) { tempStartHour.value = h; autoAdjustEndTime(); }
function selectStartMin(m)  { tempStartMin.value  = m; autoAdjustEndTime(); }
function selectEndHour(h)   { tempEndHour.value   = h; }
function selectEndMin(m)    { tempEndMin.value    = m; }

/** 自动让结束时间 = 开始时间 + 30min */
function autoAdjustEndTime() {
  const totalMins = tempStartHour.value * 60 + tempStartMin.value + 30;
  tempEndHour.value = Math.min(23, Math.floor(totalMins / 60));
  tempEndMin.value  = totalMins % 60;
}

function onStartHourScroll() {}
function onStartMinScroll()  {}
function onEndHourScroll()   {}
function onEndMinScroll()    {}

/** 打开时间选择弹窗，初始化临时值 */
function openTimePicker() {
  // 初始化：若已有值则读取，否则用当前时间
  if (form.value.startTime) {
    const [sh, sm] = form.value.startTime.split(':').map(Number);
    tempStartHour.value = sh;
    tempStartMin.value  = sm;
  } else {
    const now = new Date();
    tempStartHour.value = now.getHours();
    tempStartMin.value  = now.getMinutes();
  }
  if (form.value.endTime) {
    const [eh, em] = form.value.endTime.split(':').map(Number);
    tempEndHour.value = eh;
    tempEndMin.value  = em;
  } else {
    autoAdjustEndTime();
  }
  showTimePicker.value = true;
}

function closeTimePicker() {
  showTimePicker.value = false;
}

function confirmTime() {
  const sh = String(tempStartHour.value).padStart(2, '0');
  const sm = String(tempStartMin.value).padStart(2, '0');
  const eh = String(tempEndHour.value).padStart(2, '0');
  const em = String(tempEndMin.value).padStart(2, '0');
  form.value.startTime = `${sh}:${sm}`;
  form.value.endTime   = `${eh}:${em}`;
  form.value.isAllDay  = false;
  showTimePicker.value = false;
}

// ============================================================
// 右卡片点击路由
// ============================================================
function onClickEndCard() {
  if (form.value.hasTimeRange) {
    openTimePicker();
  } else {
    // 打开日历弹窗
    const startDate = form.value.taskDate || formatDate(new Date());
    // 初始化日历显示月份为开始日期所在月
    const d = new Date(startDate);
    calYear.value  = d.getFullYear();
    calMonth.value = d.getMonth();
    // 初始化临时结束日期
    tempEndDate.value = form.value.endDate || startDate;
    showDaysPicker.value = true;
  }
}

/** 清空结束值 */
function clearEndValue() {
  if (form.value.hasTimeRange) {
    form.value.startTime = '';
    form.value.endTime   = '';
    form.value.isAllDay  = true;
  } else {
    form.value.endDate = '';
  }
}

// ============================================================
// 时间段开关切换
// ============================================================
function onTimeRangeToggle(e) {
  form.value.hasTimeRange = e.detail.value;
  // 切换时清空另一种模式的数据
  if (form.value.hasTimeRange) {
    // 开启时间段：清空多天结束日期
    form.value.endDate  = '';
    form.value.isAllDay = false;
  } else {
    // 关闭时间段：清空时间
    form.value.startTime = '';
    form.value.endTime   = '';
    form.value.isAllDay  = true;
  }
}

// ============================================================
// 工具函数
// ============================================================

function selectQuadrant(q) {
  form.value.isUrgent    = q.isUrgent;
  form.value.isImportant = q.isImportant;
}

function pickPlan() {
  uni.showToast({ title: '规划关联功能开发中', icon: 'none' });
}

/**
 * 编辑模式：将已有的 RRULE 字符串解析回 UI 状态
 * 支持：DAILY / WEEKLY / MONTHLY / YEARLY
 * 示例：FREQ=MONTHLY;BYMONTHDAY=10,19;INTERVAL=1;UNTIL=20270101T235959Z
 */
function parseRruleToUI(rrule) {
  if (!rrule) return;
  const parts = {};
  rrule.split(';').forEach(p => {
    const [k, v] = p.split('=');
    if (k && v !== undefined) parts[k] = v;
  });

  // 频率
  const freqMap = { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly', YEARLY: 'yearly' };
  repeatMode.value = freqMap[parts.FREQ] || 'none';

  // 间隔
  repeatInterval.value = parts.INTERVAL ? parseInt(parts.INTERVAL) : 1;

  // 每周 BYDAY（纯字母，如 MO,FR）
  if (repeatMode.value === 'weekly' && parts.BYDAY) {
    const dayMap = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };
    repeatWeekDays.value = parts.BYDAY.split(',').map(d => dayMap[d]).filter(Boolean);
  }

  // 每月
  if (repeatMode.value === 'monthly') {
    if (parts.BYMONTHDAY) {
      // 按日期：BYMONTHDAY=10,19
      monthlySubMode.value = 'day';
      monthlyDays.value = parts.BYMONTHDAY.split(',').map(Number).filter(n => n > 0);
    } else if (parts.BYDAY) {
      // 按星期位置：BYDAY=3TH 或 -1SU
      monthlySubMode.value = 'weekday';
      const m = parts.BYDAY.match(/^(-?\d+)([A-Z]{2})$/);
      if (m) {
        const pos = parseInt(m[1]);
        const dayMap = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };
        monthlyWeekNum.value  = pos === -1 ? 5 : pos;
        monthlyWeekday.value  = dayMap[m[2]] || 1;
      }
    }
  }

  // 每年
  if (repeatMode.value === 'yearly') {
    if (parts.BYMONTH)    yearlyMonth.value = parseInt(parts.BYMONTH);
    if (parts.BYMONTHDAY) yearlyDay.value   = parseInt(parts.BYMONTHDAY);
  }

  // UNTIL → 结束日期
  if (parts.UNTIL) {
    const s = parts.UNTIL.replace('T235959Z', '');
    repeatEndDate.value = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }
}

/** 格式化日期为 YYYY-MM-DD */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 格式化为"M月D日，周X" */
function formatDateDisplay(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日，${getWeekdayName(d)}`;
}

/** 获取星期名 */
function getWeekdayName(date) {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[new Date(date).getDay()];
}

/** 计算两日期相差天数（含首尾） */
function calcDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / 86400000);
  return Math.max(1, diff + 1);
}

/** 计算两个 HH:mm 之间的分钟差 */
function timeDiffMinutes(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/** 格式化持续时间 */
function formatDuration(mins) {
  if (mins < 60) return `${mins}分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

/** 简单农历（仅显示农历日期名，无需精确，后续可接入 lunar-javascript 库） */
function getLunarSimple(_date) {
  // 暂时返回空，界面保留农历显示位置
  return '';
}

// ============================================================
// 保存 / 删除
// ============================================================
async function save() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请填写任务标题', icon: 'none' });
    return;
  }

  const startDate = form.value.taskDate || formatDate(new Date());

  try {
    uni.showLoading({ title: '保存中...' });

    let payload;

    if (form.value.hasTimeRange) {
      // 当天时间段模式
      if (!form.value.startTime || !form.value.endTime) {
        uni.hideLoading();
        uni.showToast({ title: '请选择开始/结束时间', icon: 'none' });
        return;
      }
      payload = {
        title:       form.value.title.trim(),
        description: form.value.description || null,
        isUrgent:    form.value.isUrgent,
        isImportant: form.value.isImportant,
        isAllDay:    false,
        dateType:    'single',
        taskDate:    startDate,
        startTime:   form.value.startTime,
        endTime:     form.value.endTime,
        isRecurring: !!form.value.rrule,
        rrule:       form.value.rrule || null,
        planId:      form.value.planId || null
      };
    } else if (form.value.endDate && form.value.endDate !== startDate) {
      // 多天范围模式
      payload = {
        title:       form.value.title.trim(),
        description: form.value.description || null,
        isUrgent:    form.value.isUrgent,
        isImportant: form.value.isImportant,
        isAllDay:    true,
        dateType:    'range',
        taskDate:    startDate,
        endDate:     form.value.endDate,
        startTime:   null,
        endTime:     null,
        isRecurring: !!form.value.rrule,
        rrule:       form.value.rrule || null,
        planId:      form.value.planId || null
      };
    } else {
      // 单天全天模式
      payload = {
        title:       form.value.title.trim(),
        description: form.value.description || null,
        isUrgent:    form.value.isUrgent,
        isImportant: form.value.isImportant,
        isAllDay:    true,
        dateType:    'single',
        taskDate:    startDate,
        startTime:   null,
        endTime:     null,
        isRecurring: !!form.value.rrule,
        rrule:       form.value.rrule || null,
        planId:      form.value.planId || null
      };
    }

    if (isEdit.value) {
      await taskStore.editTask(taskId.value, payload);
      uni.showToast({ title: '修改成功', icon: 'success' });
    } else {
      await taskStore.addTask(payload);
      uni.showToast({ title: '创建成功', icon: 'success' });
    }

    setTimeout(() => { uni.navigateBack(); }, 800);
  } catch (err) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}

function deleteTask() {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这个任务吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await taskStore.removeTask(taskId.value);
          uni.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => uni.navigateBack(), 800);
        } catch (err) {
          uni.showToast({ title: err.message || '删除失败', icon: 'none' });
        }
      }
    }
  });
}

function goBack() {
  uni.navigateBack();
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || currentPage.options || {};

  if (options.id) {
    taskId.value = parseInt(options.id);
    const task = taskStore.tasks.find(t => t.id === taskId.value);
    if (task) {
      form.value.title        = task.title        || '';
      form.value.description  = task.description  || '';
      form.value.isUrgent     = task.isUrgent     || false;
      form.value.isImportant  = task.isImportant  || false;
      form.value.isAllDay     = task.isAllDay     !== false;
      form.value.taskDate     = task.taskDate     || '';
      form.value.startTime    = task.startTime    || '';
      form.value.endTime      = task.endTime      || '';
      form.value.rrule        = task.rrule        || '';
      form.value.planId       = task.planId       || null;
      // 判断模式
      form.value.hasTimeRange = !task.isAllDay && !!task.startTime;
      // 解析 RRULE 到 UI 状态
      if (task.rrule) {
        parseRruleToUI(task.rrule);
      }
      // 新增字段
      taskDone.value    = task.status === 'completed';
      createdAt.value   = task.createdAt  || task.created_at  || '';
      completedAt.value = task.completedAt || task.completed_at || '';
      // 子计划
      if (task.subtasks && Array.isArray(task.subtasks)) {
        subtasks.value = task.subtasks.map(s => ({ title: s.title || s, done: s.done || false }));
      }
      // 规划名称
      if (task.planName) {
        selectedPlanName.value = task.planName;
      }
    }
  }

  if (options.date) {
    presetDate.value = options.date;
    if (!form.value.taskDate) {
      form.value.taskDate = options.date;
    }
  }

  // 默认日期为今天
  if (!form.value.taskDate) {
    form.value.taskDate = formatDate(new Date());
  }

  // 根据 taskDate 初始化 activeDateTab
  const today    = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  if (!form.value.taskDate) {
    activeDateTab.value = 'inbox';
  } else if (form.value.taskDate === today) {
    activeDateTab.value = 'today';
  } else if (form.value.taskDate === tomorrow) {
    activeDateTab.value = 'tomorrow';
  } else {
    activeDateTab.value = 'other';
  }
});
</script>

<style scoped>
/* ============================================================
   任务详情/编辑页 (tep = task-edit-page)
   ============================================================ */
.tep-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F6FA;
}

/* ① 顶部导航 */
.tep-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  padding: 56rpx 24rpx 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
}
.tep-nav-back {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}
.tep-nav-back-icon { font-size: 36rpx; color: #333; font-weight: bold; }

.tep-nav-center {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.tep-plan-icon { font-size: 28rpx; margin-right: 8rpx; }
.tep-nav-title { font-size: 30rpx; font-weight: bold; color: #1A1A2E; }
.tep-nav-arrow { font-size: 24rpx; color: #888; margin-left: 8rpx; }

.tep-nav-more {
  width: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}
.tep-nav-more-icon { font-size: 28rpx; color: #888; letter-spacing: 2rpx; }

/* ② 日期 Tab 栏 */
.tep-date-tabs {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #F0F0F0;
}
.tep-date-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0 0;
  position: relative;
}
.tep-date-tab-text {
  font-size: 26rpx;
  color: #999;
  padding-bottom: 16rpx;
}
.tep-date-tab-active .tep-date-tab-text { color: #1A1A2E; font-weight: bold; }
.tep-date-tab-line {
  position: absolute;
  bottom: 0;
  left: 20%;
  width: 60%;
  height: 4rpx;
  background-color: #1A1A2E;
  border-radius: 4rpx;
}

/* 滚动区 */
.tep-scroll { flex: 1; }

/* ③ 任务卡片 */
.tep-task-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin: 24rpx 24rpx 0;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.tep-task-main {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

/* 圆形复选框 */
.tep-check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid #CCC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 16rpx;
  margin-top: 6rpx;
  box-sizing: border-box;
}
.tep-check-q1 { border-color: #FF4444; }
.tep-check-q2 { border-color: #4F7FFF; }
.tep-check-q3 { border-color: #FFB300; }
.tep-check-q4 { border-color: #44AA66; }
.tep-check-done { background-color: #CCCCCC; border-color: #CCCCCC; }
.tep-check-mark { font-size: 24rpx; color: #FFFFFF; font-weight: bold; }

/* 标题输入 */
.tep-title-input {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A2E;
  line-height: 1.5;
  min-height: 48rpx;
}
.tep-title-done { text-decoration: line-through; color: #BBBBBB; }
.tep-title-placeholder { color: #CCCCCC; font-weight: normal; }

/* 子计划区域 */
.tep-subtask-wrap {
  display: flex;
  flex-direction: row;
  padding-left: 60rpx;
}
.tep-subtask-line {
  width: 4rpx;
  background-color: #E8E8E8;
  border-radius: 4rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
  min-height: 40rpx;
}
.tep-subtask-body { flex: 1; display: flex; flex-direction: column; }
.tep-subtask-add-row { padding: 8rpx 0 12rpx; }
.tep-subtask-add-input { font-size: 26rpx; color: #333; width: 100%; }
.tep-subtask-placeholder { color: #CCCCCC; font-size: 26rpx; }
.tep-subtask-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12rpx 0;
  border-top: 1rpx solid #F5F5F5;
}
.tep-subtask-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 16rpx;
  box-sizing: border-box;
}
.tep-subtask-check-done { background-color: #CCCCCC; border-color: #CCCCCC; }
.tep-subtask-text { flex: 1; font-size: 28rpx; font-weight: bold; color: #222; }
.tep-subtask-text-done { text-decoration: line-through; color: #BBBBBB; font-weight: normal; }
.tep-subtask-del {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tep-subtask-del-icon { font-size: 32rpx; color: #CCCCCC; }

/* ④ 描述文本框 */
.tep-desc-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
  min-height: 180rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.tep-desc-input { width: 100%; font-size: 28rpx; color: #333; line-height: 1.6; min-height: 140rpx; }
.tep-desc-placeholder { color: #CCCCCC; font-size: 28rpx; }

/* ⑤ 属性行卡片 */
.tep-props-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin: 20rpx 24rpx 0;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  overflow: hidden;
}
.tep-prop-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 28rpx;
  min-height: 100rpx;
}
.tep-prop-divider { height: 1rpx; background-color: #F5F5F5; margin: 0 28rpx; }
.tep-prop-left { display: flex; flex-direction: row; align-items: center; flex: 1; }
.tep-prop-right { display: flex; flex-direction: row; align-items: center; flex-shrink: 0; }
.tep-prop-icon-text { font-size: 32rpx; margin-right: 16rpx; }

/* 四色圆点图标 */
.tep-prop-icon-dots {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 36rpx;
  height: 36rpx;
  gap: 4rpx;
  margin-right: 16rpx;
  align-items: center;
  justify-content: center;
}
.dot { width: 14rpx; height: 14rpx; border-radius: 50%; }
.dot-red    { background-color: #FF4444; }
.dot-yellow { background-color: #FFB300; }
.dot-blue   { background-color: #4F7FFF; }
.dot-green  { background-color: #44AA66; }

.tep-prop-label { font-size: 28rpx; color: #333; }
.tep-prop-value-gray { font-size: 26rpx; color: #999; }
.tep-prop-value-on { font-size: 26rpx; color: #333; margin-right: 8rpx; }
.tep-prop-arrow { font-size: 28rpx; color: #CCCCCC; margin-left: 8rpx; }

.tep-reminder-clear, .tep-reminder-add {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid #DDDDDD;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
}
.tep-reminder-clear-icon { font-size: 22rpx; color: #999; }
.tep-reminder-add-icon   { font-size: 28rpx; color: #5B8CFF; }

/* 优先级徽章 */
.tep-quadrant-badge {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 20rpx;
  padding: 6rpx 16rpx;
  margin-right: 4rpx;
}
.tep-quadrant-badge-icon { font-size: 22rpx; font-weight: bold; margin-right: 6rpx; }
.tep-quadrant-badge-text { font-size: 24rpx; font-weight: bold; }
.badge-q1 { background-color: #FFF0F0; }
.badge-q1 .tep-quadrant-badge-icon, .badge-q1 .tep-quadrant-badge-text { color: #FF4444; }
.badge-q2 { background-color: #F0F4FF; }
.badge-q2 .tep-quadrant-badge-icon, .badge-q2 .tep-quadrant-badge-text { color: #4F7FFF; }
.badge-q3 { background-color: #FFFBF0; }
.badge-q3 .tep-quadrant-badge-icon, .badge-q3 .tep-quadrant-badge-text { color: #FFB300; }
.badge-q4 { background-color: #F0FFF4; }
.badge-q4 .tep-quadrant-badge-icon, .badge-q4 .tep-quadrant-badge-text { color: #44AA66; }

/* ⑥ 装饰分隔线 */
.tep-divider-deco {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 28rpx 24rpx 8rpx;
  gap: 6rpx;
}
.tep-divider-dot { font-size: 20rpx; color: #D0D0D0; }
.tep-deco-icon { font-size: 24rpx; opacity: 0.4; }

/* ⑦ 创建/完成时间 */
.tep-meta-card { margin: 8rpx 24rpx 0; padding: 8rpx 0; }
.tep-meta-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 4rpx;
}
.tep-meta-label { font-size: 24rpx; color: #999; }
.tep-meta-value { font-size: 24rpx; color: #999; }

/* ⑧ 底部按钮 */
.tep-bottom-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #FFFFFF;
  border-top: 1rpx solid #F0F0F0;
  gap: 20rpx;
}
.tep-btn-outline {
  flex: 1;
  height: 90rpx;
  border-radius: 50rpx;
  border: 2rpx solid #999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tep-btn-outline-text { font-size: 30rpx; color: #555; }
.tep-btn-save {
  flex: 1;
  height: 90rpx;
  border-radius: 50rpx;
  background-color: #AAAAAA;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tep-btn-save-full { flex: 1; }
.tep-btn-save-text { font-size: 30rpx; color: #FFFFFF; font-weight: bold; }

/* 弹窗通用 */
.tep-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.4);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.tep-modal-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 28rpx 28rpx 0 0;
  padding: 32rpx 32rpx 48rpx;
  max-height: 80vh;
}
.tep-sheet-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #222;
  text-align: center;
  margin-bottom: 28rpx;
}
.tep-modal-btns {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 24rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #F0F0F0;
}
.tep-modal-cancel  { font-size: 30rpx; color: #999; padding: 8rpx 32rpx; }
.tep-modal-confirm { font-size: 30rpx; color: #5B8CFF; font-weight: bold; padding: 8rpx 32rpx; }

/* 四象限弹窗 */
.tep-quadrant-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 28rpx 28rpx 0 0;
  padding: 32rpx 24rpx 48rpx;
}
.tep-quadrant-grid { display: flex; flex-direction: row; flex-wrap: wrap; gap: 20rpx; }
.tep-quad-option {
  flex: 0 0 calc(50% - 10rpx);
  border-radius: 16rpx;
  padding: 24rpx 20rpx;
  border: 3rpx solid transparent;
  display: flex;
  flex-direction: column;
}
.tep-quad-q1 { background-color: #FFF0F0; }
.tep-quad-q2 { background-color: #F0F4FF; }
.tep-quad-q3 { background-color: #FFFBF0; }
.tep-quad-q4 { background-color: #F0FFF4; }
.tep-quad-selected { border-color: #333; }
.tep-quad-badge-icon { font-size: 28rpx; font-weight: bold; color: #555; margin-bottom: 8rpx; }
.tep-quad-name { font-size: 26rpx; font-weight: bold; color: #222; margin-bottom: 4rpx; }
.tep-quad-desc { font-size: 22rpx; color: #999; }

/* 重复规则弹窗 */
.tep-repeat-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 28rpx 28rpx 0 0;
  padding: 32rpx 24rpx 48rpx;
}
.tep-repeat-options { display: flex; flex-direction: column; gap: 8rpx; }
.tep-repeat-opt {
  padding: 28rpx 24rpx;
  border-radius: 16rpx;
  background-color: #F5F6FA;
  display: flex;
  align-items: center;
}
.tep-repeat-opt-active { background-color: #E8EEFF; }
.tep-repeat-opt-text { font-size: 30rpx; color: #333; }
.tep-repeat-opt-active .tep-repeat-opt-text { color: #4F7FFF; font-weight: bold; }

/* 日历弹窗 */
.days-title-row {
  display: flex; flex-direction: row; align-items: center; justify-content: center;
  margin-bottom: 24rpx;
}
.days-title-text { font-size: 28rpx; color: #555; }
.days-count { font-size: 44rpx; font-weight: bold; color: #1A1A2E; margin: 0 12rpx; }
.cal-header {
  display: flex; flex-direction: row; align-items: center; justify-content: center;
  margin-bottom: 16rpx;
}
.cal-nav { font-size: 36rpx; color: #555; padding: 0 24rpx; }
.cal-month-title { font-size: 30rpx; font-weight: bold; color: #222; }
.cal-week-row { display: flex; flex-direction: row; }
.cal-week-cell { flex: 1; text-align: center; font-size: 22rpx; color: #999; padding: 8rpx 0; }
.cal-body { display: flex; flex-direction: column; }
.cal-row { display: flex; flex-direction: row; }
.cal-cell {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 12rpx 0; border-radius: 8rpx;
}
.cal-cell-num { font-size: 28rpx; color: #333; }
.cal-cell.other-month .cal-cell-num { color: #CCC; }
.cal-cell.is-past .cal-cell-num { color: #DDD; }
.cal-cell.is-today .cal-cell-num { color: #5B8CFF; font-weight: bold; }
.cal-cell.is-start, .cal-cell.is-end { background-color: #1A1A2E; border-radius: 50%; }
.cal-cell.is-start .cal-cell-num, .cal-cell.is-end .cal-cell-num { color: #FFFFFF; }
.cal-cell.in-range { background-color: #E8EEFF; }

/* 提醒弹窗 */
.reminder-tabs { display: flex; flex-direction: row; margin-bottom: 16rpx; }
.reminder-tab { flex: 1; text-align: center; padding: 16rpx 0; border-bottom: 3rpx solid transparent; }
.reminder-tab-active { border-bottom-color: #1A1A2E; }
.reminder-tab-text { font-size: 26rpx; color: #999; }
.reminder-tab-active .reminder-tab-text { color: #1A1A2E; font-weight: bold; }
.reminder-wheels {
  display: flex; flex-direction: row; align-items: center;
  height: 240rpx; overflow: hidden;
}
.reminder-wheel { flex: 1; height: 240rpx; }
.reminder-wheel-num { flex: 0 0 100rpx; }
.reminder-wheel-padding { height: 80rpx; }
.reminder-wheel-item { height: 80rpx; display: flex; align-items: center; justify-content: center; }
.reminder-wheel-item-text { font-size: 26rpx; color: #999; }
.reminder-wheel-item-sel .reminder-wheel-item-text { color: #1A1A2E; font-weight: bold; font-size: 30rpx; }
.reminder-wheel-unit { font-size: 24rpx; color: #999; margin: 0 8rpx; }
.reminder-hint-row { min-height: 56rpx; display: flex; align-items: center; justify-content: center; margin: 12rpx 0; }
.reminder-hint-invalid { background-color: #FFF0F0; border-radius: 12rpx; padding: 10rpx 24rpx; }
.reminder-hint-text { font-size: 24rpx; color: #FF4444; }
.reminder-hint-valid { font-size: 24rpx; color: #44AA66; }
</style>
