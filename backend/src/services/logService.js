'use strict';

const { Op } = require('sequelize');
const { JournalLog, Task, PlanningRecord } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * 日志Service
 * 心得/灵感/事件记录，精确到分，支持转化为任务
 */

/**
 * 创建日志
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<JournalLog>}
 */
async function createLog(userId, data) {
  const {
    title, content, logType = 'note',
    moodLevel, tags, logTime, planId, taskId, attachments
  } = data;

  if (!content || content.trim() === '') {
    throw new ValidationError('日志内容不能为空');
  }

  // 记录时刻：前端传入或使用当前时间
  const recordTime = logTime ? new Date(logTime) : new Date();

  // 自动计算所属日期（取北京时间日期）
  const logDate = getLocalDate(recordTime);

  const log = await JournalLog.create({
    userId,
    title: title || null,
    content: content.trim(),
    logType,
    moodLevel: moodLevel || null,
    tags: tags || null,
    logTime: recordTime,
    logDate,
    planId: planId || null,
    taskId: taskId || null,
    attachments: attachments || null,
    convertedToTask: false
  });

  return log;
}

/**
 * 获取某天的日志（按 log_time 升序，精确到分）
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<JournalLog[]>}
 */
async function getLogsByDate(userId, date) {
  return JournalLog.findAll({
    where: { userId, logDate: date },
    include: [
      { model: Task, as: 'relatedTask', attributes: ['id', 'title', 'status'], required: false },
      { model: PlanningRecord, as: 'plan', attributes: ['id', 'title', 'type'], required: false }
    ],
    order: [['logTime', 'ASC']]  // 按记录时刻正序（流水账）
  });
}

/**
 * 获取日期范围内的日志（默认倒序，最新的在前）
 * @param {number} userId
 * @param {string} startDate
 * @param {string} endDate
 * @param {Object} options
 * @returns {Promise<JournalLog[]>}
 */
async function getLogsByRange(userId, startDate, endDate, options = {}) {
  const { logType, planId, page = 1, pageSize = 20 } = options;

  const where = {
    userId,
    logDate: { [Op.between]: [startDate, endDate] }
  };
  if (logType) where.logType = logType;
  if (planId) where.planId = planId;

  return JournalLog.findAndCountAll({
    where,
    include: [
      { model: Task, as: 'relatedTask', attributes: ['id', 'title', 'status'], required: false },
      { model: PlanningRecord, as: 'plan', attributes: ['id', 'title', 'type'], required: false }
    ],
    order: [['logTime', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  });
}

/**
 * 更新日志
 * @param {number} logId
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<JournalLog>}
 */
async function updateLog(logId, userId, data) {
  const log = await JournalLog.findOne({ where: { id: logId, userId } });
  if (!log) throw new NotFoundError('日志不存在');

  const { title, content, logType, moodLevel, tags, planId, taskId, attachments } = data;

  await log.update({
    title: title ?? log.title,
    content: content ?? log.content,
    logType: logType ?? log.logType,
    moodLevel: moodLevel ?? log.moodLevel,
    tags: tags ?? log.tags,
    planId: planId ?? log.planId,
    taskId: taskId ?? log.taskId,
    attachments: attachments ?? log.attachments
  });

  return log;
}

/**
 * 将日志转化为任务
 * @param {number} logId
 * @param {number} userId
 * @param {Object} taskData - 额外的任务属性（可选）
 * @returns {Promise<{ log: JournalLog, task: Task }>}
 */
async function convertToTask(logId, userId, taskData = {}) {
  const log = await JournalLog.findOne({ where: { id: logId, userId } });
  if (!log) throw new NotFoundError('日志不存在');
  if (log.convertedToTask) throw new ValidationError('该日志已转化为任务');

  const { Task: TaskModel } = require('../models');

  // 以日志内容创建任务
  const task = await TaskModel.create({
    userId,
    title: taskData.title || log.title || log.content.substring(0, 100),
    description: taskData.description || log.content,
    isUrgent: taskData.isUrgent || false,
    isImportant: taskData.isImportant || false,
    isAllDay: taskData.isAllDay !== undefined ? taskData.isAllDay : true,
    dateType: taskData.taskDate ? 'single' : 'none',
    taskDate: taskData.taskDate || null,
    planId: taskData.planId || log.planId || null,
    sourceType: 'from_log',
    sourceId: log.id
  });

  // 更新日志，标记已转化
  await log.update({
    convertedToTask: true,
    convertedTaskId: task.id
  });

  return { log, task };
}

/**
 * 软删除日志
 * @param {number} logId
 * @param {number} userId
 */
async function deleteLog(logId, userId) {
  const log = await JournalLog.findOne({ where: { id: logId, userId } });
  if (!log) throw new NotFoundError('日志不存在');
  await log.destroy();
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取给定时间的本地日期字符串（北京时间 UTC+8）
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
function getLocalDate(date) {
  // UTC+8
  const offset = 8 * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + offset);
  return localDate.toISOString().split('T')[0];
}

module.exports = {
  createLog,
  getLogsByDate,
  getLogsByRange,
  updateLog,
  convertToTask,
  deleteLog
};
