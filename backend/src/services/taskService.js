'use strict';

const { Op } = require('sequelize');
const { Task, TaskOccurrence, User } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * 任务Service
 * 备忘录任务的增删改查 + 重复任务实例生成
 */

/**
 * 创建任务
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<Task>}
 */
async function createTask(userId, data) {
  const {
    title, description,
    isUrgent = false, isImportant = false,
    isAllDay = true, dateType = 'single',
    taskDate, startDate, endDate, startTime, endTime,
    isRecurring = false, rrule, rruleUntil,
    planId = null
  } = data;

  // 校验日期逻辑
  if (dateType === 'single' && !taskDate) {
    throw new ValidationError('单日任务需要提供 taskDate');
  }
  if (dateType === 'range' && (!startDate || !endDate)) {
    throw new ValidationError('跨天任务需要提供 startDate 和 endDate');
  }
  if (dateType === 'range' && startDate > endDate) {
    throw new ValidationError('开始日期不能晚于结束日期');
  }
  if (isRecurring && !rrule) {
    throw new ValidationError('重复任务需要提供 rrule 规则');
  }

  const task = await Task.create({
    userId,
    title,
    description,
    isUrgent,
    isImportant,
    isAllDay,
    dateType,
    taskDate: dateType === 'single' ? taskDate : null,
    startDate: dateType === 'range' ? startDate : null,
    endDate: dateType === 'range' ? endDate : null,
    startTime: !isAllDay ? startTime : null,
    endTime: !isAllDay ? endTime : null,
    isRecurring,
    rrule: isRecurring ? rrule : null,
    rruleUntil: isRecurring ? rruleUntil : null,
    planId,
    sourceType: planId ? 'from_plan' : 'manual'
  });

  // 如果是重复任务，生成近3个月的实例
  if (isRecurring && rrule) {
    await generateOccurrences(task, 90);
  }

  return task;
}

/**
 * 获取某天的任务列表
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @param {Object} options - 额外过滤选项
 * @returns {Promise<Object>} { single: Task[], range: Task[], recurring: TaskOccurrence[] }
 */
async function getTasksByDate(userId, date, options = {}) {
  const { includeCompleted = true } = options;

  const statusFilter = includeCompleted ? {} : { status: 'pending' };

  // 1. 单日任务
  const singleTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'single',
      taskDate: date,
      ...statusFilter
    },
    order: [['startTime', 'ASC'], ['isUrgent', 'DESC'], ['isImportant', 'DESC']]
  });

  // 2. 跨天任务（该日期在范围内）
  const rangeTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'range',
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date },
      ...statusFilter
    },
    order: [['startDate', 'ASC']]
  });

  // 3. 重复任务实例
  const recurringOccurrences = await TaskOccurrence.findAll({
    where: {
      userId,
      occurDate: date,
      ...(includeCompleted ? {} : { status: 'pending' })
    },
    include: [{ model: Task, as: 'task' }],
    order: [['occurStartTime', 'ASC']]
  });

  return {
    single: singleTasks,
    range: rangeTasks,
    recurring: recurringOccurrences
  };
}

/**
 * 获取日期范围内的任务（用于周历/月历）
 * @param {number} userId
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Object>} key=YYYY-MM-DD, value=任务数组
 */
async function getTasksByRange(userId, startDate, endDate) {
  // 单日任务
  const singleTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'single',
      taskDate: { [Op.between]: [startDate, endDate] }
    }
  });

  // 跨天任务
  const rangeTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'range',
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate }
    }
  });

  // 重复任务实例
  const occurrences = await TaskOccurrence.findAll({
    where: {
      userId,
      occurDate: { [Op.between]: [startDate, endDate] }
    },
    include: [{ model: Task, as: 'task' }]
  });

  // 按日期分组
  const map = {};
  const initDate = (d) => { if (!map[d]) map[d] = []; };

  for (const t of singleTasks) {
    initDate(t.taskDate);
    map[t.taskDate].push({ ...t.toJSON(), _type: 'single' });
  }

  for (const t of rangeTasks) {
    // 跨天任务出现在范围内的每一天
    let cur = new Date(t.startDate < startDate ? startDate : t.startDate);
    const endD = new Date(t.endDate > endDate ? endDate : t.endDate);
    while (cur <= endD) {
      const ds = cur.toISOString().split('T')[0];
      initDate(ds);
      map[ds].push({ ...t.toJSON(), _type: 'range' });
      cur.setDate(cur.getDate() + 1);
    }
  }

  for (const o of occurrences) {
    initDate(o.occurDate);
    map[o.occurDate].push({ ...o.toJSON(), _type: 'recurring' });
  }

  return map;
}

/**
 * 更新任务
 * @param {number} taskId
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<Task>}
 */
async function updateTask(taskId, userId, data) {
  const task = await Task.findOne({ where: { id: taskId, userId } });
  if (!task) throw new NotFoundError('任务不存在');

  const {
    title, description, isUrgent, isImportant,
    isAllDay, dateType, taskDate, startDate, endDate,
    startTime, endTime, status
  } = data;

  // 完成任务时记录完成时间
  if (status === 'completed' && task.status !== 'completed') {
    data.completedAt = new Date();
  }

  await task.update({
    title: title ?? task.title,
    description: description ?? task.description,
    isUrgent: isUrgent ?? task.isUrgent,
    isImportant: isImportant ?? task.isImportant,
    isAllDay: isAllDay ?? task.isAllDay,
    dateType: dateType ?? task.dateType,
    taskDate: taskDate ?? task.taskDate,
    startDate: startDate ?? task.startDate,
    endDate: endDate ?? task.endDate,
    startTime: startTime ?? task.startTime,
    endTime: endTime ?? task.endTime,
    status: status ?? task.status,
    completedAt: data.completedAt ?? task.completedAt
  });

  return task;
}

/**
 * 完成/取消完成重复任务的某个实例
 * @param {number} occurrenceId
 * @param {number} userId
 * @param {string} status - 'completed' | 'pending' | 'skipped'
 * @returns {Promise<TaskOccurrence>}
 */
async function updateOccurrence(occurrenceId, userId, status) {
  const occurrence = await TaskOccurrence.findOne({ where: { id: occurrenceId, userId } });
  if (!occurrence) throw new NotFoundError('任务实例不存在');

  await occurrence.update({
    status,
    completedAt: status === 'completed' ? new Date() : null
  });

  return occurrence;
}

/**
 * 软删除任务
 * @param {number} taskId
 * @param {number} userId
 */
async function deleteTask(taskId, userId) {
  const task = await Task.findOne({ where: { id: taskId, userId } });
  if (!task) throw new NotFoundError('任务不存在');
  await task.destroy();  // paranoid: true → 软删除
}

/**
 * 获取规划的子任务列表
 * @param {number} planId
 * @param {number} userId
 * @returns {Promise<Task[]>}
 */
async function getSubtasksByPlan(planId, userId) {
  return Task.findAll({
    where: { planId, userId },
    order: [['taskDate', 'ASC'], ['isUrgent', 'DESC']]
  });
}

// ============================================================
// 重复任务实例生成（内部工具）
// ============================================================

/**
 * 根据RRULE生成重复任务实例
 * @param {Task} task
 * @param {number} days - 生成多少天内的实例
 */
async function generateOccurrences(task, days = 90) {
  const { RRule } = require('rrule');

  // 解析RRULE字符串
  const rruleStr = task.rrule.startsWith('RRULE:') ? task.rrule : `RRULE:${task.rrule}`;

  let rule;
  try {
    rule = RRule.fromString(rruleStr);
  } catch {
    return;  // RRULE格式不对则跳过
  }

  // 生成时间范围：从今天到N天后
  const dtstart = task.taskDate ? new Date(task.taskDate) : new Date();
  const until = new Date();
  until.setDate(until.getDate() + days);
  if (task.rruleUntil && new Date(task.rruleUntil) < until) {
    until.setTime(new Date(task.rruleUntil).getTime());
  }

  const dates = rule.between(dtstart, until, true);

  // 批量插入实例
  const occurrences = dates.map(d => ({
    taskId: task.id,
    userId: task.userId,
    occurDate: d.toISOString().split('T')[0],
    occurStartTime: task.startTime,
    occurEndTime: task.endTime,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  if (occurrences.length > 0) {
    await TaskOccurrence.bulkCreate(occurrences, {
      ignoreDuplicates: true  // 避免重复插入
    });
  }
}

module.exports = {
  createTask,
  getTasksByDate,
  getTasksByRange,
  updateTask,
  updateOccurrence,
  deleteTask,
  getSubtasksByPlan,
  generateOccurrences
};
