<template>
  <view class="log-edit-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @tap="goBack">← 返回</text>
      <text class="nav-title">{{ isEdit ? '编辑日志' : '记录日志' }}</text>
      <text class="nav-save" @tap="save">保存</text>
    </view>

    <scroll-view class="form-scroll" scroll-y>
      <!-- 时间戳显示（核心：精确到分钟） -->
      <view class="time-display-section">
        <view class="time-display" @tap="editTime">
          <text class="time-big">{{ displayTime }}</text>
          <text class="time-date">{{ displayDate }}</text>
          <text class="time-edit-hint">点击修改时间</text>
        </view>
      </view>

      <!-- 内容区 -->
      <view class="form-section content-section">
        <textarea
          class="content-input"
          placeholder="记录此刻的想法、进展、感受..."
          placeholder-class="placeholder-style"
          :value="form.content"
          @input="form.content = $event.detail.value"
          maxlength="2000"
          auto-height
          focus
        />
        <text class="char-count">{{ form.content.length }}/2000</text>
      </view>

      <!-- 关联信息 -->
      <view class="form-section">
        <text class="section-label">关联（可选）</text>
        <!-- 关联任务 -->
        <view class="form-item" @tap="pickTask">
          <text class="form-label">关联任务</text>
          <text class="form-value" :class="{ placeholder: !selectedTaskName }">
            {{ selectedTaskName || '关联到某个任务' }}
          </text>
          <text class="form-arrow">›</text>
        </view>
        <!-- 关联规划 -->
        <view class="form-item" @tap="pickPlan">
          <text class="form-label">关联规划</text>
          <text class="form-value" :class="{ placeholder: !selectedPlanName }">
            {{ selectedPlanName || '关联到某个规划' }}
          </text>
          <text class="form-arrow">›</text>
        </view>
      </view>

      <!-- 转为任务按钮 -->
      <view class="action-section">
        <view class="action-btn convert-btn" @tap="convertToTask">
          <text class="action-icon">✅</text>
          <text class="action-text">转化为任务</text>
          <text class="action-desc">将此日志内容创建为新任务</text>
        </view>
      </view>

      <!-- 删除按钮（编辑模式） -->
      <view v-if="isEdit" class="delete-section">
        <view class="delete-btn" @tap="deleteLog">
          <text class="delete-text">删除日志</text>
        </view>
      </view>

      <view class="bottom-padding"></view>
    </scroll-view>

    <!-- 时间选择弹窗 -->
    <view v-if="showTimePicker" class="time-picker-mask" @tap.self="showTimePicker = false">
      <view class="time-picker-panel">
        <view class="picker-header">
          <text class="picker-cancel" @tap="showTimePicker = false">取消</text>
          <text class="picker-title">选择时间</text>
          <text class="picker-confirm" @tap="confirmTime">确定</text>
        </view>
        <view class="time-inputs">
          <view class="time-input-group">
            <text class="time-input-label">日期</text>
            <input
              class="time-input"
              type="text"
              placeholder="YYYY-MM-DD"
              :value="tempDate"
              @input="tempDate = $event.detail.value"
              maxlength="10"
            />
          </view>
          <view class="time-input-group">
            <text class="time-input-label">时间</text>
            <input
              class="time-input"
              type="text"
              placeholder="HH:mm"
              :value="tempTime"
              @input="tempTime = $event.detail.value"
              maxlength="5"
            />
          </view>
        </view>
        <view class="quick-times">
          <text class="quick-time-label">快速选择</text>
          <view class="quick-time-list">
            <text
              v-for="qt in quickTimes"
              :key="qt"
              class="quick-time-item"
              @tap="selectQuickTime(qt)"
            >{{ qt }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLogStore } from '@/store/log.js';
import { useTaskStore } from '@/store/task.js';

// ============================================================
// Store
// ============================================================
const logStore = useLogStore();
const taskStore = useTaskStore();

// ============================================================
// 状态
// ============================================================
/** 日志ID（编辑模式时有值） */
const logId = ref(null);
/** 是否编辑模式 */
const isEdit = computed(() => !!logId.value);

/** 表单数据 */
const form = ref({
  content: '',
  loggedAt: new Date().toISOString(), // 精确到分钟
  planId: null,
  taskId: null
});

/** 关联任务名称（显示用） */
const selectedTaskName = ref('');
/** 关联规划名称（显示用） */
const selectedPlanName = ref('');

/** 时间选择弹窗 */
const showTimePicker = ref(false);
const tempDate = ref('');
const tempTime = ref('');

// ============================================================
// 快速时间选项（整点和半点）
// ============================================================
const quickTimes = computed(() => {
  const now = new Date();
  const h = now.getHours();
  return [
    `${String(h).padStart(2, '0')}:00`,
    `${String(h).padStart(2, '0')}:30`,
    `${String((h + 1) % 24).padStart(2, '0')}:00`,
    '现在'
  ];
});

// ============================================================
// 计算属性（显示用）
// ============================================================

/** 显示时间 HH:mm */
const displayTime = computed(() => {
  const d = new Date(form.value.loggedAt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
});

/** 显示日期 */
const displayDate = computed(() => {
  const d = new Date(form.value.loggedAt);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
  return `${y}年${m}月${day}日 周${weekNames[d.getDay()]}`;
});

// ============================================================
// 方法
// ============================================================

/** 打开时间修改弹窗 */
function editTime() {
  const d = new Date(form.value.loggedAt);
  tempDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  tempTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  showTimePicker.value = true;
}

/** 快速选择时间 */
function selectQuickTime(qt) {
  if (qt === '现在') {
    form.value.loggedAt = new Date().toISOString();
    showTimePicker.value = false;
    return;
  }
  tempTime.value = qt;
}

/** 确认时间选择 */
function confirmTime() {
  if (!tempDate.value || !tempTime.value) {
    uni.showToast({ title: '请填写日期和时间', icon: 'none' });
    return;
  }
  // 校验格式
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tempDate.value)) {
    uni.showToast({ title: '日期格式应为 YYYY-MM-DD', icon: 'none' });
    return;
  }
  if (!/^\d{2}:\d{2}$/.test(tempTime.value)) {
    uni.showToast({ title: '时间格式应为 HH:mm', icon: 'none' });
    return;
  }

  form.value.loggedAt = new Date(`${tempDate.value}T${tempTime.value}:00`).toISOString();
  showTimePicker.value = false;
}

/** 选择关联任务 */
function pickTask() {
  // TODO: 打开任务选择弹窗
  uni.showToast({ title: '关联任务功能开发中', icon: 'none' });
}

/** 选择关联规划 */
function pickPlan() {
  // TODO: 打开规划选择弹窗
  uni.showToast({ title: '关联规划功能开发中', icon: 'none' });
}

/** 保存日志 */
async function save() {
  if (!form.value.content.trim()) {
    uni.showToast({ title: '请填写日志内容', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '保存中...' });

    const payload = {
      content: form.value.content.trim(),
      loggedAt: form.value.loggedAt,
      planId: form.value.planId || null,
      taskId: form.value.taskId || null
    };

    if (isEdit.value) {
      await logStore.editLog(logId.value, payload);
      uni.showToast({ title: '修改成功', icon: 'success' });
    } else {
      await logStore.addLog(payload);
      uni.showToast({ title: '记录成功', icon: 'success' });
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

/** 日志转为任务 */
async function convertToTask() {
  if (!isEdit.value) {
    // 先保存再转化
    uni.showModal({
      title: '提示',
      content: '将先保存日志，再转化为任务，确认吗？',
      success: async (res) => {
        if (res.confirm) {
          if (!form.value.content.trim()) {
            uni.showToast({ title: '请先填写内容', icon: 'none' });
            return;
          }
          try {
            const log = await logStore.addLog({
              content: form.value.content.trim(),
              loggedAt: form.value.loggedAt
            });
            await logStore.toTask(log.id);
            uni.showToast({ title: '已创建任务', icon: 'success' });
            setTimeout(() => uni.navigateBack(), 800);
          } catch (err) {
            uni.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
    return;
  }

  try {
    await logStore.toTask(logId.value);
    uni.showToast({ title: '已转为任务', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (err) {
    uni.showToast({ title: err.message || '转换失败', icon: 'none' });
  }
}

/** 删除日志 */
function deleteLog() {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这条日志吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await logStore.removeLog(logId.value);
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
  // 读取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || currentPage.options || {};

  if (options.id) {
    logId.value = parseInt(options.id);
    // 编辑模式：从 store 加载日志数据
    const log = logStore.logs.find(l => l.id === logId.value);
    if (log) {
      form.value.content = log.content || '';
      form.value.loggedAt = log.loggedAt || new Date().toISOString();
      form.value.planId = log.planId || null;
      form.value.taskId = log.taskId || null;
    }
  }

  // 如果传入日期，设置 loggedAt 为该日期当前时间
  if (options.date && !logId.value) {
    const now = new Date();
    const d = new Date(options.date);
    d.setHours(now.getHours(), now.getMinutes(), 0, 0);
    form.value.loggedAt = d.toISOString();
  }
});
</script>

<style scoped>
/* ============================================================
   页面基础
   ============================================================ */
.log-edit-page {
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
   时间大显示区
   ============================================================ */
.time-display-section {
  padding: 40rpx 24rpx 0;
}

.time-display {
  background: linear-gradient(135deg, #5B8CFF, #7B5EA7);
  border-radius: 24rpx;
  padding: 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.time-big {
  font-size: 80rpx;
  font-weight: bold;
  color: #FFFFFF;
  letter-spacing: 4rpx;
  line-height: 1;
}

.time-date {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 12rpx;
}

.time-edit-hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8rpx;
}

/* ============================================================
   内容输入区
   ============================================================ */
.form-section {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin: 24rpx 24rpx 0;
  padding: 8rpx 0;
  overflow: hidden;
}

.content-section {
  padding: 24rpx 32rpx;
}

.content-input {
  width: 100%;
  font-size: 32rpx;
  color: #333;
  line-height: 1.6;
  min-height: 240rpx;
}

.placeholder-style {
  color: #CCC;
}

.char-count {
  font-size: 22rpx;
  color: #CCC;
  text-align: right;
  display: block;
  margin-top: 12rpx;
}

/* ============================================================
   表单项
   ============================================================ */
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

.form-label {
  font-size: 30rpx;
  color: #555;
  width: 140rpx;
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
}

/* ============================================================
   操作按钮区
   ============================================================ */
.action-section {
  padding: 24rpx 24rpx 0;
}

.action-btn {
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
}

.convert-btn {
  border: 2rpx solid #4CAF50;
}

.action-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.action-text {
  font-size: 30rpx;
  color: #4CAF50;
  font-weight: bold;
  margin-right: 16rpx;
}

.action-desc {
  font-size: 24rpx;
  color: #999;
}

/* ============================================================
   删除按钮
   ============================================================ */
.delete-section {
  padding: 24rpx 24rpx 0;
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

/* ============================================================
   时间选择弹窗
   ============================================================ */
.time-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.time-picker-panel {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 0 0 60rpx;
}

.picker-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.picker-cancel {
  font-size: 30rpx;
  color: #999;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.picker-confirm {
  font-size: 30rpx;
  color: #5B8CFF;
  font-weight: bold;
}

.time-inputs {
  padding: 32rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.time-input-group {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.time-input-label {
  font-size: 28rpx;
  color: #555;
  width: 80rpx;
}

.time-input {
  flex: 1;
  font-size: 32rpx;
  color: #333;
  border-bottom: 2rpx solid #E0E0E0;
  padding: 8rpx 0;
}

.quick-times {
  padding: 0 40rpx;
}

.quick-time-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
  display: block;
}

.quick-time-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx;
}

.quick-time-item {
  background-color: #F0F4FF;
  color: #5B8CFF;
  font-size: 28rpx;
  padding: 12rpx 28rpx;
  border-radius: 40rpx;
}
</style>
