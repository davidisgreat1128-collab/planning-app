<template>
  <!-- 提醒选择器弹窗 -->
  <view v-if="visible" class="tep-modal-mask" @tap.self="handleCancel">
    <view class="tep-modal-sheet">
      <!-- 顶部按天/按周切换标签 -->
      <view class="reminder-tabs">
        <view
          class="reminder-tab"
          :class="{ 'reminder-tab-active': tempMode === 'day' }"
          @tap="tempMode = 'day'"
        >
          <text class="reminder-tab-text">按天提前</text>
        </view>
        <view
          class="reminder-tab"
          :class="{ 'reminder-tab-active': tempMode === 'week' }"
          @tap="tempMode = 'week'"
        >
          <text class="reminder-tab-text">按周提前</text>
        </view>
      </view>

      <!-- 三列滚轮选择器 -->
      <view class="reminder-wheels">
        <!-- 第一列：提前天数/周数 -->
        <scroll-view class="reminder-wheel" scroll-y :scroll-top="dayScrollTop" scroll-with-animation>
          <view class="reminder-wheel-padding"></view>
          <view
            v-for="item in dayItems"
            :key="item.value"
            class="reminder-wheel-item"
            :class="{ 'reminder-wheel-item-sel': tempDays === item.value }"
            @tap="tempDays = item.value"
          >
            <text class="reminder-wheel-item-text">{{ item.label }}</text>
          </view>
          <view class="reminder-wheel-padding"></view>
        </scroll-view>

        <!-- 第二列：小时 -->
        <scroll-view class="reminder-wheel reminder-wheel-num" scroll-y :scroll-top="hourScrollTop" scroll-with-animation>
          <view class="reminder-wheel-padding"></view>
          <view
            v-for="h in 24"
            :key="h - 1"
            class="reminder-wheel-item"
            :class="{ 'reminder-wheel-item-sel': tempHour === h - 1 }"
            @tap="tempHour = h - 1"
          >
            <text class="reminder-wheel-item-text">{{ String(h - 1).padStart(2, '0') }}</text>
          </view>
          <view class="reminder-wheel-padding"></view>
        </scroll-view>
        <text class="reminder-wheel-unit">时</text>

        <!-- 第三列：分钟 -->
        <scroll-view class="reminder-wheel reminder-wheel-num" scroll-y :scroll-top="minScrollTop" scroll-with-animation>
          <view class="reminder-wheel-padding"></view>
          <view
            v-for="m in 60"
            :key="m - 1"
            class="reminder-wheel-item"
            :class="{ 'reminder-wheel-item-sel': tempMin === m - 1 }"
            @tap="tempMin = m - 1"
          >
            <text class="reminder-wheel-item-text">{{ String(m - 1).padStart(2, '0') }}</text>
          </view>
          <view class="reminder-wheel-padding"></view>
        </scroll-view>
        <text class="reminder-wheel-unit">分</text>
      </view>

      <!-- 底部提示文字 -->
      <view class="reminder-hint-row">
        <view v-if="isInvalid" class="reminder-hint-invalid">
          <text class="reminder-hint-text">鸭~这个提醒时间无效哦</text>
        </view>
        <text v-else class="reminder-hint-valid">{{ hintText }}</text>
      </view>

      <!-- 底部按钮 -->
      <view class="tep-modal-btns">
        <text class="tep-modal-cancel" @tap="handleCancel">取消</text>
        <text class="tep-modal-confirm" @tap="handleConfirm">确定</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatDate } from '@/utils/date.js'

/**
 * 提醒选择器组件
 *
 * Props:
 * - visible: Boolean - 弹窗是否可见
 * - taskDate: String - 任务日期（用于计算绝对提醒时间）
 * - reminderData: Object - 提醒数据 { enabled, advanceMode, advanceDays, hour, min }
 *
 * Emits:
 * - update:visible - 更新弹窗状态
 * - confirm - 确认按钮（传递提醒数据）
 * - cancel - 取消按钮
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  taskDate: {
    type: String,
    required: true
  },
  reminderData: {
    type: Object,
    default: () => ({
      enabled: false,
      advanceMode: 'day',
      advanceDays: 0,
      hour: 0,
      min: 0
    })
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// ============================================================
// 临时状态（弹窗内编辑）
// ============================================================

const tempMode = ref('day')  // 'day' | 'week'
const tempDays = ref(0)      // 按天：0=当天,1=提前1天…  按周：0=当天,1=提前1周…
const tempHour = ref(0)
const tempMin = ref(0)

// ============================================================
// 监听弹窗打开，初始化临时值
// ============================================================

watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 弹窗打开时，从 props 初始化临时值
    tempMode.value = props.reminderData.advanceMode || 'day'
    tempDays.value = props.reminderData.advanceDays || 0

    // 若尚未设置，默认当前时刻（触发无效提示）
    if (!props.reminderData.enabled) {
      const now = new Date()
      tempHour.value = now.getHours()
      tempMin.value = now.getMinutes()
    } else {
      tempHour.value = props.reminderData.hour
      tempMin.value = props.reminderData.min
    }
  }
})

// ============================================================
// 计算属性
// ============================================================

/** 按天/按周的选项列表 */
const dayItems = computed(() => {
  if (tempMode.value === 'day') {
    return [
      { value: 0, label: '当天' },
      ...Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: `提前${i + 1}天` }))
    ]
  } else {
    return [
      { value: 0, label: '当天' },
      ...Array.from({ length: 7 }, (_, i) => ({ value: i + 1, label: `提前${i + 1}周` }))
    ]
  }
})

/** scroll-top 辅助（每项高度 120rpx ≈ 60px） */
const ITEM_HEIGHT = 60
const dayScrollTop = computed(() => Math.max(0, tempDays.value * ITEM_HEIGHT))
const hourScrollTop = computed(() => Math.max(0, tempHour.value * ITEM_HEIGHT))
const minScrollTop = computed(() => Math.max(0, tempMin.value * ITEM_HEIGHT))

/**
 * 计算当前弹窗选中的绝对提醒时间（Date 对象）
 * 基准 = 任务日期（taskDate）+ 当天时间；提前N天/周 = 任务日期 - N天/周
 */
const absoluteTime = computed(() => {
  const taskDateStr = props.taskDate || formatDate(new Date())
  const taskDate = new Date(taskDateStr)

  let offsetDays = tempDays.value
  if (tempMode.value === 'week') offsetDays = tempDays.value * 7

  const reminderDate = new Date(taskDate)
  reminderDate.setDate(reminderDate.getDate() - offsetDays)
  reminderDate.setHours(tempHour.value, tempMin.value, 0, 0)
  return reminderDate
})

/** 提醒时间是否无效（≤ 当前时刻） */
const isInvalid = computed(() => {
  return absoluteTime.value <= new Date()
})

/** 底部提示文字（有效时显示） */
const hintText = computed(() => {
  const d = absoluteTime.value
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `将于${month}月${day}日，${hh}:${mm}提醒你`
})

// ============================================================
// 事件处理
// ============================================================

/** 取消按钮 */
function handleCancel() {
  emit('update:visible', false)
  emit('cancel')
}

/** 确认按钮 */
function handleConfirm() {
  if (isInvalid.value) {
    // 无效时不能确定
    uni.showToast({ title: '提醒时间无效，请选择未来时间', icon: 'none' })
    return
  }

  // 返回提醒数据给父组件
  emit('confirm', {
    enabled: true,
    advanceMode: tempMode.value,
    advanceDays: tempDays.value,
    hour: tempHour.value,
    min: tempMin.value
  })

  emit('update:visible', false)
}
</script>

<style scoped>
/* ============================================================
   提醒选择器弹窗样式
   ============================================================ */

.tep-modal-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tep-modal-sheet {
  width: 85%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 顶部按天/按周切换标签 */
.reminder-tabs {
  display: flex;
  gap: 16rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
  padding: 6rpx;
}

.reminder-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 8rpx;
  transition: all 0.2s;
}

.reminder-tab-text {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.reminder-tab-active {
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.reminder-tab-active .reminder-tab-text {
  color: #1a1a2e;
  font-weight: bold;
}

/* 三列滚轮选择器 */
.reminder-wheels {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 300rpx;
  position: relative;
}

.reminder-wheel {
  flex: 1;
  height: 100%;
  overflow-y: scroll;
}

.reminder-wheel-num {
  flex: 0 0 100rpx;
}

.reminder-wheel-padding {
  height: 120rpx;
}

.reminder-wheel-item {
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.reminder-wheel-item-text {
  font-size: 28rpx;
  color: #999;
}

.reminder-wheel-item-sel .reminder-wheel-item-text {
  font-size: 32rpx;
  color: #1a1a2e;
  font-weight: bold;
}

.reminder-wheel-unit {
  font-size: 28rpx;
  color: #666;
  margin-left: 4rpx;
}

/* 底部提示文字 */
.reminder-hint-row {
  min-height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reminder-hint-invalid {
  background: #fff3e0;
  border-radius: 8rpx;
  padding: 12rpx 24rpx;
}

.reminder-hint-text {
  font-size: 24rpx;
  color: #ff6b00;
}

.reminder-hint-valid {
  font-size: 26rpx;
  color: #07c160;
}

/* 底部按钮 */
.tep-modal-btns {
  display: flex;
  gap: 20rpx;
  margin-top: 12rpx;
}

.tep-modal-cancel,
.tep-modal-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  transition: all 0.2s;
}

.tep-modal-cancel {
  background: #f5f6fa;
  color: #666;
}

.tep-modal-cancel:active {
  background: #e5e5e5;
}

.tep-modal-confirm {
  background: #07c160;
  color: #fff;
}

.tep-modal-confirm:active {
  opacity: 0.8;
}
</style>
