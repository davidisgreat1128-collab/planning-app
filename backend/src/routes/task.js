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
  validateParams(idParamSchema),
  validateQuery(getOccurrencesQuerySchema),
  taskController.getTaskOccurrences
);

// POST /api/v1/tasks/:taskId/complete
// 创建任务完成记录
router.post('/:taskId/complete',
  validateParams(idParamSchema),
  validate(completeTaskSchema),
  taskController.completeTask
);

// GET /api/v1/tasks/:taskId/completion-records?start=2026-03-01&end=2026-03-31
// 获取任务的完成记录列表
router.get('/:taskId/completion-records',
  validateParams(idParamSchema),
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

module.exports = router;
