/**
 * 规划日期工具函数
 * 职责：处理规划相关的日期计算、格式化、星期计算等纯函数逻辑
 */

/**
 * 获取星期几的中文名称
 * @param {Date} date - 日期对象
 * @returns {string} 星期几（如"周一"）
 */
export function getWeekday(date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

/**
 * 计算日期相对今天的提示文字
 * @param {Date} targetDate - 目标日期
 * @returns {string} 提示文字（如"今天"、"明天"、"3天后"）
 */
export function getDateHint(targetDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((target - today) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '明天'
  } else if (diffDays === -1) {
    return '昨天'
  } else if (diffDays > 1) {
    return `${diffDays}天后`
  } else if (diffDays < -1) {
    return `${Math.abs(diffDays)}天前`
  }
  return ''
}

/**
 * 计算两个日期之间的持续天数（包含起止日期）
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {number} 持续天数
 */
export function calculateDuration(startDate, endDate) {
  const diffMs = endDate - startDate
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
}

/**
 * 格式化持续天数为文字
 * @param {number} days - 天数
 * @returns {string} 格式化后的文字（如"持续30天"）
 */
export function formatDuration(days) {
  return `持续${days}天`
}

/**
 * 计算日期相关信息（星期、提示、持续天数）
 * @param {string} startDateStr - 开始日期字符串（yyyy/MM/dd 或 yyyy-MM-dd）
 * @param {string} endDateStr - 结束日期字符串（yyyy/MM/dd 或 yyyy-MM-dd）
 * @returns {object} 包含星期、提示、持续天数的对象
 */
export function calculateDateInfo(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) {
    return {
      startWeekday: '',
      startHint: '',
      endWeekday: '',
      duration: ''
    }
  }

  const startDate = new Date(startDateStr.replace(/\//g, '-'))
  const endDate = new Date(endDateStr.replace(/\//g, '-'))

  // 计算星期几
  const startWeekday = getWeekday(startDate)
  const endWeekday = getWeekday(endDate)

  // 计算开始日期提示
  const startHint = getDateHint(startDate)

  // 计算持续天数
  const durationDays = calculateDuration(startDate, endDate)
  const duration = formatDuration(durationDays)

  return {
    startWeekday,
    startHint,
    endWeekday,
    duration,
    durationDays // 额外返回数字，方便其他地方使用
  }
}

/**
 * 格式化日期为 yyyy/MM/dd 格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * 格式化日期显示为 M月D日 格式
 * @param {string} dateStr - 日期字符串（yyyy/MM/dd 或 yyyy-MM-dd）
 * @returns {string} 格式化后的显示文字（如"3月12日"）
 */
export function formatDateDisplay(dateStr) {
  // 兼容格式: 2026/02/27 或 2026-02-27
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-')
  if (parts.length !== 3) {
    return dateStr
  }

  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  return `${month}月${day}日`
}

/**
 * 格式化日期为完整中文格式（yyyy年M月D日）
 * @param {string} dateStr - 日期字符串（yyyy/MM/dd）
 * @returns {string} 格式化后的中文日期（如"2026年3月12日"）
 */
export function formatDateFullChinese(dateStr) {
  const parts = dateStr.split('/')
  if (parts.length !== 3) {
    return dateStr
  }
  const year = parts[0]
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  return `${year}年${month}月${day}日`
}

/**
 * 计算里程碑相对规划开始日期的天数
 * @param {string} startDateStr - 规划开始日期（yyyy/MM/dd）
 * @param {string} milestoneDateStr - 里程碑日期（yyyy/MM/dd）
 * @returns {string} 第几天的文字（如"第10天"）
 */
export function calculateMilestoneDays(startDateStr, milestoneDateStr) {
  if (!startDateStr || !milestoneDateStr) {
    return '第X天'
  }

  const startDate = new Date(startDateStr.replace(/\//g, '-'))
  const milestoneDate = new Date(milestoneDateStr.replace(/\//g, '-'))

  const diffDays = Math.floor((milestoneDate - startDate) / (1000 * 60 * 60 * 24))
  return `第${diffDays}天`
}
