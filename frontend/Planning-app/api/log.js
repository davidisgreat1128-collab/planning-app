/**
 * 日志 API 封装
 * 对应后端 /api/v1/logs
 */
import { get, post, put, del } from '@/utils/request.js';

/**
 * 获取日志列表
 * @param {object} params - 查询参数
 * @param {string} [params.date] - 按日期筛选 YYYY-MM-DD
 * @param {string} [params.startDate] - 开始日期
 * @param {string} [params.endDate] - 结束日期
 * @param {number} [params.planId] - 关联规划ID筛选
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页数量
 * @returns {Promise<object>} { list, total, page, pageSize }
 */
export const getLogs = (params = {}) =>
  get('/logs', params);

/**
 * 创建日志
 * @param {object} data - 日志数据
 * @param {string} data.content - 内容（必填）
 * @param {string} [data.loggedAt] - 记录时间 ISO8601（精确到分钟）
 * @param {number} [data.planId] - 关联规划ID
 * @param {number} [data.taskId] - 关联任务ID
 * @returns {Promise<object>}
 */
export const createLog = (data) =>
  post('/logs', data);

/**
 * 更新日志
 * @param {number} id - 日志ID
 * @param {object} data - 更新字段
 * @returns {Promise<object>}
 */
export const updateLog = (id, data) =>
  put(`/logs/${id}`, data);

/**
 * 将日志转化为任务
 * @param {number} id - 日志ID
 * @returns {Promise<object>} 新创建的任务对象
 */
export const convertLogToTask = (id) =>
  post(`/logs/${id}/convert-to-task`);

/**
 * 删除日志
 * @param {number} id - 日志ID
 * @returns {Promise<null>}
 */
export const deleteLog = (id) =>
  del(`/logs/${id}`);
