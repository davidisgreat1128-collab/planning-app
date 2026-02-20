'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * PlanProgressLog 规划进度记录模型
 *
 * DB表名: plan_progress_logs
 * 记录每次规划进度更新（百分比 0-100）
 * 关联:
 *   PlanProgressLog.belongsTo(PlanningRecord, { foreignKey: 'planId', as: 'plan' })
 */
class PlanProgressLog extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof PlanProgressLog}
 */
function initPlanProgressLogModel(sequelize) {
  PlanProgressLog.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      planId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { notNull: { msg: '规划ID不能为空' } }
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      progressPct: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: {
          notNull: { msg: '进度百分比不能为空' },
          min: { args: [0], msg: '进度最小为0' },
          max: { args: [100], msg: '进度最大为100' }
        }
      },
      note: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      logId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      loggedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: { msg: '记录时刻不能为空' }
        }
      }
    },
    {
      sequelize,
      modelName: 'PlanProgressLog',
      tableName: 'plan_progress_logs',
      underscored: true,
      timestamps: true,
      paranoid: false  // 进度记录不需要软删除
    }
  );

  return PlanProgressLog;
}

module.exports = initPlanProgressLogModel;
