'use strict';

const holidayService = require('../services/holidayService');
const { success } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * GET /api/v1/holidays/year/:year
 * 获取指定年份所有节日（含农历转公历）
 */
async function getByYear(req, res, next) {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new ValidationError('年份需在2000-2100之间');
    }
    const holidays = await holidayService.getHolidaysByYear(year);
    res.json(success({ year, holidays }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/holidays/month?year=2026&month=2
 * 获取指定月份的节日（返回按日期分组的Map）
 */
async function getByMonth(req, res, next) {
  try {
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new ValidationError('请提供有效的year和month参数（month: 1-12）');
    }
    const holidayMap = await holidayService.getHolidaysByMonth(year, month);
    res.json(success({ year, month, holidayMap }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/holidays/range?start=2026-02-16&end=2026-02-22
 * 获取日期范围内的节日（周历用）
 */
async function getByRange(req, res, next) {
  try {
    const { start, end } = req.query;
    if (!start || !end || start > end) {
      throw new ValidationError('请提供有效的start和end日期参数（YYYY-MM-DD）');
    }
    const holidayMap = await holidayService.getHolidaysByRange(start, end);
    res.json(success({ start, end, holidayMap }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/holidays/lunar?date=2026-02-18
 * 获取指定公历日期的农历信息
 */
async function getLunarInfo(req, res, next) {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError('请提供有效的date参数（YYYY-MM-DD）');
    }
    const lunarInfo = holidayService.getLunarInfo(date);
    res.json(success({ date, lunarInfo }));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/holidays/lunar/range?start=2026-02-01&end=2026-02-28
 * 批量获取日期范围内每天的农历信息（月历渲染用）
 */
async function getLunarInfoRange(req, res, next) {
  try {
    const { start, end } = req.query;
    if (!start || !end || start > end) {
      throw new ValidationError('请提供有效的start和end日期参数');
    }
    // 限制最大范围为3个月，防止滥用
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
    if (diffDays > 93) {
      throw new ValidationError('日期范围最大不能超过3个月');
    }
    const lunarMap = holidayService.getLunarInfoRange(start, end);
    res.json(success({ start, end, lunarMap }));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getByYear,
  getByMonth,
  getByRange,
  getLunarInfo,
  getLunarInfoRange
};
