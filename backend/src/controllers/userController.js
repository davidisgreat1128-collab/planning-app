'use strict';

const userService = require('../services/userService');
const { success, noContent } = require('../utils/response');

/**
 * 用户控制器
 * 处理用户个人信息的查询与更新
 */

/**
 * GET /api/v1/users/me
 * 获取当前登录用户的个人信息
 */
async function getMe(req, res, next) {
  try {
    const user = await userService.getProfile(req.user.id);
    return success(res, user, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/users/me
 * 更新当前用户的个人信息（昵称/头像/出生日期）
 */
async function updateMe(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    return success(res, user, '更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/users/me/password
 * 修改当前用户的密码
 */
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    await userService.changePassword(req.user.id, oldPassword, newPassword);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  changePassword
};
