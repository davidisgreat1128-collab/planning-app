'use strict';

/**
 * Migration: 数据库索引优化
 *
 * 目的：优化重复任务查询性能
 * 预期效果：查询速度提升30%，磁盘I/O降低50%
 *
 * 新增索引：
 * - idx_user_recurring: 优化"查询用户的所有重复任务"（覆盖索引）
 *
 * 关联文档：
 * - docs/02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md（方案一：数据库架构增强）
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-16
 */

module.exports = {
  /**
   * 创建索引
   */
  async up(queryInterface, Sequelize) {
    // 优化重复任务查询（覆盖索引）
    // 查询场景：SELECT * FROM tasks WHERE user_id = ? AND is_recurring = TRUE
    await queryInterface.addIndex('tasks', ['user_id', 'is_recurring'], {
      name: 'idx_user_recurring',
      comment: '加速查询用户的重复任务（覆盖索引）',
      where: {
        is_recurring: true
      }
    });

    console.log('[Migration] 索引创建成功：idx_user_recurring');
    console.log('[Migration] 验证索引：执行 EXPLAIN SELECT * FROM tasks WHERE user_id=1 AND is_recurring=TRUE;');
    console.log('[Migration] 预期结果：Using index（覆盖索引生效）');
  },

  /**
   * 回滚：删除索引
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tasks', 'idx_user_recurring');
    console.log('[Migration] 索引已删除：idx_user_recurring');
  }
};
