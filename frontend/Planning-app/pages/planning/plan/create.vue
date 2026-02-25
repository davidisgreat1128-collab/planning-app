<template>
  <view class="create-plan-page">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-left" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">新规划</text>
      <view class="nav-right"></view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view class="scroll-content" scroll-y>
      <!-- 规划名称 -->
      <view class="form-section">
        <text class="form-label">规划名称</text>
        <view class="input-wrapper">
          <text class="input-icon">🔔</text>
          <input
            class="form-input"
            v-model="planForm.title"
            placeholder="循序渐进养成良好作息"
            placeholder-class="input-placeholder"
          />
          <text class="char-count">{{ planForm.title.length }}/20</text>
        </view>
      </view>

      <!-- Buff -->
      <view class="form-section">
        <view class="form-label-row">
          <text class="form-label">Buff</text>
          <view class="change-buff-btn" @tap="changeBuff">
            <text class="buff-icon">📦</text>
            <text class="buff-text">换一个</text>
          </view>
        </view>
        <view class="buff-input-wrapper">
          <input
            class="buff-input"
            v-model="planForm.buff"
            placeholder="输入激励语"
            placeholder-class="input-placeholder"
          />
        </view>
      </view>

      <!-- 规划期限 -->
      <view class="form-section">
        <text class="form-label">规划期限</text>
        <view class="date-range-wrapper">
          <view class="date-display">
            <text class="date-text">{{ planForm.startDate }}-{{ planForm.endDate }}</text>
            <text class="clear-icon" @tap="clearDates">⊗</text>
          </view>

          <view class="date-detail">
            <picker mode="date" :value="pickerStartDate" @change="onStartDateChange" class="date-picker-wrapper">
              <view class="date-item">
                <text class="date-label">开始日期</text>
                <view class="date-value-wrapper">
                  <text class="date-value">{{ planForm.startDate }} {{ planForm.startWeekday }}</text>
                </view>
                <text class="date-hint">{{ planForm.startHint }}</text>
              </view>
            </picker>
            <picker mode="date" :value="pickerEndDate" @change="onEndDateChange" class="date-picker-wrapper">
              <view class="date-item">
                <text class="date-label">结束日期</text>
                <view class="date-value-wrapper">
                  <text class="date-value">{{ planForm.endDate }} {{ planForm.endWeekday }}</text>
                </view>
                <text class="date-hint">{{ planForm.duration }}</text>
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 里程碑 -->
      <view class="form-section">
        <view class="form-label-row">
          <text class="form-label">里程碑</text>
          <text class="form-hint">建议拆解规划，为规划设立阶段里程碑</text>
          <text class="add-milestone-btn" @tap="addMilestone">+添加</text>
        </view>

        <view
          v-for="(milestone, index) in planForm.milestones"
          :key="index"
          class="milestone-card"
        >
          <view class="milestone-header">
            <view class="milestone-number">{{ index + 1 }}</view>
            <input
              class="milestone-title-input"
              v-model="milestone.title"
              placeholder="里程碑标题"
            />
            <text class="milestone-edit-icon" @tap="editMilestone(index)">✏️</text>
          </view>

          <textarea
            class="milestone-desc-input"
            v-model="milestone.description"
            placeholder="输入里程碑描述..."
            :auto-height="true"
          />

          <view class="milestone-date">
            <text class="date-text">{{ milestone.date }} · {{ milestone.days }}</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 底部创建按钮 -->
    <view class="bottom-action">
      <view class="create-btn" @tap="createPlan">
        <text class="btn-text">创建规划</text>
      </view>
    </view>

    <!-- 里程碑弹窗 -->
    <milestone-modal
      v-model:visible="showMilestoneModal"
      :milestone-number="planForm.milestones.length + 1"
      :edit-data="editingMilestone"
      @save="handleMilestoneSave"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getRandomBuff } from '@/utils/buffLibrary.js';
import MilestoneModal from '@/components/milestone-modal.vue';

// 表单数据
const planForm = ref({
  title: '循序渐进养成良好作息',
  buff: getRandomBuff(),
  startDate: '2026/02/24',
  startWeekday: '周二',
  startHint: '今天',
  endDate: '2026/03/26',
  endWeekday: '周四',
  duration: '持续30天',
  milestones: [
    {
      title: '建立健康观念，健康永远是第一位的',
      description: '注意是要时刻记得。如果你希望养成良好作息，那么你先要做到的事，做任何选择时都不应该以牺牲健康为代价。',
      date: '2026/03/05',
      days: '第10天'
    },
    {
      title: '锚定一日三餐的时间点',
      description: '根据个人的实际生活和工作情况，确定每天的一日三餐时间点。一日三餐的时间往往是休息的时间，保持它尽可能不被客观环境所打破，在休息日吃早饭会帮助你完成早起，按时晚饭也可以让你拒绝夜宵。',
      date: '2026/03/15',
      days: '第20天'
    }
  ]
});

// 日期格式转换：将 yyyy/MM/dd 转为 yyyy-MM-dd（用于picker组件）
const pickerStartDate = computed(() => {
  return planForm.value.startDate.replace(/\//g, '-');
});

const pickerEndDate = computed(() => {
  return planForm.value.endDate.replace(/\//g, '-');
});

// 里程碑弹窗显示状态
const showMilestoneModal = ref(false);

// 正在编辑的里程碑
const editingMilestone = ref(null);
const editingMilestoneIndex = ref(-1);

// 换一个Buff
function changeBuff() {
  planForm.value.buff = getRandomBuff();
}

// 清除日期
function clearDates() {
  planForm.value.startDate = '';
  planForm.value.endDate = '';
}

// 开始日期变更
function onStartDateChange(e) {
  const selectedDate = e.detail.value;
  planForm.value.startDate = selectedDate.replace(/-/g, '/');
  calculateDateInfo();
}

// 结束日期变更
function onEndDateChange(e) {
  const selectedDate = e.detail.value;
  planForm.value.endDate = selectedDate.replace(/-/g, '/');
  calculateDateInfo();
}

// 计算日期相关信息
function calculateDateInfo() {
  if (!planForm.value.startDate || !planForm.value.endDate) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(planForm.value.startDate);
  const endDate = new Date(planForm.value.endDate);

  // 计算开始日期的星期几
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  planForm.value.startWeekday = weekdays[startDate.getDay()];
  planForm.value.endWeekday = weekdays[endDate.getDay()];

  // 计算开始日期与今天的差异
  const diffDays = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    planForm.value.startHint = '今天';
  } else if (diffDays === 1) {
    planForm.value.startHint = '明天';
  } else if (diffDays === -1) {
    planForm.value.startHint = '昨天';
  } else if (diffDays > 1) {
    planForm.value.startHint = `${diffDays}天后`;
  } else if (diffDays < -1) {
    planForm.value.startHint = `${Math.abs(diffDays)}天前`;
  }

  // 计算持续天数（结束日期 - 开始日期 + 1）
  const durationDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  planForm.value.duration = `持续${durationDays}天`;

  console.log('[CreatePlan] 日期更新:', {
    startHint: planForm.value.startHint,
    duration: planForm.value.duration
  });
}

// 添加里程碑
function addMilestone() {
  console.log('[CreatePlan] 添加里程碑');
  editingMilestone.value = null;
  editingMilestoneIndex.value = -1;
  showMilestoneModal.value = true;
}

// 编辑里程碑
function editMilestone(index) {
  console.log('[CreatePlan] 编辑里程碑:', index);
  editingMilestone.value = { ...planForm.value.milestones[index] };
  editingMilestoneIndex.value = index;
  showMilestoneModal.value = true;
}

// 保存里程碑
function handleMilestoneSave(milestoneData) {
  console.log('[CreatePlan] 保存里程碑:', milestoneData);

  // 计算第几天（基于规划时间）
  let days = '第X天';
  if (planForm.value.startDate && milestoneData.date) {
    const startDate = new Date(planForm.value.startDate);
    const milestoneDate = new Date(milestoneData.date);
    const diffDays = Math.floor((milestoneDate - startDate) / (1000 * 60 * 60 * 24));
    days = `第${diffDays}天`;
  }

  const newMilestone = {
    title: milestoneData.title,
    description: milestoneData.description,
    date: milestoneData.date,
    days: days
  };

  if (editingMilestoneIndex.value >= 0) {
    // 编辑模式：更新现有里程碑
    planForm.value.milestones[editingMilestoneIndex.value] = newMilestone;
    uni.showToast({
      title: '更新成功',
      icon: 'success'
    });
  } else {
    // 新增模式：添加到列表
    planForm.value.milestones.push(newMilestone);
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    });
  }

  // 重置编辑状态
  editingMilestone.value = null;
  editingMilestoneIndex.value = -1;
}

// 创建规划
function createPlan() {
  console.log('[CreatePlan] 创建规划:', planForm.value);

  // 将规划数据存储到全局或通过URL参数传递
  const planData = encodeURIComponent(JSON.stringify({
    title: planForm.value.title,
    buff: planForm.value.buff,
    startDate: planForm.value.startDate,
    endDate: planForm.value.endDate,
    duration: planForm.value.duration,
    milestones: planForm.value.milestones
  }));

  uni.showToast({
    title: '创建成功',
    icon: 'success'
  });

  setTimeout(() => {
    // 跳转到规划详情页，传递数据
    uni.navigateTo({
      url: `/pages/planning/plan/detail?planData=${planData}`
    });
  }, 1500);
}

// 返回
function goBack() {
  uni.navigateBack();
}

// 页面加载时计算日期信息
onMounted(() => {
  calculateDateInfo();
});
</script>

<style scoped>
.create-plan-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* ============================================================
   导航栏
   ============================================================ */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #e0e0e0;
}

.nav-left {
  width: 80rpx;
  cursor: pointer;
}

.back-icon {
  font-size: 48rpx;
  color: #333;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 80rpx;
}

/* ============================================================
   滚动内容
   ============================================================ */
.scroll-content {
  flex: 1;
  padding: 30rpx 20rpx 140rpx;
  width: 100%;
  box-sizing: border-box;
}

/* ============================================================
   表单区域
   ============================================================ */
.form-section {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.form-label-row {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.form-hint {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}

/* 规划名称输入 */
.input-wrapper {
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 25rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
  width: 100%;
  box-sizing: border-box;
}

.input-icon {
  font-size: 40rpx;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  min-width: 0; /* 防止flex子元素溢出 */
}

.input-placeholder {
  color: #ccc;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

/* Buff输入 */
.change-buff-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.buff-icon {
  font-size: 28rpx;
}

.buff-text {
  font-size: 26rpx;
  color: #5B8CFF;
  white-space: nowrap;
}

.buff-input-wrapper {
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 25rpx;
  width: 100%;
  box-sizing: border-box;
}

.buff-input {
  width: 100%;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

/* 日期范围 */
.date-range-wrapper {
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 25rpx;
  width: 100%;
  box-sizing: border-box;
}

.date-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.date-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-icon {
  font-size: 32rpx;
  color: #999;
  cursor: pointer;
  flex-shrink: 0;
}

.date-detail {
  display: flex;
  gap: 15rpx;
  width: 100%;
}

.date-picker-wrapper {
  flex: 1;
  min-width: 0;
}

.date-item {
  flex: 1;
  min-width: 0; /* 防止溢出 */
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 15rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  box-sizing: border-box;
  cursor: pointer;
}

.date-label {
  font-size: 24rpx;
  color: #999;
}

.date-value-wrapper {
  cursor: pointer;
}

.date-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
  word-break: break-all;
  line-height: 1.4;
}

.date-hint {
  font-size: 22rpx;
  color: #666;
}

/* 里程碑 */
.add-milestone-btn {
  font-size: 26rpx;
  color: #5B8CFF;
  cursor: pointer;
}

.milestone-card {
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.milestone-number {
  width: 48rpx;
  height: 48rpx;
  background-color: #333;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.milestone-title-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.milestone-edit-icon {
  font-size: 32rpx;
  cursor: pointer;
}

.milestone-desc-input {
  width: 100%;
  min-height: 120rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  padding: 15rpx 0;
  border: none;
  background: transparent;
}

.milestone-date {
  padding-top: 15rpx;
  border-top: 1rpx dashed #e0e0e0;
}

.date-text {
  font-size: 24rpx;
  color: #999;
}

/* ============================================================
   底部按钮
   ============================================================ */
.bottom-spacer {
  height: 40rpx;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 60rpx 40rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.create-btn {
  width: 100%;
  height: 90rpx;
  background-color: #333;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}
</style>
