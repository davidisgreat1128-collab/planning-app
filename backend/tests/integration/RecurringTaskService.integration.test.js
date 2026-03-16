/**
 * RecurringTaskService 集成测试
 * 文件位置: backend/tests/integration/RecurringTaskService.integration.test.js
 *
 * 测试范围：
 * - Service层与Repository层、Model层的集成
 * - 真实数据库操作
 * - 完整的业务流程验证
 */

const recurringTaskService = require('../../src/services/RecurringTaskService');
const taskOverrideRepository = require('../../src/repositories/TaskOverrideRepository');
const { Task } = require('../../src/models');
const { sequelize } = require('../../src/models');

describe('RecurringTaskService 集成测试', () => {
  let testTaskId;
  let userId = 1; // 假设userId=1存在

  // 测试前清理
  beforeAll(async () => {
    await sequelize.sync(); // 确保数据库连接正常
  });

  // 每个测试前创建测试任务
  beforeEach(async () => {
    // 创建测试用的重复任务
    const task = await Task.create({
      userId: userId,
      title: '集成测试-重复任务',
      description: '用于集成测试的重复任务',
      isUrgent: false,
      isImportant: true,
      isAllDay: true,
      dateType: 'single',
      taskDate: '2026-03-16',
      isRecurring: true,
      rrule: 'DTSTART:20260316T000000Z\nRRULE:FREQ=DAILY;COUNT=10',
      rruleUntil: null,
      exdate: '[]',
      sourceType: 'manual'
    });

    testTaskId = task.id;
  });

  // 每个测试后清理
  afterEach(async () => {
    if (testTaskId) {
      try {
        // 删除拆分产生的子任务（先删除子任务）
        await sequelize.query('DELETE FROM tasks WHERE parent_task_id = ?', {
          replacements: [testTaskId],
          type: sequelize.QueryTypes.DELETE
        });
        // 删除测试任务的所有覆盖记录
        await taskOverrideRepository.deleteByTaskId(testTaskId);
        // 删除测试任务本身（真删除）
        await Task.destroy({ where: { id: testTaskId }, force: true });
      } catch (error) {
        console.error('清理测试数据失败:', error.message);
      }
    }
  });

  afterAll(async () => {
    await sequelize.close(); // 关闭数据库连接
  });

  describe('操作1：修改当天（创建单日覆盖）', () => {
    it('应该成功创建单日覆盖记录', async () => {
      // Arrange
      const date = '2026-03-20';
      const updates = {
        title: '今天改个标题',
        isUrgent: true
      };

      // Act
      const override = await recurringTaskService.modifySingleDay(
        testTaskId,
        userId,
        date,
        updates
      );

      // Assert
      expect(override).toBeDefined();
      expect(override.taskId).toBe(testTaskId);
      expect(override.overrideDate).toBe(date);
      expect(override.title).toBe('今天改个标题');
      expect(override.isUrgent).toBe(true);
      expect(override.description).toBeNull(); // NULL字段不覆盖

      // 验证数据库
      const dbOverride = await taskOverrideRepository.getByTaskAndDate(testTaskId, date);
      expect(dbOverride).not.toBeNull();
      expect(dbOverride.title).toBe('今天改个标题');
    });

    it('应该拒绝为非重复任务创建覆盖', async () => {
      // Arrange - 创建普通任务（非重复）
      const normalTask = await Task.create({
        userId: userId,
        title: '普通任务',
        isRecurring: false,
        isAllDay: true,
        dateType: 'single',
        taskDate: '2026-03-20',
        sourceType: 'manual'
      });

      // Act & Assert
      await expect(
        recurringTaskService.modifySingleDay(normalTask.id, userId, '2026-03-20', { title: '测试' })
      ).rejects.toThrow('该任务不是重复任务');

      // 清理
      await Task.destroy({ where: { id: normalTask.id }, force: true });
    });

    it('应该拒绝重复创建相同日期的覆盖', async () => {
      // Arrange - 先创建一个覆盖
      await recurringTaskService.modifySingleDay(testTaskId, userId, '2026-03-20', { title: '第一次' });

      // Act & Assert - 尝试再次创建
      await expect(
        recurringTaskService.modifySingleDay(testTaskId, userId, '2026-03-20', { title: '第二次' })
      ).rejects.toThrow('已存在覆盖记录');
    });
  });

  describe('操作4：删除当天（添加到EXDATE）', () => {
    it('应该成功添加日期到EXDATE', async () => {
      // Arrange
      const date = '2026-03-18';

      // Act
      const task = await recurringTaskService.deleteSingleDay(testTaskId, date);

      // Assert
      expect(task).toBeDefined();
      expect(task.exdate).toBeDefined();

      const exdateArray = JSON.parse(task.exdate);
      expect(exdateArray).toContain(date);

      // 验证数据库
      const dbTask = await Task.findByPk(testTaskId);
      const dbExdateArray = JSON.parse(dbTask.exdate);
      expect(dbExdateArray).toContain(date);
    });

    it('应该支持添加多个EXDATE日期', async () => {
      // Act - 添加3个日期
      await recurringTaskService.deleteSingleDay(testTaskId, '2026-03-18');
      await recurringTaskService.deleteSingleDay(testTaskId, '2026-03-20');
      const task = await recurringTaskService.deleteSingleDay(testTaskId, '2026-03-22');

      // Assert
      const exdateArray = JSON.parse(task.exdate);
      expect(exdateArray).toHaveLength(3);
      expect(exdateArray).toEqual(['2026-03-18', '2026-03-20', '2026-03-22']); // 应该已排序
    });

    it('应该拒绝重复添加相同日期', async () => {
      // Arrange
      await recurringTaskService.deleteSingleDay(testTaskId, '2026-03-18');

      // Act & Assert
      await expect(
        recurringTaskService.deleteSingleDay(testTaskId, '2026-03-18')
      ).rejects.toThrow('已在排除列表中');
    });
  });

  describe('操作6：删除当天及未来（修改UNTIL）', () => {
    it('应该成功添加UNTIL参数', async () => {
      // Arrange
      const endDate = '2026-03-25';

      // Act
      const task = await recurringTaskService.deleteFuture(testTaskId, endDate);

      // Assert
      expect(task).toBeDefined();
      expect(task.rruleUntil).toBe('2026-03-24'); // 结束日期是endDate前一天
      expect(task.rrule).toContain('UNTIL=20260324T235959Z');

      // 验证数据库
      const dbTask = await Task.findByPk(testTaskId);
      expect(dbTask.rruleUntil).toBe('2026-03-24');
      expect(dbTask.rrule).toContain('UNTIL=20260324T235959Z');
    });
  });

  describe('操作3：修改全部（修改任务规则）', () => {
    it('应该成功修改任务规则', async () => {
      // Arrange
      const updates = {
        title: '新标题-修改全部',
        isUrgent: true,
        description: '修改后的描述'
      };

      // Act
      const task = await recurringTaskService.modifyAll(testTaskId, updates);

      // Assert
      expect(task).toBeDefined();
      expect(task.title).toBe('新标题-修改全部');
      expect(task.isUrgent).toBe(true);
      expect(task.description).toBe('修改后的描述');

      // 验证数据库
      const dbTask = await Task.findByPk(testTaskId);
      expect(dbTask.title).toBe('新标题-修改全部');
      expect(dbTask.isUrgent).toBe(true);
    });
  });

  describe('操作2：修改未来（拆分任务规则）', () => {
    it('应该成功拆分任务规则', async () => {
      // Arrange
      const splitDate = '2026-03-20';
      const updates = {
        title: '从3月20日起改为新任务',
        isUrgent: true
      };

      // Act
      const result = await recurringTaskService.modifyFuture(testTaskId, userId, splitDate, updates);

      // Assert
      expect(result).toBeDefined();
      expect(result.originalTask).toBeDefined();
      expect(result.newTask).toBeDefined();

      // 验证原任务（应该添加UNTIL截止到3月19日）
      expect(result.originalTask.rruleUntil).toBe('2026-03-19');
      expect(result.originalTask.rrule).toContain('UNTIL=20260319T235959Z');

      // 验证新任务（从3月20日开始）
      expect(result.newTask.title).toBe('从3月20日起改为新任务');
      expect(result.newTask.isUrgent).toBe(true);
      expect(result.newTask.parentTaskId).toBe(testTaskId);
      expect(result.newTask.splitFromDate).toBe(splitDate);
      expect(result.newTask.rrule).toContain('DTSTART:20260320');

      // 验证数据库
      const dbOriginalTask = await Task.findByPk(testTaskId);
      expect(dbOriginalTask.rruleUntil).toBe('2026-03-19');

      const dbNewTask = await Task.findByPk(result.newTask.id);
      expect(dbNewTask).not.toBeNull();
      expect(dbNewTask.parentTaskId).toBe(testTaskId);
    });
  });

  describe('恢复操作：从EXDATE移除日期', () => {
    it('应该成功从EXDATE中移除日期', async () => {
      // Arrange - 先添加到EXDATE
      await recurringTaskService.deleteSingleDay(testTaskId, '2026-03-18');
      await recurringTaskService.deleteSingleDay(testTaskId, '2026-03-20');

      // Act - 移除其中一个日期
      const task = await recurringTaskService.restoreSingleDay(testTaskId, '2026-03-18');

      // Assert
      const exdateArray = JSON.parse(task.exdate);
      expect(exdateArray).not.toContain('2026-03-18'); // 已移除
      expect(exdateArray).toContain('2026-03-20'); // 仍保留
    });

    it('应该拒绝移除不存在的日期', async () => {
      // Act & Assert
      await expect(
        recurringTaskService.restoreSingleDay(testTaskId, '2026-03-18')
      ).rejects.toThrow('不在排除列表中');
    });
  });
});
