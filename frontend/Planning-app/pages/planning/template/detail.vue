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
 * 模板详情页（重构版 - Stage 3）
 * 职责：协调各子组件展示模板详情（仅UI协调）
 *
 * SRP重构成果：
 * - Stage 1（UI拆分）：912行 → 289行（-68%），11个职责 → 1个职责
 * - Stage 2（提取Composable）：业务逻辑移到 useTemplateDetail.js
 * - Stage 3（数据访问层）：移除硬编码数据，使用 Store + Repository
 * - 子组件：6个（TemplateHeader、UserPersistInfo、MilestoneList、DayTabBar、TaskList、MilestoneDialog）
 * - Composable：1个（useTemplateDetail.js - 业务流程层）
 * - Store：1个（template.js - 状态管理层）
 * - Repository：1个（TemplateRepository.js - 数据访问层）
 *
 * 四层架构完整实现：
 * Component（detail.vue）→ Composable（useTemplateDetail.js）→ Store（template.js）→ Repository（TemplateRepository.js）
 */
import { computed, onMounted } from 'vue'
import TemplateHeader from '@/components/planning/template/TemplateHeader.vue'
import UserPersistInfo from '@/components/planning/template/UserPersistInfo.vue'
import MilestoneList from '@/components/planning/template/MilestoneList.vue'
import DayTabBar from '@/components/planning/template/DayTabBar.vue'
import TaskList from '@/components/planning/template/TaskList.vue'
import MilestoneDialog from '@/components/planning/template/MilestoneDialog.vue'
import { useTemplateDetail } from '@/composables/useTemplateDetail'
import { useTemplateStore } from '@/store/template'

// ============================================================
// Store（状态管理层）
// ============================================================

/**
 * 使用模板 Store
 * 提供：currentTemplate（当前模板数据）、loadTemplateById（加载方法）
 */
const templateStore = useTemplateStore()

/**
 * 当前模板数据（从 Store 获取，响应式）
 */
const templateData = computed(() => {
  return templateStore.currentTemplate || {
    id: '',
    title: '',
    coverImage: '',
    tags: [],
    users: 0,
    userAvatars: [],
    buff: '',
    duration: 0,
    milestones: [],
    days: [],
    tasksByDay: {}
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
 * 从 Store 加载模板数据（四层架构完整实现）
 */
onMounted(async () => {
  const templateId = loadTemplateIdFromUrl()

  if (templateId) {
    // 从 Store 加载模板数据
    // Store → Repository → localStorage → memoryCache
    const template = await templateStore.loadTemplateById(templateId)

    if (!template) {
      uni.showToast({
        title: '模板不存在',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } else {
    // 加载默认模板
    await templateStore.loadTemplateById('tpl_1')
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
