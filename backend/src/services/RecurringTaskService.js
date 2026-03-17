/**
 * RecurringTaskService - 重复任务核心业务逻辑
 * 文件位置: backend/src/services/RecurringTaskService.js
 *
 * 职责: 实现重复任务的6种核心操作（阶段一设计理论）
 * 1. 修改当天 - 创建单日覆盖
 * 2. 修改未来 - 拆分任务规则
 * 3. 修改全部 - 修改任务规则
 * 4. 删除当天 - 添加到EXDATE
 * 5. 删除全部 - 删除任务规则
 * 6. 删除当天及未来 - 修改规则结束时间
 */

const { Task } = require('../models');
const taskOverrideRepository = require('../repositories/TaskOverrideRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { RRule, rrulestr } = require('rrule');

class RecurringTaskService {
  /**
   * 操作1：修改当天 - 创建单日覆盖
   * @param {number} taskId - 任务ID
   * @param {number} userId - 用户ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @param {object} updates - 要覆盖的字段
   * @returns {Promise<object>} 创建的覆盖记录
   */
  async modifySingleDay(taskId, userId, date, updates) {
    try {
      // 验证任务存在且是重复任务
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new NotFoundError('任务不存在');
      }
      if (!task.isRecurring || !task.rrule) {
        throw new ValidationError('该任务不是重复任务，无法创建单日覆盖');
      }

      // 创建覆盖记录
      const override = await taskOverrideRepository.create({
        taskId,
        userId,
        overrideDate: date,
        ...updates
      });

      return override;
    } catch (error) {
      console.error('修改当天失败:', error);
      throw error;
    }
  }

  /**
   * 操作2：修改未来 - 拆分任务规则
   * @param {number} taskId - 原任务ID
   * @param {number} userId - 用户ID
   * @param {string} splitDate - 拆分日期（从此日期开始改变）
   * @param {object} updates - 新规则的字段更新
   * @returns {Promise<object>} 返回新创建的任务对象
   */
  async modifyFuture(taskId, userId, splitDate, updates) {
    try {
      // 查询原任务
      const originalTask = await Task.findByPk(taskId);
      if (!originalTask) {
        throw new NotFoundError('任务不存在');
      }
      if (!originalTask.isRecurring || !originalTask.rrule) {
        throw new ValidationError('该任务不是重复任务，无法拆分规则');
      }

      // ⭐ 保存原始RRULE（在修改旧任务之前），用于创建新任务
      const originalRRuleString = originalTask.rrule;

      // 计算拆分前一天
      const splitDateObj = new Date(splitDate);
      const dayBeforeSplit = new Date(splitDateObj);
      dayBeforeSplit.setDate(dayBeforeSplit.getDate() - 1);
      const endDateForOriginal = this._formatDate(dayBeforeSplit);

      // 修改原任务：添加结束日期（截止到拆分前一天）
      const originalRRule = rrulestr(originalTask.rrule);
      const originalOptions = originalRRule.options;

      // 生成新的RRULE（加上UNTIL参数）
      const newOriginalRRule = new RRule({
        ...originalOptions,
        until: new Date(endDateForOriginal + 'T23:59:59Z')
      });

      originalTask.rrule = newOriginalRRule.toString();
      originalTask.rruleUntil = endDateForOriginal;
      await originalTask.save();

      // 创建新任务：从拆分日期开始，应用新规则
      const newTaskData = {
        userId,
        title: updates.title !== undefined ? updates.title : originalTask.title,
        description: updates.description !== undefined ? updates.description : originalTask.description,
        isUrgent: updates.isUrgent !== undefined ? updates.isUrgent : originalTask.isUrgent,
        isImportant: updates.isImportant !== undefined ? updates.isImportant : originalTask.isImportant,
        startTime: updates.startTime !== undefined ? updates.startTime : originalTask.startTime,
        endTime: updates.endTime !== undefined ? updates.endTime : originalTask.endTime,
        isAllDay: updates.isAllDay !== undefined ? updates.isAllDay : originalTask.isAllDay,
        isRecurring: true,
        rrule: this._updateRRuleStartDate(originalRRuleString, splitDate), // ⭐ 使用保存的原始RRULE，不是修改后的
        rruleUntil: null, // ⭐ 新任务永久重复，不继承原UNTIL
        exdate: '[]', // 新任务不继承EXDATE
        categoryId: originalTask.categoryId,
        planId: originalTask.planId,
        parentTaskId: originalTask.id, // 标记父任务ID
        splitFromDate: splitDate // 记录拆分起始日期
      };

      const newTask = await Task.create(newTaskData);

      return {
        originalTask,
        newTask
      };
    } catch (error) {
      console.error('修改未来失败:', error);
      throw error;
    }
  }

  /**
   * 操作3：修改全部 - 直接修改任务规则
   * @param {number} taskId - 任务ID
   * @param {object} updates - 更新数据
   * @returns {Promise<object>} 更新后的任务对象
   */
  async modifyAll(taskId, updates) {
    try {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new NotFoundError('任务不存在');
      }
      if (!task.isRecurring) {
        throw new ValidationError('该任务不是重复任务');
      }

      // 直接更新任务规则
      Object.keys(updates).forEach(key => {
        if (key in task) {
          task[key] = updates[key];
        }
      });

      await task.save();
      return task;
    } catch (error) {
      console.error('修改全部失败:', error);
      throw error;
    }
  }

  /**
   * 操作4：删除当天 - 添加到EXDATE
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {Promise<object>} 更新后的任务对象
   */
  async deleteSingleDay(taskId, date) {
    try {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new NotFoundError('任务不存在');
      }
      if (!task.isRecurring || !task.rrule) {
        throw new ValidationError('该任务不是重复任务，无法使用EXDATE');
      }

      // 解析现有EXDATE
      let exdateArray = [];
      if (task.exdate) {
        try {
          exdateArray = JSON.parse(task.exdate);
          if (!Array.isArray(exdateArray)) {
            exdateArray = [];
          }
        } catch (err) {
          exdateArray = [];
        }
      }

      // 检查是否已存在
      if (exdateArray.includes(date)) {
        throw new ValidationError(`日期 ${date} 已在排除列表中`);
      }

      // 添加新日期
      exdateArray.push(date);
      exdateArray.sort(); // 保持排序

      task.exdate = JSON.stringify(exdateArray);
      await task.save();

      return task;
    } catch (error) {
      console.error('删除当天失败:', error);
      throw error;
    }
  }

  /**
   * 操作5：删除全部 - 删除任务规则
   * @param {number} taskId - 任务ID
   * @returns {Promise<boolean>} 删除成功返回true
   */
  async deleteAll(taskId) {
    try {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      // 软删除任务（paranoid: true，会设置deletedAt）
      await task.destroy();

      // 同时删除所有相关的覆盖记录
      await taskOverrideRepository.deleteByTaskId(taskId);

      return true;
    } catch (error) {
      console.error('删除全部失败:', error);
      throw error;
    }
  }

  /**
   * 操作6：删除当天及未来 - 修改规则结束时间
   * @param {number} taskId - 任务ID
   * @param {string} endDate - 新的结束日期（从此日期开始停止）
   * @returns {Promise<object>} 更新后的任务对象
   */
  async deleteFuture(taskId, endDate) {
    try {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new NotFoundError('任务不存在');
      }
      if (!task.isRecurring || !task.rrule) {
        throw new ValidationError('该任务不是重复任务，无法设置结束时间');
      }

      // 计算实际结束日期（endDate前一天）
      const endDateObj = new Date(endDate);
      const actualEndDate = new Date(endDateObj);
      actualEndDate.setDate(actualEndDate.getDate() - 1);
      const finalEndDate = this._formatDate(actualEndDate);

      // 解析现有RRULE
      const rrule = rrulestr(task.rrule);
      const options = rrule.options;

      // 生成新的RRULE（添加UNTIL参数）
      const newRRule = new RRule({
        ...options,
        until: new Date(finalEndDate + 'T23:59:59Z')
      });

      task.rrule = newRRule.toString();
      task.rruleUntil = finalEndDate;
      await task.save();

      return task;
    } catch (error) {
      console.error('删除当天及未来失败:', error);
      throw error;
    }
  }

  /**
   * 恢复单日删除（从EXDATE中移除）
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {Promise<object>} 更新后的任务对象
   */
  async restoreSingleDay(taskId, date) {
    try {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new NotFoundError('任务不存在');
      }

      let exdateArray = [];
      if (task.exdate) {
        try {
          exdateArray = JSON.parse(task.exdate);
        } catch (err) {
          exdateArray = [];
        }
      }

      // 从数组中移除
      const index = exdateArray.indexOf(date);
      if (index === -1) {
        throw new ValidationError(`日期 ${date} 不在排除列表中`);
      }

      exdateArray.splice(index, 1);
      task.exdate = JSON.stringify(exdateArray);
      await task.save();

      return task;
    } catch (error) {
      console.error('恢复单日删除失败:', error);
      throw error;
    }
  }

  /**
   * 辅助方法：格式化日期为YYYY-MM-DD
   * @private
   */
  _formatDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 辅助方法：更新RRULE的开始日期
   * @private
   */
  _updateRRuleStartDate(rruleString, newStartDate) {
    try {
      const rrule = rrulestr(rruleString);
      const options = rrule.options;

      // ⭐ 创建新RRULE：更新开始日期，移除UNTIL参数（新任务应该永久重复）
      const newRRule = new RRule({
        ...options,
        dtstart: new Date(newStartDate + 'T00:00:00Z'),
        until: null // ⭐ 移除UNTIL参数，新任务永久重复
      });

      return newRRule.toString();
    } catch (error) {
      console.error('更新RRULE开始日期失败:', error);
      throw error;
    }
  }
}

module.exports = new RecurringTaskService();
