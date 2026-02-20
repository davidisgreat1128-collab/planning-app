'use strict';

const { DataTypes, Model } = require('sequelize');
const { ALARM_REPEAT } = require('../config/constants');

const ALARM_REPEAT_VALUES = Object.values(ALARM_REPEAT);

/**
 * Alarm 闹铃配置模型
 *
 * DB表名: alarms
 * 关联:
 *   Alarm.belongsTo(User, { foreignKey: 'userId', as: 'user' })
 *   Alarm.belongsTo(Task, { foreignKey: 'taskId', as: 'task' })
 *   Alarm.belongsTo(AlarmSound, { foreignKey: 'soundId', as: 'sound' })
 *
 * remind_config 示例：
 *   固定时间：每天08:00提醒 → repeatType='daily', alarmTime='08:00:00'
 *   每周一：repeatType='weekly', repeatDays='1'
 *   自定义：repeatType='custom', rrule='RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR'
 */
class Alarm extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Alarm}
 */
function initAlarmModel(sequelize) {
  Alarm.init(
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
      taskId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      soundId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      label: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: null
      },
      // 时间
      alarmTime: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          notNull: { msg: '闹铃时间不能为空' }
        }
      },
      alarmDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      remindBeforeMin: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: '提前时间不能为负数' }
        }
      },
      // 重复
      repeatType: {
        type: DataTypes.ENUM(...ALARM_REPEAT_VALUES),
        allowNull: false,
        defaultValue: 'none',
        validate: {
          isIn: { args: [ALARM_REPEAT_VALUES], msg: '无效的重复类型' }
        }
      },
      rrule: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      repeatDays: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null,
        comment: '重复星期几，如 1,3,5 代表周一三五'
      },
      // 提醒方式
      notifyInapp: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notifyPush: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastTriggeredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'Alarm',
      tableName: 'alarms',
      underscored: true,
      timestamps: true,
      paranoid: true  // 软删除
    }
  );

  return Alarm;
}

module.exports = initAlarmModel;
