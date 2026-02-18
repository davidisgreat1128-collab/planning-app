'use strict';

const { Router } = require('express');
const Joi = require('joi');
const planningController = require('../controllers/planningController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validator');

const router = Router();

// ============================================================
// 规划类型与状态常量（从 constants.js 提取，与数据库 ENUM 保持一致）
// ============================================================
const { PLANNING_TYPES: PLANNING_TYPES_CONST, PLANNING_STATUS } = require('../config/constants');
const PLANNING_TYPES = Object.values(PLANNING_TYPES_CONST);   // ['life','career','project','mood','diet','health','time']
const PLANNING_STATUSES = Object.values(PLANNING_STATUS);      // ['active','paused','completed','abandoned']

// ============================================================
// 请求参数验证 Schema
// ============================================================

/** 创建规划记录的参数校验 */
const createSchema = Joi.object({
  type: Joi.string().valid(...PLANNING_TYPES).required()
    .messages({
      'any.only': `规划类型必须是以下之一：${PLANNING_TYPES.join('、')}`,
      'any.required': '规划类型不能为空'
    }),
  title: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题不能超过100个字符',
      'any.required': '标题不能为空'
    }),
  content: Joi.string().max(10000).allow('', null)
    .messages({ 'string.max': '内容不能超过10000个字符' }),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null)
    .messages({ 'string.pattern.base': '开始日期格式必须为 YYYY-MM-DD' }),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null)
    .messages({ 'string.pattern.base': '结束日期格式必须为 YYYY-MM-DD' }),
  targetScore: Joi.number().integer().min(0).max(100).allow(null)
    .messages({
      'number.min': '目标分值不能小于0',
      'number.max': '目标分值不能超过100'
    }),
  relatedStage: Joi.string().max(50).allow('', null)
    .messages({ 'string.max': '关联阶段不能超过50个字符' })
});

/** 更新规划记录内容的参数校验（所有字段可选，但至少提供一个） */
const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100)
    .messages({
      'string.min': '标题不能为空',
      'string.max': '标题不能超过100个字符'
    }),
  content: Joi.string().max(10000).allow('', null)
    .messages({ 'string.max': '内容不能超过10000个字符' }),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null)
    .messages({ 'string.pattern.base': '开始日期格式必须为 YYYY-MM-DD' }),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null)
    .messages({ 'string.pattern.base': '结束日期格式必须为 YYYY-MM-DD' }),
  targetScore: Joi.number().integer().min(0).max(100).allow(null)
    .messages({
      'number.min': '目标分值不能小于0',
      'number.max': '目标分值不能超过100'
    }),
  relatedStage: Joi.string().max(50).allow('', null)
    .messages({ 'string.max': '关联阶段不能超过50个字符' })
}).min(1).messages({ 'object.min': '至少提供一个要更新的字段' });

/** 更新状态的参数校验 */
const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...PLANNING_STATUSES).required()
    .messages({
      'any.only': `状态必须是以下之一：${PLANNING_STATUSES.join('、')}`,
      'any.required': '状态不能为空'
    })
});

/** 列表查询参数校验 */
const listQuerySchema = Joi.object({
  type: Joi.string().valid(...PLANNING_TYPES).allow('', null),
  status: Joi.string().valid(...PLANNING_STATUSES).allow('', null),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
});

// ============================================================
// 路由定义（所有路由都需要登录认证）
// ============================================================

/**
 * GET /api/v1/planning
 * 获取当前用户的规划记录列表（支持分页和筛选）
 * 查询参数：type?, status?, page?, pageSize?
 */
router.get('/', authenticate, validateQuery(listQuerySchema), planningController.getList);

/**
 * POST /api/v1/planning
 * 创建新的规划记录
 * Body: { type, title, content?, startDate?, endDate?, targetScore?, relatedStage? }
 */
router.post('/', authenticate, validate(createSchema), planningController.create);

/**
 * GET /api/v1/planning/:id
 * 获取单条规划记录详情
 */
router.get('/:id', authenticate, planningController.getDetail);

/**
 * PUT /api/v1/planning/:id
 * 更新规划记录内容（不含状态变更）
 * Body: { title?, content?, startDate?, endDate?, targetScore?, relatedStage? }
 */
router.put('/:id', authenticate, validate(updateSchema), planningController.update);

/**
 * PATCH /api/v1/planning/:id/status
 * 单独更新规划记录状态
 * Body: { status }
 */
router.patch('/:id/status', authenticate, validate(updateStatusSchema), planningController.updateStatus);

/**
 * DELETE /api/v1/planning/:id
 * 删除规划记录（软删除）
 */
router.delete('/:id', authenticate, planningController.remove);

// ============================================================
// 规划进度接口
// ============================================================
const planProgressService = require('../services/planProgressService');
const { success, successCreated } = require('../utils/response');

/**
 * POST /api/v1/planning/:id/progress
 * 记录规划进度（0-100）
 * Body: { progressPct, note?, logId? }
 */
router.post('/:id/progress', authenticate, async (req, res, next) => {
  try {
    const progressLog = await planProgressService.recordProgress(
      parseInt(req.params.id),
      req.user.id,
      req.body
    );
    res.status(201).json(successCreated(progressLog, '进度记录成功'));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/planning/:id/progress
 * 获取规划进度历史
 */
router.get('/:id/progress', authenticate, async (req, res, next) => {
  try {
    const result = await planProgressService.getProgressHistory(
      parseInt(req.params.id),
      req.user.id
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
