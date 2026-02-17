'use strict';

const { DataTypes, Model } = require('sequelize');
const { PLANNING_TYPES, PLANNING_STATUS, LIFE_STAGES } = require('../config/constants');

// 从常量对象中提取值数组（供ENUM和isIn校验使用）
const PLANNING_TYPE_VALUES = Object.values(PLANNING_TYPES);
const PLANNING_STATUS_VALUES = Object.values(PLANNING_STATUS);
const LIFE_STAGE_VALUES = Object.values(LIFE_STAGES).map(s => s.name);

/**
 * PlanningRecord 规划记录模型
 *
 * DB表名: planning_records
 * 关联关系（在 models/index.js 中配置）:
 *   PlanningRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' })
 */
class PlanningRecord extends Model {}

/**
 * 初始化PlanningRecord模型
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof PlanningRecord}
 */
function initPlanningRecordModel(sequelize) {
  PlanningRecord.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      // 外键，underscored:true 自动映射 userId → user_id
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
          notNull: { msg: '用户ID不能为空' }
        }
      },
      type: {
        type: DataTypes.ENUM(...PLANNING_TYPE_VALUES),
        allowNull: false,
        validate: {
          isIn: {
            args: [PLANNING_TYPE_VALUES],
            msg: '无效的规划类型'
          }
        }
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: '规划标题不能为空' },
          len: { args: [1, 200], msg: '标题长度需在1-200个字符之间' }
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      status: {
        type: DataTypes.ENUM(...PLANNING_STATUS_VALUES),
        allowNull: false,
        defaultValue: 'active',
        validate: {
          isIn: {
            args: [PLANNING_STATUS_VALUES],
            msg: '无效的规划状态'
          }
        }
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      targetScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        validate: {
          min: { args: [0], msg: '目标分值不能为负数' }
        }
      },
      currentScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: '当前分值不能为负数' }
        }
      },
      relatedStage: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        validate: {
          isIn: {
            args: [[ ...LIFE_STAGE_VALUES, null ]],
            msg: '无效的人生阶段'
          }
        }
      },
      // JSON格式存储，读取时需手动解析
      ichingAdvice: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        get() {
          // 读取时自动解析JSON
          const raw = this.getDataValue('ichingAdvice');
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        set(value) {
          // 写入时自动序列化JSON
          this.setDataValue('ichingAdvice', value ? JSON.stringify(value) : null);
        }
      }
    },
    {
      sequelize,
      modelName: 'PlanningRecord',
      tableName: 'planning_records',
      underscored: true,
      timestamps: true,
      paranoid: true // 软删除
    }
  );

  return PlanningRecord;
}

module.exports = initPlanningRecordModel;
