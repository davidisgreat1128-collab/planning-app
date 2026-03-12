<template>
  <!-- 遮罩层 -->
  <view v-if="visible" class="panel-mask" @tap="onMaskTap"></view>

  <!-- 底部面板 -->
  <view class="add-task-panel" :class="{ visible: visible }">

    <!-- ① 顶部日期 Tab -->
    <view class="date-tabs">
      <DateTabBar
        :activeTab="activeDateTab"
        :customDate="customDate"
        :presetDate="presetDate"
        @tab-change="handleDateTabChange"
      />
    </view>

    <!-- ② 任务标题输入行 -->
    <view class="title-row">
      <!-- 分类/规划图标 -->
      <view
        class="category-icon-wrapper"
        @tap="toggleCategoryPicker"
      >
        <view class="category-icon-circle">
          <text class="category-icon-text">{{ currentCategoryIcon }}</text>
        </view>
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
        @confirm="handlePanelSubmit"
      />
    </view>

    <!-- ③ 子计划区域（展开时显示） -->
    <view v-if="showSubtasks" class="subtask-area">
      <SubtaskList
        :subtasks="subtasksForDisplay"
        :showLine="false"
        placeholder="添加子计划"
        @add="handleAddSubtask"
        @remove="handleRemoveSubtask"
        @toggle-done="handleToggleSubtaskDone"
      />
      <view v-if="subtasks.length >= 100" class="subtask-limit-tip">
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

    <!-- ④-B 重复规则选择器（点击工具栏重复按钮后展开） -->
    <RepeatRuleSheet
      v-model:visible="showRepeatPanel"
      :repeatRuleManager="repeatRuleManager"
      :form="form"
      @confirm="onRepeatConfirm"
      @cancel="onRepeatCancel"
      @open-end-date-picker="openRepeatEndPicker"
    />

    <!-- ④-C 提醒时间选择器（点击工具栏提醒按钮后展开） -->
    <ReminderPicker
      v-model:visible="showReminderPanel"
      :taskDate="resolvedDate || getTodayStr()"
      :reminderData="reminderData"
      @confirm="onReminderConfirm"
      @cancel="onReminderCancel"
    />

    <!-- ④-D 重复规则：结束重复日期选择器弹窗 -->
    <EndDateCalendar
      v-model:visible="showRepeatEndPicker"
      :startDate="resolvedDate || getTodayStr()"
      :initialEndDate="repeatEndDate"
      :showLunar="showRepeatLunar"
      @confirm="onRepeatEndDateConfirm"
    />

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

      <!-- 重复 -->
      <view class="toolbar-item" @tap="onRepeatTap">
        <text class="toolbar-icon-text" :class="{ 'icon-active': showRepeatPanel }">🔁</text>
        <text class="toolbar-label" :class="{ 'label-active': showRepeatPanel || repeatData.mode !== 'none' }">重复</text>
      </view>

      <!-- 提醒 -->
      <view class="toolbar-item" @tap="onReminderTap">
        <text class="toolbar-icon-text" :class="{ 'icon-active': showReminderPanel || reminderData.enabled }">⏰</text>
        <text class="toolbar-label" :class="{ 'label-active': showReminderPanel || reminderData.enabled }">提醒</text>
      </view>

      <!-- 发送按钮 -->
      <view class="send-btn" :class="{ 'send-btn-active': form.title.trim() }" @tap="handlePanelSubmit">
        <text class="send-icon">➤</text>
      </view>
    </view>

    <!-- ⑤ 四象限浮层 -->
    <!-- 四象限选择器 - 使用 QuadrantPicker 组件 -->
    <QuadrantPicker
      v-model:visible="showQuadrantPicker"
      :modelValue="currentQuadrant"
      variant="grid"
      @select="handleSelectQuadrant"
    />

    <!-- ⑤.5 分类/规划选择器浮层 -->
    <view v-if="showCategoryPicker" class="category-picker-mask" @tap="closeCategoryPicker">
      <view class="category-picker" @tap.stop>
        <!-- 顶部操作按钮 -->
        <view class="cp-header">
          <view class="cp-create-action" @tap="createNewCategory">
            <text class="cp-create-plus">+</text>
            <text class="cp-create-label">新建分类</text>
          </view>
          <view class="cp-create-action" @tap="createNewPlan">
            <text class="cp-create-plus">+</text>
            <text class="cp-create-label">新建目标</text>
          </view>
        </view>

        <!-- 统一列表：无分类 + 分类（包含规划） -->
        <scroll-view class="cp-scroll" scroll-y>
          <!-- 无分类选项 -->
          <view
            class="cp-item"
            :class="{ 'cp-item-selected': selectedCategoryId === null }"
            @tap="handleCategorySelect(null)"
          >
            <view class="cp-icon-wrapper">
              <text class="cp-icon">无</text>
            </view>
            <text class="cp-item-name">无分类</text>
            <text v-if="selectedCategoryId === null" class="cp-check">✓</text>
          </view>

          <!-- 分类列表（包含普通分类和规划） -->
          <view
            v-for="category in userCategories"
            :key="category.id"
            class="cp-item"
            :class="{ 'cp-item-selected': selectedCategoryId === category.id }"
            @tap="handleCategorySelect(category.id)"
          >
            <view class="cp-icon-wrapper">
              <text class="cp-icon">{{ category.iconEmoji || category.name.charAt(0) }}</text>
            </view>
            <view v-if="category.type === 'plan'" class="cp-item-content">
              <text class="cp-item-name">{{ category.name }}</text>
              <text class="cp-item-tag">规划</text>
            </view>
            <text v-else class="cp-item-name">{{ category.name }}</text>
            <text v-if="selectedCategoryId === category.id" class="cp-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- ⑤.6 新建分类弹窗（使用teleport传送到body层级，确保全屏居中） -->
    <teleport to="body">
      <CategoryDialog
        :visible="showCategoryDialog"
        :edit-mode="false"
        @update:visible="showCategoryDialog = $event"
        @save="onCategorySave"
      />
    </teleport>

    <!-- ⑤-B 自定义日期选择器弹窗（点击"其他日期"时） -->
    <CustomDatePicker
      :visible="showCustomDatePicker"
      :initialDate="customDate || ''"
      @confirm="onCustomDateConfirm"
      @cancel="closeCustomDatePicker"
    />

    <!-- ⑥ 天数日历弹窗（开关关闭时，选择结束天） - 使用 DayPicker 组件 -->
    <teleport to="body">
      <DayPicker
        v-model:visible="showDayPicker"
        :startDate="resolvedDate"
        :initialEndDate="endDate ? formatDate(endDate) : ''"
        title="设置期限：在"
        :showDaysCount="true"
        :showLunar="true"
        mode="range"
        @confirm="onDayPickerConfirm"
        @cancel="closeDayPicker"
      />
    </teleport>

    <!-- ⑦ 时间选择弹窗（开关开启时） -->

    <!-- #ifdef H5 -->
    <!-- H5端：使用增减按钮选择时间 -->
    <teleport to="body">
      <view v-if="showTimePicker" class="tp-mask" @tap.stop="closeTimePicker">
        <view class="tp-sheet-h5" @tap.stop>
          <!-- 顶部日期标题 -->
          <text class="tp-date-title">{{ timePickerDateLabel }}</text>

          <!-- 时间选择区域 -->
          <view class="h5-time-selectors">
            <!-- 开始时间 -->
            <view class="h5-time-selector">
              <text class="h5-time-label">开始时间</text>
              <view class="h5-time-picker">
                <!-- 小时 -->
                <view class="h5-time-column">
                  <view class="h5-btn-up" @tap="adjustStartHour(1)">
                    <text class="h5-btn-icon">▲</text>
                  </view>
                  <view class="h5-time-display">
                    <text class="h5-time-value">{{ String(startHour).padStart(2, '0') }}</text>
                  </view>
                  <view class="h5-btn-down" @tap="adjustStartHour(-1)">
                    <text class="h5-btn-icon">▼</text>
                  </view>
                </view>

                <text class="h5-time-colon">:</text>

                <!-- 分钟 -->
                <view class="h5-time-column">
                  <view class="h5-btn-up" @tap="adjustStartMin(1)">
                    <text class="h5-btn-icon">▲</text>
                  </view>
                  <view class="h5-time-display">
                    <text class="h5-time-value">{{ String(startMin).padStart(2, '0') }}</text>
                  </view>
                  <view class="h5-btn-down" @tap="adjustStartMin(-1)">
                    <text class="h5-btn-icon">▼</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 分隔符 -->
            <text class="h5-separator">至</text>

            <!-- 结束时间 -->
            <view class="h5-time-selector">
              <text class="h5-time-label">结束时间</text>
              <view class="h5-time-picker">
                <!-- 小时 -->
                <view class="h5-time-column">
                  <view class="h5-btn-up" @tap="adjustEndHour(1)">
                    <text class="h5-btn-icon">▲</text>
                  </view>
                  <view class="h5-time-display">
                    <text class="h5-time-value">{{ String(endHour).padStart(2, '0') }}</text>
                  </view>
                  <view class="h5-btn-down" @tap="adjustEndHour(-1)">
                    <text class="h5-btn-icon">▼</text>
                  </view>
                </view>

                <text class="h5-time-colon">:</text>

                <!-- 分钟 -->
                <view class="h5-time-column">
                  <view class="h5-btn-up" @tap="adjustEndMin(1)">
                    <text class="h5-btn-icon">▲</text>
                  </view>
                  <view class="h5-time-display">
                    <text class="h5-time-value">{{ String(endMin).padStart(2, '0') }}</text>
                  </view>
                  <view class="h5-btn-down" @tap="adjustEndMin(-1)">
                    <text class="h5-btn-icon">▼</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 持续时间提示 -->
          <view class="h5-duration-hint" v-if="h5DurationText">
            <text class="h5-duration-text">持续时间：{{ h5DurationText }}</text>
          </view>

          <!-- 底部按钮 -->
          <view class="tp-btns">
            <view class="tp-btn tp-cancel" @tap="closeTimePicker"><text class="tp-btn-text">取消</text></view>
            <view class="tp-btn tp-confirm" @tap="confirmTimePicker"><text class="tp-btn-text tp-confirm-text">确定</text></view>
          </view>
        </view>
      </view>
    </teleport>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <!-- App端：自定义滚轮选择器 -->
    <teleport to="body">
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
    </teleport>
    <!-- #endif -->

  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTaskStore } from '@/store/task.js';
import { useCategoryStore } from '@/store/category.js';
import RepeatRuleSheet from '@/components/task/RepeatRuleSheet.vue';
import ReminderPicker from '@/components/task/ReminderPicker.vue';
import EndDateCalendar from '@/components/task/EndDateCalendar.vue';
import CategoryDialog from '@/components/planning/CategoryDialog.vue';
import DateTabBar from './DateTabBar.vue';
import SubtaskList from './SubtaskList.vue';
import CustomDatePicker from './CustomDatePicker.vue';
import QuadrantPicker from './QuadrantPicker.vue';
import DayPicker from './DayPicker.vue';
import { useTaskForm } from '@/composables/useTaskForm.js';
import { useCategoryManager } from '@/composables/useCategoryManager.js';
import { formatDate, timeDiffMinutes, formatDuration, formatDateWithWeekday, getRelativeDateLabel } from '@/utils/date.js';
import { buildRrule } from '@/utils/rruleBuilder.js';
import { syncCategoryFields } from '@/utils/categorySync.js';

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
  },
  /** 当前选中的分类ID（用于创建任务时自动关联分类） */
  categoryId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close', 'submitted']);

// ============================================================
// Store
// ============================================================
const taskStore = useTaskStore();
const categoryStore = useCategoryStore();

// ============================================================
// 阶段3：初始化 useTaskForm（创建模式）
// ============================================================
const taskFormApi = useTaskForm({
  mode: 'create',  // AddTaskPanel 仅支持创建模式
  taskId: null,
  presetDate: props.presetDate || ''
});

// ============================================================
// 阶段3：从 useTaskForm 解构所有业务逻辑
// ============================================================
const {
  // 表单数据
  form,
  subtasks,
  activeDateTab,
  customDate,

  // 计算属性
  currentQuadrant,
  hasFormChanged,

  // 子计划方法
  addSubtask,
  removeSubtask,
  toggleSubtaskDone,

  // 日期Tab方法
  onDateTab,

  // 四象限方法
  selectQuadrant,

  repeatRuleManager,

  // 表单提交方法
  submit,
  resetForm
} = taskFormApi;

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
} = repeatRuleManager;

// ============================================================
// 分类管理
// ============================================================
const categoryManager = useCategoryManager();
const {
  userCategories,
  selectedCategoryId,
  loadCategories,
  loadSelectedCategory,
  selectCategory,
  getCategoryById,
  getCurrentCategoryIcon: getCategoryIconHelper
} = categoryManager;

// ============================================================
// 面板特有数据（不从 useTaskForm 获取）
// ============================================================

/** 子计划草稿（输入中） - 不再使用，保留用于向后兼容 */
const subtaskDraft = ref('');

/** 子计划列表（转换为 SubtaskList 组件所需的对象数组格式） */
const subtasksForDisplay = computed(() => {
  return subtasks.value.map(title => ({ title, done: false }));
});

/** 子计划区域是否展开 */
const showSubtasks = ref(false);

/** 四象限选择器是否展开 */
const showQuadrantPicker = ref(false);

// ============================================================
// 分类/规划选择器
// ============================================================

/** 分类/规划选择器是否展开 */
const showCategoryPicker = ref(false);

/** 新建分类弹窗是否显示 */
const showCategoryDialog = ref(false);

/** 当前图标显示（使用 composable 的 helper 方法） */
const currentCategoryIcon = computed(() => {
  return getCategoryIconHelper(props.categoryId)
});

/** 展开/折叠分类选择器 */
function toggleCategoryPicker() {
  showCategoryPicker.value = !showCategoryPicker.value;
}

/** 关闭分类选择器 */
function closeCategoryPicker() {
  showCategoryPicker.value = false;
}

// 包装函数处理UI交互逻辑
function handleCategorySelect(categoryId) {
  selectCategory(categoryId);  // 调用 composable 方法
  showCategoryPicker.value = false;
}

/** 新建分类 */
function createNewCategory() {
  showCategoryDialog.value = true;
}

/** 保存新建的分类 */
async function onCategorySave(data) {
  try {
    // 使用 CategoryStore 创建分类（统一数据源）
    const newCategory = await categoryStore.createCategory(data);

    // 重新加载分类列表（从 CategoryRepository 获取最新数据）
    loadCategories();

    // 自动选中新创建的分类
    selectedCategoryId.value = newCategory.id;

    // UI 交互逻辑
    showCategoryDialog.value = false;
    showCategoryPicker.value = false;

    uni.showToast({
      title: '分类创建成功',
      icon: 'success'
    });
  } catch (error) {
    console.error('[onCategorySave] 创建失败', error)

    uni.showToast({
      title: error.message || '创建失败',
      icon: 'none'
    });
  }
}

/** 新建规划 */
function createNewPlan() {
  showCategoryPicker.value = false;
  uni.navigateTo({
    url: '/pages/planning/template/index'
  });
}

// ============================================================
// 日期 Tab
// ============================================================

/** 获取今天、明天的日期字符串 */
function getTodayStr() {
  return formatDate(new Date());
}
function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

/** 显示自定义日期选择器 */
const showCustomDatePicker = ref(false);

/** 选择日期 Tab */
/**
 * 处理 DateTabBar 组件的 tab-change 事件
 * @param {'today' | 'tomorrow' | 'custom' | 'preset' | 'other'} tabKey - DateTabBar 组件传递的 tab 键值
 */
function handleDateTabChange(tabKey) {
  if (tabKey === 'other') {
    // 点击"其他日期"，打开自定义日期选择器（面板特有逻辑）
    openCustomDatePicker();
    return;
  }

  // 调用 useTaskForm 提供的 onDateTab 方法处理日期Tab切换
  onDateTab(tabKey);
}

/** 监听 presetDate 变化，智能切换到对应的 tab */
watch(() => props.presetDate, (newDate) => {
  if (newDate && !customDate.value) {
    // 智能判断：根据 presetDate 的值决定激活哪个 tab
    const today = getTodayStr();
    const tomorrow = getTomorrowStr();

    if (newDate === today) {
      // presetDate 是今天 → 激活"今天" tab，不显示第3个动态tab
      activeDateTab.value = 'today';
    } else if (newDate === tomorrow) {
      // presetDate 是明天 → 激活"明天" tab，不显示第3个动态tab
      activeDateTab.value = 'tomorrow';
    } else {
      // presetDate 是其他日期 → 激活"preset" tab，显示第3个动态tab（如"3.11"）
      activeDateTab.value = 'preset';
    }
  }
}, { immediate: true });


/** 根据 Tab 获取最终提交日期 */
const resolvedDate = computed(() => {
  if (activeDateTab.value === 'today') return getTodayStr();
  if (activeDateTab.value === 'tomorrow') return getTomorrowStr();
  if (activeDateTab.value === 'custom') return customDate.value;
  if (activeDateTab.value === 'preset') return props.presetDate;
  return getTodayStr();
});


// ============================================================
// 自定义日期选择器（点击"其他日期"弹出）
// ============================================================

/** 打开自定义日期选择器 */
function openCustomDatePicker() {
  showCustomDatePicker.value = true;
}

/** 关闭自定义日期选择器 */
function closeCustomDatePicker() {
  showCustomDatePicker.value = false;
}

/** 确定自定义日期选择（处理 CustomDatePicker 组件的 confirm 事件） */
function onCustomDateConfirm(payload) {
  customDate.value = payload.date;
  activeDateTab.value = 'custom';
  showCustomDatePicker.value = false;
}


// ============================================================
// 四象限
// ============================================================

/** 四象限颜色映射（用于工具栏图标显示） */
const quadrantColors = {
  q1: '#FF4444',  // 重要且紧急 - 红色
  q2: '#5B8CFF',  // 重要不紧急 - 蓝色
  q3: '#FFA726',  // 紧急不重要 - 橙色
  q4: '#4CAF50'   // 不急不重要 - 绿色
};

/** 当前四象限图标颜色（工具栏用） */
const currentQuadrantIconColor = computed(() => {
  return quadrantColors[currentQuadrant.value] || '#FF4444';
});

/** 展开/折叠四象限选择器 */
function toggleQuadrantPicker() {
  showQuadrantPicker.value = !showQuadrantPicker.value;
}

/** 选择象限 */
function handleSelectQuadrant(q) {
  // 调用 useTaskForm 提供的 selectQuadrant 方法
  selectQuadrant(q);
  showQuadrantPicker.value = false;
}

// ============================================================
// 子计划
// ============================================================

/** 展开/折叠子计划区域 */
function toggleSubtasks() {
  showSubtasks.value = !showSubtasks.value;
}

/**
 * 处理添加子计划事件（从 SubtaskList 组件触发）
 * @param {string} title - 子计划标题
 */
function handleAddSubtask(title) {
  if (subtasks.value.length >= 100) {
    uni.showToast({ title: '子计划最多100条', icon: 'none' });
    return;
  }
  addSubtask(title);  // 使用 useTaskForm 提供的方法
  showSubtasks.value = true;
}

/**
 * 处理删除子计划事件（从 SubtaskList 组件触发）
 * @param {number} index - 子计划索引
 */
function handleRemoveSubtask(index) {
  removeSubtask(index);  // 使用 useTaskForm 提供的方法
}

/**
 * 处理切换子计划完成状态事件（从 SubtaskList 组件触发）
 * @param {number} index - 子计划索引
 */
function handleToggleSubtaskDone(index) {
  toggleSubtaskDone(index);  // 使用 useTaskForm 提供的方法
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
  const taskDateStr = resolvedDate.value || getTodayStr();
  return formatDateWithWeekday(taskDateStr);
});

const timeCardLeftSub = computed(() => {
  const taskDateStr = resolvedDate.value || getTodayStr();
  return getRelativeDateLabel(taskDateStr);
});

// ----- 右卡片：结束日期显示 -----
const endDateDisplay = computed(() => {
  if (!endDate.value) return '';
  return formatDateWithWeekday(endDate.value);
});

// ----- 持续时间计算 -----
const timeDuration = computed(() => {  if (!timeStart.value || !timeEnd.value) return '';  const totalMin = timeDiffMinutes(timeStart.value, timeEnd.value);  if (totalMin <= 0) return '';  return formatDuration(totalMin);});

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

// ============================================================
// 日历选择器（DayPicker组件）
// ============================================================

const showDayPicker = ref(false);

/** 打开天数日历 */
function openDayPicker() {
  showDayPicker.value = true;
}

function closeDayPicker() {
  showDayPicker.value = false;
}

/**
 * DayPicker 组件确认回调
 * @param {object} payload - { date: string, daysCount: number }
 */
function onDayPickerConfirm(payload) {
  endDate.value = new Date(payload.date);
  endDayCount.value = payload.daysCount;
  showDayPicker.value = false;
}

// ============================================================
// 时间选择弹窗（开关开）- 通用状态
// ============================================================

const showTimePicker = ref(false);

/** 开始时间（小时/分钟，整数索引） */
const startHour = ref(new Date().getHours());
const startMin  = ref(new Date().getMinutes());

/** 结束时间 */
const endHour = ref(0);
const endMin  = ref(0);

/** 时间选择弹窗顶部日期标签 */
const timePickerDateLabel = computed(() => timeCardLeftMain.value);

/** 打开时间选择弹窗（通用） */
function openTimePicker() {
  const now = new Date();
  startHour.value = now.getHours();
  startMin.value  = now.getMinutes();
  // 结束默认 = 开始 + 30分钟
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

// ============================================================
// H5端：增减按钮时间选择器专用
// ============================================================

/** H5持续时间文本 */
const h5DurationText = computed(() => {
  const totalMin = (endHour.value * 60 + endMin.value) - (startHour.value * 60 + startMin.value);
  if (totalMin <= 0) return '';
  if (totalMin < 60) return `${totalMin}分钟`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
});

/** 调整开始小时 */
function adjustStartHour(delta) {
  startHour.value = (startHour.value + delta + 24) % 24;
}

/** 调整开始分钟 */
function adjustStartMin(delta) {
  let newMin = startMin.value + delta;
  if (newMin < 0) {
    newMin = 59;
    adjustStartHour(-1);
  } else if (newMin > 59) {
    newMin = 0;
    adjustStartHour(1);
  }
  startMin.value = newMin;
}

/** 调整结束小时 */
function adjustEndHour(delta) {
  endHour.value = (endHour.value + delta + 24) % 24;
}

/** 调整结束分钟 */
function adjustEndMin(delta) {
  let newMin = endMin.value + delta;
  if (newMin < 0) {
    newMin = 59;
    adjustEndHour(-1);
  } else if (newMin > 59) {
    newMin = 0;
    adjustEndHour(1);
  }
  endMin.value = newMin;
}


// ============================================================
// App端：scroll-view 滚轮专用
// ============================================================

/** 每个滚轮项高度（px，按 750rpx 基准：88rpx ≈ 44px） */
const ITEM_H_PX = 44;

/** 小时数组 0-23（App端 v-for 用） */
const hours = Array.from({ length: 24 }, (_, i) => i);

/** 分钟数组 0-59（App端 v-for 用） */
const minutes = Array.from({ length: 60 }, (_, i) => i);

/** scroll-top 通过 computed 驱动初始定位 */
const startHourScrollTop = computed(() => startHour.value * ITEM_H_PX);
const startMinScrollTop  = computed(() => startMin.value  * ITEM_H_PX);
const endHourScrollTop   = computed(() => endHour.value   * ITEM_H_PX);
const endMinScrollTop    = computed(() => endMin.value    * ITEM_H_PX);

/** App端滚动监听 */
function onStartHourScroll(e) {
  startHour.value = Math.round(e.detail.scrollTop / ITEM_H_PX);
}
function onStartMinScroll(e) {
  startMin.value = Math.round(e.detail.scrollTop / ITEM_H_PX);
}
function onEndHourScroll(e) {
  endHour.value = Math.round(e.detail.scrollTop / ITEM_H_PX);
}
function onEndMinScroll(e) {
  endMin.value = Math.round(e.detail.scrollTop / ITEM_H_PX);
}

// ============================================================
// 重复功能
// ============================================================

/** 重复面板是否展开 */
const showRepeatPanel = ref(false);

/** 重复规则结束日期选择器是否展开 */
const showRepeatEndPicker = ref(false);

/** 重复日历是否显示农历 */
const showRepeatLunar = ref(true);

/** 重复数据（保留用于兼容旧逻辑） */
const repeatData = ref({
  mode:     'none',
  interval: 1,
  weekDays: [],
  endDate:  ''
});

/** 点击工具栏重复按钮：展开/折叠面板 */
function onRepeatTap() {
  showQuadrantPicker.value = false;
  showRepeatPanel.value = !showRepeatPanel.value;
}

/**
 * 打开重复规则结束日期选择器
 */
function openRepeatEndPicker() {
  showRepeatEndPicker.value = true;
}

/**
 * 重复结束日期选择确认回调
 * @param {object} payload - { date: string }
 */
function onRepeatEndDateConfirm(payload) {
  repeatEndDate.value = payload.date;
  showRepeatEndPicker.value = false;
}

/** RepeatRuleSheet 确定 */
function onRepeatConfirm() {
  // 新组件自动管理 repeatRuleManager 状态，无需额外处理
  showRepeatPanel.value = false;
}

/** RepeatRuleSheet 取消 */
function onRepeatCancel() {
  // 取消时重置重复规则
  repeatRuleManager.resetRepeatRule();
  showRepeatPanel.value = false;
}

// ============================================================
// 提醒功能
// ============================================================

/** 提醒面板是否展开 */
const showReminderPanel = ref(false);

/** 提醒数据（适配 ReminderPicker 组件格式） */
const reminderData = ref({
  enabled: false,
  advanceMode: 'day',   // 'day' | 'week'
  advanceDays: 0,       // 提前天数/周数
  hour: 0,              // 小时
  min: 0                // 分钟
});

/** 点击工具栏提醒按钮：展开/折叠面板 */
function onReminderTap() {
  showQuadrantPicker.value = false;
  showReminderPanel.value = !showReminderPanel.value;
}

/**
 * ReminderPicker 确定回调
 * @param {object} data - { enabled, advanceMode, advanceDays, hour, min }
 */
function onReminderConfirm(data) {
  reminderData.value = data;
  showReminderPanel.value = false;
}

/** ReminderPicker 取消 */
function onReminderCancel() {
  // 取消时重置提醒数据
  reminderData.value = {
    enabled: false,
    advanceMode: 'day',
    advanceDays: 0,
    hour: 0,
    min: 0
  };
  showReminderPanel.value = false;
}

// ============================================================
// 任务提交逻辑
// ============================================================

// 防重复提交标志
let _submitting = false;

/**
 * 提交面板任务（调用 useTaskForm.submit()）
 */
async function handlePanelSubmit() {
  if (_submitting) return;
  _submitting = true;

  try {
    uni.showLoading({ title: '保存中...' });

    // ============================================================
    // 面板特有逻辑：同步面板状态到 form
    // ============================================================

    // 🔥 关键修复：同步 resolvedDate 到 form.taskDate（防止日期为空）
    form.value.taskDate = resolvedDate.value;

    // 判断是否有时间段设置
    const hasTimeRange = timeToggle.value && timeStart.value && timeEnd.value;
    const hasDayRange  = !timeToggle.value && endDayCount.value > 1;

    form.value.isAllDay = !hasTimeRange;
    form.value.hasTimeRange = hasTimeRange;

    if (hasTimeRange) {
      form.value.startTime = timeStart.value;
      form.value.endTime = timeEnd.value;
    }

    if (hasDayRange) {
      form.value.endDate = endDate.value ? formatDate(endDate.value) : form.value.taskDate;
    }

    // 同步分类字段（修复BUG-003）
    // 使用 categorySync 工具函数根据type区分category和plan
    const { categoryId, planId } = syncCategoryFields({
      selectedId: selectedCategoryId.value,
      fallbackId: props.categoryId,
      categories: userCategories.value
    })
    form.value.categoryId = categoryId
    form.value.planId = planId

    // 同步提醒字段（适配新的 ReminderPicker 数据格式）
    if (reminderData.value.enabled) {
      form.value.reminderEnabled = true;
      form.value.reminderAdvanceMode = reminderData.value.advanceMode;
      form.value.reminderAdvanceDays = reminderData.value.advanceDays;
      form.value.reminderHour = reminderData.value.hour;
      form.value.reminderMin = reminderData.value.min;
    } else {
      form.value.reminderEnabled = false;
    }

    // 同步重复规则字段
    // repeatRuleManager 已经在 useTaskForm 中管理，表单提交时会自动处理 rrule


    // ============================================================
    // 调用 useTaskForm.submit()
    // ============================================================
    await submit();

    uni.hideLoading();
    resetPanel();
    emit('submitted');
    closePanel();
    uni.showToast({ title: '已添加', icon: 'success' });
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: err.message || '保存失败', icon: 'none' });
  } finally {
    _submitting = false;
  }
}

// ============================================================
// 面板控制
// ============================================================

/** 重置所有状态 */
function resetPanel() {
  resetForm();

  // 重置面板特有状态
  subtaskDraft.value = '';
  showSubtasks.value = false;
  showQuadrantPicker.value = false;
  showCategoryPicker.value = false; // 重置分类选择器
  showCategoryDialog.value = false; // 重置分类弹窗
  selectedCategoryId.value = null; // 重置选中的分类（包含规划）
  // 重置时间段
  showTimePanel.value = false;
  timeToggle.value = false;
  timeStart.value = '';
  timeEnd.value = '';
  endDayCount.value = 0;
  endDate.value = null;
  // 重置重复
  showRepeatPanel.value = false;
  showRepeatEndPicker.value = false;
  repeatEndDate.value = '';  // repeatEndDate 来自 repeatRuleManager
  repeatData.value = { mode: 'none', interval: 1, weekDays: [], endDate: '' };
  // 重置提醒
  showReminderPanel.value = false;
  reminderData.value = {
    enabled: false,
    advanceMode: 'day',
    advanceDays: 0,
    hour: 0,
    min: 0
  };
}

/** 关闭面板 */
function closePanel() {
  emit('close');
}

/** 点击遮罩关闭 */
function onMaskTap() {
  showQuadrantPicker.value = false;
  showCategoryPicker.value = false; // 同时关闭分类选择器
  closePanel();
}

// ============================================================
// 生命周期
// ============================================================

/** 组件挂载时加载数据 */
onMounted(() => {
  // 加载用户分类列表（包含规划）
  loadCategories();
});

/** 监听面板显示状态 */
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 每次打开面板时重新加载数据
    loadCategories();

    // 加载全局选中的容器（分类，包含规划）
    loadSelectedCategory();
  }
});

/**
 * 加载全局选中的容器（分类，包含规划类型的分类）
 */
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
/* DateTab 样式已移至 DateTabBar.vue 组件 */
.date-tabs {
  padding: 32rpx 40rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
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

/* 分类/规划图标样式 */
.category-icon-wrapper {
  flex-shrink: 0;
  cursor: pointer;
}

.category-icon-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.category-icon-circle:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.category-icon-text {
  font-size: 24rpx;
  color: #333;
  font-weight: 600;
  line-height: 1;
}

/* 旧的四象限圆点样式（保留兼容） */
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
/* Subtask 样式已移至 SubtaskList.vue 组件 */
.subtask-area {
  padding: 0 32rpx 16rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.subtask-limit-tip {
  padding: 12rpx 0;
  text-align: center;
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
   ⑤.5 分类/规划选择器浮层
   ============================================================ */
.category-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.category-picker {
  width: 100%;
  max-height: 85vh;
  background-color: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 顶部操作按钮区域（54.jpg风格） */
.cp-header {
  display: flex;
  padding: 30rpx 40rpx 20rpx;
  gap: 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
  flex-shrink: 0;
}

.cp-create-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cp-create-action:active {
  opacity: 0.6;
}

.cp-create-plus {
  font-size: 32rpx;
  color: #5B8CFF;
  font-weight: 300;
  line-height: 1;
}

.cp-create-label {
  font-size: 28rpx;
  color: #5B8CFF;
  font-weight: 500;
}

/* 滚动区域 */
.cp-scroll {
  flex: 1;
  padding: 10rpx 0;
  overflow-y: auto;
  min-height: 200rpx;
  max-height: calc(85vh - 120rpx);
}

/* 列表项（54.jpg风格：更大间距） */
.cp-item {
  display: flex;
  align-items: center;
  padding: 24rpx 40rpx;
  transition: background-color 0.2s;
  cursor: pointer;
}

.cp-item:active {
  background-color: #F8F8F8;
}

.cp-item-selected {
  background-color: transparent;
}

/* 图标容器（54.jpg风格：更大圆圈） */
.cp-icon-wrapper {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background-color: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.cp-icon {
  font-size: 32rpx;
  color: #333;
  line-height: 1;
}

/* 列表项内容区域 */
.cp-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.cp-item-name {
  font-size: 30rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 目标标签（54.jpg风格） */
.cp-item-tag {
  font-size: 24rpx;
  color: #999;
  background-color: #F5F5F5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

/* 勾选标记 */
.cp-check {
  font-size: 36rpx;
  color: #5B8CFF;
  flex-shrink: 0;
  margin-left: 10rpx;
  font-weight: 600;
}

/* ============================================================
   ⑦ 通用弹窗遮罩 + 弹窗卡片
   ============================================================ */
.tp-mask {
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

.tp-sheet {
  width: 70%;
  max-width: 500rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 20rpx 0 0;
  max-height: 65vh;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

/* H5端时间选择器样式 */
.tp-sheet-h5 {
  width: 90%;
  max-width: 650rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.h5-time-selectors {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  gap: 32rpx;
}

.h5-time-selector {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.h5-time-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.h5-time-picker {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.h5-time-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.h5-btn-up,
.h5-btn-down {
  width: 80rpx;
  height: 60rpx;
  background-color: #F5F5F5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.h5-btn-up:active,
.h5-btn-down:active {
  background-color: #FFB300;
  transform: scale(0.95);
}

.h5-btn-icon {
  font-size: 24rpx;
  color: #666;
}

.h5-btn-up:active .h5-btn-icon,
.h5-btn-down:active .h5-btn-icon {
  color: #FFF;
}

.h5-time-display {
  width: 80rpx;
  height: 100rpx;
  background-color: #FFF;
  border: 3rpx solid #FFB300;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(255, 179, 0, 0.2);
}

.h5-time-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #222;
  line-height: 1;
}

.h5-time-colon {
  font-size: 40rpx;
  color: #999;
  font-weight: bold;
  padding: 0 8rpx;
}

.h5-separator {
  font-size: 28rpx;
  color: #999;
  padding: 0 8rpx;
}

.h5-duration-hint {
  text-align: center;
  padding: 16rpx 0 24rpx;
}

.h5-duration-text {
  font-size: 26rpx;
  color: #888;
}


/* 底部按钮行 */
.tp-btns {
  display: flex;
  flex-direction: row;
  border-top: 1rpx solid #F0F0F0;
  margin-top: 8rpx;
}

.tp-btn {
  flex: 1;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tp-cancel {
  border-right: 1rpx solid #F0F0F0;
}

.tp-btn-text {
  font-size: 26rpx;
  color: #666;
}

.tp-confirm-text {
  color: #333;
  font-weight: bold;
}

/* ============================================================
   ⑧ DayPicker 组件样式已内置在组件中，此处无需重复定义
   ============================================================ */

/* ============================================================
   ⑨ 时间滚轮弹窗样式（APP端）
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
