'use strict';

const { error } = require('../utils/response');
const { logger } = require('./logger');

/**
 * 全局错误处理中间件
 * 必须放在所有路由之后注册: app.use(errorHandler)
 *
 * 处理两类错误:
 * 1. 可预期的业务错误 (AppError子类, isOperational=true)
 * 2. 不可预期的系统错误 (普通Error)
 *
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - Express request对象
 * @param {import('express').Response} res - Express response对象
 * @param {import('express').NextFunction} next - Express next函数
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const context = { url: req.originalUrl, method: req.method };

  // ---- 1. Sequelize 验证错误 ----
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
    logger.warn('数据库验证错误', { ...context, messages });
    return error(res, '数据验证失败', 422, messages);
  }

  // ---- 2. JWT 错误 ----
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT无效', context);
    return error(res, 'Token无效，请重新登录', 401);
  }
  if (err.name === 'TokenExpiredError') {
    logger.warn('JWT已过期', context);
    return error(res, 'Token已过期，请重新登录', 401);
  }

  // ---- 3. 可预期的业务错误 (AppError子类) ----
  if (err.isOperational) {
    // 4xx 用 warn，避免污染 error 日志
    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel](`业务错误: ${err.message}`, { ...context, statusCode: err.statusCode });
    const errResponse = err.field
      ? error(res, err.message, err.statusCode, [{ field: err.field, message: err.message }])
      : error(res, err.message, err.statusCode);
    return errResponse;
  }

  // ---- 4. 不可预期的系统错误 ----
  logger.error('系统错误（未预期）', {
    ...context,
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // 生产环境不暴露内部错误细节
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误，请稍后重试'
    : err.message;

  return error(res, message, 500);
}

module.exports = errorHandler;
