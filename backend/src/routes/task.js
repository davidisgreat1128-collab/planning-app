'use strict';

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validator');
const taskController = require('../controllers/taskController');

// ---- Joi Schemas ----

const dateStr = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  'string.pattern.base': '日期格式需为 YYYY-MM-DD'
});
const timeStr = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).messages({
  'string.pattern.base': '时间格式需为 HH:mm 或 HH:mm:ss'
});

const createTaskSchema = Joi.object({
  title:        Joi.string().trim().min(1).max(200).required(),
  description:  Joi.string().trim().max(2000).allow('', null),
  isUrgent:     Joi.boolean().default(false),
  isImportant:  Joi.boolean().default(false),
  isAllDay:     Joi.boolean().default(true),
  dateType:     Joi.string().valid('single', 'range').default('single'),
  taskDate:     dateStr.when('dateType', { is: 'single', then: Joi.required() }),
  startDate:    dateStr.when('dateType', { is: 'range',  then: Joi.required() }),
  endDate:      dateStr.when('dateType', { is: 'range',  then: Joi.required() }),
  startTime:    timeStr.allow(null),
  endTime:      timeStr.allow(null),
  isRecurring:  Joi.boolean().default(false),
  rrule:        Joi.string().max(500).allow('', null),
  rruleUntil:   dateStr.allow(null),
  planId:       Joi.string().max(50).allow(null),  // 修改：前端规划ID是字符串类型
  categoryId:   Joi.string().max(50).allow(null),  // 添加：分类ID字段
  reminderTime: Joi.string().allow(null),  // 添加：提醒时间字段
  reminderPersistent: Joi.boolean().allow(null),  // 添加：持久提醒字段
  subtasks:     Joi.array().items(
    Joi.object({
      title: Joi.string().trim().min(1).max(200).required(),
      done: Joi.boolean().required()
    })
  ).allow(null)  // 添加：子任务数组字段
});

const updateTaskSchema = Joi.object({
  title:        Joi.string().trim().min(1).max(200),
  description:  Joi.string().trim().max(2000).allow('', null),
  isUrgent:     Joi.boolean(),
  isImportant:  Joi.boolean(),
  isAllDay:     Joi.boolean(),
  dateType:     Joi.string().valid('single', 'range'),
  taskDate:     dateStr.allow(null),
  startDate:    dateStr.allow(null),
  endDate:      dateStr.allow(null),
  startTime:    timeStr.allow(null),
  endTime:      timeStr.allow(null),
  status:       Joi.string().valid('pending', 'completed', 'skipped'),
  categoryId:   Joi.string().max(50).allow(null),  // 添加：分类ID字段
  subtasks:     Joi.array().items(
    Joi.object({
      title: Joi.string().trim().min(1).max(200).required(),
      done: Joi.boolean().required()
    })
  ).allow(null)  // 添加：子任务数组字段
}).min(1);

const getTasksQuerySchema = Joi.object({
  date:             dateStr,
  start:            dateStr,
  end:              dateStr,
  includeCompleted: Joi.string().valid('true', 'false')
}).or('date', 'start');  // 至少提供 date 或 start

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

const taskIdParamSchema = Joi.object({
  taskId: Joi.number().integer().positive().required()
});

const planIdParamSchema = Joi.object({
  planId: Joi.string().max(50).required()  // 修改：前端规划ID是字符串类型
});

const categoryIdParamSchema = Joi.object({
  categoryId: Joi.string().max(50).required()
});

// 新增：完成记录相关的Schema
const completeTaskSchema = Joi.object({
  completionDate: dateStr.required(),
  subtaskCompletion: Joi.object().allow(null),
  note: Joi.string().max(2000).allow('', null)
});

const getOccurrencesQuerySchema = Joi.object({
  start: dateStr.required(),
  end: dateStr.required()
});

const getCompletionRecordsQuerySchema = Joi.object({
  start: dateStr,
  end: dateStr,
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
});

const updateCompletionRecordSchema = Joi.object({
  status: Joi.string().valid('pending', 'completed', 'skipped'),
  subtaskCompletion: Joi.object().allow(null),
  note: Joi.string().max(2000).allow('', null)
}).min(1);

const taskIdAndDateParamsSchema = Joi.object({
  taskId: Joi.number().integer().positive().required(),
  date: dateStr.required()
});

// ⭐ 新增（2026-03-15）：重复任务批量更新相关Schema
const updateRecurrenceQuerySchema = Joi.object({
  scope: Joi.string().valid('future').required(),  // 当前仅支持 'future'
  date: dateStr.required()  // 分界日期
});

const updateOccurrenceSchema = Joi.object({
  isUrgent: Joi.boolean(),
  isImportant: Joi.boolean()
}).min(1);

// ---- Routes ----

router.use(authenticate);

// POST /api/v1/tasks - 创建任务
router.post('/', validate(createTaskSchema), taskController.createTask);

// GET /api/v1/tasks?date=2026-02-18 或 ?start=...&end=...
router.get('/', validateQuery(getTasksQuerySchema), taskController.getTasks);

// GET /api/v1/tasks/plan/:planId - 获取规划子任务
router.get('/plan/:planId', validateParams(planIdParamSchema), taskController.getSubtasksByPlan);

// PUT /api/v1/tasks/:id - 更新任务
router.put('/:id', validateParams(idParamSchema), validate(updateTaskSchema), taskController.updateTask);

// PATCH /api/v1/tasks/occurrences/:id - 更新重复任务实例
router.patch('/occurrences/:id', validateParams(idParamSchema), taskController.updateOccurrence);

// DELETE /api/v1/tasks/:id - 软删除任务
router.delete('/:id', validateParams(idParamSchema), taskController.deleteTask);

// PUT /api/v1/tasks/category/:categoryId/uncategorize - 将分类下的任务移到"无分类"
router.put('/category/:categoryId/uncategorize', validateParams(categoryIdParamSchema), taskController.uncategorizeTasks);

// DELETE /api/v1/tasks/category/:categoryId - 删除分类下的所有任务
router.delete('/category/:categoryId', validateParams(categoryIdParamSchema), taskController.deleteCategoryTasks);

// ============================================================
// 重复任务 + 完成记录 新增路由（RRULE规则计算）
// ============================================================

// GET /api/v1/tasks/:taskId/occurrences?start=2026-03-01&end=2026-03-31
// 获取重复任务在指定日期范围内的所有发生日期
router.get('/:taskId/occurrences',
  validateParams(taskIdParamSchema),
  validateQuery(getOccurrencesQuerySchema),
  taskController.getTaskOccurrences
);

// POST /api/v1/tasks/:taskId/complete
// 创建任务完成记录
router.post('/:taskId/complete',
  validateParams(taskIdParamSchema),
  validate(completeTaskSchema),
  taskController.completeTask
);

// GET /api/v1/tasks/:taskId/completion-records?start=2026-03-01&end=2026-03-31
// 获取任务的完成记录列表
router.get('/:taskId/completion-records',
  validateParams(taskIdParamSchema),
  validateQuery(getCompletionRecordsQuerySchema),
  taskController.getCompletionRecords
);

// PUT /api/v1/tasks/:taskId/completion-records/:date
// 更新任务完成记录
router.put('/:taskId/completion-records/:date',
  validateParams(taskIdAndDateParamsSchema),
  validate(updateCompletionRecordSchema),
  taskController.updateCompletionRecord
);

// ============================================================
// ⭐ 新增（2026-03-15）：重复任务批量更新API
// ============================================================

// PUT /api/v1/tasks/:id/recurrence?scope=future&date=YYYY-MM-DD
// 更新重复任务的未来实例（保留过去记录）
router.put('/:id/recurrence',
  validateParams(idParamSchema),
  validateQuery(updateRecurrenceQuerySchema),
  validate(updateOccurrenceSchema),
  taskController.updateTaskRecurrence
);

// PUT /api/v1/tasks/:id/occurrences/:date
// 仅更新重复任务的单个日期实例（象限覆盖）
router.put('/:id/occurrences/:date',
  validateParams(taskIdAndDateParamsSchema),
  validate(updateOccurrenceSchema),
  taskController.updateTaskOccurrence
);

// ============================================================
// ⭐ RRULE架构完善 - 阶段一Day3新增（2026-03-16）
// 重复任务的四种核心操作
// ============================================================

// 新增Schema：修改当天（创建单日覆盖）
const modifySingleDaySchema = Joi.object({
  date: dateStr.required(),
  updates: Joi.object({
    title: Joi.string().trim().min(1).max(500),
    description: Joi.string().trim().max(2000).allow('', null),
    isUrgent: Joi.boolean(),
    isImportant: Joi.boolean(),
    startTime: timeStr.allow(null),
    endTime: timeStr.allow(null),
    isAllDay: Joi.boolean()
  }).min(1).required()
});

// 新增Schema：修改未来（拆分规则）
const modifyFutureSchema = Joi.object({
  splitDate: dateStr.required(),
  updates: Joi.object({
    title: Joi.string().trim().min(1).max(500),
    description: Joi.string().trim().max(2000).allow('', null),
    isUrgent: Joi.boolean(),
    isImportant: Joi.boolean(),
    startTime: timeStr.allow(null),
    endTime: timeStr.allow(null),
    isAllDay: Joi.boolean()
  }).min(1).required()
});

// 新增Schema：删除当天（添加EXDATE）
const deleteSingleDaySchema = Joi.object({
  date: dateStr.required()
});

// 新增Schema：删除未来（修改UNTIL）
const deleteFutureSchema = Joi.object({
  endDate: dateStr.required()
});

// POST /api/v1/tasks/:id/modify-single-day
// 操作1：修改当天 - 创建单日覆盖
router.post('/:id/modify-single-day',
  validateParams(idParamSchema),
  validate(modifySingleDaySchema),
  taskController.modifyRecurringTaskSingleDay
);

// POST /api/v1/tasks/:id/modify-future
// 操作2：修改未来 - 拆分任务规则
router.post('/:id/modify-future',
  validateParams(idParamSchema),
  validate(modifyFutureSchema),
  taskController.modifyRecurringTaskFuture
);

// POST /api/v1/tasks/:id/delete-single-day
// 操作4：删除当天 - 添加到EXDATE
router.post('/:id/delete-single-day',
  validateParams(idParamSchema),
  validate(deleteSingleDaySchema),
  taskController.deleteRecurringTaskSingleDay
);

// POST /api/v1/tasks/:id/delete-future
// 操作6：删除当天及未来 - 修改UNTIL
router.post('/:id/delete-future',
  validateParams(idParamSchema),
  validate(deleteFutureSchema),
  taskController.deleteRecurringTaskFuture
);

module.exports = router;
