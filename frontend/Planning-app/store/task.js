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
import * as taskApi from '@/api/task' // ⭐ 新增：用于调用后端API

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
  // ⭐ 事件订阅机制（2026-03-14 新增）
  // ============================================================

  /**
   * 初始化事件订阅（Store 创建时自动调用）
   *
   * 订阅 TaskRepository 的数据变化事件，自动更新 tasks.value
   *
   * @private
   */
  function _initEventSubscription() {
    TaskRepository.subscribe((event, data) => {
      // ⭐⭐⭐ 详细日志：追踪事件处理
      console.log('========================================')
      console.log(`[taskStore] 收到 Repository 事件: ${event}`)
      console.log('  事件时间:', new Date().toISOString())
      console.log('  当前选中日期:', selectedDate.value)
      console.log('  当前列表任务数:', tasks.value.length)
      if (data) {
        console.log('  事件数据:', {
          id: data.id,
          title: data.title,
          taskDate: data.taskDate,
          categoryId: data.categoryId
        })
      }

      switch (event) {
        case 'create':
          console.log('  [create事件] 开始处理')
          // 如果新任务属于当前选中日期，自动添加到列表
          if (selectedDate.value && data.taskDate) {
            const taskDate = new Date(data.taskDate).toISOString().split('T')[0]
            console.log('  任务日期:', taskDate, '当前选中:', selectedDate.value)
            if (taskDate === selectedDate.value) {
              console.log('  ⭐ 任务属于当前日期，添加到列表')
              console.log('  添加前列表长度:', tasks.value.length)
              tasks.value.push(data)
              console.log('  添加后列表长度:', tasks.value.length)
              console.log('  [taskStore] 自动添加新任务到列表:', data.title || data.id)
            } else {
              console.log('  ✖ 任务不属于当前日期，不添加')
            }
          } else {
            console.log('  ✖ selectedDate 或 taskDate 为空，不添加')
            console.log('    selectedDate.value:', selectedDate.value)
            console.log('    data.taskDate:', data.taskDate)
          }
          break

        case 'update':
          // 查找并更新对应任务
          const updateIndex = tasks.value.findIndex(t => t.id === data.id)
          if (updateIndex > -1) {
            tasks.value[updateIndex] = data
            console.log('[taskStore] 自动更新任务:', data.title || data.id)
          } else {
            // 如果更新后的任务属于当前日期，但列表中没有，添加它
            if (selectedDate.value && data.taskDate) {
              const taskDate = new Date(data.taskDate).toISOString().split('T')[0]
              if (taskDate === selectedDate.value) {
                tasks.value.push(data)
                console.log('[taskStore] 更新后任务进入当前日期，自动添加:', data.title || data.id)
              }
            }
          }
          break

        case 'delete':
          // 从列表中移除已删除任务
          const deleteIndex = tasks.value.findIndex(t => t.id === data.id)
          if (deleteIndex > -1) {
            tasks.value.splice(deleteIndex, 1)
            console.log('[taskStore] 自动移除已删除任务:', data.id)
          }
          break

        case 'hydrate':
          // hydrate 完成：重新加载当前日期任务
          if (selectedDate.value) {
            tasks.value = TaskRepository.getByDate(selectedDate.value)
            console.log('[taskStore] hydrate 完成，自动刷新列表，任务数:', tasks.value.length)
          }
          break

        default:
          console.warn(`[taskStore] 未知事件类型: ${event}`)
      }

      console.log('  [taskStore] 事件处理完成，最终列表任务数:', tasks.value.length)
      console.log('========================================')
    })

    console.log('[taskStore] 事件订阅已初始化')
  }

  // ⭐ Store 初始化时自动订阅事件
  _initEventSubscription()

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
    // ⭐ 无需手动刷新，Repository 会发布 'hydrate' 事件，自动触发刷新
  }

  /**
   * 加载指定日期的任务
   * ⭐ BUG修复（2026-03-15）：调用后端API获取任务，支持重复任务实时计算
   *
   * @param {string} date - 日期字符串（YYYY-MM-DD）
   * @returns {Promise<void>}
   */
  async function fetchTasksByDate(date) {
    loading.value = true
    selectedDate.value = date

    try {
      // ⭐ 调用后端 API 获取任务（包含重复任务的 RRULE 实时计算）
      const response = await taskApi.getTasks({ date })

      console.log('[TaskStore] fetchTasksByDate - 后端返回:', response)

      // 处理后端返回的 { single, range, recurring } 三分结构
      const { single = [], range = [], recurring = [] } = response.data || {}

      // 合并三种类型的任务
      const allTasks = [...single, ...range, ...recurring]

      console.log('[TaskStore] fetchTasksByDate - 合并后任务数:', allTasks.length)
      console.log('  - 单日任务:', single.length)
      console.log('  - 跨天任务:', range.length)
      console.log('  - 重复任务:', recurring.length)

      // ⭐ 同步到本地 Repository（更新缓存）
      allTasks.forEach(task => {
        // 检查任务是否已存在
        const existingTask = TaskRepository.getById(task.id)
        if (!existingTask) {
          // 新任务：直接添加到缓存
          TaskRepository.memoryCache.set(task.id, task)
          console.log('[TaskStore] 新任务已添加到缓存:', task.id, task.title)
        } else if (task.updatedAt > existingTask.updatedAt) {
          // 任务已存在但服务器版本更新：覆盖本地缓存
          TaskRepository.memoryCache.set(task.id, task)
          console.log('[TaskStore] 任务缓存已更新（服务器版本更新）:', task.id, task.title)
        }
      })

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

    // ⭐ 无需手动更新 tasks.value，Repository 会发布 'create' 事件，自动触发更新

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

    // ⭐ 无需手动更新 tasks.value，Repository 会发布 'update' 事件，自动触发更新

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
   * 批量更新任务的子任务列表
   *
   * @param {string} taskId - 任务 ID
   * @param {Array} subtasks - 新的子任务数组 [{title, isDone}, ...]
   * @returns {Promise<object>} 更新后的任务对象
   */
  async function updateTaskSubtasks(taskId, subtasks) {
    const updated = await TaskRepository.update(taskId, { subtasks })

    // ⭐ 无需手动更新 tasks.value，Repository 会发布 'update' 事件，自动触发更新

    return updated
  }

  /**
   * 完成今日重复任务实例
   * 逻辑：仅标记今日实例为完成，不影响其他日期的实例
   *
   * ⚠️ 注意：这是临时简化方案，后端尚未实现重复任务实例分离
   * 当前实现：直接更新任务状态为 completed
   * TODO: 待后端实现重复任务实例管理后，改为更新特定日期实例
   *
   * @param {string} taskId - 重复任务 ID
   * @returns {Promise<void>}
   */
  async function completeRecurringTaskToday(taskId) {
    // 临时方案：直接更新任务状态（视觉效果同普通任务完成）
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await updateTask(taskId, { status: newStatus })

    // TODO: 后端实现后改为以下逻辑：
    // const todayDate = selectedDate.value
    // await TaskRepository.completeRecurringInstance(taskId, todayDate)
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
   * 清空所有无分类的任务（区分普通任务和重复任务）
   * ⭐ 架构升级（2026-03-15）：删除重复任务时会级联删除 completion_records
   *
   * @returns {Promise<void>}
   *
   * 使用场景：用户点击"清空无分类任务"
   *
   * 清空流程：
   * 1. 获取所有任务
   * 2. 筛选出 categoryId=null 且 planId=null 的任务
   * 3. 删除这些任务（后端 DELETE /tasks/:id 会级联删除 completion_records）
   * 4. 刷新当前任务列表
   */
  async function clearUncategorizedTasks() {
    console.log('[TaskStore] 清空无分类任务');

    // 1. 获取所有任务
    const allTasks = TaskRepository.getAll();

    // 2. 筛选无分类任务（categoryId=null 且 planId=null）
    const uncategorizedTasks = allTasks.filter(
      t => (t.categoryId === null || t.categoryId === undefined) &&
           (t.planId === null || t.planId === undefined)
    );

    console.log('[TaskStore] 找到无分类任务数量:', uncategorizedTasks.length);

    // 3. 删除无分类任务（区分任务类型，便于调试）
    const recurringCount = uncategorizedTasks.filter(t => t.isRecurring).length;
    const regularCount = uncategorizedTasks.length - recurringCount;

    console.log(`[TaskStore] 任务分类：普通任务${regularCount}个，重复任务${recurringCount}个`);

    for (const task of uncategorizedTasks) {
      try {
        if (task.isRecurring) {
          // ✅ 重复任务：删除任务定义（后端会级联删除 completion_records）
          console.log('[TaskStore] 删除重复任务（含完成记录）:', task.id, task.title);
        } else {
          // ✅ 普通任务：直接删除
          console.log('[TaskStore] 删除普通任务:', task.id, task.title);
        }

        // 统一调用 Repository.delete（后端会处理级联删除）
        await TaskRepository.delete(task.id);

      } catch (e) {
        console.error('[TaskStore] 删除任务失败:', task.id, e);
      }
    }

    // 4. 如果当前页面正在显示任务，重新加载当前日期的任务
    if (selectedDate.value) {
      await fetchTasksByDate(selectedDate.value);
    }

    console.log('[TaskStore] 清空无分类任务完成');
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
    updateTaskSubtasks,              // 新增：批量更新子任务
    completeRecurringTaskToday,      // 新增：完成重复任务今日实例

    // ⭐ 诊断工具
    diagnoseOrphanTasks
  }
})
