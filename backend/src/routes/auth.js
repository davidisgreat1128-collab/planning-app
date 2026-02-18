'use strict';

const { Router } = require('express');
const Joi = require('joi');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = Router();

// ============================================================
// 请求参数验证 Schema
// ============================================================

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱不能为空'
    }),
  password: Joi.string().min(8).max(64)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': '密码不能少于8位',
      'string.pattern.base': '密码必须同时包含字母和数字',
      'any.required': '密码不能为空'
    }),
  nickname: Joi.string().trim().min(2).max(20).required()
    .messages({
      'string.min': '昵称不能少于2个字符',
      'string.max': '昵称不能超过20个字符',
      'any.required': '昵称不能为空'
    })
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱不能为空'
    }),
  password: Joi.string().required()
    .messages({ 'any.required': '密码不能为空' })
});

// ============================================================
// 路由定义
// ============================================================

/**
 * POST /api/v1/auth/register
 * 注册新用户
 * Body: { email, password, nickname }
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * POST /api/v1/auth/login
 * 用户登录，返回JWT Token
 * Body: { email, password }
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * POST /api/v1/auth/logout
 * 退出登录（需携带Token）
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/v1/auth/me
 * 获取当前登录用户信息（需携带Token）
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;
