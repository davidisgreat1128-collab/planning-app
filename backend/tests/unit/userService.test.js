'use strict';

/**
 * userService 单元测试
 * mock数据库，只测业务逻辑
 */

process.env.NODE_ENV = 'test';

jest.mock('../../src/models/index', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

const userService = require('../../src/services/userService');
const { User } = require('../../src/models/index');
const { NotFoundError, ValidationError } = require('../../src/utils/errors');

describe('userService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------
  // getProfile
  // ----------------------------------------------------------
  describe('getProfile()', () => {

    it('用户存在：返回安全用户信息', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        nickname: '唐伯虎',
        toSafeJSON: () => ({ id: 1, email: 'test@example.com', nickname: '唐伯虎' })
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.getProfile(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('nickname', '唐伯虎');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('用户不存在：抛出NotFoundError', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.getProfile(999)).rejects.toThrow(NotFoundError);
    });
  });

  // ----------------------------------------------------------
  // updateProfile
  // ----------------------------------------------------------
  describe('updateProfile()', () => {

    it('更新昵称成功', async () => {
      const mockUser = {
        id: 1,
        nickname: '旧昵称',
        update: jest.fn().mockResolvedValue(true),
        toSafeJSON: () => ({ id: 1, nickname: '新昵称' })
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.updateProfile(1, { nickname: '新昵称' });

      // 验证update只用了白名单字段
      expect(mockUser.update).toHaveBeenCalledWith({ nickname: '新昵称' });
      expect(result).toHaveProperty('nickname', '新昵称');
    });

    it('不允许通过此接口修改邮箱', async () => {
      const mockUser = {
        id: 1,
        update: jest.fn().mockResolvedValue(true),
        toSafeJSON: () => ({ id: 1 })
      };
      User.findByPk.mockResolvedValue(mockUser);

      await userService.updateProfile(1, { email: 'hacker@evil.com', nickname: '正常' });

      // email不在白名单，update调用中不应包含email
      expect(mockUser.update).toHaveBeenCalledWith({ nickname: '正常' });
      expect(mockUser.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ email: expect.anything() })
      );
    });

    it('用户不存在：抛出NotFoundError', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(
        userService.updateProfile(999, { nickname: '新昵称' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ----------------------------------------------------------
  // changePassword
  // ----------------------------------------------------------
  describe('changePassword()', () => {

    it('旧密码正确：修改成功', async () => {
      const mockUser = {
        id: 1,
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      await userService.changePassword(1, 'OldPass1', 'NewPass1');

      // 验证update被调用且包含新密码（beforeSave会自动哈希）
      expect(mockUser.update).toHaveBeenCalledWith({ passwordHash: 'NewPass1' });
    });

    it('旧密码错误：抛出ValidationError', async () => {
      const mockUser = {
        id: 1,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findByPk.mockResolvedValue(mockUser);

      await expect(
        userService.changePassword(1, 'WrongOldPass', 'NewPass1')
      ).rejects.toThrow(ValidationError);
    });

    it('用户不存在：抛出NotFoundError', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(
        userService.changePassword(999, 'OldPass1', 'NewPass1')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
