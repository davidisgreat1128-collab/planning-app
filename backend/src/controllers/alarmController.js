'use strict';

const alarmService = require('../services/alarmService');
const { success, successCreated } = require('../utils/response');

/**
 * POST /api/v1/alarms - 创建闹铃
 */
async function createAlarm(req, res, next) {
  try {
    const alarm = await alarmService.createAlarm(req.user.id, req.body);
    res.status(201).json(successCreated(alarm, '闹铃创建成功'));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/alarms?activeOnly=true - 获取闹铃列表
 */
async function getAlarms(req, res, next) {
  try {
    const alarms = await alarmService.getAlarms(req.user.id, {
      activeOnly: req.query.activeOnly === 'true'
    });
    res.json(success({ alarms }));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/alarms/:id - 更新闹铃
 */
async function updateAlarm(req, res, next) {
  try {
    const alarm = await alarmService.updateAlarm(parseInt(req.params.id), req.user.id, req.body);
    res.json(success(alarm, '闹铃更新成功'));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/alarms/:id/toggle - 切换启用/禁用
 */
async function toggleAlarm(req, res, next) {
  try {
    const alarm = await alarmService.toggleAlarm(parseInt(req.params.id), req.user.id);
    res.json(success(alarm, alarm.isActive ? '闹铃已启用' : '闹铃已禁用'));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/alarms/:id - 删除闹铃
 */
async function deleteAlarm(req, res, next) {
  try {
    await alarmService.deleteAlarm(parseInt(req.params.id), req.user.id);
    res.json(success(null, '闹铃已删除'));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/alarms/sounds - 获取音频库
 */
async function getAlarmSounds(req, res, next) {
  try {
    const sounds = await alarmService.getAlarmSounds(req.user.id);
    res.json(success(sounds));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/alarms/sounds - 创建用户录音条目
 */
async function createAlarmSound(req, res, next) {
  try {
    const sound = await alarmService.createAlarmSound(req.user.id, req.body);
    res.status(201).json(successCreated(sound, '录音已保存'));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/alarms/sounds/:id/trim - 更新剪辑信息
 */
async function updateAlarmSoundTrim(req, res, next) {
  try {
    const sound = await alarmService.updateAlarmSoundTrim(
      parseInt(req.params.id), req.user.id, req.body
    );
    res.json(success(sound, '剪辑信息已更新'));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAlarm, getAlarms, updateAlarm, toggleAlarm, deleteAlarm,
  getAlarmSounds, createAlarmSound, updateAlarmSoundTrim
};
