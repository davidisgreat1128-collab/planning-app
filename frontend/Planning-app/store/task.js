/**
 * 任务 Pinia Store
 * 管理任务列表、四象限分类、当前选中日期的任务
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getTasks, createTask, updateTask, deleteTask } from '@/api/task.js';

export const useTaskStore = defineStore('task', () => {
  // ============================================================
  // 状态
  // ============================================================

  /** 当前日期的任务列表 */
  const tasks = ref([]);

  /** 加载状态 */
  const loading = ref(false);

  /** 当前选中日期 YYYY-MM-DD */
  const selectedDate = ref('');

  // ============================================================
  // 计算属性（四象限分类）
  // ============================================================

  /** 第一象限：紧急且重要（危机处理）- 红色 */
  const urgentImportant = computed(() =>
    tasks.value.filter(t => t.isUrgent && t.isImportant && t.status !== 'completed')
  );

  /** 第二象限：重要不紧急（规划区）- 蓝色 */
  const notUrgentImportant = computed(() =>
    tasks.value.filter(t => !t.isUrgent && t.isImportant && t.status !== 'completed')
  );

  /** 第三象限：紧急不重要（琐事区）- 黄色 */
  const urgentNotImportant = computed(() =>
    tasks.value.filter(t => t.isUrgent && !t.isImportant && t.status !== 'completed')
  );

  /** 第四象限：不紧急不重要（消遣区）- 绿色 */
  const notUrgentNotImportant = computed(() =>
    tasks.value.filter(t => !t.isUrgent && !t.isImportant && t.status !== 'completed')
  );

  /** 已完成任务 */
  const doneTasks = computed(() =>
    tasks.value.filter(t => t.status === 'completed')
  );

  /** 时间轴视图（非全天、有 startTime 的任务，按时间排序） */
  const timelineTasks = computed(() => {
    return [...tasks.value]
      .filter(t => !t.isAllDay && t.startTime && t.status !== 'completed')
      .sort((a, b) => {
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;
        return 0;
      });
  });

  // ============================================================
  // 方法
  // ============================================================

  /**
   * 加载指定日期的任务
   * @param {string} date - YYYY-MM-DD
   */
  async function fetchTasksByDate(date) {
    loading.value = true;
    selectedDate.value = date;
    try {
      const res = await getTasks({ date });
      // console.log('[TaskStore] fetchTasksByDate 返回数据:', JSON.stringify(res, null, 2));

      // 后端返回结构：{ date, single: [], range: [], recurring: [] }
      // 三类任务合并为一个列表，并附加 _type 标记

      // 🔧 修复：过滤掉 single 中的重复任务（isRecurring=true），避免与 recurring 实例重复显示
      const single    = (res.single    || [])
        .filter(t => !t.isRecurring)  // 重复任务只显示实例，不显示原始任务
        .map(t => ({ ...t, _type: 'single' }));

      const range     = (res.range     || [])
        .filter(t => !t.isRecurring)  // 同样过滤跨天重复任务
        .map(t => ({ ...t, _type: 'range' }));

      const recurring = (res.recurring || []).map(o => ({
        ...o.task,        // 展开关联 task 字段
        ...o,             // occurrence 字段覆盖（如 occurDate/occurStartTime）
        _type: 'recurring'
      }));

      // console.log('[TaskStore] single 数量 (过滤后):', single.length);
      // console.log('[TaskStore] range 数量 (过滤后):', range.length);
      // console.log('[TaskStore] recurring 数量:', recurring.length);
      // console.log('[TaskStore] 合并后总数:', single.length + range.length + recurring.length);

      tasks.value = [...single, ...range, ...recurring];
    } catch (err) {
      console.error('[TaskStore] 加载任务失败:', err);
      uni.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建新任务
   * @param {object} data - 任务数据
   * @returns {Promise<object>} 新任务
   */
  async function addTask(data) {
    const newTask = await createTask(data);
    // 不做本地乐观插入，由调用方通过 fetchTasksByDate 刷新列表，避免重复
    return newTask;
  }

  /**
   * 修改任务
   * @param {number} id - 任务ID
   * @param {object} data - 更新字段
   */
  async function editTask(id, data) {
    const updated = await updateTask(id, data);
    const idx = tasks.value.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...updated };
    }
    return updated;
  }

  /**
   * 切换任务完成状态
   * @param {number} id - 任务ID
   * @param {string} currentStatus - 当前状态 ('pending' | 'completed' | 'skipped')
   */
  async function toggleDone(id, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateTask(id, { status: newStatus });
    const idx = tasks.value.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks.value[idx].status = newStatus;
    }
  }

  /**
   * 删除任务
   * @param {number} id - 任务ID
   */
  async function removeTask(id) {
    await deleteTask(id);
    tasks.value = tasks.value.filter(t => t.id !== id);
  }

  /**
   * 重置 store
   */
  function reset() {
    tasks.value = [];
    loading.value = false;
    selectedDate.value = '';
  }

  return {
    // 状态
    tasks,
    loading,
    selectedDate,
    // 计算属性
    urgentImportant,
    notUrgentImportant,
    urgentNotImportant,
    notUrgentNotImportant,
    doneTasks,
    timelineTasks,
    // 方法
    fetchTasksByDate,
    addTask,
    editTask,
    toggleDone,
    removeTask,
    reset
  };
});
