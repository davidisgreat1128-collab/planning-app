/**
 * 节假日数据管理服务
 *
 * 职责（单一职责）：
 * - 检查节假日和工作日数据是否存在
 * - 导入缺失的种子数据
 * - 检查数据有效性和时效性
 *
 * 架构层级：Service 层
 * 调用关系：Service → Repository/Model → Database
 *
 * 创建时间：2026-03-25
 * 最后更新：2026-03-25
 * 作者：Claude Sonnet 4.5
 */

'use strict';

const { Holiday, WorkDay } = require('../models');
const { execSync } = require('child_process');
const { logger } = require('../middleware/logger');

class HolidayDataManager {
  /**
   * 检查表是否为空
   * @param {string} modelName - 模型名称（'Holiday' 或 'WorkDay'）
   * @returns {Promise<boolean>} true表示空表，false表示有数据
   */
  async isTableEmpty(modelName) {
    try {
      const Model = modelName === 'Holiday' ? Holiday : WorkDay;
      const count = await Model.count();
      logger.info(`[HolidayDataManager] ${modelName} 表当前数据量: ${count}`);
      return count === 0;
    } catch (error) {
      logger.error(`[HolidayDataManager] 检查 ${modelName} 表失败:`, error.message);
      // 如果表不存在或查询失败，返回 true（需要导入）
      return true;
    }
  }

  /**
   * 运行指定的种子文件
   * @param {string} seedFile - 种子文件名（不含路径）
   * @returns {Promise<boolean>} 成功返回true
   */
  async runSeedFile(seedFile) {
    try {
      logger.info(`[HolidayDataManager] 运行种子文件: ${seedFile}`);
      execSync(`npx sequelize-cli db:seed --seed ${seedFile}`, {
        stdio: 'inherit',
        cwd: require('path').join(__dirname, '../../')
      });
      logger.info(`[HolidayDataManager] 种子文件 ${seedFile} 导入成功`);
      return true;
    } catch (error) {
      logger.error(`[HolidayDataManager] 种子文件 ${seedFile} 导入失败:`, error.message);
      return false;
    }
  }

  /**
   * 检查并导入节假日数据（holidays 表）
   * @returns {Promise<boolean>} 成功返回true
   */
  async ensureHolidayData() {
    logger.info('[HolidayDataManager] 检查 holidays 表...');
    const isEmpty = await this.isTableEmpty('Holiday');

    if (isEmpty) {
      logger.warn('[HolidayDataManager] holidays 表为空，需要导入数据');
      return await this.runSeedFile('20260219000001-holidays.js');
    } else {
      logger.info('[HolidayDataManager] holidays 表已有数据，跳过导入');
      return true;
    }
  }

  /**
   * 检查并导入工作日数据（work_days 表）
   * @returns {Promise<boolean>} 成功返回true
   */
  async ensureWorkDayData() {
    logger.info('[HolidayDataManager] 检查 work_days 表...');
    const isEmpty = await this.isTableEmpty('WorkDay');

    if (isEmpty) {
      logger.warn('[HolidayDataManager] work_days 表为空，需要导入数据');
      // 获取当前年份
      const currentYear = new Date().getFullYear();
      const seedFile = `20260306152306-work-days-${currentYear}.js`;

      logger.info(`[HolidayDataManager] 尝试导入 ${currentYear} 年工作日数据: ${seedFile}`);
      return await this.runSeedFile(seedFile);
    } else {
      logger.info('[HolidayDataManager] work_days 表已有数据，跳过导入');
      return true;
    }
  }

  /**
   * 检查工作日数据是否需要更新（每年11月1日检查）
   * @returns {Promise<object>} 返回检查结果 { needUpdate: boolean, message: string, currentYear: number, latestYear: number }
   */
  async checkWorkDayExpiry() {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 0-11 → 1-12

      // 查询数据库中最新的工作日数据年份
      const latestWorkDay = await WorkDay.findOne({
        order: [['year', 'DESC']],
        attributes: ['year']
      });

      const latestYear = latestWorkDay ? latestWorkDay.year : null;

      logger.info(`[HolidayDataManager] 工作日数据检查: 当前年份=${currentYear}, 数据库最新年份=${latestYear}, 当前月份=${currentMonth}`);

      // 判断是否需要更新
      const needUpdate = (
        latestYear === null ||                    // 没有任何数据
        latestYear < currentYear ||               // 数据过期（去年的数据）
        (currentMonth >= 11 && latestYear === currentYear) // 11月后需要更新下一年数据
      );

      let message = '';
      if (needUpdate) {
        const targetYear = currentMonth >= 11 ? currentYear + 1 : currentYear;
        message = `⚠️ 工作日数据需要更新！请添加 ${targetYear} 年的工作日种子数据（work-days-${targetYear}.js）`;
        logger.warn(`[HolidayDataManager] ${message}`);
      } else {
        message = `✅ 工作日数据最新（${latestYear} 年）`;
        logger.info(`[HolidayDataManager] ${message}`);
      }

      return {
        needUpdate,
        message,
        currentYear,
        currentMonth,
        latestYear,
        targetYear: currentMonth >= 11 ? currentYear + 1 : currentYear
      };
    } catch (error) {
      logger.error('[HolidayDataManager] 检查工作日数据有效期失败:', error.message);
      return {
        needUpdate: true,
        message: '❌ 无法检查工作日数据有效期',
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        latestYear: null,
        targetYear: new Date().getFullYear()
      };
    }
  }

  /**
   * 完整的数据检查和导入流程（容器启动时调用）
   * @returns {Promise<object>} 返回执行结果
   */
  async initialize() {
    logger.info('[HolidayDataManager] ========== 开始初始化节假日数据 ==========');

    const result = {
      success: true,
      holidayImported: false,
      workDayImported: false,
      workDayExpiry: null,
      errors: []
    };

    try {
      // 1. 检查并导入 holidays 数据
      result.holidayImported = await this.ensureHolidayData();
      if (!result.holidayImported) {
        result.errors.push('holidays 数据导入失败');
      }

      // 2. 检查并导入 work_days 数据
      result.workDayImported = await this.ensureWorkDayData();
      if (!result.workDayImported) {
        result.errors.push('work_days 数据导入失败');
      }

      // 3. 检查工作日数据有效期
      result.workDayExpiry = await this.checkWorkDayExpiry();

      // 4. 如果数据需要更新，记录警告
      if (result.workDayExpiry.needUpdate) {
        logger.warn(`[HolidayDataManager] ${result.workDayExpiry.message}`);
        result.errors.push(result.workDayExpiry.message);
      }

      result.success = result.errors.length === 0;

      logger.info('[HolidayDataManager] ========== 节假日数据初始化完成 ==========');
      logger.info(`[HolidayDataManager] 结果: ${JSON.stringify(result)}`);

      return result;

    } catch (error) {
      logger.error('[HolidayDataManager] 初始化节假日数据失败:', error.message);
      result.success = false;
      result.errors.push(error.message);
      return result;
    }
  }
}

// 导出单例
module.exports = new HolidayDataManager();
