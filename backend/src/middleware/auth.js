'use strict';

const jwt = require('jsonwebtoken');
const { AuthenticationError, ForbiddenError } = require('../utils/errors');

/**
 * JWT身份验证中间件
 *
 * 使用方式:
 * const { authenticate } = require('../middleware/auth');
 * router.get('/profile', authenticate, controller.getProfile);
 *
 * Token格式: Authorization: Bearer <token>
 */

/**
 * 验证JWT Token，通过后将用户信息挂载到 req.user
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('未提供认证Token');
    }

    const token = authHeader.substring(7); // 去掉 "Bearer " 前缀
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET未配置');
    }

    const decoded = jwt.verify(token, secret);

    // 将解码后的用户信息挂载到请求对象
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();
  } catch (err) {
    next(err); // 交给全局errorHandler处理 JWT错误
  }
}

/**
 * 可选身份验证 - Token存在则验证，不存在则放行（用于公开/登录可选接口）
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  authenticate(req, res, next);
}

/**
 * 角色权限检查中间件工厂函数
 * 必须在 authenticate 之后使用
 *
 * @param {...string} roles - 允许访问的角色列表
 * @returns {import('express').RequestHandler}
 *
 * 使用方式:
 * router.delete('/users/:id', authenticate, requireRole('admin'), controller.deleteUser);
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`需要 ${roles.join('/')} 权限`));
    }
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireRole
};
