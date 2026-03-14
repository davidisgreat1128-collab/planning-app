/**
 * useSubtaskModal - 子任务模态框业务逻辑
 *
 * 职责：
 * - 管理模态框显示/隐藏状态
 * - 处理主任务和子任务的双向联动逻辑
 * - 调用 taskStore 更新任务数据
 *
 * 使用场景：
 * - 复杂交互逻辑（模态框状态机）
 * - 多步骤业务流程（双向联动）
 * - 需要协调 Store 调用
 *
 * 双向联动规则：
 * 1. 主任务勾选 → 所有子任务自动勾选
 * 2. 主任务取消勾选 → 所有子任务自动取消勾选
 * 3. 所有子任务勾选 → 主任务自动勾选
 * 4. 某个子任务取消勾选（且主任务已完成）→ 主任务自动取消勾选
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-14
 */

import { ref } from 'vue'
import { useTaskStore } from '@/store/task'

export function useSubtaskModal() {
  // ============================================================
  // 引入 Store
  // ============================================================
  const taskStore = useTaskStore()

  // ============================================================
  // 响应式状态
  // ============================================================

  /** 模态框是否可见 */
  const isModalVisible = ref(false)

  /** 当前操作的任务对象 */
  const currentTask = ref(null)

  // ============================================================
  // 方法
  // ============================================================

  /**
   * 打开子任务模态框
   * @param {object} task - 任务对象
   */
  function openModal(task) {
    console.log('[useSubtaskModal] 打开子任务模态框:', task.id, task.title)
    currentTask.value = task
    isModalVisible.value = true
  }

  /**
   * 关闭子任务模态框
   */
  function closeModal() {
    console.log('[useSubtaskModal] 关闭子任务模态框')
    isModalVisible.value = false
    // 延迟清空，避免关闭动画期间数据闪烁
    setTimeout(() => {
      currentTask.value = null
    }, 300)
  }

  /**
   * 处理主任务勾选
   * 逻辑：主任务勾选 → 所有子任务也勾选
   *
   * @param {object} task - 任务对象
   */
  async function handleMainTaskToggle(task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const isCompleting = newStatus === 'completed'

    console.log('[useSubtaskModal] 主任务勾选切换:', {
      taskId: task.id,
      oldStatus: task.status,
      newStatus: newStatus,
      isCompleting: isCompleting
    })

    try {
      // 更新主任务状态
      await taskStore.updateTask(task.id, { status: newStatus })

      // 如果有子任务，同步更新所有子任务
      if (task.subtasks && task.subtasks.length > 0) {
        console.log(`[useSubtaskModal] 同步更新 ${task.subtasks.length} 个子任务状态:`, isCompleting ? '完成' : '未完成')

        const updatedSubtasks = task.subtasks.map(st => ({
          ...st,
          isDone: isCompleting // 主任务完成 → 所有子任务完成
        }))

        await taskStore.updateTaskSubtasks(task.id, updatedSubtasks)
      }

      // 刷新任务列表
      await taskStore.fetchTasksByDate(taskStore.selectedDate)

      uni.showToast({
        title: isCompleting ? '任务已完成' : '任务已恢复',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('[useSubtaskModal] 主任务勾选切换失败:', error)
      uni.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  /**
   * 处理子任务勾选
   * 逻辑：
   * 1. 切换指定子任务的完成状态
   * 2. 如果所有子任务都完成 → 主任务自动完成
   * 3. 如果主任务已完成但某个子任务未完成 → 主任务自动取消完成
   *
   * @param {object} task - 任务对象
   * @param {number} index - 子任务索引
   */
  async function handleSubtaskToggle(task, index) {
    if (!task.subtasks || index < 0 || index >= task.subtasks.length) {
      console.warn('[useSubtaskModal] 子任务索引无效:', index)
      return
    }

    console.log('[useSubtaskModal] 子任务勾选切换:', {
      taskId: task.id,
      subtaskIndex: index,
      subtaskTitle: task.subtasks[index].title,
      oldStatus: task.subtasks[index].isDone
    })

    try {
      // 复制子任务数组，切换指定子任务的状态
      const updatedSubtasks = [...task.subtasks]
      updatedSubtasks[index] = {
        ...updatedSubtasks[index],
        isDone: !updatedSubtasks[index].isDone
      }

      // 更新子任务列表
      await taskStore.updateTaskSubtasks(task.id, updatedSubtasks)

      // 检查是否所有子任务都完成
      const allSubtasksCompleted = updatedSubtasks.every(st => st.isDone)
      const currentStatus = task.status

      console.log('[useSubtaskModal] 子任务完成状态检查:', {
        allCompleted: allSubtasksCompleted,
        mainTaskStatus: currentStatus
      })

      // 双向联动逻辑
      if (allSubtasksCompleted && currentStatus !== 'completed') {
        // 所有子任务完成 → 主任务自动完成
        console.log('[useSubtaskModal] 所有子任务完成，自动完成主任务')
        await taskStore.updateTask(task.id, { status: 'completed' })

        uni.showToast({
          title: '所有子任务已完成',
          icon: 'success',
          duration: 1500
        })
      } else if (!allSubtasksCompleted && currentStatus === 'completed') {
        // 有子任务未完成 → 主任务改为未完成
        console.log('[useSubtaskModal] 有子任务未完成，自动取消主任务完成')
        await taskStore.updateTask(task.id, { status: 'pending' })

        uni.showToast({
          title: '任务已恢复',
          icon: 'none',
          duration: 1500
        })
      }

      // 刷新任务列表
      await taskStore.fetchTasksByDate(taskStore.selectedDate)
    } catch (error) {
      console.error('[useSubtaskModal] 子任务勾选切换失败:', error)
      uni.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  /**
   * 处理点击重复任务图标
   * 逻辑：标记今日重复任务实例为完成（不影响其他日期实例）
   *
   * ⚠️ 临时方案：后端尚未实现重复任务实例分离
   * 当前实现：直接更新任务状态为 completed（视觉效果同普通任务完成）
   * TODO: 待后端实现后，改为更新特定日期实例
   *
   * @param {object} task - 重复任务对象
   */
  async function handleRecurringTaskComplete(task) {
    if (!task.isRecurring) {
      console.warn('[useSubtaskModal] 该任务不是重复任务:', task.id)
      return
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const isCompleting = newStatus === 'completed'

    console.log('[useSubtaskModal] 重复任务完成切换:', {
      taskId: task.id,
      oldStatus: task.status,
      newStatus: newStatus,
      note: '临时方案：直接更新任务状态'
    })

    try {
      // 临时方案：直接更新任务状态（视觉效果同普通任务完成）
      await taskStore.completeRecurringTaskToday(task.id)

      // 刷新任务列表
      await taskStore.fetchTasksByDate(taskStore.selectedDate)

      uni.showToast({
        title: isCompleting ? '今日任务已完成' : '今日任务已恢复',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('[useSubtaskModal] 重复任务完成切换失败:', error)
      uni.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // ============================================================
  // 返回公开接口
  // ============================================================
  return {
    // 状态
    isModalVisible,
    currentTask,

    // 方法
    openModal,
    closeModal,
    handleMainTaskToggle,
    handleSubtaskToggle,
    handleRecurringTaskComplete
  }
}
