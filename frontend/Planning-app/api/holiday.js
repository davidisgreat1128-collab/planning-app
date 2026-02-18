/**
 * 节日/节气 API 封装
 * 对应后端 /api/v1/holidays
 */
import { get } from '@/utils/request.js';

/**
 * 获取指定年月的节日节气列表
 * @param {number} year - 年份
 * @param {number} month - 月份（1-12）
 * @returns {Promise<Array>} 节日节气数组
 */
export const getHolidays = (year, month) =>
  get('/holidays', { year, month });

/**
 * 获取指定日期的节日节气
 * @param {string} date - 日期 YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export const getHolidaysByDate = (date) =>
  get('/holidays', { date });
