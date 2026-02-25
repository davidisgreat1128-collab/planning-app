<template>
  <view class="detail-page">
    <!-- 头部背景区域 -->
    <view class="header-section" :style="{ backgroundImage: `url(${templateData.coverImage})` }">
      <!-- 返回按钮 -->
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>

      <!-- 规划标题和标签 -->
      <view class="header-content">
        <text class="goal-title"># {{ templateData.title }}</text>

        <view class="tag-list">
          <view v-for="(tag, index) in templateData.tags" :key="index" class="tag-item">
            <text class="tag-text">{{ tag }}</text>
          </view>
        </view>

        <!-- 用户坚持信息 -->
        <view class="users-info">
          <view class="user-avatars">
            <image
              v-for="(avatar, index) in templateData.userAvatars"
              :key="index"
              class="user-avatar"
              :src="avatar"
              mode="aspectFill"
            />
            <view class="more-users">
              <text class="more-text">...</text>
            </view>
          </view>
          <text class="users-count">{{ templateData.users }}人坚持</text>
        </view>
      </view>

      <!-- 里程碑展示 -->
      <view class="milestones-section">
        <!-- 横向滚动容器 -->
        <scroll-view class="milestones-scroll" scroll-x enable-flex>
          <view class="milestones-wrapper">
            <view
              v-for="(milestone, index) in templateData.milestones"
              :key="index"
              class="milestone-item"
              @tap="showMilestoneDetail(milestone, index)"
            >
              <!-- 里程碑卡片 -->
              <view class="milestone-card">
                <text class="milestone-flag">🚩</text>
                <view class="milestone-info">
                  <text class="milestone-num">{{ index + 1 }}.里程碑</text>
                  <text class="milestone-title">{{ milestone.title }}</text>
                </view>
                <text class="milestone-arrow">›</text>
              </view>
              <!-- 连接线和圆点 -->
              <view class="milestone-connector">
                <view class="milestone-dot"></view>
                <view v-if="index < templateData.milestones.length - 1" class="milestone-line"></view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 计划模板区域 -->
    <view class="plan-section">
      <text class="plan-title">计划模板</text>

      <!-- Day标签切换 -->
      <scroll-view class="day-tabs-scroll" scroll-x enable-flex>
        <view class="day-tabs">
          <view
            v-for="day in templateData.days"
            :key="day"
            class="day-tab"
            :class="{ active: currentDay === day }"
            @tap="switchDay(day)"
          >
            <text class="day-label">Day</text>
            <text class="day-num">{{ day }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 任务列表 -->
      <view class="task-list">
        <view
          v-for="(task, index) in currentDayTasks"
          :key="index"
          class="task-item"
          :class="[`priority-${task.priority || 'medium'}`]"
        >
          <view class="task-content">
            <text class="task-title">{{ task.title }}</text>
            <text v-if="task.isRepeat" class="task-repeat">重复事件</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-action">
      <view class="action-btn" @tap="addGoal">
        <text class="btn-text">+ 添加规划</text>
      </view>
    </view>

    <!-- 里程碑详情弹窗 -->
    <view v-if="showMilestoneModal" class="milestone-modal" @tap="closeMilestoneDetail">
      <view class="milestone-modal-content" @tap.stop>
        <text class="milestone-modal-title">{{ currentMilestone.index + 1 }}.{{ currentMilestone.title }}</text>
        <text class="milestone-modal-desc">{{ currentMilestone.description }}</text>
        <text class="milestone-modal-days">{{ currentMilestone.days }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const currentDay = ref(1);
const showMilestoneModal = ref(false);
const currentMilestone = ref({ title: '', description: '', days: '', index: 0 });

// 模板数据
const templateData = ref({
  id: 'tpl_2',
  title: '循序渐进养成良好作息',
  coverImage: '/static/images/template-sleep-bg.jpg',
  tags: ['作息改善', '提高生活质量'],
  users: 9504,
  userAvatars: [
    '/static/images/avatar1.png',
    '/static/images/avatar2.png',
    '/static/images/avatar3.png'
  ],
  milestones: [
    {
      title: '建立健康观念',
      description: '建立健康观念,健康永远是第一位的。注意是要时刻记得。如果你希望养成良好作息,那么你先要做到的事,做任何选择时都不应该以牺牲健康为代价。',
      days: '第10天'
    },
    {
      title: '锚定一日三餐时间',
      description: '确定每天三餐的固定时间,养成规律的饮食习惯。',
      days: '第20天'
    },
    {
      title: '养成自己的助眠习惯',
      description: '喝牛奶、保持一定的运动量、睡前阅读都有助于提升睡眠质量,选择最适合你的方式养成这个习惯。注意运动不要在睡前半个小时内进行。',
      days: '第0天'
    }
  ],
  days: Array.from({ length: 30 }, (_, i) => i + 1), // 1-30天
  tasksByDay: {
    1: [
      { title: '查资料，了解缺少睡眠的危害', isRepeat: true, priority: 'high' },
      { title: '22:00按时上床', isRepeat: true, priority: 'high' },
      { title: '每天按时吃三餐', isRepeat: true, priority: 'medium' }
    ],
    2: [
      { title: '制定个人作息时间表', isRepeat: false, priority: 'high' },
      { title: '22:00按时上床', isRepeat: true, priority: 'high' },
      { title: '早餐7:00-8:00', isRepeat: true, priority: 'medium' }
    ],
    30: [
      { title: '22:00按时上床', isRepeat: true, priority: 'high' },
      { title: '每天按时吃三餐', isRepeat: true, priority: 'medium' },
      { title: '完成助眠活动，喝牛奶或看书', isRepeat: true, priority: 'medium' },
      { title: '完成今日的累积7小时睡眠', isRepeat: true, priority: 'medium' }
    ]
  }
});

// 当前选中天数的任务
const currentDayTasks = computed(() => {
  return templateData.value.tasksByDay[currentDay.value] || [];
});

// 切换天数
function switchDay(day) {
  currentDay.value = day;
}

// 显示里程碑详情
function showMilestoneDetail(milestone, index) {
  currentMilestone.value = {
    ...milestone,
    index
  };
  showMilestoneModal.value = true;
}

// 关闭里程碑详情
function closeMilestoneDetail() {
  showMilestoneModal.value = false;
}

// 添加规划
function addGoal() {
  console.log('[TemplateDetail] 添加规划到个人计划');
  // 跳转到新规划页面
  uni.navigateTo({
    url: '/pages/planning/plan/create'
  });
}

// 返回
function goBack() {
  uni.navigateBack();
}

// 页面加载
onMounted(() => {
  // 可以根据路由参数加载不同的模板数据
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};

  if (options.id) {
    console.log('[TemplateDetail] 加载模板ID:', options.id);
    // TODO: 从API加载模板数据
  }
});
</script>

<style scoped>
.detail-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

/* ============================================================
   头部背景区域
   ============================================================ */
.header-section {
  position: relative;
  width: 100%;
  min-height: 1000rpx; /* 改为最小高度,确保内容完整显示 */
  background-size: cover;
  background-position: center;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 半透明遮罩 */
.header-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
  z-index: 0;
}

.back-btn {
  position: relative;
  z-index: 1;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-icon {
  font-size: 48rpx;
  color: #fff;
  filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
}

/* ============================================================
   头部内容
   ============================================================ */
.header-content {
  position: relative;
  z-index: 1;
  margin-top: 100rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.goal-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
}

.tag-list {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.tag-item {
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
}

.tag-text {
  font-size: 24rpx;
  color: #fff;
}

/* 用户信息 */
.users-info {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-top: 10rpx;
}

.user-avatars {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 3rpx solid #fff;
  margin-left: -15rpx;
}

.user-avatar:first-child {
  margin-left: 0;
}

.more-users {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: 3rpx solid #fff;
  margin-left: -15rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-text {
  font-size: 24rpx;
  color: #fff;
}

.users-count {
  font-size: 28rpx;
  color: #fff;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

/* ============================================================
   里程碑展示 - 横向滚动
   ============================================================ */
.milestones-section {
  position: relative;
  z-index: 1;
  margin-top: 60rpx;
  padding-bottom: 40rpx;
}

/* 横向滚动容器 */
.milestones-scroll {
  width: 100%;
  white-space: nowrap;
}

/* 里程碑内容包装器 */
.milestones-wrapper {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-end;
  padding: 0 30rpx;
  gap: 0;
}

/* 单个里程碑项 */
.milestone-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

/* 里程碑卡片 */
.milestone-card {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s;
  width: 220rpx;
  box-sizing: border-box;
  margin-bottom: 10rpx;
}

.milestone-card:active {
  transform: scale(0.98);
}

/* 里程碑图标 */
.milestone-flag {
  font-size: 32rpx;
  flex-shrink: 0;
}

/* 里程碑信息容器 */
.milestone-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}

/* 里程碑编号 */
.milestone-num {
  font-size: 22rpx;
  color: #666;
  font-weight: 600;
  white-space: nowrap;
}

/* 里程碑标题 */
.milestone-title {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 箭头 */
.milestone-arrow {
  font-size: 32rpx;
  color: #999;
  flex-shrink: 0;
}

/* 连接线容器 - 竖向 */
.milestone-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 80rpx;
}

/* 圆点 */
.milestone-dot {
  width: 20rpx;
  height: 20rpx;
  background-color: #FF6B6B;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  margin-bottom: 8rpx;
  flex-shrink: 0;
}

/* 连接线 - 横向 */
.milestone-line {
  width: 200rpx;
  height: 4rpx;
  background: linear-gradient(90deg, #FF6B6B 0%, #999 100%);
  flex-shrink: 0;
}

/* ============================================================
   计划模板区域
   ============================================================ */
.plan-section {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  margin-top: -40rpx;
  padding: 40rpx 30rpx;
  position: relative;
  z-index: 2;
  box-sizing: border-box;
}

.plan-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 30rpx;
}

/* Day标签滚动容器 */
.day-tabs-scroll {
  width: 100%;
  margin-bottom: 30rpx;
  white-space: nowrap;
}

/* Day标签内容 */
.day-tabs {
  display: inline-flex; /* 改为inline-flex以支持横向滚动 */
  flex-direction: row;
  gap: 20rpx;
  white-space: nowrap;
}

.day-tab {
  flex-shrink: 0;
  width: 120rpx;
  height: 120rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #fff;
}

.day-tab.active {
  border: 4rpx solid #333; /* 选中状态边框加粗 */
  background-color: #fff;
}

.day-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.day-tab.active .day-label {
  color: #333;
  font-weight: 600;
}

.day-num {
  font-size: 40rpx;
  color: #333;
  font-weight: 600;
}

.day-tab.active .day-num {
  color: #333;
}

.day-tab.active::after {
  content: '▼';
  font-size: 20rpx;
  color: #333;
  margin-top: 8rpx;
}

/* ============================================================
   任务列表
   ============================================================ */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.task-item {
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 30rpx;
  position: relative;
  box-sizing: border-box;
  width: 100%; /* 确保占满容器宽度 */
}

.task-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8rpx;
  background-color: #5B8CFF; /* 默认蓝色-普通优先级 */
  border-radius: 16rpx 0 0 16rpx;
}

/* 高优先级-红色 */
.task-item.priority-high::before {
  background-color: #FF6B6B;
}

/* 中优先级-蓝色 */
.task-item.priority-medium::before {
  background-color: #5B8CFF;
}

/* 低优先级-灰色 */
.task-item.priority-low::before {
  background-color: #999;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding-left: 20rpx;
}

.task-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.task-repeat {
  font-size: 24rpx;
  color: #999;
}

/* ============================================================
   底部按钮
   ============================================================ */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-btn {
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

.action-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}

/* ============================================================
   里程碑详情弹窗
   ============================================================ */
.milestone-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 60rpx;
}

.milestone-modal-content {
  background-color: rgba(60, 60, 60, 0.95);
  backdrop-filter: blur(10rpx);
  border-radius: 16rpx;
  padding: 40rpx;
  max-width: 600rpx;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.milestone-modal-title {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.milestone-modal-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.milestone-modal-days {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
}
</style>
