'use strict';

const { PlanProgressLog, PlanningRecord } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * 规划进度Service
 */

/**
 * 记录规划进度
 * @param {number} planId
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<PlanProgressLog>}
 */
async function recordProgress(planId, userId, data) {
  const { progressPct, note, logId } = data;

  // 验证规划存在且属于该用户
  const plan = await PlanningRecord.findOne({ where: { id: planId, userId } });
  if (!plan) throw new NotFoundError('规划不存在');

  if (progressPct === undefined || progressPct < 0 || progressPct > 100) {
    throw new ValidationError('进度百分比需在 0-100 之间');
  }

  const progressLog = await PlanProgressLog.create({
    planId,
    userId,
    progressPct,
    note: note || null,
    logId: logId || null,
    loggedAt: new Date()
  });

  // 同步更新 planning_records.progress_pct
  await plan.update({ progressPct });

  return progressLog;
}

/**
 * 获取规划的进度历史
 * @param {number} planId
 * @param {number} userId
 * @returns {Promise<PlanProgressLog[]>}
 */
async function getProgressHistory(planId, userId) {
  // 验证权限
  const plan = await PlanningRecord.findOne({ where: { id: planId, userId } });
  if (!plan) throw new NotFoundError('规划不存在');

  const logs = await PlanProgressLog.findAll({
    where: { planId },
    order: [['loggedAt', 'DESC']]
  });

  return { plan, logs };
}

module.exports = { recordProgress, getProgressHistory };
