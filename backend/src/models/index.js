'use strict';

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

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
// 导入所有模型（后续随业务增加逐步添加）
// ============================================================
// const User = require('./user')(sequelize);
// const PlanningRecord = require('./planningRecord')(sequelize);
// const IChingHexagram = require('./iChingHexagram')(sequelize);

// ============================================================
// 定义模型关联关系（后续随模型增加逐步配置）
// ============================================================
// User.hasMany(PlanningRecord, { foreignKey: 'userId', as: 'planningRecords' });
// PlanningRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const db = {
  sequelize,
  Sequelize,
  testConnection
  // User,
  // PlanningRecord,
  // IChingHexagram,
};

module.exports = db;
