<template>
  <view class="subtask-list-wrap">
    <!-- 左侧竖线（可选） -->
    <view v-if="showLine" class="subtask-line"></view>

    <view class="subtask-body">
      <!-- 添加子计划输入框 -->
      <view class="subtask-add-row">
        <input
          class="subtask-add-input"
          :placeholder="subtasks.length > 0 ? '继续添加下一条子计划' : (placeholder || '添加子计划')"
          placeholder-class="subtask-placeholder"
          :value="inputText"
          @input="inputText = $event.detail.value"
          @confirm="handleAdd"
        />
        <view class="subtask-add-btn" @tap="handleAdd">
          <text class="subtask-add-icon">+</text>
        </view>
      </view>

      <!-- 已有子计划列表 -->
      <view
        v-for="(sub, idx) in subtasks"
        :key="idx"
        class="subtask-row"
      >
        <view
          class="subtask-check"
          :class="{ 'subtask-check-done': sub.done }"
          @tap="handleToggleDone(idx)"
        >
          <text v-if="sub.done" class="check-mark">✓</text>
        </view>
        <text
          class="subtask-text"
          :class="{ 'subtask-text-done': sub.done }"
        >{{ sub.title }}</text>
        <view class="subtask-del" @tap="handleRemove(idx)">
          <text class="subtask-del-icon">⊖</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * SubtaskList 组件
 *
 * 用途：子计划列表管理（添加、删除、完成/未完成切换）
 *
 * @component SubtaskList
 * @example
 * <SubtaskList
 *   :subtasks="subtasks"
 *   :showLine="true"
 *   placeholder="添加子计划"
 *   @add="handleAddSubtask"
 *   @remove="handleRemoveSubtask"
 *   @toggle-done="handleToggleSubtaskDone"
 * />
 */

import { ref } from 'vue'

// Props 定义
const props = defineProps({
  /**
   * 子计划列表数据
   * @type {Array<{ title: string, done: boolean }>}
   * @default []
   */
  subtasks: {
    type: Array,
    default: () => []
  },

  /**
   * 输入框占位符文本
   * @type {String}
   * @default '添加子计划'
   */
  placeholder: {
    type: String,
    default: '添加子计划'
  },

  /**
   * 是否显示左侧竖线
   * @type {Boolean}
   * @default true
   */
  showLine: {
    type: Boolean,
    default: true
  }
})

// Emits 定义
const emit = defineEmits([
  /**
   * 当用户添加新子计划时触发
   * @param {string} title - 子计划标题
   */
  'add',

  /**
   * 当用户删除子计划时触发
   * @param {number} index - 子计划索引
   */
  'remove',

  /**
   * 当用户切换子计划完成状态时触发
   * @param {number} index - 子计划索引
   */
  'toggle-done'
])

// 响应式数据
const inputText = ref('')

/**
 * 处理添加子计划事件
 */
function handleAdd() {
  const title = inputText.value.trim()
  if (!title) {
    uni.showToast({
      title: '请输入子计划内容',
      icon: 'none',
      duration: 1500
    })
    return
  }

  emit('add', title)

  // 清空输入框
  inputText.value = ''
}

/**
 * 处理删除子计划事件
 * @param {number} index - 子计划索引
 */
function handleRemove(index) {
  emit('remove', index)
}

/**
 * 处理切换子计划完成状态事件
 * @param {number} index - 子计划索引
 */
function handleToggleDone(index) {
  emit('toggle-done', index)
}
</script>

<style scoped>
/* 子计划区域包裹容器 */
.subtask-list-wrap {
  display: flex;
  flex-direction: row;
  padding-left: 60rpx;
}

/* 左侧竖线 */
.subtask-line {
  width: 4rpx;
  background-color: #E8E8E8;
  border-radius: 4rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
  min-height: 60rpx;
}

/* 子计划内容区 */
.subtask-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 添加子计划输入行 */
.subtask-add-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8rpx 0 12rpx;
}

/* 添加子计划输入框 */
.subtask-add-input {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

/* 输入框占位符样式 */
.subtask-placeholder {
  color: #CCCCCC;
  font-size: 26rpx;
}

/* 添加按钮 */
.subtask-add-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 2rpx solid #DDDDDD;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 添加按钮图标 */
.subtask-add-icon {
  font-size: 32rpx;
  color: #999999;
  font-weight: bold;
}

/* 已有子计划行 */
.subtask-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12rpx 0;
  border-top: 1rpx solid #F5F5F5;
}

/* 子计划勾选框 */
.subtask-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 16rpx;
}

/* 已完成勾选框样式 */
.subtask-check-done {
  background-color: #CCCCCC;
  border-color: #CCCCCC;
}

/* 勾选框内的对勾 */
.check-mark {
  font-size: 20rpx;
  color: #FFFFFF;
}

/* 子计划文字 */
.subtask-text {
  flex: 1;
  font-size: 28rpx;
  font-weight: bold;
  color: #222;
}

/* 已完成的子计划文字（删除线） */
.subtask-text-done {
  text-decoration: line-through;
  color: #BBBBBB;
  font-weight: normal;
}

/* 删除按钮 */
.subtask-del {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 删除按钮图标 */
.subtask-del-icon {
  font-size: 32rpx;
  color: #CCCCCC;
}
</style>
