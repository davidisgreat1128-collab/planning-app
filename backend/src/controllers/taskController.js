'use strict';

const taskService = require('../services/taskService');
const completionRecordRepository = require('../repositories/CompletionRecordRepository');
const rruleCalculationService = require('../services/RRuleCalculationService');
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
    console.error('[TaskController] 创建任务失败:', err);
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
      return success(res, { date, ...tasks });
    } else if (start && end) {
      // 范围查询
      if (start > end) {
        throw new ValidationError('start 不能晚于 end');
      }
      const taskMap = await taskService.getTasksByRange(userId, start, end);
      return success(res, { start, end, taskMap });
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
    return success(res, task, '任务更新成功');
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
    return success(res, occurrence, '任务实例已更新');
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
    return success(res, null, '任务已删除');
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
    return success(res, { planId: parseInt(req.params.planId), tasks });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/tasks/category/:categoryId/uncategorize
 * 将指定分类下的所有任务移到"无分类"（设置 categoryId 为 null）
 */
async function uncategorizeTasks(req, res, next) {
  try {
    const categoryId = req.params.categoryId;
    const userId = req.user.id;

    const count = await taskService.updateCategoryTasksToUncategorized(userId, categoryId);

    return success(res, { count }, `已将 ${count} 个任务移到无分类`);
  } catch (err) {
    console.error('[TaskController] 移除分类失败:', err);
    next(err);
  }
}

/**
 * DELETE /api/v1/tasks/category/:categoryId
 * 删除指定分类下的所有任务
 */
async function deleteCategoryTasks(req, res, next) {
  try {
    const categoryId = req.params.categoryId;
    const userId = req.user.id;

    const count = await taskService.deleteCategoryTasks(userId, categoryId);

    return success(res, { count }, `已删除 ${count} 个任务`);
  } catch (err) {
    console.error('[TaskController] 删除分类任务失败:', err);
    next(err);
  }
}

// ============================================================
// 重复任务 + 完成记录 新增方法（RRULE规则计算）
// ============================================================

/**
 * GET /api/v1/tasks/:taskId/occurrences?start=2026-03-01&end=2026-03-31
 * 获取重复任务在指定日期范围内的所有发生日期
 */
async function getTaskOccurrences(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId);
    const { start, end } = req.query;

    if (!start || !end) {
      throw new ValidationError('请提供 start 和 end 参数（YYYY-MM-DD格式）');
    }

    // 获取任务
    const task = await taskService.getTaskById(taskId, req.user.id);

    if (!task.isRecurring || !task.rrule) {
      return success(res, { occurrences: [] }, '任务不是重复任务');
    }

    // 计算发生日期
    const occurrences = rruleCalculationService.calculateOccurrences(task, start, end);

    return success(res, { taskId, start, end, occurrences });
  } catch (err) {
    console.error('[TaskController] 获取任务发生日期失败:', err);
    next(err);
  }
}

/**
 * POST /api/v1/tasks/:taskId/complete
 * 创建任务完成记录（重复任务在指定日期的完成记录）
 * Body: { completionDate, subtaskCompletion?, note? }
 */
async function completeTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId);
    const { completionDate, subtaskCompletion, note } = req.body;

    if (!completionDate || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
      throw new ValidationError('请提供有效的completionDate（YYYY-MM-DD格式）');
    }

    // 验证任务是否存在
    const task = await taskService.getTaskById(taskId, req.user.id);

    // 如果是重复任务，检查该日期是否有效
    if (task.isRecurring && task.rrule) {
      const isValid = rruleCalculationService.isOccurrenceOnDate(task, completionDate);
      if (!isValid) {
        throw new ValidationError('该日期不在任务的重复规则中');
      }
    }

    // 创建完成记录
    const record = await completionRecordRepository.create({
      taskId,
      userId: req.user.id,
      completionDate,
      status: 'completed',
      subtaskCompletion: subtaskCompletion || null,
      note: note || null
    });

    return created(res, record, '任务完成记录已创建');
  } catch (err) {
    console.error('[TaskController] 创建完成记录失败:', err);
    next(err);
  }
}

/**
 * GET /api/v1/tasks/:taskId/completion-records?start=2026-03-01&end=2026-03-31
 * 获取任务的完成记录列表
 */
async function getCompletionRecords(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId);
    const { start, end, page = 1, pageSize = 20 } = req.query;

    // 验证任务是否存在
    await taskService.getTaskById(taskId, req.user.id);

    // 获取完成记录
    const { rows, count } = await completionRecordRepository.getByTask(taskId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      startDate: start,
      endDate: end
    });

    return success(res, {
      taskId,
      records: rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count
      }
    });
  } catch (err) {
    console.error('[TaskController] 获取完成记录失败:', err);
    next(err);
  }
}

/**
 * PUT /api/v1/tasks/:taskId/completion-records/:date
 * 更新任务完成记录
 * Body: { status?, subtaskCompletion?, note? }
 */
async function updateCompletionRecord(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId);
    const completionDate = req.params.date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
      throw new ValidationError('日期格式需为 YYYY-MM-DD');
    }

    // 验证任务是否存在
    await taskService.getTaskById(taskId, req.user.id);

    // 更新完成记录
    const record = await completionRecordRepository.update(taskId, completionDate, req.body);

    return success(res, record, '完成记录已更新');
  } catch (err) {
    console.error('[TaskController] 更新完成记录失败:', err);
    next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
  updateOccurrence,
  deleteTask,
  getSubtasksByPlan,
  uncategorizeTasks,
  deleteCategoryTasks,
  // 新增方法
  getTaskOccurrences,
  completeTask,
  getCompletionRecords,
  updateCompletionRecord
};
