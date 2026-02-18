'use strict';

const taskService = require('../services/taskService');
const { success, created } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * POST /api/v1/tasks
 * 创建任务
 */
async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    return created(res, task, '任务创建成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/tasks?date=2026-02-18
 * GET /api/v1/tasks?start=2026-02-01&end=2026-02-28
 * 获取任务列表（按日期或范围查询）
 */
async function getTasks(req, res, next) {
  try {
    const { date, start, end, includeCompleted } = req.query;
    const userId = req.user.id;

    if (date) {
      // 单日查询
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('日期格式需为 YYYY-MM-DD');
      }
      const tasks = await taskService.getTasksByDate(userId, date, {
        includeCompleted: includeCompleted !== 'false'
      });
      res.json(success({ date, ...tasks }));
    } else if (start && end) {
      // 范围查询
      if (start > end) {
        throw new ValidationError('start 不能晚于 end');
      }
      const taskMap = await taskService.getTasksByRange(userId, start, end);
      res.json(success({ start, end, taskMap }));
    } else {
      throw new ValidationError('请提供 date 或 start/end 参数');
    }
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/tasks/:id
 * 更新任务（含完成打勾）
 */
async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(
      parseInt(req.params.id),
      req.user.id,
      req.body
    );
    res.json(success(task, '任务更新成功'));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/tasks/occurrences/:id
 * 更新重复任务的单个实例状态（完成/跳过）
 */
async function updateOccurrence(req, res, next) {
  try {
    const { status } = req.body;
    if (!['completed', 'pending', 'skipped'].includes(status)) {
      throw new ValidationError('status 需为 completed / pending / skipped');
    }
    const occurrence = await taskService.updateOccurrence(
      parseInt(req.params.id),
      req.user.id,
      status
    );
    res.json(success(occurrence, '任务实例已更新'));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/tasks/:id
 * 软删除任务
 */
async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(parseInt(req.params.id), req.user.id);
    res.json(success(null, '任务已删除'));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/tasks/plan/:planId
 * 获取规划的子任务列表
 */
async function getSubtasksByPlan(req, res, next) {
  try {
    const tasks = await taskService.getSubtasksByPlan(
      parseInt(req.params.planId),
      req.user.id
    );
    res.json(success({ planId: parseInt(req.params.planId), tasks }));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
  updateOccurrence,
  deleteTask,
  getSubtasksByPlan
};
