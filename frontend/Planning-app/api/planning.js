/**
 * 规划记录相关API
 * 覆盖7种规划类型: life / career / project / mood / health / time / habit
 */

import { get, post, put, patch, del } from '@/utils/request.js';

/**
 * 获取规划记录列表
 * @param {object} params
 * @param {string} [params.type] - 规划类型
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=20]
 * @returns {Promise<{list: Array, pagination: object}>}
 */
export function getPlanningList(params = {}) {
  return get('/planning', params);
}

/**
 * 获取单条规划记录详情
 * @param {number} id
 * @returns {Promise<object>}
 */
export function getPlanningDetail(id) {
  return get(`/planning/${id}`);
}

/**
 * 创建规划记录
 * @param {object} data
 * @param {string} data.type - 规划类型
 * @param {string} data.title - 标题
 * @param {string} [data.content] - 内容
 * @param {string} [data.startDate] - 开始日期
 * @param {string} [data.endDate] - 结束日期
 * @returns {Promise<object>}
 */
export function createPlanning(data) {
  return post('/planning', data);
}

/**
 * 更新规划记录
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export function updatePlanning(id, data) {
  return put(`/planning/${id}`, data);
}

/**
 * 更新规划状态
 * @param {number} id
 * @param {string} status - active / completed / paused / cancelled
 * @returns {Promise<object>}
 */
export function updatePlanningStatus(id, status) {
  return patch(`/planning/${id}/status`, { status });
}

/**
 * 删除规划记录（软删除）
 * @param {number} id
 * @returns {Promise<void>}
 */
export function deletePlanning(id) {
  return del(`/planning/${id}`);
}
