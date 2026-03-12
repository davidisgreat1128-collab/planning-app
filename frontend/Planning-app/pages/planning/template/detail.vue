<template>
  <view class="detail-page">
    <!-- 模板头部（封面、标题、标签） -->
    <view class="header-wrapper">
      <TemplateHeader
        :coverImage="templateData.coverImage"
        :title="templateData.title"
        :tags="templateData.tags"
        @back="goBack"
      />
      
      <!-- 用户坚持信息（叠加在头部底部） -->
      <view class="persist-info-wrapper">
        <UserPersistInfo
          :userAvatars="templateData.userAvatars"
          :userCount="templateData.users"
        />
      </view>
    </view>

    <!-- 里程碑列表 -->
    <MilestoneList
      :milestones="templateData.milestones"
      @select="handleMilestoneSelect"
    />

    <!-- Day标签栏和任务列表 -->
    <view class="plan-section">
      <DayTabBar
        :days="templateData.days"
        :currentDay="currentDay"
        @switch="switchDay"
      />

      <TaskList :tasks="currentDayTasks" />
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-action">
      <view class="action-btn" @tap="handleAddGoal">
        <text class="btn-text">+ 添加规划</text>
      </view>
    </view>

    <!-- 里程碑详情弹窗 -->
    <MilestoneDialog
      :visible="showMilestoneModal"
      :milestone="currentMilestone"
      :milestoneIndex="currentMilestone.index"
      @close="closeMilestoneDetail"
    />
  </view>
</template>

<script setup>
/**
 * 模板详情页（重构版 - Stage 2）
 * 职责：协调各子组件展示模板详情（仅UI协调）
 *
 * SRP重构成果：
 * - Stage 1（UI拆分）：912行 → 289行（-68%），11个职责 → 1个职责
 * - Stage 2（提取Composable）：业务逻辑移到 useTemplateDetail.js
 * - 子组件：6个（TemplateHeader、UserPersistInfo、MilestoneList、DayTabBar、TaskList、MilestoneDialog）
 * - Composable：1个（useTemplateDetail.js - 业务流程层）
 */
import { ref, onMounted } from 'vue'
import TemplateHeader from '@/components/planning/template/TemplateHeader.vue'
import UserPersistInfo from '@/components/planning/template/UserPersistInfo.vue'
import MilestoneList from '@/components/planning/template/MilestoneList.vue'
import DayTabBar from '@/components/planning/template/DayTabBar.vue'
import TaskList from '@/components/planning/template/TaskList.vue'
import MilestoneDialog from '@/components/planning/template/MilestoneDialog.vue'
import { useTemplateDetail } from '@/composables/useTemplateDetail'

// ============================================================
// 模板数据（临时硬编码，Stage 3 将移到 TemplateRepository）
// ============================================================

/** 模板数据（临时硬编码，Stage 3将移到TemplateRepository） */
const templateData = ref({
  id: 'tpl_1',
  title: '一个科学的攒钱模式',
  coverImage: '/static/images/template-money.jpg',
  tags: ['培养理财能力', '财务管理'],
  users: 8141,
  userAvatars: [
    '/static/images/avatar1.png',
    '/static/images/avatar2.png',
    '/static/images/avatar3.png'
  ],
  buff: '财富自由，从今天开始',
  duration: 30,
  milestones: [
    {
      title: '建立理财意识',
      description: '认识到理财的重要性，了解复利的力量。',
      days: '第7天'
    },
    {
      title: '制定储蓄计划',
      description: '根据收入和支出，制定合理的储蓄目标和计划。',
      days: '第15天'
    },
    {
      title: '养成记账习惯',
      description: '坚持每日记账，了解自己的消费习惯和资金流向。',
      days: '第30天'
    }
  ],
  days: Array.from({ length: 30 }, (_, i) => i + 1),
  tasksByDay: {
    1: [
      { title: '记录今日收支情况', isRepeat: true, priority: 'high' },
      { title: '设定月度储蓄目标', isRepeat: false, priority: 'high' }
    ],
    2: [
      { title: '记录今日收支情况', isRepeat: true, priority: 'high' },
      { title: '分析昨日消费习惯', isRepeat: false, priority: 'medium' }
    ],
    3: [
      { title: '记录今日收支情况', isRepeat: true, priority: 'high' },
      { title: '制定每周储蓄计划', isRepeat: false, priority: 'medium' }
    ]
  }
})

// ============================================================
// 使用 Composable（业务流程层）
// ============================================================

/**
 * 使用模板详情业务逻辑
 * 提供：状态、计算属性、业务方法
 */
const {
  // 状态
  currentDay,
  showMilestoneModal,
  currentMilestone,
  // 计算属性
  currentDayTasks,
  // 方法
  switchDay,
  handleMilestoneSelect,
  closeMilestoneDetail,
  addGoal,
  goBack,
  loadTemplateIdFromUrl
} = useTemplateDetail(templateData)

// ============================================================
// UI 事件处理（仅UI相关逻辑，业务逻辑在 Composable）
// ============================================================

/**
 * 处理添加规划按钮点击
 */
function handleAddGoal() {
  addGoal(templateData.value.id)
}

// ============================================================
// 生命周期
// ============================================================

/**
 * 页面加载时初始化数据
 * Stage 3 TODO: 从 TemplateRepository 加载数据
 */
onMounted(() => {
  const templateId = loadTemplateIdFromUrl()

  if (templateId) {
    console.log('[TemplateDetail] 加载模板ID:', templateId)
    // Stage 3 TODO: const template = await TemplateRepository.getById(templateId)
    // templateData.value = template
  } else {
    console.log('[TemplateDetail] 未指定模板ID，使用默认硬编码模板')
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 160rpx; /* 为底部按钮留空间 */
}

/* ============================================================
   头部区域包装器
   ============================================================ */
.header-wrapper {
  position: relative;
}

.persist-info-wrapper {
  position: absolute;
  bottom: 30rpx;
  left: 30rpx;
  right: 30rpx;
  z-index: 20;
}

/* ============================================================
   计划区域
   ============================================================ */
.plan-section {
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  margin-top: -20rpx;
  padding: 0 0 30rpx;
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
</style>
