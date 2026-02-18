'use strict';

const { User } = require('../models/index');
const { NotFoundError } = require('../utils/errors');

/**
 * 用户业务服务
 * 负责用户信息的查询与更新
 */

/**
 * 根据ID获取用户完整信息
 * @param {number} userId - 用户ID
 * @returns {Promise<object>} 安全的用户信息（不含密码哈希）
 * @throws {NotFoundError} 用户不存在时抛出
 */
async function getProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('用户');
  }
  return user.toSafeJSON();
}

/**
 * 更新用户基本信息
 * 支持更新：昵称、头像、出生日期
 * 不允许通过此接口修改：邮箱、密码、角色、积分
 * @param {number} userId - 用户ID
 * @param {object} data - 更新数据
 * @param {string} [data.nickname] - 新昵称
 * @param {string} [data.avatarUrl] - 新头像URL
 * @param {string} [data.birthDate] - 出生日期（YYYY-MM-DD格式）
 * @returns {Promise<object>} 更新后的用户信息
 * @throws {NotFoundError} 用户不存在时抛出
 */
async function updateProfile(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('用户');
  }

  // 只允许更新白名单字段，防止越权修改敏感信息
  const allowedFields = ['nickname', 'avatarUrl', 'birthDate'];
  const updateData = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  await user.update(updateData);
  return user.toSafeJSON();
}

/**
 * 修改密码
 * @param {number} userId - 用户ID
 * @param {string} oldPassword - 旧密码（明文）
 * @param {string} newPassword - 新密码（明文，Service层自动哈希）
 * @returns {Promise<void>}
 * @throws {NotFoundError} 用户不存在时抛出
 * @throws {ValidationError} 旧密码不正确时抛出
 */
async function changePassword(userId, oldPassword, newPassword) {
  const { ValidationError } = require('../utils/errors');

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('用户');
  }

  // 验证旧密码
  const isOldPasswordValid = await user.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    throw new ValidationError('旧密码不正确', 'oldPassword');
  }

  // 更新密码（User模型的 beforeSave hook 会自动哈希新密码）
  await user.update({ passwordHash: newPassword });
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
