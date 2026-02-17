'use strict';

/**
 * planningService 单元测试
 * mock数据库，只测业务逻辑（权限校验、白名单过滤、软删除等）
 */

process.env.NODE_ENV = 'test';

// mock 整个 models/index 模块
jest.mock('../../src/models/index', () => ({
  PlanningRecord: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

const planningService = require('../../src/services/planningService');
const { PlanningRecord } = require('../../src/models/index');
const { NotFoundError, ForbiddenError } = require('../../src/utils/errors');

describe('planningService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------
  // getList
  // ----------------------------------------------------------
  describe('getList()', () => {

    it('只返回当前用户的记录，并支持分页', async () => {
      const mockRows = [{ id: 1, title: '我的人生规划' }];
      PlanningRecord.findAndCountAll.mockResolvedValue({ rows: mockRows, count: 1 });

      const result = await planningService.getList(1, { page: 1, pageSize: 20 });

      // 验证查询条件中有 userId 限制
      expect(PlanningRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          limit: 20,
          offset: 0
        })
      );
      expect(result.rows).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('按类型筛选：where 中应包含 type', async () => {
      PlanningRecord.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await planningService.getList(1, { type: 'life', page: 1, pageSize: 20 });

      expect(PlanningRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, type: 'life' }
        })
      );
    });

    it('按状态筛选：where 中应包含 status', async () => {
      PlanningRecord.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await planningService.getList(1, { status: 'active', page: 1, pageSize: 20 });

      expect(PlanningRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, status: 'active' }
        })
      );
    });

    it('第2页：offset 应为 pageSize * 1', async () => {
      PlanningRecord.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await planningService.getList(1, { page: 2, pageSize: 10 });

      expect(PlanningRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10 // (2-1) * 10
        })
      );
    });
  });

  // ----------------------------------------------------------
  // getDetail
  // ----------------------------------------------------------
  describe('getDetail()', () => {

    it('记录存在且属于当前用户：返回记录', async () => {
      const mockRecord = { id: 1, userId: 1, title: '测试规划' };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      const result = await planningService.getDetail(1, 1);

      expect(result).toEqual(mockRecord);
    });

    it('记录不存在：抛出 NotFoundError', async () => {
      PlanningRecord.findByPk.mockResolvedValue(null);

      await expect(planningService.getDetail(999, 1)).rejects.toThrow(NotFoundError);
    });

    it('记录属于其他用户：抛出 ForbiddenError', async () => {
      // 记录属于 userId=2，但当前用户是 userId=1
      const mockRecord = { id: 1, userId: 2, title: '他人的规划' };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      await expect(planningService.getDetail(1, 1)).rejects.toThrow(ForbiddenError);
    });
  });

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  describe('create()', () => {

    it('创建成功：返回新记录', async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        type: 'life',
        title: '我的人生规划',
        content: null,
        startDate: null,
        endDate: null,
        targetScore: null,
        relatedStage: null
      };
      PlanningRecord.create.mockResolvedValue(mockRecord);

      const result = await planningService.create(1, {
        type: 'life',
        title: '我的人生规划'
      });

      expect(PlanningRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, type: 'life', title: '我的人生规划' })
      );
      expect(result).toEqual(mockRecord);
    });
  });

  // ----------------------------------------------------------
  // update
  // ----------------------------------------------------------
  describe('update()', () => {

    it('更新成功：只更新白名单字段', async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        title: '旧标题',
        update: jest.fn().mockResolvedValue(true)
      };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      await planningService.update(1, 1, { title: '新标题', type: '恶意字段' });

      // type 不在白名单，不应出现在 update 调用中
      expect(mockRecord.update).toHaveBeenCalledWith({ title: '新标题' });
      expect(mockRecord.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.anything() })
      );
    });

    it('记录不属于当前用户：抛出 ForbiddenError', async () => {
      const mockRecord = { id: 1, userId: 2 };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      await expect(
        planningService.update(1, 1, { title: '新标题' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('记录不存在：抛出 NotFoundError', async () => {
      PlanningRecord.findByPk.mockResolvedValue(null);

      await expect(
        planningService.update(999, 1, { title: '新标题' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ----------------------------------------------------------
  // updateStatus
  // ----------------------------------------------------------
  describe('updateStatus()', () => {

    it('更新状态成功', async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        status: 'active',
        update: jest.fn().mockResolvedValue(true)
      };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      await planningService.updateStatus(1, 1, 'completed');

      expect(mockRecord.update).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('越权更新他人记录状态：抛出 ForbiddenError', async () => {
      const mockRecord = { id: 1, userId: 2 };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      await expect(
        planningService.updateStatus(1, 1, 'completed')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ----------------------------------------------------------
  // remove
  // ----------------------------------------------------------
  describe('remove()', () => {

    it('删除成功（软删除）：调用 record.destroy()', async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      await planningService.remove(1, 1);

      expect(mockRecord.destroy).toHaveBeenCalledTimes(1);
    });

    it('越权删除他人记录：抛出 ForbiddenError', async () => {
      const mockRecord = { id: 1, userId: 2 };
      PlanningRecord.findByPk.mockResolvedValue(mockRecord);

      await expect(planningService.remove(1, 1)).rejects.toThrow(ForbiddenError);
    });

    it('记录不存在：抛出 NotFoundError', async () => {
      PlanningRecord.findByPk.mockResolvedValue(null);

      await expect(planningService.remove(999, 1)).rejects.toThrow(NotFoundError);
    });
  });
});
