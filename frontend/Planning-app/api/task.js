/**
 * 任务 API 封装
 * 对应后端 /api/v1/tasks
 */
import { get, post, put, patch, del } from '@/utils/request.js';

/**
 * 获取任务列表
 * @param {object} params - 查询参数
 * @param {string} [params.date] - 按日期筛选 YYYY-MM-DD
 * @param {string} [params.startDate] - 开始日期
 * @param {string} [params.endDate] - 结束日期
 * @param {string} [params.status] - 状态筛选
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页数量
 * @returns {Promise<object>} { list, total, page, pageSize }
 */
export const getTasks = (params = {}) =>
  get('/tasks', params);

/**
 * 获取单个任务详情
 * @param {number} id - 任务ID
 * @returns {Promise<object>}
 */
export const getTaskDetail = (id) =>
  get(`/tasks/${id}`);

/**
 * 创建任务
 * @param {object} data - 任务数据
 * @param {string} data.title - 标题（必填）
 * @param {string} [data.description] - 描述
 * @param {boolean} [data.isUrgent] - 是否紧急
 * @param {boolean} [data.isImportant] - 是否重要
 * @param {string} [data.dueDate] - 截止日期 YYYY-MM-DD
 * @param {string} [data.dueTime] - 截止时间 HH:mm
 * @param {string} [data.startDate] - 开始日期 YYYY-MM-DD
 * @param {string} [data.rrule] - 重复规则（RRULE格式）
 * @param {number} [data.planId] - 关联规划ID
 * @returns {Promise<object>}
 */
export const createTask = (data) =>
  post('/tasks', data);

/**
 * 更新任务
 * @param {number} id - 任务ID
 * @param {object} data - 更新字段
 * @returns {Promise<object>}
 */
export const updateTask = (id, data) =>
  put(`/tasks/${id}`, data);

/**
 * 更新任务状态
 * @param {number} id - 任务ID
 * @param {string} status - 新状态 pending/in_progress/done/skipped
 * @returns {Promise<object>}
 */
export const updateTaskStatus = (id, status) =>
  patch(`/tasks/${id}/status`, { status });

/**
 * 删除任务
 * @param {number} id - 任务ID
 * @returns {Promise<null>}
 */
export const deleteTask = (id) =>
  del(`/tasks/${id}`);
