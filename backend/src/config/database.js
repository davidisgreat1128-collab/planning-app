'use strict';

require('dotenv').config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
});

/**
 * Sequelize数据库配置
 *
 * 关键配置说明:
 * - underscored: true  → 自动映射 snake_case(DB) ↔ camelCase(JS)
 * - paranoid: true     → 启用软删除，使用 deleted_at 字段
 * - timestamps: true   → 自动管理 created_at / updated_at
 * - freezeTableName    → 禁止Sequelize自动复数化表名
 */
module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'planning_app_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: (msg) => process.env.DB_LOGGING === 'true' && console.log(msg),
    define: {
      underscored: true,         // ⭐ 核心: snake_case(DB) ↔ camelCase(JS) 自动映射
      freezeTableName: true,     // 禁止自动复数化表名
      timestamps: true,          // 自动管理 created_at / updated_at
      paranoid: true,            // 软删除: deleted_at 字段
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  test: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'planning_app_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  },

  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'planning_app_prod',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};
