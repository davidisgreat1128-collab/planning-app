<template>
  <!--
    RepeatEndPicker - 设置结束重复日历弹窗（可复用）
    浮层白卡样式（区别于全屏底部Sheet）
    今天=虚线圆，选中=实心黑圆，过去日期=灰色不可点
    Props:
      visible   Boolean  是否显示
      value     String   已选日期 YYYY-MM-DD（空=未设置）
    Emits:
      confirm(dateStr)   确定，传 YYYY-MM-DD 或 '' (清空)
      cancel             取消
  -->
  <view v-if="visible" class="rep-mask" @tap.stop="onCancel">
    <view class="rep-card" @tap.stop>

      <!-- 月份导航 -->
      <view class="rep-nav">
        <view class="rep-nav-btn" @tap="prevMonth">
          <text class="rep-nav-icon">‹</text>
        </view>
        <text class="rep-nav-title">{{ navYear }}年{{ navMonth }}月</text>
        <view class="rep-nav-btn" @tap="nextMonth">
          <text class="rep-nav-icon">›</text>
        </view>
        <text class="rep-lunar-btn">隐藏农历</text>
      </view>

      <!-- 星期头 -->
      <view class="rep-weekrow">
        <text
          v-for="w in ['一','二','三','四','五','六','日']"
          :key="w"
          class="rep-weekcell"
        >{{ w }}</text>
      </view>

      <!-- 日期格子 -->
      <view class="rep-grid">
        <view
          v-for="(cell, idx) in cells"
          :key="idx"
          class="rep-cell"
          @tap="onCellTap(cell)"
        >
          <view
            class="rep-cell-inner"
            :class="{
              'rep-other':    cell.otherMonth,
              'rep-past':     cell.isPast,
              'rep-today':    cell.isToday,
              'rep-selected': cell.isSelected
            }"
          >
            <text class="rep-cell-num">{{ cell.day }}</text>
            <text v-if="cell.lunar" class="rep-cell-lunar">{{ cell.lunar }}</text>
          </view>
        </view>
      </view>

      <!-- 底部按钮：圆角大按钮（区别于天数日历的平铺按钮） -->
      <view class="rep-btns">
        <view class="rep-btn-cancel" @tap="onCancel">
          <text class="rep-btn-cancel-text">取消</text>
        </view>
        <view class="rep-btn-confirm" @tap="onConfirm">
          <text class="rep-btn-confirm-text">确定</text>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// ============================================================
// Props & Emits
// ============================================================
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  /** 已选日期 YYYY-MM-DD，空字符串=未设置 */
  value: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['confirm', 'cancel']);

// ============================================================
// 内部状态
// ============================================================

/** 日历当前浏览的年/月 */
const navYear  = ref(new Date().getFullYear());
const navMonth = ref(new Date().getMonth() + 1); // 1-12

/** 临时选中的日期（Date 对象） */
const selectedDate = ref(null);

/** 每次打开时初始化 */
watch(() => props.visible, (val) => {
  if (!val) return;
  const today = new Date();
  navYear.value  = today.getFullYear();
  navMonth.value = today.getMonth() + 1;
  // 恢复已选值
  if (props.value) {
    selectedDate.value = new Date(props.value + 'T00:00:00');
  } else {
    selectedDate.value = null;
  }
});

// ============================================================
// 月份切换
// ============================================================
function prevMonth() {
  if (navMonth.value === 1) {
    navMonth.value = 12;
    navYear.value--;
  } else {
    navMonth.value--;
  }
}

function nextMonth() {
  if (navMonth.value === 12) {
    navMonth.value = 1;
    navYear.value++;
  } else {
    navMonth.value++;
  }
}

// ============================================================
// 日历格子生成
// ============================================================
const cells = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year  = navYear.value;
  const month = navMonth.value; // 1-12

  // 当月第一天星期（0=周日），转为周一起点（0=周一，6=周日）
  const firstDow = new Date(year, month - 1, 1).getDay();
  const startDow = firstDow === 0 ? 6 : firstDow - 1;

  // 当月天数 / 上月末天数
  const daysInMonth   = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const list = [];

  // 上月补位
  for (let i = startDow - 1; i >= 0; i--) {
    const d    = prevMonthDays - i;
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    list.push({
      day: d,
      date: new Date(prevY, prevM - 1, d),
      otherMonth: true,
      isPast: true,
      isToday: false,
      isSelected: false,
      lunar: ''
    });
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month - 1, d);
    cellDate.setHours(0, 0, 0, 0);

    const isPast   = cellDate < today;
    const isToday  = cellDate.getTime() === today.getTime();

    let isSelected = false;
    if (selectedDate.value) {
      const sel = new Date(selectedDate.value);
      sel.setHours(0, 0, 0, 0);
      isSelected = cellDate.getTime() === sel.getTime();
    }

    list.push({
      day: d,
      date: cellDate,
      otherMonth: false,
      isPast: isPast && !isToday,
      isToday,
      isSelected,
      lunar: ''
    });
  }

  // 下月补位（凑满 42 格）
  const remaining = 42 - list.length;
  for (let d = 1; d <= remaining; d++) {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    list.push({
      day: d,
      date: new Date(nextY, nextM - 1, d),
      otherMonth: true,
      isPast: false,
      isToday: false,
      isSelected: false,
      lunar: ''
    });
  }

  return list;
});

// ============================================================
// 交互
// ============================================================

/** 点击格子 */
function onCellTap(cell) {
  if (cell.otherMonth || cell.isPast) return;
  selectedDate.value = new Date(cell.date);
}

/** 取消 */
function onCancel() {
  emit('cancel');
}

/** 确定 */
function onConfirm() {
  if (!selectedDate.value) {
    emit('confirm', '');
    return;
  }
  const d = selectedDate.value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  emit('confirm', `${y}-${m}-${day}`);
}
</script>

<style scoped>
/* ============================================================
   遮罩（半透明，居中显示白卡）
   ============================================================ */
.rep-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

/* 白色圆角卡片 */
.rep-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  width: 100%;
  padding: 32rpx 24rpx 24rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.18);
}

/* ============================================================
   月份导航
   ============================================================ */
.rep-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20rpx;
}

.rep-nav-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rep-nav-icon {
  font-size: 36rpx;
  color: #555;
  font-weight: bold;
  line-height: 1;
}

.rep-nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  color: #222;
  font-weight: bold;
}

.rep-lunar-btn {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

/* ============================================================
   星期头
   ============================================================ */
.rep-weekrow {
  display: flex;
  flex-direction: row;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #F0F0F0;
  margin-bottom: 8rpx;
}

.rep-weekcell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #AAAAAA;
}

/* ============================================================
   日期网格
   ============================================================ */
.rep-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.rep-cell {
  width: calc(100% / 7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rpx 0;
}

.rep-cell-inner {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.rep-cell-num {
  font-size: 28rpx;
  color: #333;
  line-height: 1.2;
}

.rep-cell-lunar {
  font-size: 16rpx;
  color: #999;
  line-height: 1;
}

/* 其他月份 */
.rep-other .rep-cell-num {
  color: #CCCCCC;
}

/* 过去日期 */
.rep-past .rep-cell-num {
  color: #CCCCCC;
}

/* 今天：虚线圆圈（区别于天数日历的实心黑圆） */
.rep-today {
  border: 2rpx dashed #555555;
}
.rep-today .rep-cell-num {
  color: #333;
  font-weight: bold;
}

/* 选中：实心黑圆 */
.rep-selected {
  background-color: #222222;
}
.rep-selected .rep-cell-num {
  color: #FFFFFF;
  font-weight: bold;
}

/* 今天且被选中：实心黑圆（优先级高） */
.rep-today.rep-selected {
  border: none;
  background-color: #222222;
}
.rep-today.rep-selected .rep-cell-num {
  color: #FFFFFF;
}

/* ============================================================
   底部按钮（圆角大按钮，区别于天数日历的平铺按钮）
   ============================================================ */
.rep-btns {
  display: flex;
  flex-direction: row;
  margin-top: 24rpx;
  gap: 16rpx;
}

.rep-btn-cancel {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  border: 2rpx solid #DDDDDD;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rep-btn-cancel-text {
  font-size: 32rpx;
  color: #555;
}

.rep-btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  background-color: #222222;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rep-btn-confirm-text {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: bold;
}
</style>
