'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const alarmController = require('../controllers/alarmController');

router.use(authenticate);

// 音频库（路由需在 /:id 之前，避免被误匹配）
router.get('/sounds', alarmController.getAlarmSounds);
router.post('/sounds', alarmController.createAlarmSound);
router.put('/sounds/:id/trim', alarmController.updateAlarmSoundTrim);

// 闹铃 CRUD
router.post('/', alarmController.createAlarm);
router.get('/', alarmController.getAlarms);
router.put('/:id', alarmController.updateAlarm);
router.patch('/:id/toggle', alarmController.toggleAlarm);
router.delete('/:id', alarmController.deleteAlarm);

module.exports = router;
