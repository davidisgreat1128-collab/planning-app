/**
 * 模板任务创建业务逻辑
 * 职责：从模板创建任务，处理任务批量生成逻辑
 *
 * ⭐ 2026-03-14 重构：使用 Repository 模式替代旧系统（uni.getStorageSync('tasks')）
 */

import TaskRepository from '@/repositories/TaskRepository'

/**
 * 模板任务创建Composable
 * @returns {object} 任务创建方法
 */
export function useTemplateTask() {
  /**
   * 从模板创建任务
   * @param {string} planId - 规划ID
   * @param {object} planForm - 规划表单数据
   * @param {object} templateData - 模板数据
   * @returns {Promise<number>} 创建的任务数量
   */
  async function createTasksFromTemplate(planId, planForm, templateData) {
    console.log('[useTemplateTask] 开始从模板创建任务')

    const startDate = new Date(planForm.startDate.replace(/\//g, '-'))
    const endDate = new Date(planForm.endDate.replace(/\//g, '-'))
    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

    let createdTaskCount = 0
    let currentDayTasks = [] // 当前使用的任务模板

    // 为每一天创建任务（从第1天到最后一天）
    for (let dayIndex = 1; dayIndex <= totalDays; dayIndex++) {
      // 检查这一天是否有特定的任务定义
      if (templateData.tasksByDay[dayIndex]) {
        // 使用这一天的任务定义
        currentDayTasks = templateData.tasksByDay[dayIndex]
        console.log(`[useTemplateTask] 第${dayIndex}天使用新任务模板:`, currentDayTasks.length, '个任务')
      } else if (currentDayTasks.length === 0 && dayIndex === 1) {
        // 如果第1天没有定义，尝试使用day1的任务，或者跳过
        console.warn(`[useTemplateTask] 模板没有定义第${dayIndex}天的任务，跳过`)
        continue
      }
      // 否则继续使用上一天的任务模板（延续重复任务）

      // 计算该天的实际日期
      const taskDate = new Date(startDate)
      taskDate.setDate(taskDate.getDate() + (dayIndex - 1))
      const taskDateStr = formatDateToYYYYMMDD(taskDate)  // ⭐ 改为YYYY-MM-DD格式

      // 为该天创建任务
      console.log(`  [useTemplateTask] 第${dayIndex}天有 ${currentDayTasks.length} 个任务`)
      for (const taskTemplate of currentDayTasks) {
        // ⭐ 使用 Repository 创建任务（自动生成ID，格式为 cat_xxx）
        const newTask = {
          title: taskTemplate.title,
          taskDate: taskDateStr,  // ⭐ 使用taskDate字段
          categoryId: planId,      // 关联到规划
          planId: null,            // 如果规划是plan类型，这里应该用planId
          status: 'pending',
          isUrgent: taskTemplate.isUrgent !== undefined ? taskTemplate.isUrgent : false,
          isImportant: taskTemplate.isImportant !== undefined ? taskTemplate.isImportant : true,
          isAllDay: true,          // 从模板创建的任务默认为全天任务
          startTime: null,
          endTime: null,
          description: taskTemplate.description || '',
          tags: []
        }

        console.log(`  [useTemplateTask] 准备创建第 ${createdTaskCount + 1} 个任务:`, {
          title: newTask.title,
          date: newTask.taskDate,
          dayIndex
        })

        await TaskRepository.create(newTask)
        createdTaskCount++

        console.log(`  [useTemplateTask] 第 ${createdTaskCount} 个任务创建完成`)
      }
    }

    console.log(`[useTemplateTask] 成功创建 ${createdTaskCount} 个任务，共 ${totalDays} 天`)

    uni.showToast({
      title: `已创建${createdTaskCount}个任务`,
      icon: 'success',
      duration: 2000
    })

    return createdTaskCount
  }

  /**
   * 格式化日期为 YYYY-MM-DD（Repository标准格式）
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    createTasksFromTemplate
  }
}
