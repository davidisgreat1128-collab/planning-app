<template>
  <view
    class="calendar-bar"
    :class="{ 'month-mode': mode === 'month' }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
  >
    <!-- 星期头 (周一到周日) -->
    <view class="week-header">
      <text
        v-for="day in weekDays"
        :key="day"
        class="week-day-name"
      >{{ day }}</text>
    </view>

    <!-- 周模式: 只显示1行7天 -->
    <view v-if="mode === 'week'" class="week-dates">
      <view
        v-for="item in currentWeekDates"
        :key="item.dateStr"
        class="date-cell"
        :class="{
          selected: item.dateStr === selectedDate,
          today: item.dateStr === todayStr,
          'has-task': item.hasTask
        }"
        @tap="handleDateClick(item.dateStr)"
      >
        <!-- 工作日角标（右上角） -->
        <text v-if="item.workDay" class="work-badge" :class="item.workDay.type">
          {{ item.workDay.type === 'holiday' ? '休' : '班' }}
        </text>
        <!-- 日期数字在上 -->
        <view class="date-circle">
          <text class="date-num">{{ item.day }}</text>
        </view>
        <!-- 节日/农历在下 -->
        <text class="lunar-label">{{ item.lunarLabel }}</text>
        <!-- 多色任务点 (最多显示2个象限色) -->
        <view v-if="item.hasTask" class="task-dots">
          <view
            v-for="(dot, di) in item.taskDots"
            :key="di"
            class="task-dot"
            :class="'dot-' + dot"
          ></view>
        </view>
      </view>
    </view>

    <!-- 月模式: 6行×7列 = 42天 -->
    <view v-else class="month-grid">
      <view
        v-for="(row, ri) in monthRows"
        :key="ri"
        class="month-row"
      >
        <view
          v-for="item in row"
          :key="item.dateStr"
          class="date-cell month-cell"
          :class="{
            selected: item.dateStr === selectedDate,
            today: item.dateStr === todayStr,
            'has-task': item.hasTask,
            'other-month': item.otherMonth
          }"
          @tap="handleDateClick(item.dateStr)"
        >
          <!-- 工作日角标（右上角） -->
          <text v-if="item.workDay" class="work-badge" :class="item.workDay.type">
            {{ item.workDay.type === 'holiday' ? '休' : '班' }}
          </text>
          <!-- 日期数字在上 -->
          <view class="date-circle">
            <text class="date-num">{{ item.day }}</text>
          </view>
          <!-- 节日/农历在下 -->
          <text class="lunar-label">{{ item.lunarLabel }}</text>
          <view v-if="item.hasTask" class="task-dots">
            <view
              v-for="(dot, di) in item.taskDots"
              :key="di"
              class="task-dot"
              :class="'dot-' + dot"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 月份/年份标签 -->
    <view class="cal-month-label">
      <text>{{ monthLabel }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * CalendarBar - 日历条组件
 *
 * 职责:
 * - 显示周视图或月视图的日期网格
 * - 处理日期选择
 * - 处理滑动手势 (切换周/月, 展开/折叠)
 * - 显示任务标记点和节日农历
 *
 * 使用方式:
 * ```vue
 * <CalendarBar
 *   :mode="calendarMode"
 *   :selected-date="selectedDate"
 *   :current-week-dates="currentWeekDates"
 *   :month-rows="monthRows"
 *   :month-label="currentMonthLabel"
 *   @date-click="handleDateClick"
 *   @swipe-left="nextWeek"
 *   @swipe-right="prevWeek"
 *   @expand="expandToMonth"
 *   @collapse="collapseToWeek"
 * />
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-05
 */
import { ref, watch } from 'vue';

// ============ Props ============
const props = defineProps({
  /** 日历模式: 'week' | 'month' */
  mode: {
    type: String,
    default: 'week',
    validator: (value) => ['week', 'month'].includes(value)
  },

  /** 当前选中日期 YYYY-MM-DD */
  selectedDate: {
    type: String,
    default: ''
  },

  /** 今天的日期字符串 YYYY-MM-DD */
  todayStr: {
    type: String,
    required: true
  },

  /** 周视图数据 (7天) */
  currentWeekDates: {
    type: Array,
    default: () => []
  },

  /** 月视图数据 (6行×7列) */
  monthRows: {
    type: Array,
    default: () => []
  },

  /** 月份标签 (如 "2026年3月") */
  monthLabel: {
    type: String,
    default: ''
  },

  /** 周一到周日 */
  weekDays: {
    type: Array,
    default: () => ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  }
});

// ============ Emits ============
const emit = defineEmits([
  'date-click',      // 点击日期
  'swipe-left',      // 左滑 (下一周/月)
  'swipe-right',     // 右滑 (上一周/月)
  'expand',          // 向下拉展开为月视图
  'collapse'         // 向上滑折叠为周视图
]);

// ⭐ 调试：监听 currentWeekDates 变化
watch(() => props.currentWeekDates, (newVal) => {
  if (newVal && newVal.length > 0) {
    console.log('[CalendarBar] currentWeekDates 更新:', {
      length: newVal.length,
      firstDay: newVal[0],
      hasLunarLabel: !!newVal[0]?.lunarLabel,
      hasWorkDay: !!newVal[0]?.workDay
    });
  }
}, { immediate: true, deep: true });


// ============ 触摸状态 ============
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;
let touchDir = ''; // 'h' | 'v' | ''

// ============ H5鼠标事件状态 ============
// #ifdef H5
let mouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;
let mouseMoved = false;
let mouseDir = ''; // 'h' | 'v' | ''
// #endif

// ============ 触摸处理 ============

/**
 * 触摸开始
 */
function onTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchMoved = false;
  touchDir = '';
}

/**
 * 触摸移动 (判断滑动方向)
 */
function onTouchMove(e) {
  if (touchMoved) return; // 方向已锁定,不重复判断

  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  // 阈值 12px,且水平/垂直比例差距足够大才锁定方向,避免斜向误判
  if (adx < 12 && ady < 12) return;

  touchMoved = true;
  touchDir = adx > ady * 1.2 ? 'h' : (ady > adx * 1.2 ? 'v' : '');
}

/**
 * 触摸结束 (触发手势事件)
 */
function onTouchEnd(e) {
  if (!touchMoved || touchDir === '') {
    return; // 未达到方向判断阈值,视为点击
  }

  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (touchDir === 'h' && Math.abs(dx) > 40) {
    // 水平滑动: 切换周/月
    if (dx < 0) {
      emit('swipe-left'); // 左滑 (下一周/月)
    } else {
      emit('swipe-right'); // 右滑 (上一周/月)
    }
  } else if (touchDir === 'v') {
    if (props.mode === 'week' && dy > 50) {
      // 周模式下向下拉 → 展开月视图
      emit('expand');
    } else if (props.mode === 'month' && dy < -50) {
      // 月模式下向上滑 → 折叠回周视图
      emit('collapse');
    }
  }
}

/**
 * 处理日期点击
 */
function handleDateClick(dateStr) {
  emit('date-click', dateStr);
}

// ============ H5鼠标事件处理 ============
// #ifdef H5

/**
 * H5端: 鼠标按下 (启动滑动监听)
 */
function onMouseDown(e) {
  // 只处理左键（注意：UniApp H5中e.button可能是undefined，这种情况也视为左键）
  if (e.button !== undefined && e.button !== 0) {
    return;
  }

  // 如果点击的是日期单元格,不处理滑动(让点击事件生效)
  const dateCell = e.target.closest?.('.date-cell');
  if (dateCell) {
    return;
  }

  e.preventDefault();

  mouseDown = true;
  mouseStartX = e.clientX;
  mouseStartY = e.clientY;
  mouseMoved = false;
  mouseDir = '';

  // 监听document上的move和up,确保鼠标移出组件后仍能触发
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

/**
 * H5端: 鼠标移动 (判断滑动方向)
 */
function onMouseMove(e) {
  if (!mouseDown) return;
  if (mouseMoved) return; // 方向已锁定

  const dx = e.clientX - mouseStartX;
  const dy = e.clientY - mouseStartY;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  // 阈值 12px
  if (adx < 12 && ady < 12) return;

  mouseMoved = true;
  mouseDir = adx > ady * 1.2 ? 'h' : (ady > adx * 1.2 ? 'v' : '');
}

/**
 * H5端: 鼠标松开 (触发手势事件)
 */
function onMouseUp(e) {
  if (!mouseDown) return;

  mouseDown = false;

  // 移除document监听
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);

  if (!mouseMoved || mouseDir === '') {
    return; // 未达到阈值,视为点击
  }

  const dx = e.clientX - mouseStartX;
  const dy = e.clientY - mouseStartY;

  if (mouseDir === 'h' && Math.abs(dx) > 40) {
    // 水平滑动: 切换周/月
    if (dx < 0) {
      emit('swipe-left');
    } else {
      emit('swipe-right');
    }
  } else if (mouseDir === 'v') {
    if (props.mode === 'week' && dy > 50) {
      // 周模式下向下拉 → 展开月视图
      emit('expand');
    } else if (props.mode === 'month' && dy < -50) {
      // 月模式下向上滑 → 折叠回周视图
      emit('collapse');
    }
  }
}

// #endif

</script>

<style lang="scss" scoped>
/* ============================================================
   日历条容器
   ============================================================ */
.calendar-bar {
  background-color: #FFFFFF;
  padding: 0 16rpx 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  overflow: hidden;
  transition: height 0.3s ease;
  /* 禁止浏览器接管触摸/鼠标滚动,保证手势完整传递给自定义处理器 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

/* ============================================================
   星期头 (周一到周日)
   ============================================================ */
.week-header {
  display: flex;
  flex-direction: row;
  padding: 8rpx 0 4rpx;
}

.week-day-name {
  flex: 1;
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

/* ============================================================
   周模式 (1行7天)
   ============================================================ */
.week-dates {
  display: flex;
  flex-direction: row;
}

/* ============================================================
   月模式 (6行×7列)
   ============================================================ */
.month-grid {
  display: flex;
  flex-direction: column;
}

.month-row {
  display: flex;
  flex-direction: row;
}

/* ============================================================
   日期单元格 (通用样式)
   ============================================================ */
.date-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0;
  position: relative;
}

.month-cell {
  height: 96rpx;
}

/* 工作日角标（右上角） */
.work-badge {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  font-size: 18rpx;
  line-height: 28rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 4rpx;
  text-align: center;
  font-weight: 600;
  z-index: 10;
}

.work-badge.holiday {
  background-color: #FF4D4F;
  color: #FFFFFF;
}

.work-badge.workday {
  background-color: #FAAD14;
  color: #FFFFFF;
}

/* 农历/节日标签 */
.lunar-label {
  font-size: 20rpx;
  color: #999;
  line-height: 24rpx;
  margin-top: 4rpx;
  width: 90rpx;
  min-height: 24rpx;
  text-align: center;
  word-break: break-all;
  word-wrap: break-word;
  white-space: normal;
}

/* 日期圆圈 */
.date-circle {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.date-num {
  font-size: 28rpx;
  color: #333;
}

/* 今天高亮 */
.date-cell.today .date-circle {
  background-color: #E6F7FF;
}

.date-cell.today .date-num {
  color: #1890FF;
  font-weight: 600;
}

/* 选中状态 */
.date-cell.selected .date-circle {
  background-color: #1890FF;
}

.date-cell.selected .date-num {
  color: #FFFFFF;
  font-weight: 600;
}

/* 其他月份日期 (月视图中) */
.date-cell.other-month .date-num {
  color: #CCC;
}

/* 任务标记点 */
.task-dots {
  display: flex;
  flex-direction: row;
  gap: 4rpx;
  margin-top: 4rpx;
}

.task-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}

/* 象限颜色 */
.task-dot.dot-q1 {
  background-color: #FF4D4F; /* 紧急且重要 - 红色 */
}

.task-dot.dot-q2 {
  background-color: #1890FF; /* 重要不紧急 - 蓝色 */
}

.task-dot.dot-q3 {
  background-color: #FAAD14; /* 紧急不重要 - 黄色 */
}

.task-dot.dot-q4 {
  background-color: #52C41A; /* 不紧急不重要 - 绿色 */
}

/* ============================================================
   月份标签
   ============================================================ */
.cal-month-label {
  text-align: center;
  padding: 8rpx 0 4rpx;
  font-size: 24rpx;
  color: #666;
}
</style>
