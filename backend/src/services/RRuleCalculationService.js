/**
 * RRULE 计算服务
 * 文件位置: backend/src/services/RRuleCalculationService.js
 *
 * 职责: 基于RRULE规则实时计算重复任务的发生日期
 * 核心原则: 不预生成任务实例，按需计算
 */

const { RRule, RRuleSet, rrulestr } = require('rrule');
const { ValidationError } = require('../utils/errors');

class RRuleCalculationService {
  /**
   * 计算任务在指定日期范围内的所有发生日期
   * @param {object} task - 任务对象
   * @param {string} task.rrule - RRULE字符串
   * @param {string[]} task.exdate - 排除日期数组（getter已转换为数组）
   * @param {string} startDate - 起始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   * @returns {string[]} 日期数组（YYYY-MM-DD格式）
   */
  calculateOccurrences(task, startDate, endDate) {
    if (!task.rrule) {
      throw new ValidationError('任务没有RRULE规则', 'rrule');
    }

    try {
      // 解析RRULE字符串
      const rule = rrulestr(task.rrule);

      // 计算日期范围（UTC时间）
      const start = new Date(startDate + 'T00:00:00Z');
      const end = new Date(endDate + 'T23:59:59Z');

      // 使用RRuleSet处理排除日期
      const rruleSet = new RRuleSet();
      rruleSet.rrule(rule);

      // 添加排除日期（EXDATE）
      if (task.exdate && Array.isArray(task.exdate) && task.exdate.length > 0) {
        task.exdate.forEach(exdateStr => {
          const exdateDate = new Date(exdateStr + 'T00:00:00Z');
          rruleSet.exdate(exdateDate);
        });
      }

      // 计算发生日期
      const occurrences = rruleSet.between(start, end, true);

      // 转换为YYYY-MM-DD格式
      return occurrences.map(date => this._formatDate(date));
    } catch (error) {
      throw new ValidationError('RRULE解析失败: ' + error.message, 'rrule');
    }
  }

  /**
   * 检查任务是否在指定日期发生
   * @param {object} task - 任务对象
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {boolean}
   */
  isOccurrenceOnDate(task, date) {
    if (!task.rrule) return false;

    try {
      const occurrences = this.calculateOccurrences(task, date, date);
      return occurrences.includes(date);
    } catch (error) {
      console.error('检查任务发生日期失败:', error);
      return false;
    }
  }

  /**
   * 获取任务的下一个发生日期
   * @param {object} task - 任务对象
   * @param {string} [afterDate] - 起始日期（默认今天）
   * @returns {string|null} 下一个发生日期（YYYY-MM-DD），如果没有则返回null
   */
  getNextOccurrence(task, afterDate = null) {
    if (!task.rrule) return null;

    try {
      const rule = rrulestr(task.rrule);
      const rruleSet = new RRuleSet();
      rruleSet.rrule(rule);

      // 添加排除日期
      if (task.exdate && Array.isArray(task.exdate) && task.exdate.length > 0) {
        task.exdate.forEach(exdateStr => {
          const exdateDate = new Date(exdateStr + 'T00:00:00Z');
          rruleSet.exdate(exdateDate);
        });
      }

      // 计算起始日期
      const startDate = afterDate
        ? new Date(afterDate + 'T00:00:00Z')
        : new Date();

      // 获取下一个发生日期
      const nextOccurrence = rruleSet.after(startDate, false);

      return nextOccurrence ? this._formatDate(nextOccurrence) : null;
    } catch (error) {
      console.error('获取下一个发生日期失败:', error);
      return null;
    }
  }

  /**
   * 验证RRULE字符串是否合法
   * @param {string} rruleString - RRULE字符串
   * @returns {boolean}
   */
  validateRRule(rruleString) {
    try {
      rrulestr(rruleString);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成RRULE字符串（辅助方法）
   * @param {object} options - RRule配置
   * @param {string} options.freq - 频率（DAILY/WEEKLY/MONTHLY/YEARLY）
   * @param {number} [options.interval=1] - 间隔
   * @param {string[]} [options.byweekday] - 按星期（MO/TU/WE/TH/FR/SA/SU）
   * @param {number} [options.count] - 重复次数
   * @param {string} [options.until] - 结束日期（YYYY-MM-DD）
   * @param {string} dtstart - 开始日期（YYYY-MM-DD）
   * @returns {string} RRULE字符串
   */
  generateRRule(options, dtstart) {
    try {
      const rruleOptions = {
        freq: RRule[options.freq],
        interval: options.interval || 1,
        dtstart: new Date(dtstart + 'T00:00:00Z')
      };

      // 按星期
      if (options.byweekday && options.byweekday.length > 0) {
        rruleOptions.byweekday = options.byweekday.map(day => RRule[day]);
      }

      // 重复次数或结束日期（二选一）
      if (options.count) {
        rruleOptions.count = options.count;
      } else if (options.until) {
        rruleOptions.until = new Date(options.until + 'T23:59:59Z');
      }

      const rule = new RRule(rruleOptions);
      return rule.toString();
    } catch (error) {
      throw new ValidationError('生成RRULE失败: ' + error.message, 'options');
    }
  }

  /**
   * 格式化日期为YYYY-MM-DD
   * @private
   * @param {Date} date - Date对象
   * @returns {string} YYYY-MM-DD格式
   */
  _formatDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

module.exports = new RRuleCalculationService();
