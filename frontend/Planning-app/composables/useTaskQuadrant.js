/**
 * useTaskQuadrant - 四象限任务管理 Composable
 *
 * 职责:
 * - 管理象限变更对话框状态
 * - 处理象限间任务移动
 * - 象限配置和工具函数
 *
 * 四象限定义:
 * - q1: 紧急且重要 (危机处理) - 红色
 * - q2: 重要不紧急 (规划区) - 蓝色
 * - q3: 紧急不重要 (琐事区) - 黄色
 * - q4: 不紧急不重要 (消遣区) - 绿色
 *
 * 使用方式:
 * ```javascript
 * import { useTaskQuadrant } from '@/composables/useTaskQuadrant'
 *
 * const {
 *   quadrants,
 *   showChangeQuadrantDialog,
 *   changeTaskQuadrant,
 *   confirmChangeQuadrant
 * } = useTaskQuadrant()
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-05
 */

import { ref } from 'vue';
import { useTaskStore } from '@/store/task';
import { updateTaskRecurrence } from '@/api/task';
import TaskRepository from '@/repositories/TaskRepository';

// ============================================================
// 象限配置
// ============================================================

/**
 * 象限定义配置
 *
 * 布局顺序（2026-03-14更新）：
 * Q1(重要且紧急)  Q3(紧急不重要)
 * Q2(重要不紧急)  Q4(不急不重要)
 *
 * 注意：数组顺序影响UI显示顺序（Grid布局）
 */
export const quadrants = [
  {
    key: 'q1',
    name: '紧急且重要',
    isUrgent: true,
    isImportant: true,
    color: '#FF4D4F',
    icon: '🔥',
    description: '危机处理、紧急问题'
  },
  {
    key: 'q3',
    name: '紧急不重要',
    isUrgent: true,
    isImportant: false,
    color: '#FAAD14',
    icon: '⚡',
    description: '琐事、打扰、干扰'
  },
  {
    key: 'q2',
    name: '重要不紧急',
    isUrgent: false,
    isImportant: true,
    color: '#1890FF',
    icon: '⭐',
    description: '规划、学习、成长'
  },
  {
    key: 'q4',
    name: '不紧急不重要',
    isUrgent: false,
    isImportant: false,
    color: '#52C41A',
    icon: '🍃',
    description: '消遣、娱乐、放松'
  }
];

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取任务所属象限
 * @param {object} task - 任务对象
 * @returns {string} 'q1' | 'q2' | 'q3' | 'q4'
 */
export function getTaskQuadrant(task) {
  if (task.isUrgent && task.isImportant) return 'q1';
  if (!task.isUrgent && task.isImportant) return 'q2';
  if (task.isUrgent && !task.isImportant) return 'q3';
  return 'q4';
}

/**
 * 根据象限键获取配置
 * @param {string} key - 象限键 'q1' | 'q2' | 'q3' | 'q4'
 * @returns {object|null} 象限配置对象
 */
export function getQuadrantConfig(key) {
  return quadrants.find(q => q.key === key) || null;
}

/**
 * 获取象限的紧急/重要属性
 * @param {string} quadrantKey - 象限键
 * @returns {object} { isUrgent, isImportant }
 */
export function getQuadrantProperties(quadrantKey) {
  const config = getQuadrantConfig(quadrantKey);
  if (!config) {
    return { isUrgent: false, isImportant: false };
  }
  return {
    isUrgent: config.isUrgent,
    isImportant: config.isImportant
  };
}

// ============================================================
// Composable 主函数
// ============================================================

export function useTaskQuadrant() {
  // ============ Stores ============
  const taskStore = useTaskStore();

  // ============ 状态 ============

  /** 更改象限确认对话框 */
  const showChangeQuadrantDialog = ref(false);

  /** 更改选项: 1=完整更改, 2=更改当天及未来 */
  const changeQuadrantOption = ref(1);

  /** 目标象限 */
  const targetQuadrant = ref('');

  /** 当前正在操作的任务 (用于对话框) */
  const currentTask = ref(null);

  /** 来源象限 (用于对话框) */
  const fromQuadrant = ref('');

  // ============ 方法 ============

  /**
   * 打开更改象限对话框
   * @param {object} task - 任务对象
   * @param {string} from - 来源象限
   * @param {string} to - 目标象限
   */
  function openChangeQuadrantDialog(task, from, to) {
    currentTask.value = task;
    fromQuadrant.value = from;
    targetQuadrant.value = to;
    changeQuadrantOption.value = 1;
    showChangeQuadrantDialog.value = true;
  }

  /**
   * 关闭更改象限对话框
   */
  function closeChangeQuadrantDialog() {
    showChangeQuadrantDialog.value = false;
    changeQuadrantOption.value = 1;
    currentTask.value = null;
    fromQuadrant.value = '';
    targetQuadrant.value = '';
  }

  /**
   * 确认更改象限（支持3种更新策略）⭐ 架构升级（2026-03-15）
   */
  async function confirmChangeQuadrant() {
    const task = currentTask.value;
    const newQuadrant = targetQuadrant.value;
    const option = changeQuadrantOption.value;

    if (!task || !newQuadrant) return;

    // 根据目标象限获取属性
    const { isUrgent, isImportant } = getQuadrantProperties(newQuadrant);

    try {
      // 对于重复任务,使用 taskId (原始任务ID),否则使用 id
      const taskIdToUpdate = task.taskId || task.id;
      const selectedDate = taskStore.selectedDate; // 当前选中的日期

      // ⭐ 根据用户选择调用不同的更新策略
      if (option === 1) {
        // 选项1：完整更改此条重复计划 → 更新Task表（影响所有日期）
        await taskStore.updateTask(taskIdToUpdate, { isUrgent, isImportant });

        // 强制立即同步到服务器（避免防抖延迟）
        await TaskRepository.sync();

        uni.showToast({ title: '已更改所有实例', icon: 'success' });
      } else if (option === 2) {
        // 选项2：更改当天及未来计划 → 调用后端API（更新Task表 + 保留过去记录）
        await taskStore.updateTaskFuture(taskIdToUpdate, { isUrgent, isImportant }, selectedDate);

        uni.showToast({ title: '已更改未来实例', icon: 'success' });
      } else if (option === 3) {
        // 选项3：只更新当天计划 → 仅创建/更新CompletionRecord（象限覆盖）
        await taskStore.updateTaskOnce(taskIdToUpdate, { isUrgent, isImportant }, selectedDate);

        uni.showToast({ title: '已更改当天实例', icon: 'success' });
      }

      // ⭐ 重新获取当前日期的所有任务实例（刷新UI）
      if (selectedDate) {
        await taskStore.fetchTasksByDate(selectedDate);
      }
    } catch (err) {
      console.error('[useTaskQuadrant] 更改象限失败:', err);
      uni.showToast({ title: '更改失败', icon: 'none' });
    }

    closeChangeQuadrantDialog();
  }

  /**
   * 更改任务象限 (入口函数)
   * @param {object} task - 任务对象
   * @param {string} from - 来源象限
   * @param {string} to - 目标象限
   */
  async function changeTaskQuadrant(task, from, to) {
    if (from === to) {
      return;
    }

    // 检查任务是否为重复任务
    const isRecurring = task.isRecurring || task.rrule;

    if (isRecurring) {
      // 重复任务:显示对话框让用户选择
      openChangeQuadrantDialog(task, from, to);
    } else {
      // 普通任务:直接更改象限
      const { isUrgent, isImportant } = getQuadrantProperties(to);

      try {
        await taskStore.updateTask(task.id, { isUrgent, isImportant });

        // ⭐ 无需手动刷新：Repository会发布'update'事件，自动触发UI更新

        uni.showToast({ title: '已更改', icon: 'success' });
      } catch (err) {
        console.error('[useTaskQuadrant] 更改象限失败:', err);
        uni.showToast({ title: '更改失败', icon: 'none' });
      }
    }
  }

  /**
   * 获取象限标签文本
   * @param {object} task - 任务对象
   * @returns {string} 象限标签
   */
  function getQuadrantLabel(task) {
    const quadrant = getTaskQuadrant(task);
    const config = getQuadrantConfig(quadrant);
    return config ? config.name : '';
  }

  /**
   * 获取象限颜色
   * @param {object} task - 任务对象
   * @returns {string} 颜色值
   */
  function getQuadrantColor(task) {
    const quadrant = getTaskQuadrant(task);
    const config = getQuadrantConfig(quadrant);
    return config ? config.color : '#999';
  }

  // ============ 返回 API ============
  return {
    // 配置
    quadrants,

    // 状态
    showChangeQuadrantDialog,
    changeQuadrantOption,
    targetQuadrant,
    currentTask,
    fromQuadrant,

    // 方法
    openChangeQuadrantDialog,
    closeChangeQuadrantDialog,
    confirmChangeQuadrant,
    changeTaskQuadrant,
    getQuadrantLabel,
    getQuadrantColor,

    // 工具函数
    getTaskQuadrant,
    getQuadrantConfig,
    getQuadrantProperties
  };
}
