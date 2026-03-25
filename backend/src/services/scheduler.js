/**
 * 定时任务调度服务
 *
 * 职责（单一职责）：
 * - 管理后台定时任务
 * - 调度工作日数据有效期检查（每天凌晨2点）
 * - 在每年11月1日发出数据更新提醒
 *
 * 架构层级：Service 层
 * 依赖：其他 Service（如 holidayDataManager）
 *
 * 创建时间：2026-03-25
 * 最后更新：2026-03-25
 * 作者：Claude Sonnet 4.5
 */

'use strict';

const { logger } = require('../middleware/logger');
const holidayDataManager = require('./holidayDataManager');

class Scheduler {
  constructor() {
    this.timers = {}; // 存储定时器引用
    this.lastCheckDate = null; // 记录上次检查日期（避免重复检查）
  }

  /**
   * 计算距离下一次检查时间的毫秒数
   * @returns {number} 毫秒数
   */
  calculateNextCheckTime() {
    const now = new Date();
    const nextCheck = new Date();

    // 设置为明天凌晨 2:00
    nextCheck.setDate(now.getDate() + 1);
    nextCheck.setHours(2, 0, 0, 0);

    const delay = nextCheck - now;
    return delay;
  }

  /**
   * 检查工作日数据有效期（每天凌晨2点执行）
   */
  async checkWorkDayExpiry() {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // 避免同一天重复检查
      if (this.lastCheckDate === today) {
        logger.info('[Scheduler] 今日已检查过工作日数据有效期，跳过');
        return;
      }

      logger.info('[Scheduler] ========== 定时检查工作日数据有效期 ==========');

      const result = await holidayDataManager.checkWorkDayExpiry();

      if (result.needUpdate) {
        // ⭐ 重要：需要更新数据
        logger.warn(`[Scheduler] ⚠️⚠️⚠️ ${result.message}`);
        logger.warn(`[Scheduler] 当前月份: ${result.currentMonth}, 数据库最新年份: ${result.latestYear}, 目标年份: ${result.targetYear}`);

        // 如果是11月1日或之后，发出特别提醒
        if (result.currentMonth >= 11) {
          logger.warn('[Scheduler] ========================================');
          logger.warn(`[Scheduler] 🔔 【重要提醒】现在是${result.currentMonth}月，请立即添加 ${result.targetYear} 年工作日数据！`);
          logger.warn('[Scheduler] 📋 操作步骤：');
          logger.warn(`[Scheduler] 1. 等待国务院公布 ${result.targetYear} 年调休安排`);
          logger.warn(`[Scheduler] 2. 创建种子文件: backend/src/seeders/YYYYMMDD-work-days-${result.targetYear}.js`);
          logger.warn('[Scheduler] 3. 参考现有文件格式填写数据');
          logger.warn('[Scheduler] 4. 提交代码并重新部署');
          logger.warn('[Scheduler] ========================================');
        }
      } else {
        logger.info(`[Scheduler] ${result.message}`);
      }

      this.lastCheckDate = today;
      logger.info('[Scheduler] ========== 工作日数据检查完成 ==========');

    } catch (error) {
      logger.error('[Scheduler] 检查工作日数据有效期失败:', error.message);
    }
  }

  /**
   * 启动定时任务（应用启动时调用一次）
   */
  start() {
    logger.info('[Scheduler] ========== 启动定时任务调度器 ==========');

    // 1. 立即执行一次检查（应用启动时）
    logger.info('[Scheduler] 应用启动时执行首次检查');
    this.checkWorkDayExpiry();

    // 2. 设置每天凌晨2点的定时检查
    const scheduleNextCheck = () => {
      const delay = this.calculateNextCheckTime();
      logger.info(`[Scheduler] 下一次检查将在 ${new Date(Date.now() + delay).toLocaleString('zh-CN')} 执行`);

      this.timers.workDayCheck = setTimeout(() => {
        this.checkWorkDayExpiry();
        scheduleNextCheck(); // 递归调度下一次检查
      }, delay);
    };

    scheduleNextCheck();

    logger.info('[Scheduler] ✅ 定时任务调度器已启动');
  }

  /**
   * 停止所有定时任务（应用关闭时调用）
   */
  stop() {
    logger.info('[Scheduler] 停止所有定时任务');

    Object.keys(this.timers).forEach(key => {
      if (this.timers[key]) {
        clearTimeout(this.timers[key]);
        delete this.timers[key];
      }
    });

    logger.info('[Scheduler] ✅ 所有定时任务已停止');
  }
}

// 导出单例
module.exports = new Scheduler();
