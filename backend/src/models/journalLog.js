'use strict';

const { DataTypes, Model } = require('sequelize');
const { LOG_TYPE } = require('../config/constants');

const LOG_TYPE_VALUES = Object.values(LOG_TYPE);

/**
 * JournalLog 日志模型
 *
 * DB表名: logs
 * 文件名用 journalLog.js（避免与 Node.js 保留词 log 混淆）
 * 类名用 JournalLog
 *
 * 功能：
 *   - 记录心得、灵感、事件（精确到分，按 log_time 排序）
 *   - 可关联规划（plan_id）或任务（task_id）
 *   - 可转化为任务（converted_to_task=true, converted_task_id=新任务ID）
 *
 * 关联:
 *   JournalLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })
 *   JournalLog.belongsTo(PlanningRecord, { foreignKey: 'planId', as: 'plan' })
 *   JournalLog.belongsTo(Task, { foreignKey: 'taskId', as: 'task' })
 */
class JournalLog extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof JournalLog}
 */
function initJournalLogModel(sequelize) {
  JournalLog.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { notNull: { msg: '用户ID不能为空' } }
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: '日志内容不能为空' }
        }
      },
      logType: {
        type: DataTypes.ENUM(...LOG_TYPE_VALUES),
        allowNull: false,
        defaultValue: 'note',
        validate: {
          isIn: { args: [LOG_TYPE_VALUES], msg: '无效的日志类型' }
        }
      },
      moodLevel: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        validate: {
          min: { args: [1], msg: '情绪评分最低为1' },
          max: { args: [5], msg: '情绪评分最高为5' }
        }
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      },
      // 时间（精确到分）
      logTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: { msg: '记录时刻不能为空' },
          isDate: { msg: '无效的时间格式' }
        }
      },
      logDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: '日志日期不能为空' }
        }
      },
      // 关联
      planId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      taskId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      // 转化为任务
      convertedToTask: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      convertedTaskId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      // 媒体附件
      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'JournalLog',
      tableName: 'logs',
      underscored: true,
      timestamps: true,
      paranoid: true  // 软删除
    }
  );

  return JournalLog;
}

module.exports = initJournalLogModel;
