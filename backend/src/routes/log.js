'use strict';

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validator');
const logController = require('../controllers/logController');

// ---- Joi Schemas ----

const dateStr = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  'string.pattern.base': '日期格式需为 YYYY-MM-DD'
});

const createLogSchema = Joi.object({
  title:       Joi.string().trim().max(200).allow('', null),
  content:     Joi.string().trim().min(1).max(10000).required(),
  logType:     Joi.string().valid('note', 'insight', 'event', 'idea', 'mood').default('note'),
  moodLevel:   Joi.number().integer().min(1).max(5).allow(null),
  tags:        Joi.array().items(Joi.string().trim().max(50)).max(20).allow(null),
  logTime:     Joi.string().isoDate().allow('', null),
  planId:      Joi.number().integer().positive().allow(null),
  taskId:      Joi.number().integer().positive().allow(null),
  attachments: Joi.array().allow(null)
});

const updateLogSchema = Joi.object({
  title:       Joi.string().trim().max(200).allow('', null),
  content:     Joi.string().trim().min(1).max(10000),
  logType:     Joi.string().valid('note', 'insight', 'event', 'idea', 'mood'),
  moodLevel:   Joi.number().integer().min(1).max(5).allow(null),
  tags:        Joi.array().items(Joi.string().trim().max(50)).max(20).allow(null),
  planId:      Joi.number().integer().positive().allow(null),
  taskId:      Joi.number().integer().positive().allow(null),
  attachments: Joi.array().allow(null)
}).min(1);

const convertToTaskSchema = Joi.object({
  title:       Joi.string().trim().max(200).allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  isUrgent:    Joi.boolean(),
  isImportant: Joi.boolean(),
  isAllDay:    Joi.boolean(),
  taskDate:    dateStr.allow(null),
  planId:      Joi.number().integer().positive().allow(null)
});

const getLogsQuerySchema = Joi.object({
  date:     dateStr,
  start:    dateStr,
  end:      dateStr,
  logType:  Joi.string().valid('note', 'insight', 'event', 'idea', 'mood'),
  planId:   Joi.number().integer().positive(),
  page:     Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
}).or('date', 'start');

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// ---- Routes ----

router.use(authenticate);

router.post('/', validate(createLogSchema), logController.createLog);
router.get('/', validateQuery(getLogsQuerySchema), logController.getLogs);
router.put('/:id', validateParams(idParamSchema), validate(updateLogSchema), logController.updateLog);
router.post('/:id/convert-to-task', validateParams(idParamSchema), validate(convertToTaskSchema), logController.convertToTask);
router.delete('/:id', validateParams(idParamSchema), logController.deleteLog);

module.exports = router;
