<template>
  <!-- 遮罩层（点击关闭模态框） -->
  <view v-if="visible" class="modal-mask" @tap.self="handleClose">
    <!-- 模态框卡片 -->
    <view class="modal-card">
      <!-- 主任务标题区 -->
      <view class="main-task-header">
        <view class="main-task-checkbox" @tap="handleMainTaskToggle">
          <view class="checkbox-circle" :class="{ checked: isMainTaskDone }" :style="{ borderColor: checkboxColor }">
            <text v-if="isMainTaskDone" class="check-icon">✓</text>
          </view>
        </view>
        <text class="main-task-title" :class="{ done: isMainTaskDone }">{{ task?.title || '' }}</text>
        <!-- 重复任务标识（仅重复任务显示） -->
        <view v-if="task?.isRecurring" class="recurring-badge">
          <text class="recurring-icon">🔁</text>
          <text class="recurring-text">重复</text>
        </view>
      </view>

      <!-- 分隔线 -->
      <view class="divider"></view>

      <!-- 子任务列表 -->
      <view class="subtask-list">
        <view
          v-for="(subtask, index) in subtaskList"
          :key="index"
          class="subtask-item"
          @tap="handleSubtaskToggle(index)"
        >
          <view class="subtask-checkbox">
            <view class="checkbox-circle" :class="{ checked: subtask.isDone }" :style="{ borderColor: checkboxColor }">
              <text v-if="subtask.isDone" class="check-icon">✓</text>
            </view>
          </view>
          <text class="subtask-title" :class="{ done: subtask.isDone }">{{ subtask.title }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

// ============================================================
// Props
// ============================================================
const props = defineProps({
  /** 是否显示模态框 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 任务对象 */
  task: {
    type: Object,
    default: null
  }
})

// ============================================================
// Emits
// ============================================================
const emit = defineEmits(['update:visible', 'main-task-toggle', 'subtask-toggle'])

// ============================================================
// 计算属性
// ============================================================

/** 子任务列表 */
const subtaskList = computed(() => props.task?.subtasks || [])

/** 主任务是否完成 */
const isMainTaskDone = computed(() => props.task?.status === 'completed')

/**
 * 复选框颜色（根据任务象限）
 * 获取任务所属象限的颜色，用于复选框边框和填充色
 */
const checkboxColor = computed(() => {
  if (!props.task) return '#5B8CFF'

  const { isUrgent, isImportant } = props.task

  // 根据四象限分类返回对应颜色
  if (isUrgent && isImportant) return '#FF4444'      // Q1: 重要且紧急 - 红色
  if (!isUrgent && isImportant) return '#5B8CFF'     // Q2: 重要不紧急 - 蓝色
  if (isUrgent && !isImportant) return '#FFA726'     // Q3: 紧急不重要 - 橙色
  return '#4CAF50'                                    // Q4: 不急不重要 - 绿色
})

// ============================================================
// 方法
// ============================================================

/**
 * 处理关闭模态框
 * 点击遮罩层外部时触发
 */
function handleClose() {
  emit('update:visible', false)
}

/**
 * 处理主任务勾选
 * 向父组件发射事件，由父组件调用 Composable 处理双向联动逻辑
 */
function handleMainTaskToggle() {
  emit('main-task-toggle', props.task)
}

/**
 * 处理子任务勾选
 * @param {number} index - 子任务索引
 */
function handleSubtaskToggle(index) {
  emit('subtask-toggle', props.task, index)
}
</script>

<style scoped>
/* ============================================================
   遮罩层和模态框容器
   ============================================================ */

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.modal-card {
  width: 100%;
  max-width: 600rpx;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
  overflow-y: auto;
}

/* ============================================================
   主任务标题区
   ============================================================ */

.main-task-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.main-task-checkbox {
  margin-right: 16rpx;
  padding: 8rpx;
}

.checkbox-circle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox-circle.checked {
  border-width: 0;
}

.check-icon {
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: bold;
}

.main-task-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #1A1A1A;
  word-break: break-all;
  transition: all 0.2s ease;
}

.main-task-title.done {
  text-decoration: line-through;
  color: #999999;
}

.recurring-badge {
  display: flex;
  align-items: center;
  background: #FFF3E0;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.recurring-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.recurring-text {
  font-size: 24rpx;
  color: #FFA726;
  font-weight: 500;
}

/* ============================================================
   分隔线
   ============================================================ */

.divider {
  height: 2rpx;
  background: #E0E0E0;
  margin: 24rpx 0;
}

/* ============================================================
   子任务列表
   ============================================================ */

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.subtask-item {
  display: flex;
  align-items: center;
  padding: 20rpx 16rpx;
  background: #F5F6FA;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.subtask-item:active {
  background: #E8E9EF;
}

.subtask-checkbox {
  margin-right: 16rpx;
  padding: 4rpx;
}

.subtask-title {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  word-break: break-all;
  transition: all 0.2s ease;
}

.subtask-title.done {
  text-decoration: line-through;
  color: #999999;
}

/* ============================================================
   象限颜色变体（复选框填充色）
   ============================================================ */

/* Q1: 重要且紧急 - 红色 */
.checkbox-circle.checked[style*="#FF4444"] {
  background: #FF4444;
}

/* Q2: 重要不紧急 - 蓝色 */
.checkbox-circle.checked[style*="#5B8CFF"] {
  background: #5B8CFF;
}

/* Q3: 紧急不重要 - 橙色 */
.checkbox-circle.checked[style*="#FFA726"] {
  background: #FFA726;
}

/* Q4: 不急不重要 - 绿色 */
.checkbox-circle.checked[style*="#4CAF50"] {
  background: #4CAF50;
}
</style>
