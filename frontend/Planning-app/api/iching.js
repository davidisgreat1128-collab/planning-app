/**
 * 易经相关API
 * 包括起卦、卦象查询、人生阶段诊断
 */

import { get, post } from '@/utils/request.js';

/**
 * 获取当前用户人生阶段
 * @returns {Promise<{stage: string, score: number, description: string}>}
 */
export function getLifeStage() {
  return get('/iching/stage');
}

/**
 * 起卦（根据用户提交的问题生成卦象）
 * @param {object} data
 * @param {string} data.question - 所问事项
 * @param {string} [data.method='random'] - 起卦方式: random / birthday / manual
 * @returns {Promise<object>} 卦象结果
 */
export function divination(data) {
  return post('/iching/divination', data);
}

/**
 * 获取卦象详情
 * @param {string} hexagramCode - 卦的编号或名称
 * @returns {Promise<object>} 卦象详细信息
 */
export function getHexagram(hexagramCode) {
  return get(`/iching/hexagrams/${hexagramCode}`);
}

/**
 * 获取全部64卦列表
 * @returns {Promise<Array>}
 */
export function getAllHexagrams() {
  return get('/iching/hexagrams');
}

/**
 * 获取规划建议（根据人生阶段+规划类型）
 * @param {object} params
 * @param {string} params.stage - 人生阶段
 * @param {string} params.planningType - 规划类型
 * @returns {Promise<object>} 规划建议
 */
export function getPlanningAdvice(params) {
  return get('/iching/advice', params);
}
