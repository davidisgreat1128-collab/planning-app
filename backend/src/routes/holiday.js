'use strict';

const express = require('express');
const router = express.Router();
// const { authenticate } = require('../middleware/auth');  // 节假日API不需要认证
const holidayController = require('../controllers/holidayController');

// 节假日接口为公开接口（无需登录），支持游客模式和离线缓存
// router.use(authenticate);  // ⭐ 已移除：节假日数据是公开数据

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

// GET /api/v1/holidays/workdays/year/:year - 获取指定年份工作日调整数据
router.get('/workdays/year/:year', holidayController.getWorkDaysByYear);

// GET /api/v1/holidays/workdays/range?start=2026-02-01&end=2026-02-28 - 获取日期范围工作日调整
router.get('/workdays/range', holidayController.getWorkDaysByRange);

module.exports = router;
