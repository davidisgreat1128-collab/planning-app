'use strict';

const logService = require('../services/logService');
const { success, created } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * POST /api/v1/logs - 创建日志
 */
async function createLog(req, res, next) {
  try {
    const log = await logService.createLog(req.user.id, req.body);
    return created(res, log, '日志创建成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/logs?date=2026-02-18
 * GET /api/v1/logs?start=2026-02-01&end=2026-02-28&logType=note&page=1
 */
async function getLogs(req, res, next) {
  try {
    const { date, start, end, logType, planId, page, pageSize } = req.query;
    const userId = req.user.id;

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('日期格式需为 YYYY-MM-DD');
      }
      const logs = await logService.getLogsByDate(userId, date);
      return success(res, { date, logs, total: logs.length });
    } else if (start && end) {
      if (start > end) throw new ValidationError('start 不能晚于 end');
      const result = await logService.getLogsByRange(userId, start, end, {
        logType, planId: planId ? parseInt(planId) : undefined,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20
      });
      return success(res, { start, end, logs: result.rows, total: result.count });
    } else {
      throw new ValidationError('请提供 date 或 start/end 参数');
    }
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/logs/:id - 更新日志
 */
async function updateLog(req, res, next) {
  try {
    const log = await logService.updateLog(parseInt(req.params.id), req.user.id, req.body);
    return success(res, log, '日志更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/logs/:id/convert-to-task - 日志转任务
 */
async function convertToTask(req, res, next) {
  try {
    const result = await logService.convertToTask(
      parseInt(req.params.id),
      req.user.id,
      req.body
    );
    return created(res, result, '日志已转化为任务');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/logs/:id - 软删除日志
 */
async function deleteLog(req, res, next) {
  try {
    await logService.deleteLog(parseInt(req.params.id), req.user.id);
    return success(res, null, '日志已删除');
  } catch (err) {
    next(err);
  }
}

module.exports = { createLog, getLogs, updateLog, convertToTask, deleteLog };
