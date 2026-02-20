'use strict';

const { Alarm, AlarmSound, Task } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * 闹铃Service
 */

/**
 * 创建闹铃
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<Alarm>}
 */
async function createAlarm(userId, data) {
  const {
    taskId = null, soundId = null, label,
    alarmTime, alarmDate = null,
    remindBeforeMin = 0,
    repeatType = 'none', rrule = null, repeatDays = null,
    notifyInapp = true, notifyPush = true
  } = data;

  if (!alarmTime) throw new ValidationError('闹铃时间不能为空');
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(alarmTime)) {
    throw new ValidationError('闹铃时间格式需为 HH:mm 或 HH:mm:ss');
  }
  if (repeatType === 'none' && !alarmDate) {
    throw new ValidationError('单次闹铃需要提供 alarmDate（具体日期）');
  }
  if (repeatType === 'custom' && !rrule) {
    throw new ValidationError('自定义重复需要提供 rrule 规则');
  }

  // 验证任务存在（如果绑定了任务）
  if (taskId) {
    const task = await Task.findOne({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundError('关联的任务不存在');
  }

  // 验证音频存在（如果指定了音频）
  if (soundId) {
    const sound = await AlarmSound.findByPk(soundId);
    if (!sound) throw new NotFoundError('指定的闹铃音频不存在');
  }

  const alarm = await Alarm.create({
    userId, taskId, soundId, label,
    alarmTime, alarmDate,
    remindBeforeMin, repeatType, rrule, repeatDays,
    notifyInapp, notifyPush,
    isActive: true
  });

  return alarm;
}

/**
 * 获取用户的闹铃列表
 * @param {number} userId
 * @param {Object} options
 * @returns {Promise<Alarm[]>}
 */
async function getAlarms(userId, options = {}) {
  const { activeOnly = false } = options;

  return Alarm.findAll({
    where: {
      userId,
      ...(activeOnly ? { isActive: true } : {})
    },
    include: [
      { model: AlarmSound, as: 'sound', attributes: ['id', 'name', 'filePath', 'durationSec'] },
      { model: Task, as: 'task', attributes: ['id', 'title', 'taskDate'] }
    ],
    order: [['alarmTime', 'ASC']]
  });
}

/**
 * 更新闹铃
 * @param {number} alarmId
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<Alarm>}
 */
async function updateAlarm(alarmId, userId, data) {
  const alarm = await Alarm.findOne({ where: { id: alarmId, userId } });
  if (!alarm) throw new NotFoundError('闹铃不存在');

  await alarm.update(data);
  return alarm;
}

/**
 * 切换闹铃启用状态
 * @param {number} alarmId
 * @param {number} userId
 * @returns {Promise<Alarm>}
 */
async function toggleAlarm(alarmId, userId) {
  const alarm = await Alarm.findOne({ where: { id: alarmId, userId } });
  if (!alarm) throw new NotFoundError('闹铃不存在');
  await alarm.update({ isActive: !alarm.isActive });
  return alarm;
}

/**
 * 删除闹铃
 * @param {number} alarmId
 * @param {number} userId
 */
async function deleteAlarm(alarmId, userId) {
  const alarm = await Alarm.findOne({ where: { id: alarmId, userId } });
  if (!alarm) throw new NotFoundError('闹铃不存在');
  await alarm.destroy();
}

/**
 * 获取闹铃音频库（系统预置 + 用户自己的录音）
 * @param {number} userId
 * @returns {Promise<{ preset: AlarmSound[], recorded: AlarmSound[] }>}
 */
async function getAlarmSounds(userId) {
  const preset = await AlarmSound.findAll({
    where: { userId: null, type: 'preset' },
    order: [['name', 'ASC']]
  });

  const recorded = await AlarmSound.findAll({
    where: { userId, type: 'recorded' },
    order: [['createdAt', 'DESC']]
  });

  return { preset, recorded };
}

/**
 * 创建用户录音条目（前端上传音频后调用）
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<AlarmSound>}
 */
async function createAlarmSound(userId, data) {
  const { name, filePath, durationSec, originalPath, trimStartMs = 0, trimEndMs = null, fileSizeBytes, mimeType } = data;

  if (!name || !filePath) throw new ValidationError('音频名称和文件路径不能为空');

  return AlarmSound.create({
    userId,
    name,
    type: 'recorded',
    filePath,
    durationSec: durationSec || 0,
    originalPath,
    trimStartMs,
    trimEndMs,
    fileSizeBytes,
    mimeType
  });
}

/**
 * 更新录音剪辑信息
 * @param {number} soundId
 * @param {number} userId
 * @param {Object} trimData - { trimStartMs, trimEndMs, filePath, durationSec }
 * @returns {Promise<AlarmSound>}
 */
async function updateAlarmSoundTrim(soundId, userId, trimData) {
  const sound = await AlarmSound.findOne({ where: { id: soundId, userId, type: 'recorded' } });
  if (!sound) throw new NotFoundError('录音不存在或无权限修改');

  await sound.update(trimData);
  return sound;
}

module.exports = {
  createAlarm,
  getAlarms,
  updateAlarm,
  toggleAlarm,
  deleteAlarm,
  getAlarmSounds,
  createAlarmSound,
  updateAlarmSoundTrim
};
