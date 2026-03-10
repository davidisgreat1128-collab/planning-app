/**
 * RRULE 构建工具
 *
 * 将用户选择的重复规则数据转换为标准 RRULE 字符串
 *
 * 符合 iCalendar RFC 5545 标准
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-10
 * @version 1.0.0
 */

/**
 * 将重复数据对象转换为 RRULE 字符串
 *
 * @param {Object} repeatData - 重复规则数据
 * @param {string} repeatData.mode - 重复模式: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
 * @param {number} repeatData.interval - 间隔数(每N天/周/月/年)
 * @param {Array<number>} repeatData.weekDays - 每周重复的星期(0=周一, 6=周日)
 * @param {string} repeatData.monthlySubMode - 每月子模式: 'date' | 'week'
 * @param {Array<number>} repeatData.monthDays - 每月重复的日期(1-31)
 * @param {number} repeatData.monthWeekOrdinal - 每月第几个(0-3=第1-4个, 4=最后一个)
 * @param {number} repeatData.monthWeekDay - 每月重复的星期(0=周一, 6=周日)
 * @param {number} repeatData.yearlyMonth - 每年重复的月份(1-12)
 * @param {number} repeatData.yearlyDay - 每年重复的日期(1-31)
 * @param {string} repeatData.endDate - 结束日期(YYYY-MM-DD)
 *
 * @returns {string} RRULE 字符串, 例如: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH"
 *
 * @example
 * // 每2周的周一、周四重复
 * buildRrule({ mode: 'weekly', interval: 2, weekDays: [0, 3] })
 * // => "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH"
 *
 * @example
 * // 每月1日、15日重复,到2026-12-31结束
 * buildRrule({ mode: 'monthly', monthlySubMode: 'date', monthDays: [1, 15], endDate: '2026-12-31' })
 * // => "FREQ=MONTHLY;BYMONTHDAY=1,15;UNTIL=20261231T235959Z"
 */
export function buildRrule(repeatData) {
  // 不重复
  if (!repeatData || repeatData.mode === 'none') {
    return ''
  }

  // 频率映射表
  const freqMap = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    yearly: 'YEARLY'
  }

  const freq = freqMap[repeatData.mode]
  if (!freq) {
    return ''
  }

  const parts = [`FREQ=${freq}`]

  // 间隔(大于1时添加)
  if (repeatData.interval > 1) {
    parts.push(`INTERVAL=${repeatData.interval}`)
  }

  // 每周: BYDAY(0=周一 MO ... 6=周日 SU)
  if (repeatData.mode === 'weekly' && repeatData.weekDays && repeatData.weekDays.length > 0) {
    const dayMap = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
    const days = repeatData.weekDays.map(d => dayMap[d]).join(',')
    parts.push(`BYDAY=${days}`)
  }

  // 每月-按日期: BYMONTHDAY
  if (repeatData.mode === 'monthly' && repeatData.monthlySubMode === 'date' && repeatData.monthDays && repeatData.monthDays.length > 0) {
    parts.push(`BYMONTHDAY=${repeatData.monthDays.join(',')}`)
  }

  // 每月-按星期: BYDAY(带序号,如 "2MO" 表示第2个周一)
  if (repeatData.mode === 'monthly' && repeatData.monthlySubMode === 'week') {
    const dayMap = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
    // monthWeekOrdinal: 0-3=第1到第4个, 4=最后一个(-1)
    const pos = repeatData.monthWeekOrdinal === 4 ? -1 : repeatData.monthWeekOrdinal + 1
    const weekDay = dayMap[repeatData.monthWeekDay]
    parts.push(`BYDAY=${pos}${weekDay}`)
  }

  // 每年: BYMONTH + BYMONTHDAY
  if (repeatData.mode === 'yearly') {
    if (repeatData.yearlyMonth) {
      parts.push(`BYMONTH=${repeatData.yearlyMonth}`)
    }
    if (repeatData.yearlyDay) {
      parts.push(`BYMONTHDAY=${repeatData.yearlyDay}`)
    }
  }

  // 结束日期: UNTIL(格式: YYYYMMDDTHHMMSSZ)
  if (repeatData.endDate) {
    // 将 YYYY-MM-DD 转为 YYYYMMDD
    const dateStr = repeatData.endDate.replace(/-/g, '')
    parts.push(`UNTIL=${dateStr}T235959Z`)
  }

  return parts.join(';')
}

/**
 * 解析 RRULE 字符串为重复数据对象(逆向转换)
 *
 * @param {string} rrule - RRULE 字符串
 * @returns {Object} 重复数据对象
 *
 * @example
 * parseRrule("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH")
 * // => { mode: 'weekly', interval: 2, weekDays: [0, 3] }
 */
export function parseRrule(rrule) {
  if (!rrule) {
    return { mode: 'none', interval: 1, weekDays: [], endDate: '' }
  }

  const parts = rrule.split(';')
  const result = { mode: 'none', interval: 1, weekDays: [], endDate: '' }

  // 频率映射表(反向)
  const freqReverseMap = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
  }

  // 星期映射表(反向)
  const dayReverseMap = {
    MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6
  }

  parts.forEach(part => {
    const [key, value] = part.split('=')

    if (key === 'FREQ') {
      result.mode = freqReverseMap[value] || 'none'
    } else if (key === 'INTERVAL') {
      result.interval = parseInt(value, 10)
    } else if (key === 'BYDAY') {
      // 解析 BYDAY(可能包含位置,如 "2MO")
      const days = value.split(',')
      result.weekDays = days.map(day => {
        // 去掉前面的数字
        const pureDay = day.replace(/^-?\d+/, '')
        return dayReverseMap[pureDay]
      }).filter(d => d !== undefined)
    } else if (key === 'BYMONTHDAY') {
      result.monthDays = value.split(',').map(d => parseInt(d, 10))
    } else if (key === 'BYMONTH') {
      result.yearlyMonth = parseInt(value, 10)
    } else if (key === 'UNTIL') {
      // UNTIL 格式: YYYYMMDDTHHMMSSZ
      const dateStr = value.substring(0, 8) // 取前8位 YYYYMMDD
      result.endDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
    }
  })

  return result
}
