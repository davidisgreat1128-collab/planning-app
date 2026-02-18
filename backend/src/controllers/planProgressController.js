'use strict';

const planProgressService = require('../services/planProgressService');
const { success, created } = require('../utils/response');

/**
 * 规划进度 Controller
 * 对应路由：/api/v1/planning/:id/progress
 */

/**
 * POST /api/v1/planning/:id/progress
 * 记录规划进度（0-100）
 * Body: { progressPct, note?, logId? }
 */
async function recordProgress(req, res, next) {
  try {
    const progressLog = await planProgressService.recordProgress(
      parseInt(req.params.id),
      req.user.id,
      req.body
    );
    return created(res, progressLog, '进度记录成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/planning/:id/progress
 * 获取规划进度历史
 */
async function getProgressHistory(req, res, next) {
  try {
    const result = await planProgressService.getProgressHistory(
      parseInt(req.params.id),
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { recordProgress, getProgressHistory };
