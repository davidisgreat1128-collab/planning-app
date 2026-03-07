<template>
  <view class="date-tab-bar">
    <!-- Tab 1: 今天 -->
    <view
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === 'today' }"
      @tap="onTabChange('today')"
    >
      <text class="date-tab-text">今天</text>
      <view v-if="activeTab === 'today'" class="date-tab-line"></view>
    </view>

    <!-- Tab 2: 明天 -->
    <view
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === 'tomorrow' }"
      @tap="onTabChange('tomorrow')"
    >
      <text class="date-tab-text">明天</text>
      <view v-if="activeTab === 'tomorrow'" class="date-tab-line"></view>
    </view>

    <!-- Tab 3: 动态标签（显示选中的日期或"XX日期"占位符） -->
    <view
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === 'custom' || activeTab === 'preset' }"
      @tap="onTabChange(dynamicTabKey)"
    >
      <text class="date-tab-text">{{ dynamicTabLabel }}</text>
      <view v-if="activeTab === 'custom' || activeTab === 'preset'" class="date-tab-line"></view>
    </view>

    <!-- Tab 4: 其他日期（点击后打开日期选择器） -->
    <view
      class="date-tab"
      @tap="onTabChange('other')"
    >
      <text class="date-tab-text">其他日期</text>
    </view>
  </view>
</template>

<script setup>
/**
 * DateTabBar 组件 - 动态日期Tab栏
 *
 * 用途：任务日期选择 Tab 栏（今天/明天/动态日期/其他日期）
 * 特性：第3个Tab会根据 customDate 或 presetDate 动态显示日期（如"3.7"）
 *
 * @component DateTabBar
 * @example
 * <DateTabBar
 *   :activeTab="activeDateTab"
 *   :customDate="customDate"
 *   :presetDate="presetDate"
 *   @tab-change="handleTabChange"
 * />
 */

import { computed } from 'vue'

// Props 定义
const props = defineProps({
  /**
   * 当前激活的 Tab
   * @type {'today' | 'tomorrow' | 'custom' | 'preset' | 'other'}
   * @default 'today'
   */
  activeTab: {
    type: String,
    default: 'today',
    validator: (value) => ['today', 'tomorrow', 'custom', 'preset', 'other'].includes(value)
  },

  /**
   * 用户自定义选择的日期（YYYY-MM-DD 格式）
   * 当有值时，第3个Tab显示为"M.D"格式（如"3.7"）
   * @type {String}
   * @default ''
   */
  customDate: {
    type: String,
    default: ''
  },

  /**
   * 预设日期（YYYY-MM-DD 格式）
   * 当 customDate 为空但 presetDate 有值时，第3个Tab显示为"M.D"格式
   * @type {String}
   * @default ''
   */
  presetDate: {
    type: String,
    default: ''
  }
})

// Emits 定义
const emit = defineEmits([
  /**
   * 当用户点击 Tab 时触发
   * @param {'today' | 'tomorrow' | 'custom' | 'preset' | 'placeholder' | 'other'} tab - 选中的 Tab 标识
   */
  'tab-change'
])

/**
 * 动态Tab的键值
 * 优先级：customDate > presetDate > placeholder
 */
const dynamicTabKey = computed(() => {
  if (props.customDate) return 'custom'
  if (props.presetDate) return 'preset'
  return 'placeholder'
})

/**
 * 动态Tab的显示文字
 * 优先级：customDate > presetDate > "XX日期"
 */
const dynamicTabLabel = computed(() => {
  if (props.customDate) {
    const d = new Date(props.customDate)
    return `${d.getMonth() + 1}.${d.getDate()}`
  }
  if (props.presetDate) {
    const d = new Date(props.presetDate)
    return `${d.getMonth() + 1}.${d.getDate()}`
  }
  return 'XX日期'
})

/**
 * 处理 Tab 切换事件
 * @param {'today' | 'tomorrow' | 'custom' | 'preset' | 'placeholder' | 'other'} tab - 选中的 Tab 标识
 */
function onTabChange(tab) {
  if (tab === props.activeTab) {
    // 如果点击的是当前已激活的 Tab，不触发事件
    return
  }
  emit('tab-change', tab)
}
</script>

<style scoped>
/* 日期 Tab 栏容器 */
.date-tab-bar {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #F0F0F0;
}

/* 单个 Tab 项 */
.date-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0 0;
  position: relative;
}

/* Tab 文字 */
.date-tab-text {
  font-size: 26rpx;
  color: #999;
  padding-bottom: 16rpx;
}

/* 激活状态的文字 */
.date-tab-active .date-tab-text {
  color: #1A1A2E;
  font-weight: bold;
}

/* 激活状态的下划线 */
.date-tab-line {
  position: absolute;
  bottom: 0;
  left: 20%;
  width: 60%;
  height: 4rpx;
  background-color: #1A1A2E;
  border-radius: 4rpx;
}
</style>
