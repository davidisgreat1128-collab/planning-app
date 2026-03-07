<template>
  <view class="date-tab-bar">
    <view
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === 'today' }"
      @tap="onTabChange('today')"
    >
      <text class="date-tab-text">今天</text>
      <view v-if="activeTab === 'today'" class="date-tab-line"></view>
    </view>
    <view
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === 'tomorrow' }"
      @tap="onTabChange('tomorrow')"
    >
      <text class="date-tab-text">明天</text>
      <view v-if="activeTab === 'tomorrow'" class="date-tab-line"></view>
    </view>
    <view
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === 'other' }"
      @tap="onTabChange('other')"
    >
      <text class="date-tab-text">其他日期</text>
      <view v-if="activeTab === 'other'" class="date-tab-line"></view>
    </view>
    <view
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === 'inbox' }"
      @tap="onTabChange('inbox')"
    >
      <text class="date-tab-text">收集箱</text>
      <view v-if="activeTab === 'inbox'" class="date-tab-line"></view>
    </view>
  </view>
</template>

<script setup>
/**
 * DateTabBar 组件
 *
 * 用途：任务日期选择 Tab 栏（今天/明天/其他日期/收集箱）
 *
 * @component DateTabBar
 * @example
 * <DateTabBar
 *   :activeTab="activeDateTab"
 *   @tab-change="handleTabChange"
 * />
 */

// Props 定义
const props = defineProps({
  /**
   * 当前激活的 Tab
   * @type {'today' | 'tomorrow' | 'other' | 'inbox'}
   * @default 'today'
   */
  activeTab: {
    type: String,
    default: 'today',
    validator: (value) => ['today', 'tomorrow', 'other', 'inbox'].includes(value)
  }
})

// Emits 定义
const emit = defineEmits([
  /**
   * 当用户点击 Tab 时触发
   * @param {'today' | 'tomorrow' | 'other' | 'inbox'} tab - 选中的 Tab 标识
   */
  'tab-change'
])

/**
 * 处理 Tab 切换事件
 * @param {'today' | 'tomorrow' | 'other' | 'inbox'} tab - 选中的 Tab 标识
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
