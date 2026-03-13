/**
 * 规划任务生成器 Composable
 *
 * 职责：从规划的里程碑生成任务对象，供日历展示使用
 *
 * ⚠️ 当前实现方案：
 * - 前端临时生成任务对象（不调用后端API，不持久化到数据库）
 * - 仅用于日历页面的视觉展示
 * - 规划任务ID格式：plan_{planId}_milestone_{index}
 *
 * 🔮 未来规划：
 * - 改为后端API生成真实任务记录
 * - 任务持久化到数据库
 * - 支持任务的完整CRUD操作
 *
 * @author Claude
 * @date 2026-03-13
 * @version 1.0.0
 */

import { ref, computed } from 'vue'
import { useCategoryStore } from '@/store/category.js'

/**
 * 规划任务生成器 Composable
 * @returns {object} 生成的任务列表和方法
 */
export function usePlanTaskGenerator() {
  // ============================================================
  // 1. Store 引用
  // ============================================================
  const categoryStore = useCategoryStore()

  // ============================================================
  // 2. 响应式状态
  // ============================================================

  /**
   * 规划生成的任务列表（临时存储，不持久化）
   * 每次选中规划时重新生成
   */
  const generatedTasks = ref([])

  // ============================================================
  // 3. 核心方法
  // ============================================================

  /**
   * 从规划生成任务
   * @param {object} plan - 规划对象
   */
  function generateTasksFromPlan(plan) {
    if (!plan || !plan.milestones || plan.milestones.length === 0) {
      generatedTasks.value = []
      console.log('[usePlanTaskGenerator] 规划无里程碑，清空任务')
      return
    }

    console.log('[usePlanTaskGenerator] 从规划生成任务:', plan.title || plan.name)

    generatedTasks.value = plan.milestones.map((milestone, index) => {
      // 将日期从 YYYY/MM/DD 转换为 YYYY-MM-DD
      const dateStr = milestone.date.replace(/\//g, '-')

      return {
        // ============ 任务ID（使用规划ID + 里程碑索引）============
        id: `plan_${plan.id}_milestone_${index}`,

        // ============ 基本信息 ============
        title: milestone.title,
        description: milestone.description || '',

        // ============ 日期和时间 ============
        date: dateStr,
        isAllDay: true,
        startTime: null,
        endTime: null,

        // ============ 四象限属性（默认：重要不紧急 - 第二象限 - 蓝色）============
        isUrgent: false,
        isImportant: true,

        // ============ 状态 ============
        status: milestone.isCompleted ? 'completed' : 'pending',

        // ============ 来源标记 ============
        fromPlan: true,
        planId: plan.id,
        milestoneIndex: index,

        // ============ 其他字段（兼容任务结构）============
        categoryId: null,
        reminder: null,
        repeatType: null,
        notes: `来自规划：${plan.title || plan.name}\n${milestone.days}`,

        // ============ 时间戳 ============
        createTime: plan.createTime || new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
    })

    console.log('[usePlanTaskGenerator] 生成任务数量:', generatedTasks.value.length)
  }

  /**
   * 清空生成的任务
   */
  function clearGeneratedTasks() {
    generatedTasks.value = []
    console.log('[usePlanTaskGenerator] 已清空生成的任务')
  }

  /**
   * 按日期获取规划任务
   * @param {string} dateStr - YYYY-MM-DD 格式的日期字符串
   * @returns {array} 该日期的任务列表
   */
  function getTasksByDate(dateStr) {
    return generatedTasks.value.filter(t => t.date === dateStr)
  }

  /**
   * 完成规划任务（更新里程碑状态）
   * @param {string} taskId - 任务ID（格式：plan_{planId}_milestone_{index}）
   */
  function completePlanTask(taskId) {
    const task = generatedTasks.value.find(t => t.id === taskId)
    if (!task) {
      console.warn('[usePlanTaskGenerator] 未找到任务:', taskId)
      return
    }

    // 更新任务状态
    task.status = 'completed'

    // 更新规划中的里程碑状态
    const plan = categoryStore.getCategoryById(task.planId)
    if (plan && plan.milestones && plan.milestones[task.milestoneIndex]) {
      plan.milestones[task.milestoneIndex].isCompleted = true

      // 重新计算完成的里程碑数量
      const completedCount = plan.milestones.filter(m => m.isCompleted).length

      // 更新规划的统计数据
      categoryStore.updatePlan(task.planId, {
        milestones: plan.milestones,
        stats: {
          ...plan.stats,
          completedMilestones: completedCount
        }
      })

      console.log('[usePlanTaskGenerator] 已完成任务:', taskId, '完成数:', completedCount)
    }
  }

  /**
   * 获取所有生成的任务（计算属性）
   */
  const allGeneratedTasks = computed(() => generatedTasks.value)

  // ============================================================
  // 4. 返回公开接口
  // ============================================================

  return {
    // 状态（计算属性）
    generatedTasks: allGeneratedTasks,

    // 方法
    generateTasksFromPlan,
    clearGeneratedTasks,
    getTasksByDate,
    completePlanTask
  }
}
