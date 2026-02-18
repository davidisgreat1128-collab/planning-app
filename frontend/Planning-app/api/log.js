/**
 * 日志 API 封装
 * 对应后端 /api/v1/logs
 *
 * 后端字段说明：
 *   content    - 日志正文（必填）
 *   title      - 标题（可选）
 *   logType    - 类型：'note' | 'insight' | 'event' | 'idea' | 'mood'（默认 note）
 *   moodLevel  - 心情值 1-5（可选）
 *   tags       - 标签数组（可选）
 *   logTime    - 记录时刻 ISO8601（不传则用服务器当前时间）
 *   planId     - 关联规划ID（可选）
 *   taskId     - 关联任务ID（可选）
 *   attachments - 附件数组（可选）
 */
import { get, post, put, del } from '@/utils/request.js';

/**
 * 获取日志列表
 * @param {object} params - 查询参数（date 或 start 必填其一）
 * @param {string} [params.date]     - 单日查询 YYYY-MM-DD
 * @param {string} [params.start]    - 范围查询开始日期 YYYY-MM-DD
 * @param {string} [params.end]      - 范围查询结束日期 YYYY-MM-DD
 * @param {string} [params.logType]  - 类型筛选
 * @param {number} [params.planId]   - 关联规划ID筛选
 * @param {number} [params.page]     - 页码（默认1）
 * @param {number} [params.pageSize] - 每页数量（默认20）
 * @returns {Promise<object>}
 */
export const getLogs = (params = {}) =>
  get('/logs', params);

/**
 * 创建日志
 * @param {object} data - 日志数据
 * @param {string} data.content      - 内容（必填）
 * @param {string} [data.title]      - 标题
 * @param {string} [data.logType]    - 类型，默认 'note'
 * @param {number} [data.moodLevel]  - 心情值 1-5
 * @param {string[]} [data.tags]     - 标签数组
 * @param {string} [data.logTime]    - 记录时刻 ISO8601
 * @param {number} [data.planId]     - 关联规划ID
 * @param {number} [data.taskId]     - 关联任务ID
 * @returns {Promise<object>}
 */
export const createLog = (data) =>
  post('/logs', data);

/**
 * 更新日志
 * @param {number} id - 日志ID
 * @param {object} data - 更新字段（至少一个）
 * @returns {Promise<object>}
 */
export const updateLog = (id, data) =>
  put(`/logs/${id}`, data);

/**
 * 将日志转化为任务
 * @param {number} id - 日志ID
 * @param {object} [taskData] - 可选的任务覆盖字段
 * @param {string} [taskData.title]       - 自定义任务标题（不填则用日志内容）
 * @param {string} [taskData.description] - 任务描述
 * @param {boolean} [taskData.isUrgent]
 * @param {boolean} [taskData.isImportant]
 * @param {boolean} [taskData.isAllDay]
 * @param {string} [taskData.taskDate]    - 任务日期 YYYY-MM-DD
 * @param {number} [taskData.planId]      - 关联规划ID
 * @returns {Promise<object>} { log, task }
 */
export const convertLogToTask = (id, taskData = {}) =>
  post(`/logs/${id}/convert-to-task`, taskData);

/**
 * 删除日志（软删除）
 * @param {number} id - 日志ID
 * @returns {Promise<object>}
 */
export const deleteLog = (id) =>
  del(`/logs/${id}`);
