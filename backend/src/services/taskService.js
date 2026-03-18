'use strict';

const { Op } = require('sequelize');
const { Task, TaskOccurrence } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const rruleCalculationService = require('./rruleCalculationService'); // ⭐ 新增：RRULE实时计算
const completionRecordRepository = require('../repositories/completionRecordRepository'); // ⭐ 新增：完成记录查询
const taskOverrideRepository = require('../repositories/TaskOverrideRepository'); // ⭐ 新增：单日覆盖查询

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
    planId = null,
    categoryId = null  // 添加：分类ID
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
    categoryId,  // 保存分类ID到数据库
    sourceType: planId ? 'from_plan' : 'manual',
    subtasks: data.subtasks || null  // 添加：保存子任务
  });

  // ⚠️ 重复任务重构：不再预生成TaskOccurrence实例
  // 改为按需使用RRULE规则实时计算（见RRuleCalculationService）
  // if (isRecurring && rrule) {
  //   await generateOccurrences(task, 90);
  // }

  return task;
}

/**
 * 获取某天的任务列表
 * ⭐ 架构升级（2026-03-15）：重复任务使用 RRULE 实时计算 + completion_records
 *
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @param {Object} options - 额外过滤选项
 * @returns {Promise<Object>} { single: Task[], range: Task[], recurring: Task[] }
 */
async function getTasksByDate(userId, date, options = {}) {
  const { includeCompleted = true } = options;

  const statusFilter = includeCompleted ? {} : { status: 'pending' };

  // 1. 单日任务（非重复）
  const singleTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'single',
      taskDate: date,
      isRecurring: false, // ⭐ 新增：排除重复任务
      ...statusFilter
    },
    order: [['startTime', 'ASC'], ['isUrgent', 'DESC'], ['isImportant', 'DESC']]
  });

  // 2. 跨天任务（该日期在范围内，非重复）
  const rangeTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'range',
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date },
      isRecurring: false, // ⭐ 新增：排除重复任务
      ...statusFilter
    },
    order: [['startDate', 'ASC']]
  });

  // 3. 重复任务（使用 RRULE 实时计算）
  // ⭐ 架构升级：不再查询 TaskOccurrence 表（已删除），改为查询 Task 表 + RRULE 计算
  // ⭐ BUG修复（2026-03-18）：显式过滤已软删除的任务（Sequelize paranoid未自动生效）
  const allRecurringTasks = await Task.findAll({
    where: {
      userId,
      isRecurring: true,
      deletedAt: null  // ⭐ 显式过滤已软删除的任务
    }
  });

  // 筛选出在该日期发生的重复任务
  // ⭐⭐ 架构升级（2026-03-17）：应用优先级流程（is_deleted → 覆盖 → 完成记录 → 默认规则）
  const recurringTasksOnDate = [];
  for (const task of allRecurringTasks) {
    // ⭐ 步骤1：RRULE计算候选日期
    const occurrences = rruleCalculationService.calculateOccurrences(task, date, date);

    if (occurrences.includes(date)) {
      // ⭐⭐ 步骤2：检查is_deleted标记（最高优先级）
      // 如果该日期被标记为已删除（is_deleted=true），直接跳过不生成实例
      const override = await taskOverrideRepository.getByTaskAndDate(task.id, date);

      if (override && override.isDeleted === true) {
        // ⭐⭐ 关键判断：is_deleted=true → 跳过，不生成实例
        console.log(
          `[TaskService] 跳过已删除日期 - taskId=${task.id}, ` +
          `title=${task.title}, date=${date}, is_deleted=true`
        );
        continue; // ⭐ 跳出循环，不添加到 recurringTasksOnDate
      }

      // ⭐ 步骤3：创建任务实例（基础数据来自任务规则）
      const taskInstance = task.toJSON();

      // 应用单日覆盖（如果存在）
      if (override) {
        // NULL 字段表示"不覆盖"，保留默认值
        if (override.title !== null) taskInstance.title = override.title;
        if (override.description !== null) taskInstance.description = override.description;
        if (override.isUrgent !== null) taskInstance.isUrgent = override.isUrgent;
        if (override.isImportant !== null) taskInstance.isImportant = override.isImportant;
        if (override.startTime !== null) taskInstance.startTime = override.startTime;
        if (override.endTime !== null) taskInstance.endTime = override.endTime;
        if (override.isAllDay !== null) taskInstance.isAllDay = override.isAllDay;

        // 标记该实例已被覆盖（用于前端显示）
        taskInstance.isOverridden = true;
        taskInstance.overrideId = override.id;
      }

      // ⭐ 优先级3：使用默认任务规则（已在 taskInstance 中）

      // 获取该日期的完成记录（如果有）
      const completionRecord = await completionRecordRepository.getByTaskAndDate(task.id, date);

      // 添加完成状态（用于前端显示）
      taskInstance.completionRecord = completionRecord;
      taskInstance.status = completionRecord ? completionRecord.status : 'pending';

      // 根据 includeCompleted 过滤
      if (includeCompleted || taskInstance.status === 'pending') {
        recurringTasksOnDate.push(taskInstance);
      }
    }
  }

  return {
    single: singleTasks,
    range: rangeTasks,
    recurring: recurringTasksOnDate // ⭐ 新架构：返回 Task[] 而不是 TaskOccurrence[]
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
    const occurrenceData = o.toJSON();
    const parentTask = occurrenceData.task || {};

    // 合并父任务的关键字段到实例数据中
    map[o.occurDate].push({
      ...occurrenceData,
      _type: 'recurring',
      // 从父任务继承的字段
      title: parentTask.title || occurrenceData.title,
      description: parentTask.description,
      isUrgent: parentTask.isUrgent,
      isImportant: parentTask.isImportant,
      isAllDay: parentTask.isAllDay,
      startTime: parentTask.startTime,
      endTime: parentTask.endTime,
      isRecurring: true,  // 重复任务实例始终标记为重复任务
      rrule: parentTask.rrule,
      categoryId: parentTask.categoryId,
      planId: parentTask.planId
    });
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
    startTime, endTime, status, subtasks
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
    subtasks: subtasks !== undefined ? subtasks : task.subtasks,
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

/**
 * 批量更新指定分类下的所有任务的 categoryId 为 null（移到"无分类"）
 * @param {number} userId - 用户ID
 * @param {string} categoryId - 分类ID
 * @returns {Promise<number>} 更新的任务数量
 */
async function updateCategoryTasksToUncategorized(userId, categoryId) {
  const result = await Task.update(
    { categoryId: null },
    {
      where: {
        userId,
        categoryId,
        deletedAt: null  // 只更新未删除的任务
      }
    }
  );

  // result[0] 是更新的行数
  return result[0];
}

/**
 * 批量删除指定分类下的所有任务（软删除）
 * @param {number} userId - 用户ID
 * @param {string} categoryId - 分类ID
 * @returns {Promise<number>} 删除的任务数量
 */
async function deleteCategoryTasks(userId, categoryId) {
  const result = await Task.destroy({
    where: {
      userId,
      categoryId
    }
  });

  // result 是删除的行数
  return result;
}

// ============================================================
// ⭐ 新增（2026-03-15）：重复任务批量更新Service
// ============================================================

/**
 * 更新重复任务的未来实例（保留过去记录）
 *
 * @param {number} taskId - 任务ID
 * @param {number} userId - 用户ID
 * @param {object} updateData - 要更新的字段（如 isUrgent, isImportant）
 * @param {string} scope - 更新范围（目前仅支持'future'）
 * @param {string} currentDate - 当前日期（YYYY-MM-DD），作为未来的分界点
 * @returns {Promise<Task>} 更新后的任务对象
 *
 * 实现逻辑：
 * 1. 更新Task表（影响所有日期的RRULE定义）
 * 2. 删除未来的CompletionRecord（currentDate及之后的记录）
 * 3. 保留过去的CompletionRecord（currentDate之前的记录）
 */
async function updateTaskRecurrence(taskId, userId, updateData, scope, currentDate) {
  // 1. 查询任务（验证权限和存在性）
  const task = await Task.findOne({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new NotFoundError('任务');
  }

  if (!task.isRecurring) {
    throw new ValidationError('该任务不是重复任务');
  }

  // 2. 更新Task表（影响所有日期）
  await task.update(updateData);

  // 3. 清理未来的CompletionRecord（保留过去记录）
  if (scope === 'future') {
    await completionRecordRepository.deleteFutureRecords(taskId, currentDate);
    console.log(`[TaskService] 已清理未来CompletionRecord: taskId=${taskId}, date>=${currentDate}`);
  }

  return task;
}

/**
 * 仅更新重复任务的单个日期实例（象限覆盖）
 *
 * @param {number} taskId - 任务ID
 * @param {number} userId - 用户ID
 * @param {object} updateData - 要更新的字段（如 isUrgent, isImportant）
 * @param {string} date - 指定日期（YYYY-MM-DD）
 * @returns {Promise<object>} 更新后的 CompletionRecord 对象
 *
 * 实现逻辑：
 * 1. 查询该日期的CompletionRecord
 * 2. 如果存在 → 在note字段中存储象限覆盖信息
 * 3. 如果不存在 → 创建新的CompletionRecord，存储象限覆盖
 */
async function updateTaskOccurrence(taskId, userId, updateData, date) {
  // 1. 查询任务（验证权限和存在性）
  const task = await Task.findOne({
    where: { id: taskId, userId }
  });

  if (!task) {
    throw new NotFoundError('任务');
  }

  if (!task.isRecurring) {
    throw new ValidationError('该任务不是重复任务');
  }

  // 2. 查询该日期的CompletionRecord
  let record = await completionRecordRepository.getByTaskAndDate(taskId, date);

  // 3. 构建象限覆盖信息（存储在note字段的JSON中）
  const noteData = record?.note ? JSON.parse(record.note) : {};
  noteData.overrides = {
    ...(noteData.overrides || {}),
    ...updateData
  };

  const newNote = JSON.stringify(noteData);

  if (record) {
    // 记录已存在 → 更新note字段
    await completionRecordRepository.update(taskId, date, { note: newNote });
    console.log(`[TaskService] 已更新单日实例覆盖: taskId=${taskId}, date=${date}`);
  } else {
    // 记录不存在 → 创建新记录
    record = await completionRecordRepository.create({
      taskId,
      userId,
      completionDate: date,
      status: 'pending',
      note: newNote
    });
    console.log(`[TaskService] 已创建单日实例覆盖: taskId=${taskId}, date=${date}`);
  }

  // 重新查询最新记录
  return await completionRecordRepository.getByTaskAndDate(taskId, date);
}

module.exports = {
  createTask,
  getTasksByDate,
  getTasksByRange,
  updateTask,
  updateOccurrence,
  deleteTask,
  getSubtasksByPlan,
  generateOccurrences,
  updateCategoryTasksToUncategorized,
  deleteCategoryTasks,
  // ⭐ 新增（2026-03-15）
  updateTaskRecurrence,
  updateTaskOccurrence
};
