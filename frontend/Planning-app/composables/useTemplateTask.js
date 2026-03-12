/**
 * 模板任务创建业务逻辑
 * 职责：从模板创建任务，处理任务批量生成逻辑
 */

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

    // 加载现有任务
    const savedTasks = uni.getStorageSync('tasks')
    let tasks = []
    if (savedTasks) {
      try {
        tasks = JSON.parse(savedTasks)
      } catch (e) {
        console.error('[useTemplateTask] 解析任务失败:', e)
      }
    }

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
      const taskDateStr = formatDate(taskDate)

      // 为该天创建任务
      currentDayTasks.forEach((taskTemplate, index) => {
        const newTask = {
          id: `task_${Date.now()}_${dayIndex}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          title: taskTemplate.title,
          date: taskDateStr,
          occurDate: taskDateStr,
          categoryId: planId, // 关联到规划
          iconEmoji: planForm.iconEmoji || '🔔',
          status: 'pending',
          isUrgent: taskTemplate.isUrgent !== undefined ? taskTemplate.isUrgent : false,
          isImportant: taskTemplate.isImportant !== undefined ? taskTemplate.isImportant : true,
          isRecurring: taskTemplate.isRepeat || false,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        }

        tasks.push(newTask)
        createdTaskCount++
      })
    }

    // 保存任务
    uni.setStorageSync('tasks', JSON.stringify(tasks))
    console.log(`[useTemplateTask] 成功创建 ${createdTaskCount} 个任务，共 ${totalDays} 天`)

    uni.showToast({
      title: `已创建${createdTaskCount}个任务`,
      icon: 'success',
      duration: 2000
    })

    return createdTaskCount
  }

  /**
   * 格式化日期为 yyyy/MM/dd
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  return {
    createTasksFromTemplate
  }
}
