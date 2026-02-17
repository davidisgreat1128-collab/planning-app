'use strict';

const { Router } = require('express');
const Joi = require('joi');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = Router();

// ============================================================
// 请求参数验证 Schema
// ============================================================

/** 更新个人信息的参数校验 */
const updateProfileSchema = Joi.object({
  nickname: Joi.string().trim().min(2).max(20)
    .messages({
      'string.min': '昵称不能少于2个字符',
      'string.max': '昵称不能超过20个字符'
    }),
  avatarUrl: Joi.string().uri().max(500).allow('', null)
    .messages({ 'string.uri': '头像地址格式不正确' }),
  birthDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow('', null)
    .messages({ 'string.pattern.base': '出生日期格式必须为 YYYY-MM-DD' })
}).min(1).messages({ 'object.min': '至少提供一个要更新的字段' });

/** 修改密码的参数校验 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required()
    .messages({ 'any.required': '请输入旧密码' }),
  newPassword: Joi.string().min(8).max(64)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': '新密码不能少于8位',
      'string.pattern.base': '新密码必须同时包含字母和数字',
      'any.required': '请输入新密码'
    })
});

// ============================================================
// 路由定义（所有路由都需要登录认证）
// ============================================================

/**
 * GET /api/v1/users/me
 * 获取当前用户个人信息
 */
router.get('/me', authenticate, userController.getMe);

/**
 * PUT /api/v1/users/me
 * 更新个人信息（昵称/头像/出生日期）
 * Body: { nickname?, avatarUrl?, birthDate? }
 */
router.put('/me', authenticate, validate(updateProfileSchema), userController.updateMe);

/**
 * POST /api/v1/users/me/password
 * 修改密码
 * Body: { oldPassword, newPassword }
 */
router.post('/me/password', authenticate, validate(changePasswordSchema), userController.changePassword);

module.exports = router;
