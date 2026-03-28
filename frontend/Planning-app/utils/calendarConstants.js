/**
 * 日历组件常量定义
 *
 * 职责：集中管理日历相关的常量配置
 * 特点：类型安全、易于维护、避免魔法数字
 *
 * @module utils/calendarConstants
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

/**
 * 视图模式枚举
 */
export const VIEW_MODE = {
  WEEK: 'week',   // 周视图
  MONTH: 'month'  // 月视图
}

/**
 * 手势方向枚举
 */
export const GESTURE_DIRECTION = {
  HORIZONTAL: 'horizontal', // 横向滑动（翻页）
  VERTICAL: 'vertical',     // 纵向滑动（周/月切换）
  NONE: null                // 未确定方向
}

/**
 * 日历网格配置
 */
export const GRID_CONFIG = {
  WEEK_DAYS: 7,      // 一周7天
  MONTH_ROWS: 6,     // 月视图最多6行
  MONTH_CELLS: 42,   // 月视图固定42个单元格（7×6）
  WEEK_CELLS: 7      // 周视图7个单元格
}

/**
 * 手势识别阈值
 */
export const GESTURE_THRESHOLD = {
  DIRECTION: 10,     // 方向判断阈值（10px）
  SWIPE: 0.5,        // 滑动切换阈值（50%屏幕宽度）
  VELOCITY: 0.3      // 快速滑动速度阈值（像素/毫秒）
}

/**
 * 动画配置
 */
export const ANIMATION_CONFIG = {
  DURATION: 300,         // 动画时长（毫秒）
  EASING: 'ease-out',    // 缓动函数
  RAF_THROTTLE: 16       // requestAnimationFrame 节流间隔（约60fps）
}

/**
 * 视图偏移量（用于3视图循环）
 */
export const VIEW_OFFSET = {
  PREV: -1,     // 前一个视图
  CURRENT: 0,   // 当前视图
  NEXT: 1       // 下一个视图
}

/**
 * 星期标题（周一~周日）
 */
export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

/**
 * 星期标题（完整）
 */
export const WEEKDAY_LABELS_FULL = [
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
  '星期日'
]

/**
 * 性能监控配置
 */
export const PERFORMANCE_CONFIG = {
  ENABLED: process.env.NODE_ENV === 'development', // 仅开发环境启用
  WARN_THRESHOLD: 16,  // 渲染超过16ms警告（低于60fps）
  LOG_INTERVAL: 5000   // 日志输出间隔（5秒）
}

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  MAX_VIEWS: 3,        // 最大缓存视图数（prev/current/next）
  DEBOUNCE_TIME: 300   // 防抖时间（毫秒）
}

/**
 * 颜色配置（可根据主题动态调整）
 */
export const COLOR_THEME = {
  // 今天高亮色
  TODAY_BG: '#007AFF',
  TODAY_TEXT: '#FFFFFF',

  // 选中日期色
  SELECTED_BG: '#34C759',
  SELECTED_TEXT: '#FFFFFF',

  // 非当前月日期色
  OTHER_MONTH_TEXT: '#C7C7CC',

  // 周末颜色
  WEEKEND_TEXT: '#FF3B30',

  // 普通日期色
  NORMAL_TEXT: '#333333',

  // 任务点颜色
  TASK_DOT: '#FF9500'
}

/**
 * Z-Index 层级定义
 */
export const Z_INDEX = {
  CALENDAR_CONTAINER: 1,
  HEADER: 10,
  WEEKDAYS: 9,
  GRID: 1,
  CELL: 1,
  TASK_DOT: 2
}
