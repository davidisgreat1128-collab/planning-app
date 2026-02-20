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
  planId:       Joi.number().integer().positive().allow(null)
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
  status:       Joi.string().valid('pending', 'completed', 'skipped')
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
  planId: Joi.number().integer().positive().required()
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

module.exports = router;
