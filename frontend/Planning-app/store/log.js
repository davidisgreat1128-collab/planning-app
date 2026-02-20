/**
 * 日志 Pinia Store
 * 管理日志记录（精确到分钟的时间记录）
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getLogs, createLog, updateLog, convertLogToTask, deleteLog } from '@/api/log.js';

export const useLogStore = defineStore('log', () => {
  // ============================================================
  // 状态
  // ============================================================

  /** 当前日期的日志列表（按记录时间倒序） */
  const logs = ref([]);

  /** 加载状态 */
  const loading = ref(false);

  /** 当前选中日期 YYYY-MM-DD */
  const selectedDate = ref('');

  // ============================================================
  // 方法
  // ============================================================

  /**
   * 加载指定日期的日志
   * @param {string} date - YYYY-MM-DD
   */
  async function fetchLogsByDate(date) {
    loading.value = true;
    selectedDate.value = date;
    try {
      const res = await getLogs({ date });
      logs.value = res.list || res || [];
    } catch (err) {
      console.error('[LogStore] 加载日志失败:', err);
      uni.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建新日志
   * @param {object} data - 日志数据
   * @returns {Promise<object>} 新日志
   */
  async function addLog(data) {
    const newLog = await createLog(data);
    logs.value.unshift(newLog);
    return newLog;
  }

  /**
   * 更新日志
   * @param {number} id - 日志ID
   * @param {object} data - 更新字段
   */
  async function editLog(id, data) {
    const updated = await updateLog(id, data);
    const idx = logs.value.findIndex(l => l.id === id);
    if (idx !== -1) {
      logs.value[idx] = { ...logs.value[idx], ...updated };
    }
    return updated;
  }

  /**
   * 将日志转化为任务
   * @param {number} id - 日志ID
   * @returns {Promise<object>} 新创建的任务
   */
  async function toTask(id) {
    const task = await convertLogToTask(id);
    // 标记日志已转化
    const idx = logs.value.findIndex(l => l.id === id);
    if (idx !== -1) {
      logs.value[idx].convertedToTaskId = task.id;
    }
    return task;
  }

  /**
   * 删除日志
   * @param {number} id - 日志ID
   */
  async function removeLog(id) {
    await deleteLog(id);
    logs.value = logs.value.filter(l => l.id !== id);
  }

  /**
   * 重置 store
   */
  function reset() {
    logs.value = [];
    loading.value = false;
    selectedDate.value = '';
  }

  return {
    // 状态
    logs,
    loading,
    selectedDate,
    // 方法
    fetchLogsByDate,
    addLog,
    editLog,
    toTask,
    removeLog,
    reset
  };
});
