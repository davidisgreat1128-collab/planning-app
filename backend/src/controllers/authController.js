'use strict';

const authService = require('../services/authService');
const { success, created } = require('../utils/response');

/**
 * 认证控制器
 * 只处理 HTTP 请求/响应的映射，业务逻辑全部在 authService
 */

/**
 * POST /api/v1/auth/register
 * 用户注册
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function register(req, res, next) {
  try {
    const { email, password, nickname } = req.body;
    const result = await authService.register({ email, password, nickname });
    return created(res, result, '注册成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * 用户登录
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * 退出登录（服务端无状态，由前端清除Token即可，此接口仅作记录用）
 */
async function logout(req, res, next) {
  try {
    return success(res, null, '已退出登录');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * 获取当前登录用户信息（需要认证）
 */
async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);
    return success(res, user, '获取成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
