'use strict';

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const initUserModel = require('./user');
const initPlanningRecordModel = require('./planningRecord');
const initHolidayModel = require('./holiday');
const initTaskModel = require('./task');  // ✅ 修正：匹配 Docker 镜像中的 task.js（小写）
const initWorkDayModel = require('./workDay');
const initTaskOccurrenceModel = require('./taskOccurrence');
const initTaskOverrideModel = require('./TaskOverride');
const initAlarmSoundModel = require('./alarmSound');
const initAlarmModel = require('./alarm');
const initJournalLogModel = require('./journalLog');
const initPlanProgressLogModel = require('./planProgressLog');
const initCompletionRecordModel = require('./CompletionRecord');

const env = process.env.NODE_ENV || 'development';

// 调试日志：检查环境变量注入
console.log('🔍 Sequelize 初始化诊断:');
console.log('  NODE_ENV:', env);
console.log('  dbConfig keys:', Object.keys(dbConfig));
console.log('  Selected config exists:', !!dbConfig[env]);

const config = dbConfig[env];

// 错误保护：防止 config 为 undefined
if (!config) {
  throw new Error(`❌ Database config for env "${env}" not found. Available envs: ${Object.keys(dbConfig).join(', ')}`);
}

// 调试日志：检查关键配置
console.log('  Database:', config.database);
console.log('  Username:', config.username);
console.log('  Host:', config.host);
console.log('  Port:', config.port);

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
const WorkDay = initWorkDayModel(sequelize);
const Holiday = initHolidayModel(sequelize);
const Task = initTaskModel(sequelize);
const TaskOccurrence = initTaskOccurrenceModel(sequelize);
const TaskOverride = initTaskOverrideModel(sequelize);
const AlarmSound = initAlarmSoundModel(sequelize);
const Alarm = initAlarmModel(sequelize);
const JournalLog = initJournalLogModel(sequelize);
const PlanProgressLog = initPlanProgressLogModel(sequelize);
const CompletionRecord = initCompletionRecordModel(sequelize);

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

// CompletionRecord 关联（新增）
Task.hasMany(CompletionRecord, { foreignKey: 'taskId', as: 'completionRecords' });
CompletionRecord.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(CompletionRecord, { foreignKey: 'userId', as: 'completionRecords' });
CompletionRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// TaskOverride 关联（新增）
Task.hasMany(TaskOverride, { foreignKey: 'taskId', as: 'overrides' });
TaskOverride.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(TaskOverride, { foreignKey: 'userId', as: 'taskOverrides' });
TaskOverride.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const db = {
  sequelize,
  Sequelize,
  testConnection,
  User,
  PlanningRecord,
  WorkDay,
  Holiday,
  Task,
  TaskOccurrence,
  TaskOverride,
  AlarmSound,
  Alarm,
  JournalLog,
  PlanProgressLog,
  CompletionRecord
};

module.exports = db;
