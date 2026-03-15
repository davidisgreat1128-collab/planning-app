/**
 * useRepeatRuleManager - 重复规则管理 Composable
 *
 * 职责：封装任务重复规则（RRULE）的状态和逻辑
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-10
 */

import { ref, computed } from 'vue'

/**
 * 重复规则管理 Composable
 * @param {Object} options - 配置选项
 * @returns {Object} 重复规则状态和方法
 */
export function useRepeatRuleManager(options = {}) {
  // ============================================================
  // 重复规则状态
  // ============================================================

  /** 当前选中的重复模式 */
  const repeatMode = ref('none')

  /** 重复间隔（每N天/每N周） */
  const repeatInterval = ref(1)

  /** 每周重复：选中的周几（1=周一 … 7=周日） */
  const repeatWeekDays = ref([])

  /** 结束重复日期（YYYY-MM-DD，为空表示未设置） */
  const repeatEndDate = ref('')

  /** 每月子模式：'day'=按日期  'weekday'=按星期 */
  const monthlySubMode = ref('day')

  /** 每月-日期模式：选中的日期数组（1~31，可多选） */
  const monthlyDays = ref([])

  /** 每月-星期模式：第N个（1=第一个…5=最后一个） */
  const monthlyWeekNum = ref(1)

  /** 每月-星期模式：星期几（1=周一…7=周日） */
  const monthlyWeekday = ref(1)

  /** 每年重复的月份（1~12） */
  const yearlyMonth = ref(1)

  /** 每年重复的日期（1~31） */
  const yearlyDay = ref(1)

  // ============================================================
  // 计算属性
  // ============================================================

  /** 重复模式显示文本 */
  const repeatModeLabel = computed(() => {
    const map = { none: '未开启', daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年' }
    return map[repeatMode.value] || '未开启'
  })

  /**
   * 重复规则的中文描述（用于工具栏显示）
   * @example "每1天" / "每2周" / "每月1日" / "每年1月1日"
   */
  const repeatDescription = computed(() => {
    if (repeatMode.value === 'none') {
      return '重复'
    }

    if (repeatMode.value === 'daily') {
      return `每${repeatInterval.value}天`
    }

    if (repeatMode.value === 'weekly') {
      const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      if (repeatWeekDays.value.length === 0) {
        return `每${repeatInterval.value}周`
      }
      const daysStr = repeatWeekDays.value.map(d => weekLabels[d - 1]).join(',')
      return `每${repeatInterval.value}周 ${daysStr}`
    }

    if (repeatMode.value === 'monthly') {
      if (monthlySubMode.value === 'day') {
        if (monthlyDays.value.length === 0) {
          return '每月'
        }
        const daysStr = monthlyDays.value.join(',')
        return `每月${daysStr}日`
      } else {
        const weekNumLabels = ['第一个', '第二个', '第三个', '第四个', '最后一个']
        const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        return `每月${weekNumLabels[monthlyWeekNum.value - 1]}${weekLabels[monthlyWeekday.value - 1]}`
      }
    }

    if (repeatMode.value === 'yearly') {
      return `每年${yearlyMonth.value}月${yearlyDay.value}日`
    }

    return '重复'
  })

  // ============================================================
  // 方法
  // ============================================================

  /**
   * 切换每周的某一天
   * @param {number} dayNum - 周几（1=周一...7=周日）
   */
  function toggleWeekDay(dayNum) {
    const idx = repeatWeekDays.value.indexOf(dayNum)
    if (idx >= 0) {
      if (repeatWeekDays.value.length > 1) {
        repeatWeekDays.value.splice(idx, 1)
      }
    } else {
      repeatWeekDays.value.push(dayNum)
      repeatWeekDays.value.sort((a, b) => a - b)
    }
  }

  /**
   * 切换每月日期（多选）
   * @param {number} day - 日期（1~31）
   */
  function toggleMonthlyDay(day) {
    const idx = monthlyDays.value.indexOf(day)
    if (idx >= 0) {
      if (monthlyDays.value.length > 1) {
        monthlyDays.value.splice(idx, 1)
      }
    } else {
      monthlyDays.value.push(day)
      monthlyDays.value.sort((a, b) => a - b)
    }
  }

  /**
   * 生成 RRULE 字符串
   * @returns {string} RRULE字符串
   */
  function generateRrule() {
    console.log('[generateRrule] 开始生成 RRULE，当前状态:', {
      repeatMode: repeatMode.value,
      repeatInterval: repeatInterval.value,
      repeatWeekDays: repeatWeekDays.value,
      repeatEndDate: repeatEndDate.value,
      monthlySubMode: monthlySubMode.value,
      monthlyDays: monthlyDays.value
    })

    if (repeatMode.value === 'none') {
      console.log('[generateRrule] repeatMode = none，返回空字符串')
      return ''
    }

    // TODO: 实现完整的 RRULE 生成逻辑
    // 这里简化处理，实际需要根据 repeatMode、repeatInterval、repeatWeekDays 等参数生成标准 RRULE 字符串
    let rrule = `FREQ=${repeatMode.value.toUpperCase()};INTERVAL=${repeatInterval.value}`

    if (repeatMode.value === 'weekly' && repeatWeekDays.value.length > 0) {
      const byDay = repeatWeekDays.value
        .map((d) => {
          const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
          return days[d - 1]
        })
        .join(',')
      rrule += `;BYDAY=${byDay}`
    }

    if (repeatMode.value === 'monthly') {
      if (monthlySubMode.value === 'day' && monthlyDays.value.length > 0) {
        rrule += `;BYMONTHDAY=${monthlyDays.value.join(',')}`
      } else if (monthlySubMode.value === 'weekday') {
        const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
        rrule += `;BYDAY=${monthlyWeekNum.value}${days[monthlyWeekday.value - 1]}`
      }
    }

    if (repeatMode.value === 'yearly') {
      rrule += `;BYMONTH=${yearlyMonth.value};BYMONTHDAY=${yearlyDay.value}`
    }

    if (repeatEndDate.value) {
      const endDateFormatted = repeatEndDate.value.replace(/-/g, '')
      rrule += `;UNTIL=${endDateFormatted}`
    }

    console.log('[useRepeatRuleManager] RRULE 已生成:', rrule)
    return rrule
  }

  /**
   * 从 RRULE 字符串加载状态（反向解析）
   * @param {string} rrule - RRULE字符串
   */
  function loadFromRrule(rrule) {
    console.log('[loadFromRrule] 被调用，传入的 rrule:', rrule)

    if (!rrule) {
      console.log('[loadFromRrule] rrule 为空，执行 resetRepeatRule()')
      resetRepeatRule()
      return
    }

    // TODO: 实现完整的 RRULE 解析逻辑
    // 这里简化处理，仅识别基本格式
    const parts = rrule.split(';')
    parts.forEach((part) => {
      const [key, value] = part.split('=')
      if (key === 'FREQ') {
        repeatMode.value = value.toLowerCase()
        console.log('[loadFromRrule] 设置 repeatMode =', value.toLowerCase())
      } else if (key === 'INTERVAL') {
        repeatInterval.value = parseInt(value)
        console.log('[loadFromRrule] 设置 repeatInterval =', parseInt(value))
      }
      // ... 其他字段解析
    })

    console.log('[loadFromRrule] 解析完成，当前状态:', {
      repeatMode: repeatMode.value,
      repeatInterval: repeatInterval.value
    })
  }

  /**
   * 重置重复规则
   */
  function resetRepeatRule() {
    repeatMode.value = 'none'
    repeatInterval.value = 1
    repeatWeekDays.value = []
    repeatEndDate.value = ''
    monthlySubMode.value = 'day'
    monthlyDays.value = []
    monthlyWeekNum.value = 1
    monthlyWeekday.value = 1
    yearlyMonth.value = 1
    yearlyDay.value = 1
  }

  // ============================================================
  // 返回 API
  // ============================================================

  return {
    // 状态
    repeatMode,
    repeatInterval,
    repeatWeekDays,
    repeatEndDate,
    monthlySubMode,
    monthlyDays,
    monthlyWeekNum,
    monthlyWeekday,
    yearlyMonth,
    yearlyDay,

    // 计算属性
    repeatModeLabel,
    repeatDescription,  // ⭐ 新增：重复规则的中文描述

    // 方法
    toggleWeekDay,
    toggleMonthlyDay,
    generateRrule,
    loadFromRrule,
    resetRepeatRule
  }
}
