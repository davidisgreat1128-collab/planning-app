/**
 * 任务 API 封装
 * 对应后端 /api/v1/tasks
 *
 * 后端字段说明：
 *   dateType  - 'single'（单日）或 'range'（跨天）
 *   taskDate  - 单日任务的日期 YYYY-MM-DD（dateType='single' 时必填）
 *   startDate - 跨天任务开始日期（dateType='range' 时必填）
 *   endDate   - 跨天任务结束日期（dateType='range' 时必填）
 *   startTime - 开始时间 HH:mm（非全天时使用）
 *   endTime   - 结束时间 HH:mm（非全天时使用）
 *   isAllDay  - 是否全天（默认 true）
 *   isUrgent  - 是否紧急
 *   isImportant - 是否重要
 *   isRecurring - 是否重复任务
 *   rrule     - 重复规则（RRULE格式，isRecurring=true 时必填）
 *   rruleUntil - 重复截止日期 YYYY-MM-DD
 *   planId    - 关联规划ID
 */
import { get, post, put, patch, del } from '@/utils/request.js';

/**
 * 获取任务列表（按日期或范围）
 * @param {object} params
 * @param {string} [params.date] - 单日查询 YYYY-MM-DD
 * @param {string} [params.start] - 范围查询开始日期 YYYY-MM-DD
 * @param {string} [params.end]   - 范围查询结束日期 YYYY-MM-DD
 * @param {string} [params.includeCompleted] - 'true'/'false'，是否包含已完成
 * @returns {Promise<object>} 单日: { date, single, range, recurring } | 范围: { start, end, taskMap }
 */
export const getTasks = (params = {}) =>
  get('/tasks', params);

/**
 * 获取规划的子任务列表
 * @param {number} planId - 规划ID
 * @returns {Promise<object>} { planId, tasks }
 */
export const getSubtasksByPlan = (planId) =>
  get(`/tasks/plan/${planId}`);

/**
 * 创建单日任务（isAllDay=true）
 * @param {object} data
 * @param {string} data.title       - 标题（必填）
 * @param {string} data.taskDate    - 任务日期 YYYY-MM-DD（必填）
 * @param {string} [data.description]
 * @param {boolean} [data.isUrgent]
 * @param {boolean} [data.isImportant]
 * @param {number} [data.planId]
 * @returns {Promise<object>}
 */
export const createSingleTask = (data) =>
  post('/tasks', { dateType: 'single', isAllDay: true, ...data });

/**
 * 创建定时任务（isAllDay=false，需提供 startTime/endTime）
 * @param {object} data
 * @param {string} data.title
 * @param {string} data.taskDate   - YYYY-MM-DD
 * @param {string} data.startTime  - HH:mm
 * @param {string} [data.endTime]  - HH:mm
 * @param {boolean} [data.isUrgent]
 * @param {boolean} [data.isImportant]
 * @returns {Promise<object>}
 */
export const createTimedTask = (data) =>
  post('/tasks', { dateType: 'single', isAllDay: false, ...data });

/**
 * 创建任务（通用，完整字段控制）
 * @param {object} data - 完整任务数据，见文件顶部字段说明
 * @returns {Promise<object>}
 */
export const createTask = (data) =>
  post('/tasks', data);

/**
 * 更新任务
 * @param {number} id - 任务ID
 * @param {object} data - 更新字段（至少一个）
 * @returns {Promise<object>}
 */
export const updateTask = (id, data) =>
  put(`/tasks/${id}`, data);

/**
 * 更新重复任务的单个实例状态
 * @param {number} occurrenceId - 实例ID
 * @param {string} status - 'completed' | 'pending' | 'skipped'
 * @returns {Promise<object>}
 */
export const updateOccurrence = (occurrenceId, status) =>
  patch(`/tasks/occurrences/${occurrenceId}`, { status });

/**
 * 删除任务（软删除）
 * @param {number} id - 任务ID
 * @returns {Promise<object>}
 */
export const deleteTask = (id) =>
  del(`/tasks/${id}`);
