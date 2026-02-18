<template>
  <view class="task-edit-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @tap="goBack">← 返回</text>
      <text class="nav-title">{{ isEdit ? '编辑任务' : '新建任务' }}</text>
      <text class="nav-save" @tap="save">保存</text>
    </view>

    <scroll-view class="form-scroll" scroll-y>
      <!-- 标题 -->
      <view class="form-section">
        <view class="form-item title-item">
          <input
            class="title-input"
            placeholder="任务标题（必填）"
            placeholder-class="placeholder-style"
            :value="form.title"
            @input="form.title = $event.detail.value"
            maxlength="100"
          />
        </view>
      </view>

      <!-- 四象限选择 -->
      <view class="form-section">
        <text class="section-label">优先级（艾森豪威尔矩阵）</text>
        <view class="quadrant-selector">
          <view
            v-for="q in quadrants"
            :key="q.key"
            class="quad-option"
            :class="[q.cls, { selected: currentQuadrant === q.key }]"
            @tap="selectQuadrant(q)"
          >
            <text class="quad-icon">{{ q.icon }}</text>
            <text class="quad-name">{{ q.name }}</text>
            <text class="quad-desc">{{ q.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 日期时间 -->
      <view class="form-section">
        <text class="section-label">日期时间</text>

        <!-- 全天开关 -->
        <view class="form-item">
          <text class="form-label">全天</text>
          <switch
            :checked="form.isAllDay"
            @change="onAllDayChange"
            color="#5B8CFF"
          />
        </view>

        <!-- 日期选择器（UniApp picker 原生组件） -->
        <picker
          mode="date"
          :value="form.taskDate"
          :start="minDate"
          @change="onDateChange"
        >
          <view class="form-item">
            <text class="form-label">日期</text>
            <text class="form-value" :class="{ placeholder: !form.taskDate }">
              {{ form.taskDate || '选择日期' }}
            </text>
            <text class="form-arrow">›</text>
          </view>
        </picker>

        <!-- 时间选择器（仅非全天显示） -->
        <template v-if="!form.isAllDay">
          <picker
            mode="time"
            :value="form.startTime"
            @change="onStartTimeChange"
          >
            <view class="form-item">
              <text class="form-label">开始时间</text>
              <text class="form-value" :class="{ placeholder: !form.startTime }">
                {{ form.startTime || '选择开始时间' }}
              </text>
              <text class="form-arrow">›</text>
            </view>
          </picker>

          <picker
            mode="time"
            :value="form.endTime"
            @change="onEndTimeChange"
          >
            <view class="form-item">
              <text class="form-label">结束时间</text>
              <text class="form-value" :class="{ placeholder: !form.endTime }">
                {{ form.endTime || '选择结束时间（可选）' }}
              </text>
              <text class="form-arrow">›</text>
            </view>
          </picker>
        </template>
      </view>

      <!-- 重复规则 -->
      <view class="form-section">
        <text class="section-label">重复</text>
        <view class="form-item">
          <text class="form-label">重复规则</text>
          <picker
            :range="repeatOptions"
            range-key="label"
            :value="repeatIndex"
            @change="onRepeatChange"
          >
            <view class="picker-value">
              <text class="form-value">{{ repeatOptions[repeatIndex].label }}</text>
              <text class="form-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 描述 -->
      <view class="form-section">
        <text class="section-label">备注</text>
        <view class="form-item desc-item">
          <textarea
            class="desc-input"
            placeholder="添加备注..."
            placeholder-class="placeholder-style"
            :value="form.description"
            @input="form.description = $event.detail.value"
            maxlength="500"
            auto-height
          />
        </view>
      </view>

      <!-- 关联规划（可选） -->
      <view class="form-section">
        <text class="section-label">关联规划（可选）</text>
        <view class="form-item" @tap="pickPlan">
          <text class="form-label">规划</text>
          <text class="form-value" :class="{ placeholder: !selectedPlanName }">
            {{ selectedPlanName || '选择关联规划' }}
          </text>
          <text class="form-arrow">›</text>
        </view>
      </view>

      <!-- 删除按钮（编辑模式） -->
      <view v-if="isEdit" class="delete-section">
        <view class="delete-btn" @tap="deleteTask">
          <text class="delete-text">删除任务</text>
        </view>
      </view>

      <view class="bottom-padding"></view>
    </scroll-view>
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
  taskDate: '',          // 单日任务日期 YYYY-MM-DD
  startTime: '',         // 开始时间 HH:mm（非全天时使用）
  endTime: '',           // 结束时间 HH:mm（可选）
  rrule: '',             // 重复规则 RRULE 字符串
  planId: null
});

/** 日期选择最小值（今天） */
const minDate = computed(() => formatDate(new Date()));

/** 当前四象限 key */
const currentQuadrant = computed(() => {
  if (form.value.isUrgent && form.value.isImportant) return 'q1';
  if (!form.value.isUrgent && form.value.isImportant) return 'q2';
  if (form.value.isUrgent && !form.value.isImportant) return 'q3';
  return 'q4';
});

/** 选中的规划名称（显示用） */
const selectedPlanName = ref('');

// ============================================================
// 常量
// ============================================================

/** 四象限选项 */
const quadrants = [
  {
    key: 'q1',
    name: '紧急重要',
    desc: '危机处理',
    icon: '🔴',
    cls: 'opt-q1',
    isUrgent: true,
    isImportant: true
  },
  {
    key: 'q2',
    name: '重要不紧急',
    desc: '规划成长',
    icon: '🔵',
    cls: 'opt-q2',
    isUrgent: false,
    isImportant: true
  },
  {
    key: 'q3',
    name: '紧急不重要',
    desc: '可委托他人',
    icon: '🟡',
    cls: 'opt-q3',
    isUrgent: true,
    isImportant: false
  },
  {
    key: 'q4',
    name: '不急不重要',
    desc: '减少或消除',
    icon: '🟢',
    cls: 'opt-q4',
    isUrgent: false,
    isImportant: false
  }
];

/** 重复规则选项 */
const repeatOptions = [
  { label: '不重复', value: '' },
  { label: '每天', value: 'FREQ=DAILY' },
  { label: '每周', value: 'FREQ=WEEKLY' },
  { label: '每两周', value: 'FREQ=WEEKLY;INTERVAL=2' },
  { label: '每月', value: 'FREQ=MONTHLY' },
  { label: '每年', value: 'FREQ=YEARLY' }
];

const repeatIndex = ref(0);

// ============================================================
// 方法
// ============================================================

/** 选择四象限 */
function selectQuadrant(q) {
  form.value.isUrgent = q.isUrgent;
  form.value.isImportant = q.isImportant;
}

/** 全天开关切换 */
function onAllDayChange(e) {
  form.value.isAllDay = e.detail.value;
  if (form.value.isAllDay) {
    // 切换为全天时清空时间
    form.value.startTime = '';
    form.value.endTime = '';
  }
}

/** 日期选择回调 */
function onDateChange(e) {
  form.value.taskDate = e.detail.value;  // 格式：YYYY-MM-DD
}

/** 开始时间选择回调 */
function onStartTimeChange(e) {
  form.value.startTime = e.detail.value;  // 格式：HH:mm
}

/** 结束时间选择回调 */
function onEndTimeChange(e) {
  form.value.endTime = e.detail.value;  // 格式：HH:mm
}

/** 选择重复规则 */
function onRepeatChange(e) {
  repeatIndex.value = e.detail.value;
  form.value.rrule = repeatOptions[e.detail.value].value;
}

/** 选择关联规划（跳转选择页） */
function pickPlan() {
  // TODO: 打开规划选择弹窗
  uni.showToast({ title: '规划关联功能开发中', icon: 'none' });
}

/** 格式化日期 YYYY-MM-DD */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 保存任务 */
async function save() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请填写任务标题', icon: 'none' });
    return;
  }
  if (!form.value.taskDate) {
    uni.showToast({ title: '请选择任务日期', icon: 'none' });
    return;
  }
  if (!form.value.isAllDay && !form.value.startTime) {
    uni.showToast({ title: '请选择开始时间', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '保存中...' });

    // 构建与后端字段对齐的 payload
    const payload = {
      title:       form.value.title.trim(),
      description: form.value.description || null,
      isUrgent:    form.value.isUrgent,
      isImportant: form.value.isImportant,
      isAllDay:    form.value.isAllDay,
      dateType:    'single',
      taskDate:    form.value.taskDate,
      startTime:   form.value.isAllDay ? null : (form.value.startTime || null),
      endTime:     form.value.isAllDay ? null : (form.value.endTime || null),
      isRecurring: !!form.value.rrule,
      rrule:       form.value.rrule || null,
      planId:      form.value.planId || null
    };

    if (isEdit.value) {
      await taskStore.editTask(taskId.value, payload);
      uni.showToast({ title: '修改成功', icon: 'success' });
    } else {
      await taskStore.addTask(payload);
      uni.showToast({ title: '创建成功', icon: 'success' });
    }

    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (err) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}

/** 删除任务 */
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

/** 返回 */
function goBack() {
  uni.navigateBack();
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  // 读取页面参数（UniApp 方式）
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || currentPage.options || {};

  if (options.id) {
    taskId.value = parseInt(options.id);
    // 编辑模式：从 store 加载任务数据
    const task = taskStore.tasks.find(t => t.id === taskId.value);
    if (task) {
      form.value.title       = task.title       || '';
      form.value.description = task.description || '';
      form.value.isUrgent    = task.isUrgent    || false;
      form.value.isImportant = task.isImportant || false;
      form.value.isAllDay    = task.isAllDay    !== false;   // 默认全天
      form.value.taskDate    = task.taskDate    || '';
      form.value.startTime   = task.startTime   || '';
      form.value.endTime     = task.endTime     || '';
      form.value.rrule       = task.rrule       || '';
      form.value.planId      = task.planId      || null;
      // 同步重复选项下标
      const idx = repeatOptions.findIndex(r => r.value === task.rrule);
      repeatIndex.value = idx >= 0 ? idx : 0;
    }
  }

  if (options.date) {
    presetDate.value = options.date;
    if (!form.value.taskDate) {
      form.value.taskDate = options.date;
    }
  }
});
</script>

<style scoped>
/* ============================================================
   页面基础
   ============================================================ */
.task-edit-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F6FA;
}

/* ============================================================
   导航栏
   ============================================================ */
.nav-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #FFFFFF;
  padding: 56rpx 32rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.nav-back {
  font-size: 30rpx;
  color: #5B8CFF;
  min-width: 100rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #1A1A2E;
}

.nav-save {
  font-size: 30rpx;
  color: #5B8CFF;
  font-weight: bold;
  min-width: 100rpx;
  text-align: right;
}

/* ============================================================
   表单滚动区
   ============================================================ */
.form-scroll {
  flex: 1;
}

.form-section {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin: 24rpx 24rpx 0;
  padding: 8rpx 0;
  overflow: hidden;
}

.section-label {
  font-size: 24rpx;
  color: #999;
  padding: 16rpx 32rpx 8rpx;
  display: block;
}

.form-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.form-item:last-child {
  border-bottom: none;
}

.title-item {
  padding: 20rpx 32rpx;
}

.title-input {
  flex: 1;
  font-size: 36rpx;
  color: #333;
  font-weight: 500;
}

.form-label {
  font-size: 30rpx;
  color: #555;
  width: 160rpx;
  flex-shrink: 0;
}

.form-value {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.form-value.placeholder {
  color: #BBB;
}

.form-arrow {
  font-size: 36rpx;
  color: #CCC;
  margin-left: 8rpx;
}

.picker-value {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.desc-item {
  padding: 20rpx 32rpx;
}

.desc-input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  min-height: 80rpx;
}

.placeholder-style {
  color: #CCC;
}

/* ============================================================
   四象限选择器
   ============================================================ */
.quadrant-selector {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 8rpx 16rpx 24rpx;
  gap: 16rpx;
}

.quad-option {
  flex: 1;
  min-width: calc(50% - 24rpx);
  border-radius: 16rpx;
  padding: 20rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}

.opt-q1 { background-color: #FFF5F5; }
.opt-q1.selected { border-color: #FF4444; }
.opt-q2 { background-color: #F5F8FF; }
.opt-q2.selected { border-color: #5B8CFF; }
.opt-q3 { background-color: #FFFBF0; }
.opt-q3.selected { border-color: #FFB300; }
.opt-q4 { background-color: #F5FBF5; }
.opt-q4.selected { border-color: #4CAF50; }

.quad-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.quad-name {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 4rpx;
}

.quad-desc {
  font-size: 22rpx;
  color: #999;
}

/* ============================================================
   删除按钮
   ============================================================ */
.delete-section {
  padding: 40rpx 24rpx 0;
}

.delete-btn {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #FF4444;
}

.delete-text {
  font-size: 32rpx;
  color: #FF4444;
}

.bottom-padding {
  height: 80rpx;
}
</style>
