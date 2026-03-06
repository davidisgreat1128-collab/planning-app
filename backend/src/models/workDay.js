'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * WorkDay 工作日调整模型
 *
 * DB表名: work_days
 * 用途: 存储中国法定节假日及调休补班安排
 * 数据来源: 国务院办公厅每年发布的节假日通知
 *
 * 示例数据:
 *   - { date: '2026-01-01', type: 'holiday', holidayName: '元旦' }
 *   - { date: '2026-01-04', type: 'workday', holidayName: '元旦', remark: '调休补班' }
 */
class WorkDay extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof WorkDay}
 */
function initWorkDayModel(sequelize) {
  WorkDay.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      date: {
        type: DataTypes.DATEONLY, // YYYY-MM-DD
        allowNull: false,
        unique: true,
        validate: {
          isDate: { msg: '日期格式不正确' }
        },
        comment: '日期（YYYY-MM-DD）'
      },
      type: {
        type: DataTypes.ENUM('holiday', 'workday'),
        allowNull: false,
        validate: {
          isIn: { args: [['holiday', 'workday']], msg: '类型必须是 holiday 或 workday' }
        },
        comment: 'holiday=法定假日（休）, workday=调休补班（班）'
      },
      year: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        validate: {
          min: 2000,
          max: 2100
        },
        comment: '年份（方便按年查询）'
      },
      holidayName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: '所属节假日名称（如：元旦、春节、国庆节）'
      },
      remark: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: null,
        comment: '备注说明（如：调休补班、法定假日）'
      }
    },
    {
      sequelize,
      modelName: 'WorkDay',
      tableName: 'work_days',
      underscored: true, // ⭐ 重要：启用字段自动映射 (holidayName ↔ holiday_name)
      timestamps: false  // 静态数据，无需时间戳
    }
  );

  return WorkDay;
}

module.exports = initWorkDayModel;
