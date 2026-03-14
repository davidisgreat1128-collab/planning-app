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
      <view class="tep-nav-more" @tap="showDeleteMenu">
        <text class="tep-nav-more-icon">···</text>
      </view>
    </view>

    <!-- ② 日期 Tab 栏 -->
    <view class="tep-date-tabs">
      <DateTabBar :activeTab="activeDateTab" :customDate="customDate" @tab-change="onDateTab" />
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

        <!-- 子计划区域 -->
        <SubtaskList
          :subtasks="subtasks"
          :showLine="true"
          @add="handleAddSubtask"
          @remove="handleRemoveSubtask"
          @toggle-done="handleToggleSubtaskDone"
        />
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

      <!-- ⭐⭐⭐ 调试信息面板（任务来源追踪）- 2026-03-14 新增 -->
      <view class="tep-debug-panel">
        <view class="tep-debug-title">🔍 任务来源诊断</view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">任务ID:</text>
          <text class="tep-debug-value">{{ taskId || '新任务' }}</text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">创建时间:</text>
          <text class="tep-debug-value">{{ debugInfo.createdAt }}</text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">任务日期 (taskDate):</text>
          <text class="tep-debug-value">{{ debugInfo.taskDate }}</text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">分类ID (categoryId):</text>
          <text class="tep-debug-value">{{ debugInfo.categoryId }}</text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">分类名称:</text>
          <text class="tep-debug-value">{{ debugInfo.categoryName }}</text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">是否在 Repository 中:</text>
          <text class="tep-debug-value" :class="debugInfo.inRepository ? 'tep-debug-yes' : 'tep-debug-no'">
            {{ debugInfo.inRepository ? '✅ 是' : '❌ 否' }}
          </text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">是否在 Store 中:</text>
          <text class="tep-debug-value" :class="debugInfo.inStore ? 'tep-debug-yes' : 'tep-debug-no'">
            {{ debugInfo.inStore ? '✅ 是' : '❌ 否' }}
          </text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">Repository 总任务数:</text>
          <text class="tep-debug-value">{{ debugInfo.repositoryTotalCount }}</text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">Store 当前日期任务数:</text>
          <text class="tep-debug-value">{{ debugInfo.storeTotalCount }}</text>
        </view>

        <view class="tep-debug-section">
          <text class="tep-debug-label">完整任务数据:</text>
          <view class="tep-debug-json">{{ debugInfo.fullTask }}</view>
        </view>
      </view>

      <view style="height: 180rpx;"></view>
    </scroll-view>

    <!-- ⑧ 底部按钮区 -->
    <view class="tep-bottom-bar">
      <view
        class="tep-btn-save"
        :class="{
          'tep-btn-save-disabled': !hasFormChanged,
          'tep-btn-save-active': hasFormChanged
        }"
        @tap="handleSave"
      >
        <text class="tep-btn-save-text">保存</text>
      </view>
    </view>

    <!-- ======================================================
         优先级（四象限）选择器弹窗 - 使用 QuadrantPicker 组件
         ====================================================== -->
    <QuadrantPicker
      v-model:visible="showQuadrantPicker"
      :modelValue="currentQuadrant"
      variant="sheet"
      @select="selectQuadrant"
    />

    <!-- ======================================================
         重复规则底部弹窗（新UI设计）
         ====================================================== -->
    <!-- 重复规则弹窗组件 -->
    <RepeatRuleSheet
      v-model:visible="showRepeatSheet"
      :repeatRuleManager="repeatRuleManager"
      :form="form"
      @confirm="confirmRepeatSettings"
      @cancel="cancelRepeatSettings"
      @open-end-date-picker="openEndDatePicker"
    />

    <!-- 弹窗：选择完成期限（日历） -->
    <!-- ⑥ 日历选择器（选择结束日期） - 使用 DayPicker 组件 -->
    <DayPicker
      v-model:visible="showDaysPicker"
      :startDate="form.taskDate"
      :initialEndDate="tempEndDate"
      title="设置期限：在"
      :showDaysCount="true"
      :showLunar="showLunar"
      mode="range"
      @confirm="onDayPickerConfirm"
      @cancel="closeDaysPicker"
    />

    <!-- 弹窗：自定义日期选择器（用于选择 taskDate） -->
    <CustomDatePicker
      :visible="showCustomDatePicker"
      :initialDate="customDate || form.taskDate || ''"
      @confirm="onCustomDateConfirm"
      @cancel="closeCustomDatePicker"
    />

    <!-- 弹窗：提醒时间选择 -->
    <!-- 提醒选择器组件 -->
    <ReminderPicker
      v-model:visible="showReminderPicker"
      :taskDate="form.taskDate"
      :reminderData="{
        enabled: form.reminderEnabled,
        advanceMode: form.reminderAdvanceMode,
        advanceDays: form.reminderAdvanceDays,
        hour: form.reminderHour,
        min: form.reminderMin
      }"
      @confirm="onReminderConfirm"
      @cancel="closeReminderPicker"
    />

    <!-- ⑪ 删除任务确认弹窗 -->
    <DeleteTaskDialog
      v-model:show="showDeleteDialog"
      v-model:selectedOption="deleteOption"
      @confirm="confirmDelete"
    />

    <!-- ⑪ 重复规则：结束重复日期选择器弹窗 -->
    <EndDateCalendar
      v-model:visible="showRepeatEndPicker"
      :startDate="form.taskDate"
      :initialEndDate="repeatEndDate"
      :showLunar="showRepeatLunar"
      @confirm="onRepeatEndDateConfirm"
      @cancel="closeRepeatEndPicker"
      @clear="clearRepeatEndDate"
    />

    <!-- ⑫ 保存重复任务确认弹窗 -->
    <view v-if="showSaveRecurringDialog" class="tep-modal-mask" @tap="closeSaveRecurringDialog">
      <view class="delete-dialog" @tap.stop>
        <!-- 对话框标题 -->
        <view class="delete-dialog-title">
          <text class="delete-dialog-title-text">更新重复任务</text>
        </view>

        <!-- 选项1：完整更改此条重复计划 -->
        <view
          class="delete-option"
          :class="{ 'delete-option-selected': saveRecurringOption === 1 }"
          @tap="saveRecurringOption = 1"
        >
          <view class="delete-option-content">
            <text class="delete-option-title">完整更改此条重复计划</text>
          </view>
          <view v-if="saveRecurringOption === 1" class="delete-option-check">
            <text class="delete-option-check-icon">✓</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="delete-divider"></view>

        <!-- 选项2：更改当天及未来计划 -->
        <view
          class="delete-option"
          :class="{ 'delete-option-selected': saveRecurringOption === 2 }"
          @tap="saveRecurringOption = 2"
        >
          <view class="delete-option-content">
            <text class="delete-option-title">更改当天及未来计划</text>
          </view>
          <view v-if="saveRecurringOption === 2" class="delete-option-check">
            <text class="delete-option-check-icon">✓</text>
          </view>
        </view>

        <!-- 底部按钮区域：取消 + 确定 -->
        <view class="delete-actions">
          <view class="delete-cancel-btn" @tap="closeSaveRecurringDialog">
            <text class="delete-cancel-text">取消</text>
          </view>
          <view class="delete-confirm-btn" @tap="confirmSaveRecurring">
            <text class="delete-confirm-text">确定</text>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from '@/store/task.js';
// ⭐ 架构统一：planStore 已删除，规划存储在 CategoryRepository（type='plan'）
// import { usePlanStore } from '@/store/plan.js';
import { useCategoryStore } from '@/store/category.js';
import DeleteTaskDialog from '@/components/DeleteTaskDialog.vue';
import DateTabBar from '@/components/task/DateTabBar.vue';
import SubtaskList from '@/components/task/SubtaskList.vue';
import CustomDatePicker from '@/components/task/CustomDatePicker.vue';
import QuadrantPicker from '@/components/task/QuadrantPicker.vue';
import DayPicker from '@/components/task/DayPicker.vue';
import RepeatRuleSheet from '@/components/task/RepeatRuleSheet.vue';
import ReminderPicker from '@/components/task/ReminderPicker.vue';
import EndDateCalendar from '@/components/task/EndDateCalendar.vue';

// ============================================================
// 新增：引入 useTaskForm 业务逻辑层
// ============================================================
import { useTaskForm } from '@/composables/useTaskForm.js';
import { useDateTimePickers } from '@/composables/useDateTimePickers.js';
import { formatDate, getWeekdayName, calcDays, timeDiffMinutes, formatDuration, formatDateWithWeekday, formatDateTimeDot, formatMonthDay, getToday, getTomorrow, getDateAfterDays } from '@/utils/date.js';
import { parseRrule } from '@/utils/rruleBuilder.js';

// ⭐⭐⭐ 新增：导入 Repository 用于任务来源诊断（2026-03-14）
import TaskRepository from '@/repositories/TaskRepository';
import CategoryRepository from '@/repositories/CategoryRepository';

// ============================================================
// Store
// ============================================================
const taskStore = useTaskStore();
// ⭐ 架构统一：planStore 已删除
// const planStore = usePlanStore();
const categoryStore = useCategoryStore();

// ============================================================
// 初始化 useTaskForm（阶段1：基础功能）
// ============================================================
// 注意：这里先初始化，后续步骤会逐步使用 taskFormApi 提供的状态和方法
const taskFormApi = useTaskForm({
  mode: 'edit',
  taskId: null,
  presetDate: ''
});

/** 任务ID（编辑模式时有值） */
const taskId = ref(null);
/** 原始任务ID（用于重复任务，保存时使用） */
const originalTaskId = ref(null);
/** 预设日期（从日历页传入） */
const presetDate = ref('');

// ============================================================
// 新增：新 UI 所需状态
// ============================================================

/** 当前任务是否已完成（页面内直接切换） */
const taskDone = ref(false);


/** 弹窗：四象限选择器 */
const showQuadrantPicker = ref(false);

/** 弹窗：重复规则底部弹窗 */
const showRepeatSheet = ref(false);

/** 弹窗：删除任务确认弹窗 */
const showDeleteDialog = ref(false);

/** 删除选项：1=仅删除当天, 2=完整清空重复任务, 3=删除当天及未来 */
const deleteOption = ref(1);

/** 弹窗：保存重复任务确认弹窗 */
const showSaveRecurringDialog = ref(false);

/** 保存重复任务选项：1=完整更改此条重复计划, 2=更改当天及未来计划 */
const saveRecurringOption = ref(1);

/** 当前任务的创建时间（编辑模式从任务数据读取） */
const createdAt = ref('');
const completedAt = ref('');

/** 创建时间显示文本 */
const createdAtText = computed(() => formatDateTimeDot(createdAt.value));

/** 完成时间显示文本（43.jpg：已完成时有具体时间） */
const completedAtText = computed(() => formatDateTimeDot(completedAt.value));

/** 完成期限显示文本 */
const deadlineText = computed(() => {
  const today = getToday();
  const tomorrow = getTomorrow();
  if (form.value.endDate) {
    if (form.value.endDate === today) return '当天';
    if (form.value.endDate === tomorrow) return '明天';
    return formatMonthDay(form.value.endDate);
  }
  if ((form.value.taskDate || today) === today) return '当天';
  return formatMonthDay(form.value.taskDate || new Date());
});

// ✅ repeatModeLabel 已从 repeatRuleManager 解构，删除重复定义

// ============================================================
// 新增方法
// ============================================================

// ============================================================
// 阶段1：日期Tab管理函数（部分调用 taskFormApi）
// ============================================================

/**
 * 点击日期 Tab，更新 taskDate
 * @param {'today' | 'tomorrow' | 'custom' | 'preset' | 'other'} tab - Tab标识
 */
function onDateTab(tab) {
  // 'other' tab 的处理（打开选择器）属于组件层职责，保留在这里
  if (tab === 'other') {
    openCustomDatePicker();
    return;
  }

  // 其他 tab 的处理（'today'、'tomorrow'、'custom'、'preset'）交给 taskFormApi
  taskFormApi.onDateTab(tab);
}

// ============================================================
// 阶段1：子任务管理函数（直接调用 taskFormApi 方法）
// ============================================================

/**
 * 处理添加子计划事件（从 SubtaskList 组件触发）
 * @param {string} title - 子计划标题
 */
function handleAddSubtask(title) {
  taskFormApi.addSubtask(title);
}

/**
 * 处理删除子计划事件（从 SubtaskList 组件触发）
 * @param {number} index - 子计划索引
 */
function handleRemoveSubtask(index) {
  taskFormApi.removeSubtask(index);
}

/**
 * 处理切换子计划完成状态事件（从 SubtaskList 组件触发）
 * @param {number} index - 子计划索引
 */
function handleToggleSubtaskDone(index) {
  taskFormApi.toggleSubtaskDone(index);
}

/** 聚焦子任务输入框 */
function focusSubtaskInput() {
  // UniApp 中 ref 聚焦通过 focus 属性控制，这里简单实现
}

// ============================================================
// 自定义日期选择器函数
// ============================================================

/**
 * 打开自定义日期选择器
 */
function openCustomDatePicker() {
  showCustomDatePicker.value = true;
}

/**
 * 关闭自定义日期选择器
 */
function closeCustomDatePicker() {
  showCustomDatePicker.value = false;
}

/**
 * 确定自定义日期选择（处理 CustomDatePicker 组件的 confirm 事件）
 */
function onCustomDateConfirm(payload) {
  customDate.value = payload.date;
  form.value.taskDate = payload.date;
  activeDateTab.value = 'custom';
  showCustomDatePicker.value = false;
}

/** 跳转专注页面 */
function goFocus() {
  uni.showToast({ title: '正在跳转专注页面...', icon: 'none' });
}

/** 是否编辑模式 */
const isEdit = computed(() => !!taskId.value);

// ============================================================
// 阶段1：从 useTaskForm 解构表单数据和工具函数（替换原本的 ref 定义）
// ============================================================
// 原代码已删除：const form = ref({...})
// 现在从 taskFormApi 中解构获取
const {
  form,
  subtasks,
  activeDateTab,
  customDate,
  selectQuadrant,
  currentQuadrant,
  repeatRuleManager,
  hasFormChanged,
  update,
  loadFromTask  // ✅ 新增：解构 loadFromTask 方法
} = taskFormApi;

// ✅ 从 repeatRuleManager 解构重复规则状态和方法
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
  repeatModeLabel,
  toggleWeekDay,
  toggleMonthlyDay
} = repeatRuleManager;

// ============================================================
// 新增：初始化 useDateTimePickers Composable（方案G）
// ============================================================
const dateTimePickers = useDateTimePickers({ form: form.value });

// 解构日期/时间选择器状态和方法
const {
  // 日历选择器状态
  showDaysPicker,
  showLunar,
  tempEndDate,
  // 时间选择器状态
  showTimePicker,
  hours,
  minutes,
  tempStartHour,
  tempStartMin,
  tempEndHour,
  tempEndMin,
  // 计算属性
  startHourScrollTop,
  startMinScrollTop,
  endHourScrollTop,
  endMinScrollTop,
  // 日历选择器方法
  openDaysPicker,
  closeDaysPicker,
  onDayPickerConfirm,
  // 时间选择器方法
  openTimePicker,
  closeTimePicker,
  confirmTime,
  selectStartHour,
  selectStartMin,
  selectEndHour,
  selectEndMin,
  autoAdjustEndTime,
  // 滚动事件
  onStartHourScroll,
  onStartMinScroll,
  onEndHourScroll,
  onEndMinScroll
} = dateTimePickers;

// ============================================================
// 计算属性：显示逻辑
// ============================================================

// minDate 保留供后续 picker 扩展使用（当前日历弹窗通过 isPast 逻辑控制）
// const minDate = computed(() => formatDate(new Date()));

/**
 * 任务所属容器的名称（显示用）
 * 优先级：规划 > 分类 > "无分类"
 * 符合四层架构：使用 planStore 和 categoryStore
 */
const selectedPlanName = computed(() => {
  // ⭐ 架构统一：从 categoryStore.plans 获取规划（type='plan'）
  if (form.value.planId) {
    const plan = categoryStore.plans.find(p => p.id === String(form.value.planId));
    if (plan) {
      return plan.title || plan.name;
    }
  }

  // 其次检查分类
  if (form.value.categoryId) {
    const category = categoryStore.categories.find(c => c.id === String(form.value.categoryId));
    if (category) {
      return category.name;
    }
  }

  // 都没有时显示"无分类"
  return '无分类';
});

/** 左卡片：开始日期显示 */
const startDateDisplay = computed(() => {
  const dateStr = form.value.taskDate || getToday();
  return formatDateWithWeekday(dateStr);
});

/** 左卡片：副标题（今天/明天/后天） */
const startDateSub = computed(() => {
  const today = getToday();
  const tomorrow = getTomorrow();
  const dayAfter = getDateAfterDays(2, today);
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
    return formatMonthDay(form.value.endDate);
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

/** 四象限选项（用于徽章显示） */
const quadrants = [
  { key: 'q1', name: '重要且紧急', badgeIcon: '!!!!' },
  { key: 'q2', name: '重要不紧急', badgeIcon: '!!' },
  { key: 'q3', name: '紧急不重要', badgeIcon: '!' },
  { key: 'q4', name: '不急不重要', badgeIcon: '○' }
];

/** 优先级徽章：icon 文字 */
const quadrantBadgeIcon = computed(() => {
  const q = quadrants.find(item => item.key === currentQuadrant.value);
  return q ? q.badgeIcon : '';
});

/** 优先级徽章：名称 */
const quadrantBadgeText = computed(() => {
  const q = quadrants.find(item => item.key === currentQuadrant.value);
  return q ? q.name : '未设置';
});


// ============================================================
// 每月模式：子模式 + 日期多选 + 星期位置
// ============================================================

/** 第N个 标签 */
const weekNumLabels = ['第一个', '第二个', '第三个', '第四个', '最后一个'];

/** 星期全称标签（用于每月星期模式滚轮） */
const weekdayFullLabels = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

// ============================================================
// 每年模式：月和日
// ============================================================

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
  repeatRuleManager.loadFromRrule(form.value.rrule || '');
}

/** 切换每月子模式 */
function onSelectMonthlySubMode(mode) {
  monthlySubMode.value = mode;
  repeatRuleManager.loadFromRrule(form.value.rrule || '');
}

// ============================================================
// 重复模式：设置结束重复日历弹窗
// ============================================================

const showRepeatEndPicker = ref(false);
const showRepeatLunar = ref(true);

function openEndDatePicker() {
  if (repeatMode.value === 'none') return;
  showRepeatEndPicker.value = true;
}

function closeRepeatEndPicker() {
  showRepeatEndPicker.value = false;
}

/**
 * EndDateCalendar 组件确认回调
 * @param {object} payload - { date: String }
 */
function onRepeatEndDateConfirm(payload) {
  if (payload.date) {
    repeatEndDate.value = payload.date;
  }
  repeatRuleManager.loadFromRrule(form.value.rrule || '');
}

function clearRepeatEndDate() {
  repeatEndDate.value = '';
  repeatRuleManager.loadFromRrule(form.value.rrule || '');
}

/** 选择重复模式（切换时设置合理默认值） */
function onSelectRepeatMode(mode) {
  console.log('[onSelectRepeatMode] 用户选择重复模式:', mode)
  repeatMode.value = mode;
  repeatInterval.value = 1;
  console.log('[onSelectRepeatMode] 设置后 repeatMode =', repeatMode.value, ', repeatInterval =', repeatInterval.value)

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

  repeatRuleManager.loadFromRrule(form.value.rrule || '');
}


/** 取消重复规则设置 */
function cancelRepeatSettings() {
  showRepeatSheet.value = false;
}

/** 确认重复规则设置 */
function confirmRepeatSettings() {
  console.log('[confirmRepeatSettings] 确认重复设置，当前状态:', {
    'repeatMode': repeatMode.value,
    'repeatInterval': repeatInterval.value,
    'form.value.rrule': form.value.rrule
  })

  // ❌ BUG：这行代码会用旧的 form.value.rrule 覆盖用户刚修改的 repeatRuleManager 状态！
  // repeatRuleManager.loadFromRrule(form.value.rrule || '');

  console.log('[confirmRepeatSettings] 关闭弹窗，不执行 loadFromRrule（用户修改已在 repeatRuleManager 中）')
  showRepeatSheet.value = false;
}

// ============================================================
// 提醒：弹窗5 —— 三列滚轮（提前天数/周数 + 小时 + 分钟）
// ============================================================

const showReminderPicker = ref(false);

/** 主区域显示文字（已设置后显示） */
const reminderDisplayText = computed(() => {
  if (!form.value.reminderEnabled) return '';
  const hh = String(form.value.reminderHour).padStart(2, '0');
  const mm = String(form.value.reminderMin).padStart(2, '0');
  const taskDateStr = form.value.taskDate || getToday();
  let offsetDays = form.value.reminderAdvanceDays;
  if (form.value.reminderAdvanceMode === 'week') offsetDays *= 7;
  const reminderDateStr = getDateAfterDays(-offsetDays, taskDateStr);
  return `${formatMonthDay(reminderDateStr)} ${hh}:${mm}`;
});

function openReminderPicker() {
  showReminderPicker.value = true;
}

function closeReminderPicker() {
  showReminderPicker.value = false;
}

/**
 * ReminderPicker 组件确认回调
 * @param {object} reminderData - { enabled, advanceMode, advanceDays, hour, min }
 */
function onReminderConfirm(reminderData) {
  form.value.reminderEnabled     = reminderData.enabled;
  form.value.reminderAdvanceMode = reminderData.advanceMode;
  form.value.reminderAdvanceDays = reminderData.advanceDays;
  form.value.reminderHour        = reminderData.hour;
  form.value.reminderMin         = reminderData.min;
}

function onTapWechatReminder() {
  uni.showToast({ title: '微信提醒绑定功能开发中', icon: 'none' });
}

// ============================================================
// 弹窗1：日历选择结束日期（多天模式）
// ============================================================

// ============================================================
// ✅ 日历/时间选择器逻辑已提取到 useDateTimePickers Composable（方案G完成）
// 原代码（965-1081行，共117行）已删除，功能由 Composable 提供

// ============================================================
// 自定义日期选择器（用于选择 taskDate）
// ============================================================

/** 自定义日期选择器显示状态 */
const showCustomDatePicker = ref(false);

// ============================================================
// 右卡片点击路由
// ============================================================
function onClickEndCard() {
  if (form.value.hasTimeRange) {
    openTimePicker(); // ✅ 调用 Composable 方法
  } else {
    openDaysPicker(); // ✅ 调用 Composable 方法（已封装初始化逻辑）
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

// ✅ 阶段2：selectQuadrant 已从 useTaskForm 中解构，删除重复定义

function pickPlan() {
  uni.showToast({ title: '规划关联功能开发中', icon: 'none' });
}

/**
 * 编辑模式：将已有的 RRULE 字符串解析回 UI 状态
 * 使用 utils/rruleBuilder.js 的 parseRrule 函数
 */
function parseRruleToUI(rrule) {
  if (!rrule) return;
  const parsed = parseRrule(rrule);

  // 应用解析结果到当前状态
  repeatMode.value = parsed.mode || 'none';
  repeatInterval.value = parsed.interval || 1;
  if (parsed.weekDays) repeatWeekDays.value = parsed.weekDays;
  if (parsed.monthDays) {
    monthlySubMode.value = 'day';
    monthlyDays.value = parsed.monthDays;
  }
  if (parsed.yearlyMonth) yearlyMonth.value = parsed.yearlyMonth;
  if (parsed.yearlyDay) yearlyDay.value = parsed.yearlyDay;
  if (parsed.endDate) repeatEndDate.value = parsed.endDate;
}

// ============================================================
// 保存 / 删除
// ============================================================
/**
 * 保存任务（调用 useTaskForm.update()）
 */
async function save() {
  try {
    uni.showLoading({ title: '保存中...' });

    // 检查是否为localStorage任务
    let isLocalStorageTask = false;
    if (isEdit.value && taskId.value) {
      try {
        const savedTasks = uni.getStorageSync('tasks');
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          const idToFind = originalTaskId.value || taskId.value;
          isLocalStorageTask = tasks.findIndex(t => String(t.id) === String(idToFind)) !== -1;
        }
      } catch (e) {
        console.error('[TaskEdit] 检查localStorage任务失败:', e);
      }
    }

    if (isLocalStorageTask) {
      // localStorage任务：直接更新localStorage
      const savedTasks = uni.getStorageSync('tasks');
      let tasks = savedTasks ? JSON.parse(savedTasks) : [];
      const idToFind = originalTaskId.value || taskId.value;
      const taskIndex = tasks.findIndex(t => String(t.id) === String(idToFind));

      if (taskIndex !== -1) {
        const subtasksData = subtasks.value.length > 0
          ? subtasks.value.map(s => ({ title: s.title, done: s.done }))
          : [];

        tasks[taskIndex] = {
          ...tasks[taskIndex],
          title: form.value.title.trim(),
          description: form.value.description || '',
          isUrgent: form.value.isUrgent,
          isImportant: form.value.isImportant,
          date: form.value.taskDate || formatDate(new Date()),
          occurDate: form.value.taskDate || formatDate(new Date()),
          status: taskDone.value ? 'completed' : 'pending',
          subtasks: subtasksData,
          updateTime: new Date().toISOString(),
          ...(taskDone.value && !tasks[taskIndex].completedAt ? { completedAt: new Date().toISOString() } : {})
        };

        uni.setStorageSync('tasks', JSON.stringify(tasks));

        // 同步更新taskStore
        const storeTaskIndex = taskStore.tasks.findIndex(t => String(t.id) === String(idToFind));
        if (storeTaskIndex !== -1) {
          taskStore.tasks[storeTaskIndex] = tasks[taskIndex];
        }

        uni.hideLoading();
        uni.showToast({ title: '修改成功', icon: 'success' });
        setTimeout(() => { uni.navigateBack(); }, 800);
        return;
      } else {
        throw new Error('任务不存在');
      }
    }

    // 后端任务：调用useTaskForm.update()
    await update();
    await taskStore.fetchTasksByDate(form.value.taskDate || formatDate(new Date()));

    uni.showToast({ title: '修改成功', icon: 'success' });
    setTimeout(() => { uni.navigateBack(); }, 800);
  } catch (err) {
    console.error('[TaskEdit] 保存失败:', err.message);
    uni.showToast({ title: err.message || '保存失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}

// ============================================================
// 保存任务相关函数
// ============================================================

/**
 * 处理保存按钮点击
 */
async function handleSave() {
  if (!hasFormChanged.value) return;
  await save();
}

/**
 * 关闭保存重复任务对话框
 */
function closeSaveRecurringDialog() {
  showSaveRecurringDialog.value = false;
}

/**
 * 确认保存重复任务
 */
async function confirmSaveRecurring() {
  closeSaveRecurringDialog();
  await save();
}

// ============================================================
// 删除任务相关函数
// ============================================================

/** 显示删除菜单弹窗 */
function showDeleteMenu() {
  // 重置为默认选项（仅删除当天）
  deleteOption.value = 1;
  showDeleteDialog.value = true;
}

/** 关闭删除弹窗 */
function closeDeleteDialog() {
  showDeleteDialog.value = false;
}

/** 确认删除（根据选项执行不同的删除逻辑） */
async function confirmDelete(option) {
  try {
    uni.showLoading({ title: '删除中...' });

    if (option === 1) {
      // 选项1：仅删除当天任务
      await deleteCurrentDayTask();
    } else if (option === 2) {
      // 选项2：完整清空此条重复任务
      await deleteAllRecurringTasks();
    } else if (option === 3) {
      // 选项3：删除当天及未来任务
      await deleteFutureTasks();
    }

    uni.hideLoading();
    closeDeleteDialog();
    uni.showToast({ title: '删除成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (err) {
    uni.hideLoading();
    console.error('[TaskEdit] 删除失败:', err);
    uni.showToast({ title: err.message || '删除失败', icon: 'none' });
  }
}

/** 选项1：仅删除当天任务 */
async function deleteCurrentDayTask() {
  await deleteTaskImpl();
}

/** 选项2：完整清空此条重复任务 */
async function deleteAllRecurringTasks() {
  await deleteTaskImpl();
}

/** 选项3：删除当天及未来任务 */
async function deleteFutureTasks() {
  await deleteTaskImpl();
}

/** 删除任务的实际执行逻辑 */
async function deleteTaskImpl() {
  const isLocalStorageTask = taskId.value && String(taskId.value).startsWith('task_');

  if (isLocalStorageTask) {
    // localStorage任务：直接从localStorage删除
    const savedTasks = uni.getStorageSync('tasks');
    let tasks = savedTasks ? JSON.parse(savedTasks) : [];
    tasks = tasks.filter(t => String(t.id) !== String(taskId.value));
    uni.setStorageSync('tasks', JSON.stringify(tasks));

    // 从taskStore中移除
    const storeTaskIndex = taskStore.tasks.findIndex(t => String(t.id) === String(taskId.value));
    if (storeTaskIndex !== -1) {
      taskStore.tasks.splice(storeTaskIndex, 1);
    }
  } else {
    // 后端任务：调用API
    await taskStore.removeTask(taskId.value);
  }
}

function goBack() {
  uni.navigateBack();
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  // ⭐ 架构统一：规划数据已在 App.vue 通过 categoryStore.hydrate() 加载
  // 不再需要单独调用 planStore.loadPlans()

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || currentPage.options || {};

  if (options.id) {
    // 任务ID可能是数字或字符串，不要强制转换
    taskId.value = options.id;

    // 先从taskStore查找
    let task = taskStore.tasks.find(t => String(t.id) === String(taskId.value));

    // 如果taskStore中没有，尝试从localStorage加载
    if (!task) {
      console.log('[TaskEdit] taskStore中未找到任务，尝试从localStorage加载');
      try {
        const savedTasks = uni.getStorageSync('tasks');
        if (savedTasks) {
          const allTasks = JSON.parse(savedTasks);
          task = allTasks.find(t => String(t.id) === String(taskId.value));
          if (task) {
            console.log('[TaskEdit] 从localStorage找到任务:', task);
          }
        }
      } catch (e) {
        console.error('[TaskEdit] 从localStorage加载任务失败:', e);
      }
    }

    if (task) {
      // ✅ 修复BUG：调用 taskFormApi.loadFromTask() 初始化表单
      // 这会正确设置 originalForm 和 originalSubtasks，使 hasFormChanged 正常工作
      console.log('[TaskEdit] 调用 taskFormApi.loadFromTask() 初始化表单');

      // 保存原始任务ID（对于重复任务，task.taskId 是原始ID，task.id 是实例ID）
      originalTaskId.value = task.taskId || task.id;

      // 调用 useTaskForm 的 loadFromTask 方法
      taskFormApi.loadFromTask(task);

      // 解析 RRULE 到 UI 状态（如果有）
      if (task.rrule) {
        parseRruleToUI(task.rrule);
      }

      // 设置任务完成状态
      taskDone.value = task.status === 'completed';
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

  // ✅ 注意：activeDateTab 的初始化已在 taskFormApi.loadFromTask() 中完成
  // 如果没有加载任务（新建模式），则手动设置
  if (!isEdit.value) {
    const today = formatDate(new Date());
    const tomorrow = formatDate(new Date(Date.now() + 86400000));
    if (!form.value.taskDate) {
      // 取消"收集箱"功能，空日期默认为"今天"
      activeDateTab.value = 'today';
      form.value.taskDate = today;
    } else if (form.value.taskDate === today) {
      activeDateTab.value = 'today';
    } else if (form.value.taskDate === tomorrow) {
      activeDateTab.value = 'tomorrow';
    } else {
      // 其他日期：设为 custom，并记录到 customDate
      activeDateTab.value = 'custom';
      customDate.value = form.value.taskDate;
    }
  }

});

// ============================================================
// ⭐⭐⭐ 任务来源诊断信息（2026-03-14 新增）
// ============================================================

/**
 * 调试信息：追踪任务来源
 */
const debugInfo = computed(() => {
  if (!taskId.value) {
    return {
      createdAt: '新任务',
      taskDate: form.value.taskDate || '未设置',
      categoryId: form.value.categoryId || '未设置',
      categoryName: '新任务',
      inRepository: false,
      inStore: false,
      repositoryTotalCount: TaskRepository.getAll().length,
      storeTotalCount: taskStore.tasks.length,
      fullTask: '新任务（尚未保存）'
    }
  }

  // 从 Repository 获取任务
  const taskInRepo = TaskRepository.getById(taskId.value)

  // 从 Store 获取任务
  const taskInStore = taskStore.tasks.find(t => t.id === taskId.value)

  // 从 CategoryRepository 获取分类名称
  let categoryName = '无分类'
  if (taskInRepo && taskInRepo.categoryId) {
    const category = CategoryRepository.getById(taskInRepo.categoryId)
    categoryName = category ? category.name : `未知分类 (${taskInRepo.categoryId})`
  }

  return {
    createdAt: taskInRepo ? new Date(taskInRepo.createdAt).toLocaleString('zh-CN') : '未知',
    taskDate: taskInRepo ? taskInRepo.taskDate : '未知',
    categoryId: taskInRepo ? (taskInRepo.categoryId || '无') : '未知',
    categoryName,
    inRepository: !!taskInRepo,
    inStore: !!taskInStore,
    repositoryTotalCount: TaskRepository.getAll().length,
    storeTotalCount: taskStore.tasks.length,
    fullTask: taskInRepo ? JSON.stringify(taskInRepo, null, 2) : '任务不存在'
  }
})

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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  padding: 56rpx 24rpx 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
  z-index: 100;
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
  position: fixed;
  top: 148rpx;
  left: 0;
  right: 0;
  z-index: 99;
}

/* 滚动区 */
.tep-scroll {
  position: fixed;
  top: 220rpx;
  left: 0;
  right: 0;
  bottom: 140rpx;
  overflow-y: auto;
}

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

/* 子计划区域样式已移至 SubtaskList.vue 组件 */

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
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #FFFFFF;
  border-top: 1rpx solid #F0F0F0;
  z-index: 10;
}
.tep-btn-save {
  width: 100%;
  height: 90rpx;
  border-radius: 50rpx;
  background-color: #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}
.tep-btn-save-disabled {
  background-color: #CCCCCC;
  opacity: 0.6;
}
.tep-btn-save-active {
  background-color: #1A1A2E;
}
.tep-btn-save-text { font-size: 30rpx; color: #FFFFFF; font-weight: bold; }

/* 弹窗通用 */
.tep-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.4);
  z-index: 300;
  display: flex;
  align-items: center;
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



/* ============================================================
   删除任务确认弹窗样式已移至 DeleteTaskDialog.vue 组件
   ============================================================ */

/* ============================================================
   保存重复任务确认弹窗样式（复用删除对话框样式）
   ============================================================ */
.delete-dialog-title {
  padding-bottom: 20rpx;
  border-bottom: 1px solid #E5E5E5;
  margin-bottom: 8rpx;
}

.delete-dialog-title-text {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A2E;
  text-align: center;
}

/* ============================================================
   新设计的重复规则弹窗样式（根据82-86.png设计图）
   ============================================================ */

/* 底部弹窗遮罩 */
.tep-modal-mask-bottom {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* ============================================================
   ⭐⭐⭐ 调试面板样式（任务来源诊断）- 2026-03-14 新增
   ============================================================ */

.tep-debug-panel {
  margin: 40rpx;
  padding: 30rpx;
  background: #FFF3CD;
  border: 2px solid #FFC107;
  border-radius: 16rpx;
}

.tep-debug-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.tep-debug-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #FFE5B4;
}

.tep-debug-section:last-child {
  border-bottom: none;
  flex-direction: column;
}

.tep-debug-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
  min-width: 300rpx;
}

.tep-debug-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 400;
  word-break: break-all;
  flex: 1;
  text-align: right;
}

.tep-debug-yes {
  color: #28a745;
  font-weight: 600;
}

.tep-debug-no {
  color: #dc3545;
  font-weight: 600;
}

.tep-debug-json {
  margin-top: 15rpx;
  padding: 20rpx;
  background: #FFFAEC;
  border: 1px dashed #FFB74D;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #555;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 600rpx;
  overflow-y: auto;
}

</style>
