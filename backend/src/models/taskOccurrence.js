'use strict';

const { DataTypes, Model } = require('sequelize');
const { OCCURRENCE_STATUS } = require('../config/constants');

const OCCURRENCE_STATUS_VALUES = Object.values(OCCURRENCE_STATUS);

/**
 * TaskOccurrence 重复任务实例模型
 *
 * DB表名: task_occurrences
 * 每个重复任务（含RRULE）在近3个月内预生成实例
 * 关联:
 *   TaskOccurrence.belongsTo(Task, { foreignKey: 'taskId', as: 'task' })
 */
class TaskOccurrence extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof TaskOccurrence}
 */
function initTaskOccurrenceModel(sequelize) {
  TaskOccurrence.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      taskId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { notNull: { msg: '父任务ID不能为空' } }
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      occurDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: '发生日期不能为空' },
          isDate: { msg: '无效的日期格式' }
        }
      },
      occurStartTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null
      },
      occurEndTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null
      },
      status: {
        type: DataTypes.ENUM(...OCCURRENCE_STATUS_VALUES),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: { args: [OCCURRENCE_STATUS_VALUES], msg: '无效的实例状态' }
        }
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      overrideTitle: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      overrideNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'TaskOccurrence',
      tableName: 'task_occurrences',
      underscored: true,
      timestamps: true,
      paranoid: false  // 实例不需要软删除，直接物理删除或改状态
    }
  );

  return TaskOccurrence;
}

module.exports = initTaskOccurrenceModel;
