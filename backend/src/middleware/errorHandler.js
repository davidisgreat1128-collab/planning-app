'use strict';

const { error } = require('../utils/response');

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
  // 开发环境打印完整堆栈
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ 错误详情:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  }

  // ---- 1. Sequelize 验证错误 ----
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
    return error(res, '数据验证失败', 422, messages);
  }

  // ---- 2. JWT 错误 ----
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Token无效，请重新登录', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token已过期，请重新登录', 401);
  }

  // ---- 3. 可预期的业务错误 (AppError子类) ----
  if (err.isOperational) {
    const errResponse = err.field
      ? error(res, err.message, err.statusCode, [{ field: err.field, message: err.message }])
      : error(res, err.message, err.statusCode);
    return errResponse;
  }

  // ---- 4. 不可预期的系统错误 ----
  // 生产环境不暴露内部错误细节
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误，请稍后重试'
    : err.message;

  // 生产环境记录到日志（后续集成Winston时完善）
  if (process.env.NODE_ENV === 'production') {
    console.error('💥 系统错误:', err);
  }

  return error(res, message, 500);
}

module.exports = errorHandler;
