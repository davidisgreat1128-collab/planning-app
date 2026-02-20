'use strict';

const { DataTypes, Model } = require('sequelize');
const { HOLIDAY_TYPE } = require('../config/constants');

const HOLIDAY_TYPE_VALUES = Object.values(HOLIDAY_TYPE);

/**
 * Holiday 节日与节气模型
 *
 * DB表名: holidays
 * 静态数据表，由种子文件预置，运行时只读
 */
class Holiday extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Holiday}
 */
function initHolidayModel(sequelize) {
  Holiday.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: '节日名称不能为空' }
        }
      },
      type: {
        type: DataTypes.ENUM(...HOLIDAY_TYPE_VALUES),
        allowNull: false,
        validate: {
          isIn: { args: [HOLIDAY_TYPE_VALUES], msg: '无效的节日类型' }
        }
      },
      // 公历字段（cn_solar / western / intl 用）
      month: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        validate: { min: 1, max: 12 }
      },
      day: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        validate: { min: 1, max: 31 }
      },
      // 农历字段（cn_lunar 用）
      lunarMonth: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        validate: { min: 1, max: 12 }
      },
      lunarDay: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        validate: { min: 1, max: 30 }
      },
      isLeapMonth: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      // 特殊规则（如母亲节=5月第2个周日）
      specialRule: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: false,
        defaultValue: '#FF4444'
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Holiday',
      tableName: 'holidays',
      underscored: true,
      timestamps: false  // 静态数据，无需时间戳
    }
  );

  return Holiday;
}

module.exports = initHolidayModel;
