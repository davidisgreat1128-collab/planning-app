/**
 * 日期计算工具函数集
 *
 * 职责：提供纯函数的日期计算能力
 * 特点：无副作用、可独立测试、性能优化
 *
 * @module utils/dateCalculator
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

/**
 * 获取某日期所在周的周一（固定周一为第一天）
 *
 * 算法说明：
 * - getDay() 返回：0=周日, 1=周一, ..., 6=周六
 * - 需要将周日特殊处理为 -6（往回退6天到周一）
 * - 其他日期：1-day 计算偏移量
 *
 * @param {Date} date - 输入日期
 * @returns {Date} 该周的周一（00:00:00）
 * @example
 * const wed = new Date(2026, 2, 25) // 2026-03-25（周三）
 * const mon = getWeekStart(wed)     // 2026-03-23（周一）
 */
export function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=周日, 1=周一, ..., 6=周六
  const diff = day === 0 ? -6 : 1 - day // 周日需要往回退6天
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 获取某月的第一天
 *
 * @param {Date} date - 输入日期
 * @returns {Date} 该月1号（00:00:00）
 * @example
 * const date = new Date(2026, 2, 15) // 2026-03-15
 * const first = getMonthStart(date)  // 2026-03-01
 */
export function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

/**
 * 获取某月的最后一天
 *
 * @param {Date} date - 输入日期
 * @returns {Date} 该月最后一天（23:59:59）
 * @example
 * const date = new Date(2026, 2, 15) // 2026-03-15
 * const last = getMonthEnd(date)     // 2026-03-31 23:59:59
 */
export function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * 获取月视图42天网格数据（7列×6行）
 *
 * 算法说明：
 * 1. 获取该月1号
 * 2. 获取1号所在周的周一（网格起始日期）
 * 3. 从起始日期开始，生成42天数组
 *
 * 为什么是42天？
 * - 日历网格固定7列（周一~周日）
 * - 最多需要6行（月初在周六 + 该月31天 + 下月补齐）
 * - 7 × 6 = 42天
 *
 * @param {Date} date - 基准日期
 * @returns {Date[]} 42个日期数组（含前后月补齐）
 * @example
 * const date = new Date(2026, 2, 15) // 2026-03-15
 * const grid = getMonthGrid(date)
 * // 返回：[2026-02-23, ..., 2026-04-05]（共42天）
 */
export function getMonthGrid(date) {
  const monthStart = getMonthStart(date)
  const gridStart = getWeekStart(monthStart) // 网格从该月1号所在周的周一开始

  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(d)
  }
  return days
}

/**
 * 获取周视图7天数据（周一~周日）
 *
 * @param {Date} date - 基准日期
 * @returns {Date[]} 7个日期数组（周一~周日）
 * @example
 * const wed = new Date(2026, 2, 25) // 2026-03-25（周三）
 * const week = getWeekDays(wed)
 * // 返回：[2026-03-23（周一）, ..., 2026-03-29（周日）]
 */
export function getWeekDays(date) {
  const weekStart = getWeekStart(date)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    days.push(d)
  }
  return days
}

/**
 * 日期加减（支持天/周/月）
 *
 * 注意事项：
 * - 月份加减会自动处理不同月份天数（如1月31日+1月=2月28日）
 * - 时间部分保持不变
 *
 * @param {Date} date - 基准日期
 * @param {number} amount - 数量（可为负数）
 * @param {'day'|'week'|'month'} unit - 单位
 * @returns {Date} 新日期
 * @example
 * const date = new Date(2026, 2, 15)
 * addDate(date, 7, 'day')   // 2026-03-22
 * addDate(date, 1, 'week')  // 2026-03-22
 * addDate(date, 1, 'month') // 2026-04-15
 * addDate(date, -1, 'day')  // 2026-03-14
 */
export function addDate(date, amount, unit) {
  const d = new Date(date)
  switch (unit) {
    case 'day':
      d.setDate(d.getDate() + amount)
      break
    case 'week':
      d.setDate(d.getDate() + amount * 7)
      break
    case 'month':
      d.setMonth(d.getMonth() + amount)
      break
    default:
      throw new Error(`不支持的单位: ${unit}`)
  }
  return d
}

/**
 * 判断两个日期是否同一天（忽略时间）
 *
 * @param {Date} d1 - 日期1
 * @param {Date} d2 - 日期2
 * @returns {boolean} 是否同一天
 * @example
 * const date1 = new Date(2026, 2, 15, 10, 30)
 * const date2 = new Date(2026, 2, 15, 18, 45)
 * isSameDay(date1, date2) // true
 */
export function isSameDay(d1, d2) {
  if (!d1 || !d2) return false
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * 判断是否是今天
 *
 * @param {Date} date - 日期
 * @returns {boolean} 是否今天
 * @example
 * isToday(new Date()) // true
 */
export function isToday(date) {
  return isSameDay(date, new Date())
}

/**
 * 判断是否是周末（周六或周日）
 *
 * @param {Date} date - 日期
 * @returns {boolean} 是否周末
 * @example
 * const sat = new Date(2026, 2, 28) // 2026-03-28（周六）
 * isWeekend(sat) // true
 */
export function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * 格式化月份标题
 *
 * @param {Date} date - 日期
 * @returns {string} "2026年3月"
 * @example
 * const date = new Date(2026, 2, 15)
 * formatMonthTitle(date) // "2026年3月"
 */
export function formatMonthTitle(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

/**
 * 格式化周标题
 *
 * @param {Date} weekStart - 周一日期
 * @returns {string} "3月17日 - 3月23日"
 * @example
 * const mon = new Date(2026, 2, 23) // 2026-03-23（周一）
 * formatWeekTitle(mon) // "3月23日 - 3月29日"
 */
export function formatWeekTitle(weekStart) {
  const weekEnd = addDate(weekStart, 6, 'day')
  const startStr = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日`
  const endStr = `${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
  return `${startStr} - ${endStr}`
}

/**
 * 格式化日期为 YYYY-MM-DD
 *
 * @param {Date} date - 日期
 * @returns {string} "2026-03-15"
 * @example
 * formatDate(new Date(2026, 2, 15)) // "2026-03-15"
 */
export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取两个日期之间的天数差
 *
 * @param {Date} d1 - 日期1
 * @param {Date} d2 - 日期2
 * @returns {number} 天数差（可为负数）
 * @example
 * const d1 = new Date(2026, 2, 15)
 * const d2 = new Date(2026, 2, 20)
 * getDaysBetween(d1, d2) // 5
 */
export function getDaysBetween(d1, d2) {
  const oneDay = 24 * 60 * 60 * 1000 // 毫秒数
  return Math.round((d2.getTime() - d1.getTime()) / oneDay)
}

/**
 * 判断日期是否在指定范围内
 *
 * @param {Date} date - 待检查日期
 * @param {Date} start - 开始日期
 * @param {Date} end - 结束日期
 * @returns {boolean} 是否在范围内
 * @example
 * const date = new Date(2026, 2, 15)
 * const start = new Date(2026, 2, 1)
 * const end = new Date(2026, 2, 31)
 * isDateInRange(date, start, end) // true
 */
export function isDateInRange(date, start, end) {
  return date >= start && date <= end
}
