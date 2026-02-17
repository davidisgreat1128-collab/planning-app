'use strict';

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const initUserModel = require('./user');

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

// 后续模型随业务开发逐步添加：
// const PlanningRecord = require('./planningRecord')(sequelize);
// const IChingHexagram = require('./iChingHexagram')(sequelize);
// const DivinationRecord = require('./divinationRecord')(sequelize);

// ============================================================
// 定义模型关联关系
// ============================================================
// User.hasMany(PlanningRecord, { foreignKey: 'userId', as: 'planningRecords' });
// PlanningRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// User.hasMany(DivinationRecord, { foreignKey: 'userId', as: 'divinationRecords' });
// DivinationRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const db = {
  sequelize,
  Sequelize,
  testConnection,
  User
  // PlanningRecord,
  // IChingHexagram,
  // DivinationRecord,
};

module.exports = db;
