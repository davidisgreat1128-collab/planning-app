'use strict';

const taskService = require('../services/taskService');
const completionRecordRepository = require('../repositories/CompletionRecordRepository');
const rruleCalculationService = require('../services/RRuleCalculationService');
const recurringTaskService = require('../services/RecurringTaskService'); // ⭐ 新增（2026-03-16）
const { Task } = require('../models');
const { success, created } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');

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
    const task = await Task.findOne({ where: { id: taskId, userId: req.user.id } });
    if (!task) {
      throw new NotFoundError('任务');
    }

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
    const task = await Task.findOne({ where: { id: taskId, userId: req.user.id } });
    if (!task) {
      throw new NotFoundError('任务');
    }

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
    const task = await Task.findOne({ where: { id: taskId, userId: req.user.id } });
    if (!task) {
      throw new NotFoundError('任务');
    }

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
    const task = await Task.findOne({ where: { id: taskId, userId: req.user.id } });
    if (!task) {
      throw new NotFoundError('任务');
    }

    // 更新完成记录
    const record = await completionRecordRepository.update(taskId, completionDate, req.body);

    return success(res, record, '完成记录已更新');
  } catch (err) {
    console.error('[TaskController] 更新完成记录失败:', err);
    next(err);
  }
}

// ============================================================
// ⭐ 新增（2026-03-15）：重复任务批量更新Controller
// ============================================================

/**
 * PUT /api/v1/tasks/:id/recurrence?scope=future&date=YYYY-MM-DD
 * 更新重复任务的未来实例（保留过去记录）
 */
async function updateTaskRecurrence(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const { scope, date } = req.query;
    const updateData = req.body;

    console.log(`[TaskController] 更新重复任务 taskId=${taskId}, scope=${scope}, date=${date}`);

    const task = await taskService.updateTaskRecurrence(taskId, userId, updateData, scope, date);

    return success(res, task, '未来实例已更新');
  } catch (err) {
    console.error('[TaskController] 更新未来实例失败:', err);
    next(err);
  }
}

/**
 * PUT /api/v1/tasks/:id/occurrences/:date
 * 仅更新重复任务的单个日期实例（象限覆盖）
 */
async function updateTaskOccurrence(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId || req.params.id);
    const userId = req.user.id;
    const { date } = req.params;
    const updateData = req.body;

    console.log(`[TaskController] 更新单日实例 taskId=${taskId}, date=${date}`);

    const record = await taskService.updateTaskOccurrence(taskId, userId, updateData, date);

    return success(res, record, '当天实例已更新');
  } catch (err) {
    console.error('[TaskController] 更新单日实例失败:', err);
    next(err);
  }
}

// ============================================================
// ⭐ RRULE架构完善 - 阶段一Day3新增（2026-03-16）
// 重复任务的四种核心操作
// ============================================================

/**
 * POST /api/v1/tasks/:id/modify-single-day
 * 操作1：修改当天 - 创建单日覆盖
 * @param {number} req.params.id - 任务ID
 * @param {string} req.body.date - 日期（YYYY-MM-DD）
 * @param {object} req.body.updates - 要覆盖的字段
 */
async function modifyRecurringTaskSingleDay(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const { date, updates } = req.body;

    // 参数验证
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError('日期格式需为 YYYY-MM-DD');
    }
    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('updates 必须是对象');
    }

    console.log(`[TaskController] 修改当天 taskId=${taskId}, date=${date}`);

    // 调用RecurringTaskService
    const override = await recurringTaskService.modifySingleDay(
      taskId,
      userId,
      date,
      updates
    );

    return created(res, override, '单日覆盖创建成功');
  } catch (err) {
    console.error('[TaskController] 修改当天失败:', err);
    next(err);
  }
}

/**
 * POST /api/v1/tasks/:id/modify-future
 * 操作2：修改未来 - 拆分任务规则
 * @param {number} req.params.id - 任务ID
 * @param {string} req.body.splitDate - 拆分起始日期（YYYY-MM-DD）
 * @param {object} req.body.updates - 新规则的字段更新
 */
async function modifyRecurringTaskFuture(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const { splitDate, updates } = req.body;

    // 参数验证
    if (!splitDate || !/^\d{4}-\d{2}-\d{2}$/.test(splitDate)) {
      throw new ValidationError('splitDate格式需为 YYYY-MM-DD');
    }
    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('updates 必须是对象');
    }

    console.log(`[TaskController] 修改未来 taskId=${taskId}, splitDate=${splitDate}`);

    // 调用RecurringTaskService
    const result = await recurringTaskService.modifyFuture(
      taskId,
      userId,
      splitDate,
      updates
    );

    return success(res, result, '规则拆分成功');
  } catch (err) {
    console.error('[TaskController] 修改未来失败:', err);
    next(err);
  }
}

/**
 * POST /api/v1/tasks/:id/delete-single-day
 * 操作4：删除当天 - 添加到EXDATE
 * @param {number} req.params.id - 任务ID
 * @param {string} req.body.date - 日期（YYYY-MM-DD）
 */
async function deleteRecurringTaskSingleDay(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const { date } = req.body;

    // 参数验证
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError('日期格式需为 YYYY-MM-DD');
    }

    console.log(`[TaskController] 删除当天 taskId=${taskId}, date=${date}`);

    // 调用RecurringTaskService
    const task = await recurringTaskService.deleteSingleDay(taskId, date);

    return success(res, task, '已添加到例外日期');
  } catch (err) {
    console.error('[TaskController] 删除当天失败:', err);
    next(err);
  }
}

/**
 * POST /api/v1/tasks/:id/delete-future
 * 操作6：删除当天及未来 - 修改UNTIL
 * @param {number} req.params.id - 任务ID
 * @param {string} req.body.endDate - 结束日期（YYYY-MM-DD）
 */
async function deleteRecurringTaskFuture(req, res, next) {
  try {
    const taskId = parseInt(req.params.id);
    const { endDate } = req.body;

    // 参数验证
    if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new ValidationError('endDate格式需为 YYYY-MM-DD');
    }

    console.log(`[TaskController] 删除未来 taskId=${taskId}, endDate=${endDate}`);

    // 调用RecurringTaskService
    const task = await recurringTaskService.deleteFuture(taskId, endDate);

    return success(res, task, '已修改规则结束时间');
  } catch (err) {
    console.error('[TaskController] 删除未来失败:', err);
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
  updateCompletionRecord,
  // ⭐ 新增（2026-03-15）
  updateTaskRecurrence,
  updateTaskOccurrence,
  // ⭐ RRULE架构完善 - 阶段一Day3新增（2026-03-16）
  modifyRecurringTaskSingleDay,
  modifyRecurringTaskFuture,
  deleteRecurringTaskSingleDay,
  deleteRecurringTaskFuture
};
