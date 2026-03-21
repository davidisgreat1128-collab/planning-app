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
 * 创建Sequelize实例（包裹 try-catch 捕获同步异常）
 */
let sequelize;
try {
  console.log('🔧 正在创建 Sequelize 实例...');
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
  console.log('✅ Sequelize 实例创建成功');
} catch (err) {
  console.error('❌ 创建 Sequelize 实例失败:');
  console.error('  错误类型:', err.constructor.name);
  console.error('  错误信息:', err.message);
  console.error('  完整堆栈:', err.stack);
  process.exit(1); // 明确退出，避免继续执行
}

/**
 * 数据库连接测试（支持重试，用于生产环境等待 MySQL 启动）
 * @param {number} maxRetries - 最大重试次数（默认10次）
 * @param {number} retryDelay - 初始重试延迟（毫秒，默认2000ms）
 * @returns {Promise<void>}
 */
async function testConnection(maxRetries = 10, retryDelay = 2000) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log('✅ 数据库连接成功:', config.database);
      return; // 连接成功，退出函数
    } catch (err) {
      attempt++;
      console.error(`❌ 数据库连接失败 (尝试 ${attempt}/${maxRetries}):`, err.message);

      if (attempt >= maxRetries) {
        console.error('❌ 达到最大重试次数，放弃连接');
        throw err; // 最后一次失败，抛出错误
      }

      // 指数退避：每次重试延迟翻倍（2s → 4s → 8s → 16s → ...）
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ ${delay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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
