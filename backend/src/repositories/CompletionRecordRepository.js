/**
 * CompletionRecord Repository
 * 文件位置: backend/src/repositories/CompletionRecordRepository.js
 *
 * 职责: 任务完成记录的数据访问层
 */

const { CompletionRecord, Task, User } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

class CompletionRecordRepository {
  /**
   * 创建完成记录
   * @param {object} data - 完成记录数据
   * @param {number} data.taskId - 任务ID
   * @param {number} data.userId - 用户ID
   * @param {string} data.completionDate - 完成日期（YYYY-MM-DD）
   * @param {string} [data.status='completed'] - 状态（pending/completed/skipped）
   * @param {object} [data.subtaskCompletion] - 子任务完成状态
   * @param {string} [data.note] - 备注
   * @returns {Promise<CompletionRecord>}
   */
  async create(data) {
    try {
      const record = await CompletionRecord.create({
        taskId: data.taskId,
        userId: data.userId,
        completionDate: data.completionDate,
        status: data.status || 'completed',
        completedAt: data.status === 'completed' ? new Date() : null,
        subtaskCompletion: data.subtaskCompletion || null,
        note: data.note || null
      });

      return record;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError('该任务在该日期已有完成记录', 'completionDate');
      }
      throw error;
    }
  }

  /**
   * 获取任务在指定日期的完成记录
   * @param {number} taskId - 任务ID
   * @param {string} completionDate - 完成日期（YYYY-MM-DD）
   * @returns {Promise<CompletionRecord|null>}
   */
  async getByTaskAndDate(taskId, completionDate) {
    const record = await CompletionRecord.findOne({
      where: {
        taskId,
        completionDate
      },
      include: [
        { model: Task, as: 'task' },
        { model: User, as: 'user' }
      ]
    });

    return record;
  }

  /**
   * 获取任务的所有完成记录（分页）
   * @param {number} taskId - 任务ID
   * @param {object} options - 查询选项
   * @param {number} [options.page=1] - 页码
   * @param {number} [options.pageSize=20] - 每页条数
   * @param {string} [options.startDate] - 起始日期（YYYY-MM-DD）
   * @param {string} [options.endDate] - 结束日期（YYYY-MM-DD）
   * @returns {Promise<{rows: CompletionRecord[], count: number}>}
   */
  async getByTask(taskId, options = {}) {
    const { page = 1, pageSize = 20, startDate, endDate } = options;
    const offset = (page - 1) * pageSize;

    const where = { taskId };

    // 日期范围过滤
    if (startDate || endDate) {
      where.completionDate = {};
      if (startDate) where.completionDate.$gte = startDate;
      if (endDate) where.completionDate.$lte = endDate;
    }

    const { rows, count } = await CompletionRecord.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['completionDate', 'DESC']],
      include: [{ model: User, as: 'user' }]
    });

    return { rows, count };
  }

  /**
   * 获取用户在指定日期范围的所有完成记录
   * @param {number} userId - 用户ID
   * @param {string} startDate - 起始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   * @returns {Promise<CompletionRecord[]>}
   */
  async getByUserAndDateRange(userId, startDate, endDate) {
    const records = await CompletionRecord.findAll({
      where: {
        userId,
        completionDate: {
          $gte: startDate,
          $lte: endDate
        }
      },
      include: [{ model: Task, as: 'task' }],
      order: [['completionDate', 'ASC']]
    });

    return records;
  }

  /**
   * 更新完成记录
   * @param {number} taskId - 任务ID
   * @param {string} completionDate - 完成日期（YYYY-MM-DD）
   * @param {object} updates - 更新数据
   * @param {string} [updates.status] - 状态
   * @param {object} [updates.subtaskCompletion] - 子任务完成状态
   * @param {string} [updates.note] - 备注
   * @returns {Promise<CompletionRecord>}
   */
  async update(taskId, completionDate, updates) {
    const record = await this.getByTaskAndDate(taskId, completionDate);

    if (!record) {
      throw new NotFoundError('完成记录');
    }

    // 更新字段
    if (updates.status !== undefined) {
      record.status = updates.status;
      record.completedAt = updates.status === 'completed' ? new Date() : null;
    }
    if (updates.subtaskCompletion !== undefined) {
      record.subtaskCompletion = updates.subtaskCompletion;
    }
    if (updates.note !== undefined) {
      record.note = updates.note;
    }

    await record.save();
    return record;
  }

  /**
   * 删除完成记录
   * @param {number} taskId - 任务ID
   * @param {string} completionDate - 完成日期（YYYY-MM-DD）
   * @returns {Promise<boolean>}
   */
  async delete(taskId, completionDate) {
    const record = await this.getByTaskAndDate(taskId, completionDate);

    if (!record) {
      throw new NotFoundError('完成记录');
    }

    await record.destroy();
    return true;
  }

  /**
   * 获取任务的完成统计
   * @param {number} taskId - 任务ID
   * @returns {Promise<object>} 统计数据
   */
  async getStatistics(taskId) {
    const records = await CompletionRecord.findAll({
      where: { taskId },
      attributes: ['status']
    });

    const stats = {
      total: records.length,
      completed: 0,
      pending: 0,
      skipped: 0
    };

    records.forEach(record => {
      stats[record.status]++;
    });

    return stats;
  }
}

module.exports = new CompletionRecordRepository();
