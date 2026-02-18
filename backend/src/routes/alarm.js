'use strict';

const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validator');
const alarmController = require('../controllers/alarmController');

// ---- Joi Schemas ----

const timeStr = Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).messages({
  'string.pattern.base': '时间格式需为 HH:mm 或 HH:mm:ss'
});
const dateStr = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  'string.pattern.base': '日期格式需为 YYYY-MM-DD'
});

const createAlarmSchema = Joi.object({
  taskId:          Joi.number().integer().positive().allow(null),
  soundId:         Joi.number().integer().positive().allow(null),
  label:           Joi.string().trim().max(100).allow('', null),
  alarmTime:       timeStr.required(),
  alarmDate:       dateStr.allow(null),
  remindBeforeMin: Joi.number().integer().min(0).max(1440).default(0),
  repeatType:      Joi.string().valid('none', 'daily', 'weekdays', 'weekends', 'weekly', 'custom').default('none'),
  rrule:           Joi.string().max(500).allow('', null),
  repeatDays:      Joi.array().items(Joi.number().integer().min(0).max(6)).allow(null),
  notifyInapp:     Joi.boolean().default(true),
  notifyPush:      Joi.boolean().default(true)
});

const updateAlarmSchema = Joi.object({
  taskId:          Joi.number().integer().positive().allow(null),
  soundId:         Joi.number().integer().positive().allow(null),
  label:           Joi.string().trim().max(100).allow('', null),
  alarmTime:       timeStr,
  alarmDate:       dateStr.allow(null),
  remindBeforeMin: Joi.number().integer().min(0).max(1440),
  repeatType:      Joi.string().valid('none', 'daily', 'weekdays', 'weekends', 'weekly', 'custom'),
  rrule:           Joi.string().max(500).allow('', null),
  repeatDays:      Joi.array().items(Joi.number().integer().min(0).max(6)).allow(null),
  notifyInapp:     Joi.boolean(),
  notifyPush:      Joi.boolean()
}).min(1);

const createAlarmSoundSchema = Joi.object({
  name:          Joi.string().trim().min(1).max(100).required(),
  filePath:      Joi.string().trim().max(500).required(),
  durationSec:   Joi.number().min(0).allow(null),
  originalPath:  Joi.string().trim().max(500).allow('', null),
  trimStartMs:   Joi.number().integer().min(0).default(0),
  trimEndMs:     Joi.number().integer().min(0).allow(null),
  fileSizeBytes: Joi.number().integer().min(0).allow(null),
  mimeType:      Joi.string().max(50).allow('', null)
});

const trimSoundSchema = Joi.object({
  trimStartMs:  Joi.number().integer().min(0).required(),
  trimEndMs:    Joi.number().integer().min(0).allow(null),
  filePath:     Joi.string().trim().max(500).allow('', null),
  durationSec:  Joi.number().min(0).allow(null)
}).min(1);

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// ---- Routes ----

router.use(authenticate);

// 音频库（路由需在 /:id 之前，避免被误匹配）
router.get('/sounds', alarmController.getAlarmSounds);
router.post('/sounds', validate(createAlarmSoundSchema), alarmController.createAlarmSound);
router.put('/sounds/:id/trim', validateParams(idParamSchema), validate(trimSoundSchema), alarmController.updateAlarmSoundTrim);

// 闹铃 CRUD
router.post('/', validate(createAlarmSchema), alarmController.createAlarm);
router.get('/', alarmController.getAlarms);
router.put('/:id', validateParams(idParamSchema), validate(updateAlarmSchema), alarmController.updateAlarm);
router.patch('/:id/toggle', validateParams(idParamSchema), alarmController.toggleAlarm);
router.delete('/:id', validateParams(idParamSchema), alarmController.deleteAlarm);

module.exports = router;
