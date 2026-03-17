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
 * @deprecated 已废弃（2026-03-15）：请使用 completeRecurringTask + updateCompletionRecord
 *
 * 旧架构：基于 task_occurrences 表（已删除）
 * 新架构：基于 task_completion_records 表 + RRULE实时计算
 *
 * 迁移指南：
 * - 完成任务：completeRecurringTask(taskId, { completionDate, status: 'completed' })
 * - 更新状态：updateCompletionRecord(taskId, date, { status })
 *
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

/**
 * 将指定分类下的所有任务移到"无分类"（设置 categoryId 为 null）
 * @param {string} categoryId - 分类ID
 * @returns {Promise<object>} { count }
 */
export const uncategorizeTasks = (categoryId) =>
  put(`/tasks/category/${categoryId}/uncategorize`);

/**
 * 删除指定分类下的所有任务
 * @param {string} categoryId - 分类ID
 * @returns {Promise<object>} { count }
 */
export const deleteCategoryTasks = (categoryId) =>
  del(`/tasks/category/${categoryId}`);

/**
 * @deprecated 已废弃（2026-03-15）：请直接使用 updateTask + EXDATE
 *
 * 旧架构：批量更新所有 task_occurrences 实例
 * 新架构（2026-03-17）：修改任务定义本身（task表），删除日期使用task_overrides.is_deleted
 *
 * 迁移指南：
 * - 修改任务象限：updateTask(taskId, { isUrgent, isImportant })
 * - 删除某些日期：调用deleteTaskSingleDay(taskId, date)创建is_deleted标记
 *
 * @param {number} taskId - 原始任务ID
 * @param {object} data - 更新数据 { isUrgent, isImportant }
 * @param {string} scope - 更新范围 'all'（全部更改）| 'future'（当天及未来）
 * @returns {Promise<object>}
 */
export const updateTaskRecurrence = (taskId, data, scope) =>
  patch(`/tasks/${taskId}/recurrence`, { ...data, scope });

// ============================================================
// ⭐ 新架构API（2026-03-15）：基于RRULE + completion_records
// ============================================================

/**
 * 获取重复任务在指定日期范围内的所有发生日期
 * @param {number} taskId - 任务ID
 * @param {string} start - 起始日期 YYYY-MM-DD
 * @param {string} end - 结束日期 YYYY-MM-DD
 * @returns {Promise<object>} { taskId, occurrences: ['2026-03-01', '2026-03-02', ...] }
 */
export const getTaskOccurrences = (taskId, start, end) =>
  get(`/tasks/${taskId}/occurrences`, { start, end });

/**
 * 完成重复任务的某一天（创建 completion_record）
 * @param {number} taskId - 任务ID
 * @param {object} data - 完成记录数据
 * @param {string} data.completionDate - 完成日期 YYYY-MM-DD（必填）
 * @param {string} [data.status='completed'] - 状态：'completed' | 'pending' | 'skipped'
 * @param {object} [data.subtaskCompletion] - 子任务完成状态 { subtask_0: true, subtask_1: false }
 * @param {string} [data.note] - 备注
 * @returns {Promise<object>} 创建的 completion_record
 */
export const completeRecurringTask = (taskId, data) =>
  post(`/tasks/${taskId}/complete`, data);

/**
 * 获取重复任务的完成记录列表
 * @param {number} taskId - 任务ID
 * @param {object} params - 查询参数
 * @param {string} [params.start] - 起始日期 YYYY-MM-DD
 * @param {string} [params.end] - 结束日期 YYYY-MM-DD
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pageSize=20] - 每页条数
 * @returns {Promise<object>} { taskId, records: [...], pagination }
 */
export const getCompletionRecords = (taskId, params = {}) =>
  get(`/tasks/${taskId}/completion-records`, params);

/**
 * 更新重复任务的完成记录
 * @param {number} taskId - 任务ID
 * @param {string} date - 完成日期 YYYY-MM-DD
 * @param {object} data - 更新数据
 * @param {string} [data.status] - 状态：'completed' | 'pending' | 'skipped'
 * @param {object} [data.subtaskCompletion] - 子任务完成状态
 * @param {string} [data.note] - 备注
 * @returns {Promise<object>} 更新后的 completion_record
 */
export const updateCompletionRecord = (taskId, date, data) =>
  put(`/tasks/${taskId}/completion-records/${date}`, data);
