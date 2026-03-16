/**
 * RecurringTaskService 单元测试
 * 文件位置: backend/tests/unit/services/RecurringTaskService.test.js
 *
 * 测试覆盖：
 * 1. 修改当天（创建单日覆盖）
 * 2. 删除当天（添加到EXDATE）
 * 3. 删除当天及未来（修改UNTIL）
 * 4. 修改全部（直接修改任务规则）
 */

const recurringTaskService = require('../../../src/services/RecurringTaskService');
const taskOverrideRepository = require('../../../src/repositories/TaskOverrideRepository');
const { Task } = require('../../../src/models');
const { RRule } = require('rrule');

// Mock dependencies
jest.mock('../../../src/repositories/TaskOverrideRepository');
jest.mock('../../../src/models');

describe('RecurringTaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('操作1：修改当天（创建单日覆盖）', () => {
    it('应该成功创建单日覆盖', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        isRecurring: true,
        rrule: 'DTSTART:20260301T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1'
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);
      taskOverrideRepository.create = jest.fn().mockResolvedValue({
        id: 1,
        taskId: 1,
        userId: 1,
        overrideDate: '2026-03-16',
        title: '今天标题改了',
        isUrgent: true
      });

      // Act
      const result = await recurringTaskService.modifySingleDay(
        1,
        1,
        '2026-03-16',
        { title: '今天标题改了', isUrgent: true }
      );

      // Assert
      expect(Task.findByPk).toHaveBeenCalledWith(1);
      expect(taskOverrideRepository.create).toHaveBeenCalledWith({
        taskId: 1,
        userId: 1,
        overrideDate: '2026-03-16',
        title: '今天标题改了',
        isUrgent: true
      });
      expect(result.title).toBe('今天标题改了');
    });

    it('应该拒绝非重复任务的覆盖请求', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        isRecurring: false
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      // Act & Assert
      await expect(
        recurringTaskService.modifySingleDay(1, 1, '2026-03-16', { title: '测试' })
      ).rejects.toThrow('该任务不是重复任务，无法创建单日覆盖');
    });
  });

  describe('操作4：删除当天（添加到EXDATE）', () => {
    it('应该成功添加日期到EXDATE', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        isRecurring: true,
        rrule: 'DTSTART:20260301T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        exdate: JSON.stringify(['2026-03-10']),
        save: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      // Act
      const result = await recurringTaskService.deleteSingleDay(1, '2026-03-16');

      // Assert
      expect(result.exdate).toBe(JSON.stringify(['2026-03-10', '2026-03-16']));
      expect(mockTask.save).toHaveBeenCalled();
    });

    it('应该拒绝重复添加相同日期', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        isRecurring: true,
        rrule: 'DTSTART:20260301T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        exdate: JSON.stringify(['2026-03-16'])
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      // Act & Assert
      await expect(
        recurringTaskService.deleteSingleDay(1, '2026-03-16')
      ).rejects.toThrow('日期 2026-03-16 已在排除列表中');
    });
  });

  describe('操作6：删除当天及未来（修改UNTIL）', () => {
    it('应该成功添加UNTIL参数', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        isRecurring: true,
        rrule: 'DTSTART:20260301T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        save: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      // Act
      const result = await recurringTaskService.deleteFuture(1, '2026-03-20');

      // Assert
      expect(result.rruleUntil).toBe('2026-03-19'); // 结束日期是 3月20日前一天
      expect(result.rrule).toContain('UNTIL=20260319T235959Z');
      expect(mockTask.save).toHaveBeenCalled();
    });
  });

  describe('操作3：修改全部（修改任务规则）', () => {
    it('应该成功修改任务规则', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        isRecurring: true,
        title: '原标题',
        isUrgent: false,
        save: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      // Act
      const result = await recurringTaskService.modifyAll(1, {
        title: '新标题',
        isUrgent: true
      });

      // Assert
      expect(result.title).toBe('新标题');
      expect(result.isUrgent).toBe(true);
      expect(mockTask.save).toHaveBeenCalled();
    });
  });

  describe('恢复单日删除（从EXDATE移除）', () => {
    it('应该成功从EXDATE中移除日期', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        exdate: JSON.stringify(['2026-03-10', '2026-03-16', '2026-03-20']),
        save: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      // Act
      const result = await recurringTaskService.restoreSingleDay(1, '2026-03-16');

      // Assert
      expect(result.exdate).toBe(JSON.stringify(['2026-03-10', '2026-03-20']));
      expect(mockTask.save).toHaveBeenCalled();
    });

    it('应该拒绝移除不存在的日期', async () => {
      // Arrange
      const mockTask = {
        id: 1,
        exdate: JSON.stringify(['2026-03-10'])
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      // Act & Assert
      await expect(
        recurringTaskService.restoreSingleDay(1, '2026-03-16')
      ).rejects.toThrow('日期 2026-03-16 不在排除列表中');
    });
  });
});
