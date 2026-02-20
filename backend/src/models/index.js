'use strict';

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const initUserModel = require('./user');
const initPlanningRecordModel = require('./planningRecord');
const initHolidayModel = require('./holiday');
const initTaskModel = require('./task');
const initTaskOccurrenceModel = require('./taskOccurrence');
const initAlarmSoundModel = require('./alarmSound');
const initAlarmModel = require('./alarm');
const initJournalLogModel = require('./journalLog');
const initPlanProgressLogModel = require('./planProgressLog');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

/**
 * 创建Sequelize实例
 */
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

/**
 * 数据库连接测试
 * @returns {Promise<void>}
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功:', config.database);
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    throw err;
  }
}

// ============================================================
// 初始化所有模型
// ============================================================
const User = initUserModel(sequelize);
const PlanningRecord = initPlanningRecordModel(sequelize);
const Holiday = initHolidayModel(sequelize);
const Task = initTaskModel(sequelize);
const TaskOccurrence = initTaskOccurrenceModel(sequelize);
const AlarmSound = initAlarmSoundModel(sequelize);
const Alarm = initAlarmModel(sequelize);
const JournalLog = initJournalLogModel(sequelize);
const PlanProgressLog = initPlanProgressLogModel(sequelize);

// ============================================================
// 定义模型关联关系
// ============================================================

// User 关联
User.hasMany(PlanningRecord, { foreignKey: 'userId', as: 'planningRecords' });
PlanningRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(JournalLog, { foreignKey: 'userId', as: 'logs' });
JournalLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Alarm, { foreignKey: 'userId', as: 'alarms' });
Alarm.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AlarmSound, { foreignKey: 'userId', as: 'alarmSounds' });
AlarmSound.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Task 关联
Task.hasMany(TaskOccurrence, { foreignKey: 'taskId', as: 'occurrences' });
TaskOccurrence.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

Task.hasMany(Alarm, { foreignKey: 'taskId', as: 'alarms' });
Alarm.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// AlarmSound 关联
AlarmSound.hasMany(Alarm, { foreignKey: 'soundId', as: 'alarms' });
Alarm.belongsTo(AlarmSound, { foreignKey: 'soundId', as: 'sound' });

// PlanningRecord 关联
PlanningRecord.hasMany(Task, { foreignKey: 'planId', as: 'subtasks' });
Task.belongsTo(PlanningRecord, { foreignKey: 'planId', as: 'plan' });

PlanningRecord.hasMany(PlanProgressLog, { foreignKey: 'planId', as: 'progressLogs' });
PlanProgressLog.belongsTo(PlanningRecord, { foreignKey: 'planId', as: 'plan' });

PlanningRecord.hasMany(JournalLog, { foreignKey: 'planId', as: 'logs' });
JournalLog.belongsTo(PlanningRecord, { foreignKey: 'planId', as: 'plan' });

// JournalLog 关联 Task
JournalLog.belongsTo(Task, { foreignKey: 'taskId', as: 'relatedTask' });
Task.hasMany(JournalLog, { foreignKey: 'taskId', as: 'logs' });

const db = {
  sequelize,
  Sequelize,
  testConnection,
  User,
  PlanningRecord,
  Holiday,
  Task,
  TaskOccurrence,
  AlarmSound,
  Alarm,
  JournalLog,
  PlanProgressLog
};

module.exports = db;
