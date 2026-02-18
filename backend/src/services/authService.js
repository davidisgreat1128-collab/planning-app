'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const { ConflictError, AuthenticationError, NotFoundError } = require('../utils/errors');

/**
 * 认证服务
 * 负责用户注册、登录、Token生成
 * Controller 调用此服务，此服务不直接操作 req/res
 */

/**
 * 用户注册
 * @param {object} data
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 明文密码（Service层会哈希）
 * @param {string} data.nickname - 昵称
 * @returns {Promise<{token: string, user: object}>}
 */
async function register({ email, password, nickname }) {
  // 1. 检查邮箱是否已注册（包含软删除的记录也要检查）
  const existing = await User.findOne({
    where: { email },
    paranoid: false // 包含已软删除的用户
  });

  if (existing) {
    throw new ConflictError('该邮箱已被注册');
  }

  // 2. 创建用户（密码由 User 模型 beforeSave hook 自动哈希）
  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash: password, // beforeSave hook 会自动 bcrypt 哈希
    nickname: nickname.trim()
  });

  // 3. 生成 Token
  const token = generateToken(user);

  return {
    token,
    user: user.toSafeJSON()
  };
}

/**
 * 用户登录
 * @param {object} data
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 明文密码
 * @returns {Promise<{token: string, user: object}>}
 */
async function login({ email, password }) {
  // 1. 查找用户（邮箱不区分大小写）
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    // 安全考虑：不区分"邮箱不存在"和"密码错误"，统一返回相同错误
    throw new AuthenticationError('邮箱或密码不正确');
  }

  // 2. 检查账号是否激活
  if (!user.isActive) {
    throw new AuthenticationError('账号已被禁用，请联系客服');
  }

  // 3. 验证密码
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthenticationError('邮箱或密码不正确');
  }

  // 4. 更新最后登录时间
  await user.update({ lastLoginAt: new Date() });

  // 5. 生成 Token
  const token = generateToken(user);

  return {
    token,
    user: user.toSafeJSON()
  };
}

/**
 * 获取用户信息（通过ID）
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function getUserById(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('用户');
  }
  return user.toSafeJSON();
}

/**
 * 生成 JWT Token
 * @param {User} user - User模型实例
 * @returns {string} JWT Token
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn }
  );
}

module.exports = {
  register,
  login,
  getUserById,
  generateToken
};
