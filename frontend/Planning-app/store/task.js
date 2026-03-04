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
    getAllTasks
  }
})
