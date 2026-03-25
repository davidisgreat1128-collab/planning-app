#!/usr/bin/env node
/**
 * 智能种子数据导入脚本
 *
 * 功能：检查数据库表是否为空，仅在空表时才导入种子数据
 * 使用场景：生产环境首次部署、容器重启时
 *
 * 工作流程：
 * 1. 连接数据库
 * 2. 检查 holidays 和 work_days 表是否为空
 * 3. 如果为空，运行对应的种子文件
 * 4. 如果已有数据，跳过导入（避免重复）
 *
 * 创建时间：2026-03-25
 * 最后更新：2026-03-25
 */

const { execSync } = require('child_process');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 创建数据库连接
const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'planning_app_prod',
  process.env.DB_USERNAME || 'planning_user',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'mysql',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // 关闭SQL日志
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

/**
 * 检查表是否为空
 * @param {string} tableName - 表名
 * @returns {Promise<boolean>} true表示空表，false表示有数据
 */
async function isTableEmpty(tableName) {
  try {
    const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const count = results[0].count;
    console.log(`  📊 ${tableName} 表当前数据量: ${count}`);
    return count === 0;
  } catch (error) {
    console.error(`  ❌ 检查 ${tableName} 表失败:`, error.message);
    // 如果表不存在，返回 true（需要导入）
    return true;
  }
}

/**
 * 运行指定的种子文件
 * @param {string} seedFile - 种子文件名（不含路径）
 * @returns {Promise<boolean>} 成功返回true
 */
async function runSeedFile(seedFile) {
  try {
    console.log(`  🌱 运行种子文件: ${seedFile}`);
    execSync(`npx sequelize-cli db:seed --seed ${seedFile}`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log(`  ✅ 种子文件 ${seedFile} 导入成功`);
    return true;
  } catch (error) {
    console.error(`  ❌ 种子文件 ${seedFile} 导入失败:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=========================================');
  console.log('🌱 智能种子数据导入脚本');
  console.log('=========================================');

  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查 holidays 表
    console.log('\n📋 检查 holidays 表...');
    const holidaysEmpty = await isTableEmpty('holidays');
    if (holidaysEmpty) {
      console.log('  ⚠️ holidays 表为空，需要导入数据');
      await runSeedFile('20260219000001-holidays.js');
    } else {
      console.log('  ✅ holidays 表已有数据，跳过导入');
    }

    // 检查 work_days 表
    console.log('\n📋 检查 work_days 表...');
    const workDaysEmpty = await isTableEmpty('work_days');
    if (workDaysEmpty) {
      console.log('  ⚠️ work_days 表为空，需要导入数据');
      await runSeedFile('20260306152306-work-days-2026.js');
    } else {
      console.log('  ✅ work_days 表已有数据，跳过导入');
    }

    console.log('\n=========================================');
    console.log('✅ 种子数据检查完成');
    console.log('=========================================');

  } catch (error) {
    console.error('❌ 种子数据导入失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
