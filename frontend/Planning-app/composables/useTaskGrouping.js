/**
 * 任务分组业务逻辑
 * 职责：将任务按日期分组、排序、格式化显示
 */

import { computed } from 'vue'
import { formatDateDisplay } from '@/utils/planDate.js'

/**
 * 任务按日期分组Composable
 * @param {object} tasks - 任务数组（响应式）
 * @returns {object} 分组后的任务数据
 */
export function useTaskGrouping(tasks) {
  /**
   * 按日期分组的任务（计算属性）
   */
  const tasksByDate = computed(() => {
    const grouped = {}

    tasks.value.forEach(task => {
      // 兼容多种日期字段: taskDate(API) / occurDate(重复任务) / date(localStorage)
      const date = task.taskDate || task.occurDate || task.date
      if (!date) return

      // 日期格式统一转换为 yyyy-MM-dd
      const normalizedDate = date.replace(/\//g, '-')

      if (!grouped[normalizedDate]) {
        grouped[normalizedDate] = []
      }
      grouped[normalizedDate].push(task)
    })

    // 转换为数组并按日期排序
    return Object.keys(grouped)
      .sort() // 日期升序排序
      .map(date => ({
        date,
        dateDisplay: formatDateDisplay(date),
        // 每个日期内的任务也按时间排序（有startTime的在前，按时间升序；无时间的在后）
        tasks: grouped[date].sort((a, b) => {
          const aHasTime = !!a.startTime
          const bHasTime = !!b.startTime

          // 都有时间：按时间排序
          if (aHasTime && bHasTime) {
            return a.startTime.localeCompare(b.startTime)
          }
          // 有时间的排在前面
          if (aHasTime) return -1
          if (bHasTime) return 1
          // 都没有时间：保持原顺序（或按创建时间）
          return 0
        })
      }))
  })

  return {
    tasksByDate
  }
}
