/**
 * TaskOverride Repository
 * 文件位置: backend/src/repositories/TaskOverrideRepository.js
 *
 * 职责: 单日覆盖数据访问层
 * 核心功能:
 * 1. 查询指定任务在指定日期的覆盖记录
 * 2. 创建单日覆盖（修改当天操作）
 * 3. 更新单日覆盖
 * 4. 删除单日覆盖
 * 5. 批量查询某日期范围的所有覆盖记录
 */

const { TaskOverride } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

class TaskOverrideRepository {
  /**
   * 查询指定任务在指定日期的覆盖记录
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD格式）
   * @returns {Promise<object|null>} 覆盖记录对象，如果不存在则返回null
   */
  async getByTaskAndDate(taskId, date) {
    try {
      const override = await TaskOverride.findOne({
        where: {
          taskId,
          overrideDate: date
        }
      });
      return override;
    } catch (error) {
      console.error('查询单日覆盖失败:', error);
      throw error;
    }
  }

  /**
   * 创建单日覆盖记录
   * @param {object} data - 覆盖数据
   * @param {number} data.taskId - 任务ID
   * @param {number} data.userId - 用户ID
   * @param {string} data.overrideDate - 覆盖日期（YYYY-MM-DD）
   * @param {string} [data.title] - 覆盖标题（null表示不覆盖）
   * @param {string} [data.description] - 覆盖描述（null表示不覆盖）
   * @param {boolean} [data.isUrgent] - 覆盖紧急性（null表示不覆盖）
   * @param {boolean} [data.isImportant] - 覆盖重要性（null表示不覆盖）
   * @param {string} [data.startTime] - 覆盖开始时间（null表示不覆盖）
   * @param {string} [data.endTime] - 覆盖结束时间（null表示不覆盖）
   * @param {boolean} [data.isAllDay] - 覆盖是否全天（null表示不覆盖）
   * @returns {Promise<object>} 创建的覆盖记录对象
   * @throws {ValidationError} 如果数据验证失败
   */
  async create(data) {
    try {
      // 数据验证
      if (!data.taskId || !data.userId || !data.overrideDate) {
        throw new ValidationError('taskId、userId、overrideDate为必填字段');
      }

      // 检查是否已存在覆盖记录
      const existing = await this.getByTaskAndDate(data.taskId, data.overrideDate);
      if (existing) {
        throw new ValidationError(`任务 ${data.taskId} 在 ${data.overrideDate} 已存在覆盖记录`);
      }

      // 创建覆盖记录
      const override = await TaskOverride.create({
        taskId: data.taskId,
        userId: data.userId,
        overrideDate: data.overrideDate,
        title: data.title !== undefined ? data.title : null,
        description: data.description !== undefined ? data.description : null,
        isUrgent: data.isUrgent !== undefined ? data.isUrgent : null,
        isImportant: data.isImportant !== undefined ? data.isImportant : null,
        startTime: data.startTime !== undefined ? data.startTime : null,
        endTime: data.endTime !== undefined ? data.endTime : null,
        isAllDay: data.isAllDay !== undefined ? data.isAllDay : null
      });

      return override;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('创建单日覆盖失败:', error);
      throw error;
    }
  }

  /**
   * 更新单日覆盖记录
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @param {object} updates - 更新数据
   * @returns {Promise<object>} 更新后的覆盖记录
   * @throws {NotFoundError} 如果覆盖记录不存在
   */
  async update(taskId, date, updates) {
    try {
      const override = await this.getByTaskAndDate(taskId, date);
      if (!override) {
        throw new NotFoundError(`任务 ${taskId} 在 ${date} 的覆盖记录不存在`);
      }

      // 只更新提供的字段（允许显式设置为null以取消覆盖）
      const allowedFields = [
        'title',
        'description',
        'isUrgent',
        'isImportant',
        'startTime',
        'endTime',
        'isAllDay'
      ];

      allowedFields.forEach(field => {
        if (field in updates) {
          override[field] = updates[field];
        }
      });

      await override.save();
      return override;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('更新单日覆盖失败:', error);
      throw error;
    }
  }

  /**
   * 删除单日覆盖记录
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {Promise<boolean>} 删除成功返回true
   * @throws {NotFoundError} 如果覆盖记录不存在
   */
  async delete(taskId, date) {
    try {
      const override = await this.getByTaskAndDate(taskId, date);
      if (!override) {
        throw new NotFoundError(`任务 ${taskId} 在 ${date} 的覆盖记录不存在`);
      }

      await override.destroy();
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('删除单日覆盖失败:', error);
      throw error;
    }
  }

  /**
   * 批量查询指定日期范围内的所有覆盖记录
   * @param {number} userId - 用户ID
   * @param {string} startDate - 起始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   * @returns {Promise<object[]>} 覆盖记录数组
   */
  async getByDateRange(userId, startDate, endDate) {
    try {
      const { Op } = require('sequelize');
      const overrides = await TaskOverride.findAll({
        where: {
          userId,
          overrideDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['overrideDate', 'ASC']]
      });

      return overrides;
    } catch (error) {
      console.error('批量查询覆盖记录失败:', error);
      throw error;
    }
  }

  /**
   * 查询指定任务的所有覆盖记录
   * @param {number} taskId - 任务ID
   * @returns {Promise<object[]>} 覆盖记录数组
   */
  async getByTaskId(taskId) {
    try {
      const overrides = await TaskOverride.findAll({
        where: { taskId },
        order: [['overrideDate', 'ASC']]
      });

      return overrides;
    } catch (error) {
      console.error('查询任务的所有覆盖记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除指定任务的所有覆盖记录
   * @param {number} taskId - 任务ID
   * @returns {Promise<number>} 删除的记录数量
   */
  async deleteByTaskId(taskId) {
    try {
      const count = await TaskOverride.destroy({
        where: { taskId }
      });
      return count;
    } catch (error) {
      console.error('删除任务的所有覆盖记录失败:', error);
      throw error;
    }
  }
}

module.exports = new TaskOverrideRepository();
