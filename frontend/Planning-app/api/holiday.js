/**
 * 节日/节气/农历 API 封装
 * 对应后端路由：/api/v1/holidays/*
 *
 * 后端接口说明：
 *   GET /holidays/range?start=YYYY-MM-DD&end=YYYY-MM-DD  → { holidayMap: { "2026-02-18": [{...}] } }
 *   GET /holidays/month?year=2026&month=2                 → { holidayMap: { "2026-02-18": [{...}] } }
 *   GET /holidays/year/:year                              → { year, holidays: [...] }
 *   GET /holidays/lunar?date=YYYY-MM-DD                   → { date, lunarInfo: {...} }
 *   GET /holidays/lunar/range?start=...&end=...           → { lunarMap: { "YYYY-MM-DD": {...} } }
 */
import { get } from '@/utils/request.js';

/**
 * 获取指定月份的节日节气（月历视图用）
 * @param {number} year  - 年份
 * @param {number} month - 月份（1-12）
 * @returns {Promise<object>} { year, month, holidayMap }
 *   holidayMap 结构：{ "YYYY-MM-DD": [{ id, name, type, ... }] }
 */
export const getHolidaysByMonth = (year, month) =>
  get('/holidays/month', { year, month });

/**
 * 获取日期范围内的节日节气（周历条用，7天范围）
 * @param {string} start - 开始日期 YYYY-MM-DD
 * @param {string} end   - 结束日期 YYYY-MM-DD
 * @returns {Promise<object>} { start, end, holidayMap }
 *   holidayMap 结构：{ "YYYY-MM-DD": [{ id, name, type, ... }] }
 */
export const getHolidaysByRange = (start, end) =>
  get('/holidays/range', { start, end });

/**
 * 获取指定年份所有节日（年历用）
 * @param {number} year
 * @returns {Promise<object>} { year, holidays: [...] }
 */
export const getHolidaysByYear = (year) =>
  get(`/holidays/year/${year}`);

/**
 * 获取指定公历日期的农历信息
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<object>} { date, lunarInfo: { lunarYear, lunarMonth, lunarDay, ... } }
 */
export const getLunarInfo = (date) =>
  get('/holidays/lunar', { date });

/**
 * 批量获取日期范围内每天的农历信息（月历渲染用）
 * @param {string} start - YYYY-MM-DD
 * @param {string} end   - YYYY-MM-DD（最大范围3个月）
 * @returns {Promise<object>} { lunarMap: { "YYYY-MM-DD": { lunarDay, ... } } }
 */
export const getLunarInfoRange = (start, end) =>
  get('/holidays/lunar/range', { start, end });
