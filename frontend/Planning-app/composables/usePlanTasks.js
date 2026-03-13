/**
 * 规划任务加载Composable
 * 职责：从localStorage和API加载规划相关任务，自动合并去重
 */
import { useTaskStore } from '@/store/task.js'
import { getTasks } from '@/api/task.js'

/**
 * 加载规划任务的Composable
 * @returns {object} 任务加载方法
 */
export function usePlanTasks() {
  const taskStore = useTaskStore()

  /**
   * 从localStorage和API加载任务，自动合并去重
   * @param {string} startDate - 开始日期（格式：yyyy/MM/dd 或 yyyy-MM-dd）
   * @param {string} endDate - 结束日期（格式：yyyy/MM/dd 或 yyyy-MM-dd）
   * @returns {Promise<Array>} 合并后的任务列表
   */
  async function loadTasks(startDate, endDate) {
    try {
      // 1. 从localStorage加载模板生成的任务
      let localTasks = []
      const savedTasks = uni.getStorageSync('tasks')
      if (savedTasks) {
        localTasks = JSON.parse(savedTasks)
      }

      // 2. 从后端API加载用户创建的任务（查询规划的日期范围）
      let apiTasks = []
      if (startDate && endDate) {
        // 将日期格式统一转换为 yyyy-MM-dd
        const startStr = startDate.replace(/\//g, '-')
        const endStr = endDate.replace(/\//g, '-')

        // 验证日期顺序：start 不能晚于 end
        const startDateObj = new Date(startStr)
        const endDateObj = new Date(endStr)

        if (startDateObj > endDateObj) {
          console.warn('[usePlanTasks] 日期顺序错误，startDate晚于endDate，跳过API加载:', { startStr, endStr })
          // 日期顺序错误时，只使用localStorage的任务，不调用API
        } else {
          try {
            const result = await getTasks({ start: startStr, end: endStr })

            if (result && result.taskMap) {
              // 后端返回格式: taskMap[date] = [task1, task2, ...] (每个task带_type字段)
              // 需要提取所有日期的所有任务
              apiTasks = Object.values(result.taskMap).flatMap(dayTasks => {
                if (Array.isArray(dayTasks) && dayTasks.length > 0) {
                  return dayTasks
                }
                return []
              })
            }
          } catch (apiError) {
            console.error('[usePlanTasks] API加载任务失败:', apiError)
            // 继续执行，只使用localStorage的任务
          }
        }
      }

      // 3. 合并两个来源的任务（避免重复）
      const allTasks = [...localTasks]
      const localIds = new Set(localTasks.map(t => String(t.id)))

      for (const apiTask of apiTasks) {
        const taskId = String(apiTask.id)
        if (!localIds.has(taskId)) {
          allTasks.push(apiTask)
        }
      }

      // 更新taskStore
      taskStore.tasks = allTasks

      return allTasks
    } catch (e) {
      console.error('[usePlanTasks] 加载任务失败:', e)
      return []
    }
  }

  return {
    loadTasks
  }
}
