'use strict';

const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Joi请求参数验证中间件工厂函数
 *
 * 使用方式:
 * const { validate } = require('../middleware/validator');
 * const Joi = require('joi');
 *
 * const registerSchema = Joi.object({
 *   email: Joi.string().email().required(),
 *   password: Joi.string().min(8).required(),
 *   nickname: Joi.string().max(20).required()
 * });
 *
 * router.post('/register', validate(registerSchema), controller.register);
 */

/**
 * 验证请求体 (req.body)
 * @param {Joi.Schema} schema - Joi验证模式
 * @param {object} [options] - Joi选项
 * @returns {import('express').RequestHandler}
 */
function validate(schema, options = {}) {
  const joiOptions = {
    abortEarly: false,    // 收集所有错误，不在第一个错误处停止
    allowUnknown: false,  // 不允许未定义的字段
    stripUnknown: true,   // 自动移除未定义的字段
    ...options
  };

  return (req, res, next) => {
    const { error: joiError, value } = schema.validate(req.body, joiOptions);

    if (joiError) {
      const firstError = joiError.details[0];
      const field = firstError.path.join('.');
      const message = firstError.message.replace(/['"]/g, '');
      return next(new ValidationError(message, field));
    }

    // 将验证后的（已处理的）数据覆盖回req.body
    req.body = value;
    next();
  };
}

/**
 * 验证URL参数 (req.params)
 * @param {Joi.Schema} schema - Joi验证模式
 * @returns {import('express').RequestHandler}
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { error: joiError, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false
    });

    if (joiError) {
      const firstError = joiError.details[0];
      return next(new ValidationError(firstError.message.replace(/['"]/g, ''), firstError.path.join('.')));
    }

    req.params = value;
    next();
  };
}

/**
 * 验证URL查询参数 (req.query)
 * @param {Joi.Schema} schema - Joi验证模式
 * @returns {import('express').RequestHandler}
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error: joiError, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true, // 查询参数允许额外字段
      stripUnknown: true
    });

    if (joiError) {
      const firstError = joiError.details[0];
      return next(new ValidationError(firstError.message.replace(/['"]/g, ''), firstError.path.join('.')));
    }

    req.query = value;
    next();
  };
}

/**
 * 常用验证规则（可复用）
 */
const rules = {
  /** 正整数ID */
  id: Joi.number().integer().positive().required(),
  /** 分页页码 */
  page: Joi.number().integer().min(1).default(1),
  /** 每页数量 */
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  /** 邮箱 */
  email: Joi.string().email().lowercase().trim().required(),
  /** 密码（至少8位，含字母和数字） */
  password: Joi.string().min(8).max(64).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required()
    .messages({ 'string.pattern.base': '密码必须包含字母和数字，且不少于8位' }),
  /** 昵称 */
  nickname: Joi.string().trim().min(2).max(20).required()
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  rules
};
