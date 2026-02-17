'use strict';

/**
 * 项目统一错误类
 *
 * 使用方式:
 * const { ValidationError, NotFoundError } = require('../utils/errors');
 * throw new ValidationError('邮箱格式不正确', 'email');
 * throw new NotFoundError('用户');
 */

/**
 * 应用错误基类
 */
class AppError extends Error {
  /**
   * @param {string} message - 错误信息
   * @param {number} statusCode - HTTP状态码
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // 标记为可预期的业务错误
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 参数验证错误 (400)
 */
class ValidationError extends AppError {
  /**
   * @param {string} message - 错误信息
   * @param {string} [field] - 出错的字段名
   */
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

/**
 * 资源不存在错误 (404)
 */
class NotFoundError extends AppError {
  /**
   * @param {string} resource - 资源名称，如 '用户'、'规划记录'
   */
  constructor(resource) {
    super(`${resource}不存在`, 404);
    this.resource = resource;
  }
}

/**
 * 身份验证失败错误 (401)
 */
class AuthenticationError extends AppError {
  /**
   * @param {string} [message] - 错误信息
   */
  constructor(message = '身份验证失败，请重新登录') {
    super(message, 401);
  }
}

/**
 * 权限不足错误 (403)
 */
class ForbiddenError extends AppError {
  /**
   * @param {string} [message] - 错误信息
   */
  constructor(message = '您没有权限执行此操作') {
    super(message, 403);
  }
}

/**
 * 业务逻辑冲突错误 (409)
 */
class ConflictError extends AppError {
  /**
   * @param {string} message - 冲突描述
   */
  constructor(message) {
    super(message, 409);
  }
}

/**
 * 数据处理失败错误 (422)
 */
class UnprocessableError extends AppError {
  /**
   * @param {string} message - 错误信息
   */
  constructor(message) {
    super(message, 422);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
  UnprocessableError
};
