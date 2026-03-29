<template>
  <view
    class="calendar-grid"
    :style="gridStyle"
  >
    <calendar-cell
      v-for="(cell, index) in view.days"
      :key="`${view.id}-${index}`"
      :cell="cell"
      @click="handleCellClick"
    />
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
 * 架构层级：Component 层
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { computed } from 'vue'
import CalendarCell from './CalendarCell.vue'
import { VIEW_MODE, GRID_CONFIG } from '@/utils/calendarConstants'

// 模块级缓存屏幕宽度，避免在每帧重复调用同步阻塞 API
const _screenWidth = uni.getSystemInfoSync().windowWidth

// ============================================================
// Props
// ============================================================

const props = defineProps({
  /**
   * 视图数据
   * @type {Object}
   * @property {string} id - 视图ID
   * @property {number} offset - 偏移量
   * @property {Array} days - 日期数组
   * @property {string} title - 标题
   */
  view: {
    type: Object,
    required: true
  },

  /**
   * 视图模式（'week' | 'month'）
   */
  viewMode: {
    type: String,
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
 * 动态网格样式（实现周/月平滑过渡）
 */
const gridStyle = computed(() => {
  const screenWidth = _screenWidth  // 使用模块级缓存，不再每帧调用同步 API
  const cellWidth = screenWidth / GRID_CONFIG.WEEK_DAYS // 单个单元格宽度

  // 高度插值：week(1行) → month(6行)
  const weekHeight = cellWidth // 1行高度
  const monthHeight = cellWidth * GRID_CONFIG.MONTH_ROWS // 6行高度
  const height = weekHeight + (monthHeight - weekHeight) * props.transitionProgress

  return {
    width: `${screenWidth}px`,
    height: `${height}px`,
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_CONFIG.WEEK_DAYS}, 1fr)`,
    gridTemplateRows: props.viewMode === VIEW_MODE.WEEK
      ? '1fr'
      : `repeat(${GRID_CONFIG.MONTH_ROWS}, 1fr)`,
    overflow: 'hidden', // 周视图时裁剪多余行
    flexShrink: 0
  }
})

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
  /* 高度由 JS gridStyle 逐帧驱动，不需要 CSS transition，避免双重动画干扰 */
  background-color: #FFFFFF;
}
</style>
