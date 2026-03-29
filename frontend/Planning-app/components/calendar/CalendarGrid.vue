<template>
  <!-- 外层容器：高度插值 + overflow:hidden 裁剪 -->
  <view
    class="calendar-grid"
    :style="gridStyle"
  >
    <!-- 内层网格：固定6行，不随动画变化，避免 gridTemplateRows 逐帧 reflow -->
    <view :style="innerGridStyle">
      <calendar-cell
        v-for="(cell, index) in view.days"
        :key="`${view.id}-${index}`"
        :cell="cell"
        @click="handleCellClick"
      />
    </view>
  </view>
</template>

<script setup>
/**
 * 日历网格组件
 *
 * 职责：
 * - 渲染日期网格（7×1 或 7×6）
 * - 动态调整高度（周/月切换动画）
 * - 分发单元格点击事件
 *
 * 动画设计（参考 CalendarView-3.7.0）：
 * - 内层网格固定6行，gridTemplateRows 不参与动画，避免 layout reflow
 * - 外层容器高度插值（1行↔6行），overflow:hidden 裁剪多余行
 * - 每帧只改一个数值（height），GPU 友好
 *
 * 架构层级：Component 层
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { computed } from 'vue'
import CalendarCell from './CalendarCell.vue'
import { GRID_CONFIG } from '@/utils/calendarConstants'

// 模块级缓存，只调用一次
const _screenWidth = uni.getSystemInfoSync().windowWidth
const _cellHeight = _screenWidth / GRID_CONFIG.WEEK_DAYS
const _fullHeight = _cellHeight * GRID_CONFIG.MONTH_ROWS

// ============================================================
// Props
// ============================================================

const props = defineProps({
  /**
   * 视图数据
   */
  view: {
    type: Object,
    required: true
  },

  /**
   * 过渡进度（0=week, 1=month）
   */
  transitionProgress: {
    type: Number,
    default: 1
  }
})

// ============================================================
// Emits
// ============================================================

const emit = defineEmits(['select'])

// ============================================================
// 计算属性
// ============================================================

/**
 * 外层容器样式（逐帧变化，只改 height 一个属性）
 */
const gridStyle = computed(() => {
  const visibleHeight = _cellHeight + (_fullHeight - _cellHeight) * props.transitionProgress
  return {
    width: `${_screenWidth}px`,
    height: `${visibleHeight}px`,
    overflow: 'hidden',
    flexShrink: 0
  }
})

/**
 * 内层网格样式（固定不变，不参与动画）
 */
const innerGridStyle = {
  width: `${_screenWidth}px`,
  height: `${_fullHeight}px`,
  display: 'grid',
  gridTemplateColumns: `repeat(${GRID_CONFIG.WEEK_DAYS}, 1fr)`,
  gridTemplateRows: `repeat(${GRID_CONFIG.MONTH_ROWS}, 1fr)`
}

// ============================================================
// 事件处理
// ============================================================

/**
 * 处理单元格点击
 *
 * @param {Date} date - 点击的日期
 */
function handleCellClick(date) {
  emit('select', date)
}
</script>

<style scoped lang="scss">
.calendar-grid {
  background-color: #FFFFFF;
}
</style>
