<template>
  <!-- #ifdef APP-PLUS -->
  <!-- 🔍 调试面板 -->
  <view class="keyboard-debug-panel">
    <!-- 核心数据（紧凑布局） -->
    <view class="debug-row">
      <text class="debug-label">⌨️</text>
      <text class="debug-value" :class="{ 'value-active': keyboardHeight > 0 }">
        {{ keyboardHeight }}px
      </text>
      <text class="debug-status" :class="keyboardHeight > 0 ? 'status-on' : 'status-off'">
        {{ keyboardHeight > 0 ? '🟢' : '🔴' }}
      </text>
    </view>

    <!-- Bottom 定位值 -->
    <view class="debug-row">
      <text class="debug-label">🔧</text>
      <text class="debug-code">bottom: {{ keyboardHeight }}px</text>
    </view>

    <!-- 最近一次事件 -->
    <view class="debug-row" v-if="eventLogs.length > 0">
      <text class="debug-label">📝</text>
      <text class="debug-log-item">{{ eventLogs[eventLogs.length - 1] }}</text>
    </view>
  </view>

  <!-- 🔍 键盘位置指示器（绿色虚线，仅键盘弹起时显示） -->
  <view
    v-if="keyboardHeight > 0"
    class="keyboard-position-indicator"
    :style="{ bottom: keyboardHeight + 'px' }"
  >
    <view class="indicator-label">
      ⬆️ 系统键盘顶部（{{ keyboardHeight }}px）
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup>
import { ref, watch } from 'vue'
import { useKeyboardHeight } from '@/composables/useKeyboardHeight.js'

const { keyboardHeight } = useKeyboardHeight()

// 事件日志（只保留最近3条）
const eventLogs = ref([])

// 监听键盘高度变化，记录日志
watch(keyboardHeight, (newVal, oldVal) => {
  const timestamp = new Date().toLocaleTimeString()
  const log = `${oldVal}→${newVal}px`
  eventLogs.value.push(log)

  // 只保留最近 3 条日志
  if (eventLogs.value.length > 3) {
    eventLogs.value.shift()
  }
})
</script>

<style scoped>
/* #ifdef APP-PLUS */
/* 🎯 紧凑调试面板 - 左上角小窗口 */
.keyboard-debug-panel {
  position: fixed;
  top: 20rpx;
  left: 20rpx;
  width: 280rpx; /* 固定宽度，不占满屏幕 */
  background: rgba(26, 26, 46, 0.95);
  color: #FFFFFF;
  padding: 12rpx;
  border-radius: 12rpx;
  z-index: 2147483647; /* CSS 最大 z-index */
  font-size: 20rpx;
  line-height: 1.4;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.6),
              0 0 0 3rpx rgba(255, 215, 0, 0.8); /* 金色外边框（更细） */
  pointer-events: auto;
}

/* 行布局（紧凑） */
.debug-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin: 6rpx 0;
}

.debug-label {
  font-size: 24rpx;
  flex-shrink: 0;
}

.debug-value {
  background: rgba(255, 255, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: bold;
  color: #00FF00;
  font-size: 22rpx;
  font-family: 'Courier New', monospace;
  border: 1rpx solid rgba(0, 255, 0, 0.3);
}

.debug-value.value-active {
  background: rgba(0, 255, 0, 0.2);
  border-color: #00FF00;
  animation: pulse 1s infinite;
}

.debug-status {
  font-size: 20rpx;
  flex-shrink: 0;
}

/* Transform 代码块（紧凑） */
.debug-code {
  background: rgba(0, 0, 0, 0.4);
  padding: 6rpx 10rpx;
  border-radius: 6rpx;
  font-family: 'Courier New', monospace;
  color: #00FF00;
  font-size: 18rpx;
  border: 1rpx solid rgba(0, 255, 0, 0.2);
  word-break: break-all;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 日志（紧凑） */
.debug-log-item {
  font-size: 18rpx;
  color: #87CEEB;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* ============================================================
   🔍 键盘位置指示器（绿色虚线 + 标签）
   ============================================================ */
.keyboard-position-indicator {
  position: fixed;
  left: 0;
  right: 0;
  height: 0;
  border-top: 6rpx dashed #00FF00; /* 绿色虚线，标识键盘顶部 */
  z-index: 2147483646; /* 比调试面板低一层 */
  pointer-events: none; /* 不拦截点击事件 */
}

.indicator-label {
  position: absolute;
  right: 20rpx;
  top: -40rpx;
  background: rgba(0, 255, 0, 0.95);
  color: #000000;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 4rpx 12rpx rgba(0, 255, 0, 0.4);
}
/* #endif */
</style>
