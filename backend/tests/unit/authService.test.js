'use strict';

/**
 * authService 单元测试
 * 使用 Jest mock 隔离数据库依赖，只测试业务逻辑
 */

// 在加载任何模块前先设置环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_unit_tests';
process.env.JWT_EXPIRES_IN = '1h';

// Mock models/index，避免真实数据库连接
jest.mock('../../src/models/index', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

const authService = require('../../src/services/authService');
const { User } = require('../../src/models/index');
const { ConflictError, AuthenticationError, NotFoundError } = require('../../src/utils/errors');

// ============================================================
// 测试套件
// ============================================================

describe('authService', () => {

  // 每个测试前清除所有mock调用记录
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------
  // register
  // ----------------------------------------------------------
  describe('register()', () => {

    it('注册成功：返回token和用户信息', async () => {
      User.findOne.mockResolvedValue(null); // 邮箱未被使用
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        nickname: '测试用户',
        role: 'user',
        toSafeJSON: () => ({ id: 1, email: 'test@example.com', nickname: '测试用户' })
      };
      User.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        nickname: '测试用户'
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('passwordHash'); // 安全字段已移除
    });

    it('邮箱已注册：抛出ConflictError', async () => {
      User.findOne.mockResolvedValue({ id: 1, email: 'existing@example.com' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          nickname: '已有用户'
        })
      ).rejects.toThrow(ConflictError);
    });

    it('邮箱应转为小写存储', async () => {
      User.findOne.mockResolvedValue(null);
      const mockUser = {
        id: 2,
        email: 'upper@example.com',
        nickname: '用户',
        role: 'user',
        toSafeJSON: () => ({ id: 2, email: 'upper@example.com' })
      };
      User.create.mockResolvedValue(mockUser);

      await authService.register({
        email: 'UPPER@EXAMPLE.COM',
        password: 'password123',
        nickname: '用户'
      });

      // 验证create时邮箱已转小写
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'upper@example.com' })
      );
    });
  });

  // ----------------------------------------------------------
  // login
  // ----------------------------------------------------------
  describe('login()', () => {

    it('登录成功：返回token和用户信息', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        isActive: 1,
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
        toSafeJSON: () => ({ id: 1, email: 'test@example.com' })
      };
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ lastLoginAt: expect.any(Date) })
      );
    });

    it('邮箱不存在：抛出AuthenticationError', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'notexist@example.com', password: 'password123' })
      ).rejects.toThrow(AuthenticationError);
    });

    it('密码错误：抛出AuthenticationError', async () => {
      const mockUser = {
        id: 1,
        isActive: 1,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(AuthenticationError);
    });

    it('账号被禁用：抛出AuthenticationError', async () => {
      const mockUser = {
        id: 1,
        isActive: 0 // 已禁用
      };
      User.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.login({ email: 'disabled@example.com', password: 'password123' })
      ).rejects.toThrow(AuthenticationError);
    });

    it('邮箱不区分大小写', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        isActive: 1,
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
        toSafeJSON: () => ({ id: 1, email: 'test@example.com' })
      };
      User.findOne.mockResolvedValue(mockUser);

      await authService.login({ email: 'TEST@EXAMPLE.COM', password: 'password123' });

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'test@example.com' } })
      );
    });
  });

  // ----------------------------------------------------------
  // getUserById
  // ----------------------------------------------------------
  describe('getUserById()', () => {

    it('用户存在：返回安全用户信息', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        toSafeJSON: () => ({ id: 1, email: 'test@example.com' })
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await authService.getUserById(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('email');
    });

    it('用户不存在：抛出NotFoundError', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(authService.getUserById(999)).rejects.toThrow(NotFoundError);
    });
  });

  // ----------------------------------------------------------
  // generateToken
  // ----------------------------------------------------------
  describe('generateToken()', () => {

    it('生成有效的JWT Token', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      const token = authService.generateToken(mockUser);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT结构: header.payload.signature
    });
  });

});
