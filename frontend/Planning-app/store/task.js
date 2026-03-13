/**
 * Task Store - 任务状态管理
 *
 * 职责：
 * - 全局任务状态管理（Pinia）
 * - 调用 TaskRepository 的方法
 * - 提供计算属性（四象限分类、时间轴任务）
 * - 管理当前选中日期的任务
 *
 * 重构说明：
 * - 原方法：直接调用 API（import { getTasks, createTask, ... } from '@/api/task.js'）
 * - 新方法：调用 TaskRepository（三层架构）
 * - 保留：所有计算属性（urgentImportant、notUrgentImportant 等）
 * - 保留：fetchTasksByDate 等业务逻辑
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04（重构为三层架构）
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import TaskRepository from '@/repositories/TaskRepository'

export const useTaskStore = defineStore('task', () => {
  // ============================================================
  // 状态
  // ============================================================

  /** 当前日期的任务列表 */
  const tasks = ref([])

  /** 加载状态 */
  const loading = ref(false)

  /** 当前选中日期 YYYY-MM-DD */
  const selectedDate = ref('')

  // ============================================================
  // 计算属性（四象限分类）
  // ============================================================

  /** 第一象限：紧急且重要（危机处理）- 红色 */
  const urgentImportant = computed(() =>
    tasks.value.filter(t => t.isUrgent && t.isImportant && t.status !== 'completed')
  )

  /** 第二象限：重要不紧急（规划区）- 蓝色 */
  const notUrgentImportant = computed(() =>
    tasks.value.filter(t => !t.isUrgent && t.isImportant && t.status !== 'completed')
  )

  /** 第三象限：紧急不重要（琐事区）- 黄色 */
  const urgentNotImportant = computed(() =>
    tasks.value.filter(t => t.isUrgent && !t.isImportant && t.status !== 'completed')
  )

  /** 第四象限：不紧急不重要（消遣区）- 绿色 */
  const notUrgentNotImportant = computed(() =>
    tasks.value.filter(t => !t.isUrgent && !t.isImportant && t.status !== 'completed')
  )

  /** 已完成任务 */
  const doneTasks = computed(() =>
    tasks.value.filter(t => t.status === 'completed')
  )

  /** 时间轴视图（非全天、有 startTime 的任务，按时间排序） */
  const timelineTasks = computed(() => {
    return [...tasks.value]
      .filter(t => !t.isAllDay && t.startTime && t.status !== 'completed')
      .sort((a, b) => {
        if (a.startTime < b.startTime) return -1
        if (a.startTime > b.startTime) return 1
        return 0
      })
  })

  /** 全天任务（isAllDay=true，不显示在时间轴） */
  const allDayTasks = computed(() => {
    return tasks.value.filter(t => t.isAllDay && t.status !== 'completed')
  })

  // ============================================================
  // 方法
  // ============================================================

  /**
   * 启动时加载数据
   *
   * 必须在 App.vue 的 onLaunch 中调用：
   * ```javascript
   * import { useTaskStore } from '@/store/task'
   *
   * export default {
   *   async onLaunch() {
   *     const taskStore = useTaskStore()
   *     await taskStore.hydrate()
   *   }
   * }
   * ```
   *
   * @returns {Promise<void>}
   */
  async function hydrate() {
    await TaskRepository.hydrate()
  }

  /**
   * 加载指定日期的任务
   *
   * @param {string} date - 日期字符串（YYYY-MM-DD）
   * @returns {Promise<void>}
   */
  async function fetchTasksByDate(date) {
    loading.value = true
    selectedDate.value = date

    try {
      // 从 Repository 获取该日期的所有任务
      const allTasks = TaskRepository.getByDate(date)

      // TODO: 当前 Repository 只返回本地缓存，未来需要从服务器获取
      // const res = await taskApi.getTasks({ date })
      // 处理后端返回的 { single, range, recurring } 三分结构

      tasks.value = allTasks
    } catch (err) {
      console.error('[TaskStore] 加载任务失败', err)
      tasks.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建任务
   *
   * @param {object} data - 任务数据
   * @returns {Promise<object>} 创建的任务对象
   */
  async function addTask(data) {
    const newTask = await TaskRepository.create(data)

    // 如果新任务属于当前选中日期，添加到列表
    if (selectedDate.value) {
      const taskDate = new Date(newTask.taskDate).toISOString().split('T')[0]
      if (taskDate === selectedDate.value) {
        tasks.value.push(newTask)
      }
    }

    return newTask
  }

  /**
   * 更新任务
   *
   * @param {string} id - 任务 ID
   * @param {object} data - 要更新的字段
   * @returns {Promise<object>} 更新后的任务对象
   */
  async function updateTask(id, data) {
    const updated = await TaskRepository.update(id, data)

    // 更新本地列表中的任务
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = updated
    }

    return updated
  }

  /**
   * 切换任务完成状态
   *
   * @param {string} id - 任务 ID
   * @returns {Promise<void>}
   */
  async function toggleDone(id) {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await updateTask(id, { status: newStatus })
  }

  /**
   * 删除任务
   *
   * @param {string} id - 任务 ID
   * @returns {Promise<void>}
   */
  async function removeTask(id) {
    await TaskRepository.delete(id)

    // 从本地列表移除
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  /**
   * 更新任务的象限（拖拽后调用）
   *
   * @param {string} id - 任务 ID
   * @param {boolean} isUrgent - 是否紧急
   * @param {boolean} isImportant - 是否重要
   * @returns {Promise<void>}
   */
  async function updateQuadrant(id, isUrgent, isImportant) {
    await updateTask(id, { isUrgent, isImportant })
  }

  /**
   * 批量更新任务
   *
   * @param {Array<object>} updates - 更新数组 [{ id, data }, ...]
   * @returns {Promise<void>}
   */
  async function batchUpdate(updates) {
    for (const { id, data } of updates) {
      await updateTask(id, data)
    }
  }

  /**
   * 清空当前日期的任务列表
   */
  function clearTasks() {
    tasks.value = []
    selectedDate.value = ''
  }

  /**
   * 手动同步到服务器
   *
   * @returns {Promise<void>}
   */
  async function sync() {
    await TaskRepository.sync()
  }

  /**
   * 获取任务详情（按 ID）
   *
   * @param {string} id - 任务 ID
   * @returns {object|null}
   */
  function getTaskById(id) {
    return TaskRepository.getById(id)
  }

  /**
   * 获取所有任务（从 Repository）
   *
   * @returns {Array<object>}
   */
  function getAllTasks() {
    return TaskRepository.getAll()
  }

  /**
   * 规划删除后，处理关联任务
   *
   * @param {string} planId - 规划ID
   * @param {boolean} deleteWithTasks - true=删除任务，false=改为无分类
   *
   * 迁移自：store/plan.js:112-221
   *
   * 职责：
   * - 查找所有属于该规划的任务（支持 categoryId 和 planId）
   * - 根据 deleteWithTasks 参数决定删除任务 或 改为无分类
   * - 通过 TaskRepository 执行数据操作
   */
  async function updateTasksAfterPlanDelete(planId, deleteWithTasks) {
    console.log('[TaskStore] 处理规划删除后的关联任务，planId:', planId, 'deleteWithTasks:', deleteWithTasks)

    // 1. 从 TaskRepository 获取所有任务
    const allTasks = TaskRepository.getAll()

    // 2. 筛选出属于该规划的任务（支持 categoryId 和 planId）
    const planTasks = allTasks.filter(t =>
      t.categoryId === planId || t.planId === planId
    )

    console.log('[TaskStore] 找到关联任务数量:', planTasks.length)

    if (deleteWithTasks) {
      // ============ 场景A：删除该规划下的所有任务 ============
      console.log('[TaskStore] 删除规划下的所有任务')

      for (const task of planTasks) {
        try {
          await TaskRepository.delete(task.id)
          console.log('[TaskStore] 已删除任务:', task.id)
        } catch (e) {
          console.error('[TaskStore] 删除任务失败:', task.id, e)
        }
      }
    } else {
      // ============ 场景B：将任务改为无分类（保留任务）============
      console.log('[TaskStore] 将规划下的任务改为无分类')

      for (const task of planTasks) {
        try {
          await TaskRepository.update(task.id, {
            categoryId: null,
            planId: null
          })
          console.log('[TaskStore] 任务已改为无分类:', task.id)
        } catch (e) {
          console.error('[TaskStore] 更新任务失败:', task.id, e)
        }
      }
    }

    // 3. 如果当前页面正在显示任务，重新加载当前日期的任务
    if (selectedDate.value) {
      await fetchTasksByDate(selectedDate.value)
    }

    console.log('[TaskStore] 规划关联任务处理完成')
  }

  /**
   * 清空所有分类和规划后的任务处理
   *
   * @param {boolean} deleteAllTasks - true=删除所有任务，false=所有任务改为无分类
   * @returns {Promise<void>}
   *
   * 使用场景：用户点击"清空所有规划和分类"
   *
   * 清空流程：
   * 1. 获取所有任务
   * 2. 根据 deleteAllTasks 参数决定：
   *    - true：删除所有任务
   *    - false：所有任务的 categoryId 和 planId 改为 null
   * 3. 刷新当前任务列表
   */
  async function clearAllCategoriesAndPlansTasks(deleteAllTasks) {
    console.log('[TaskStore] 处理清空所有分类后的任务，deleteAllTasks:', deleteAllTasks)

    // 1. 获取所有任务
    const allTasks = TaskRepository.getAll()
    console.log('[TaskStore] 找到任务总数:', allTasks.length)

    if (deleteAllTasks) {
      // ============ 场景A：删除所有任务 ============
      console.log('[TaskStore] 删除所有任务')

      for (const task of allTasks) {
        try {
          await TaskRepository.delete(task.id)
          console.log('[TaskStore] 已删除任务:', task.id)
        } catch (e) {
          console.error('[TaskStore] 删除任务失败:', task.id, e)
        }
      }
    } else {
      // ============ 场景B：所有任务改为无分类 ============
      console.log('[TaskStore] 所有任务改为无分类')

      for (const task of allTasks) {
        try {
          await TaskRepository.update(task.id, {
            categoryId: null,
            planId: null
          })
          console.log('[TaskStore] 任务已改为无分类:', task.id)
        } catch (e) {
          console.error('[TaskStore] 更新任务失败:', task.id, e)
        }
      }
    }

    // 3. 如果当前页面正在显示任务，重新加载当前日期的任务
    if (selectedDate.value) {
      await fetchTasksByDate(selectedDate.value)
    }

    console.log('[TaskStore] 清空所有分类后的任务处理完成')
  }

  /**
   * 清空所有无分类的任务
   *
   * @returns {Promise<void>}
   *
   * 使用场景：用户点击"清空无分类任务"
   *
   * 清空流程：
   * 1. 获取所有任务
   * 2. 筛选出 categoryId=null 且 planId=null 的任务
   * 3. 删除这些任务
   * 4. 刷新当前任务列表
   */
  async function clearUncategorizedTasks() {
    console.log('[TaskStore] 清空无分类任务')

    // 1. 获取所有任务
    const allTasks = TaskRepository.getAll()

    // 2. 筛选无分类任务（categoryId=null 且 planId=null）
    const uncategorizedTasks = allTasks.filter(
      t => (t.categoryId === null || t.categoryId === undefined) &&
           (t.planId === null || t.planId === undefined)
    )

    console.log('[TaskStore] 找到无分类任务数量:', uncategorizedTasks.length)

    // 3. 删除无分类任务
    for (const task of uncategorizedTasks) {
      try {
        await TaskRepository.delete(task.id)
        console.log('[TaskStore] 已删除无分类任务:', task.id)
      } catch (e) {
        console.error('[TaskStore] 删除任务失败:', task.id, e)
      }
    }

    // 4. 如果当前页面正在显示任务，重新加载当前日期的任务
    if (selectedDate.value) {
      await fetchTasksByDate(selectedDate.value)
    }

    console.log('[TaskStore] 清空无分类任务完成')
  }

  /**
   * ⭐ 诊断函数：检查孤儿任务（任务的 categoryId/planId 指向已删除的分类）
   *
   * @returns {object} 诊断报告
   *
   * 使用方式：
   * ```javascript
   * const report = taskStore.diagnoseOrphanTasks()
   * console.log(report)
   * ```
   */
  function diagnoseOrphanTasks() {
    const allTasks = TaskRepository.getAll()
    const allCategories = require('@/repositories/CategoryRepository').default.getAll()

    console.log('[TaskStore] 诊断孤儿任务:')
    console.log(`  总任务数: ${allTasks.length}`)
    console.log(`  总分类数: ${allCategories.length}`)

    // 提取所有有效的 categoryId 和 planId
    const validCategoryIds = new Set(allCategories.map(c => c.id))

    // 检查每个任务
    const orphanTasks = []
    allTasks.forEach(task => {
      let isOrphan = false
      let reason = ''

      if (task.categoryId && !validCategoryIds.has(task.categoryId)) {
        isOrphan = true
        reason = `categoryId=${task.categoryId} 指向的分类不存在`
      }

      if (task.planId && !validCategoryIds.has(task.planId)) {
        isOrphan = true
        reason += (reason ? '; ' : '') + `planId=${task.planId} 指向的规划不存在`
      }

      if (isOrphan) {
        orphanTasks.push({
          id: task.id,
          title: task.title,
          categoryId: task.categoryId,
          planId: task.planId,
          reason
        })
        console.log(`  ⚠️ 孤儿任务: id=${task.id}, title=${task.title}, ${reason}`)
      }
    })

    const report = {
      totalTasks: allTasks.length,
      totalCategories: allCategories.length,
      orphanTasks,
      orphanCount: orphanTasks.length
    }

    console.log(`  发现孤儿任务: ${orphanTasks.length} 个`)
    return report
  }

  // ============================================================
  // 导出
  // ============================================================

  return {
    // 状态
    tasks,
    loading,
    selectedDate,

    // 计算属性（四象限）
    urgentImportant,
    notUrgentImportant,
    urgentNotImportant,
    notUrgentNotImportant,
    doneTasks,
    timelineTasks,
    allDayTasks,

    // 方法
    hydrate,
    fetchTasksByDate,
    addTask,
    updateTask,
    toggleDone,
    removeTask,
    updateQuadrant,
    batchUpdate,
    clearTasks,
    sync,
    getTaskById,
    getAllTasks,
    updateTasksAfterPlanDelete,
    clearAllCategoriesAndPlansTasks,
    clearUncategorizedTasks,

    // ⭐ 诊断工具
    diagnoseOrphanTasks
  }
})
