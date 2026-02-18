'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const holidayController = require('../controllers/holidayController');

// 所有节日接口需要登录（防止滥用）
router.use(authenticate);

// GET /api/v1/holidays/year/:year - 获取指定年份所有节日
router.get('/year/:year', holidayController.getByYear);

// GET /api/v1/holidays/month?year=2026&month=2 - 获取指定月份节日
router.get('/month', holidayController.getByMonth);

// GET /api/v1/holidays/range?start=2026-02-16&end=2026-02-22 - 获取日期范围节日
router.get('/range', holidayController.getByRange);

// GET /api/v1/holidays/lunar?date=2026-02-18 - 获取指定日期农历信息
router.get('/lunar', holidayController.getLunarInfo);

// GET /api/v1/holidays/lunar/range?start=2026-02-01&end=2026-02-28 - 批量获取农历信息
router.get('/lunar/range', holidayController.getLunarInfoRange);

module.exports = router;
