'use strict';

/**
 * Migration: 添加is_deleted字段到task_overrides表
 *
 * 目的：实现删除单日实例功能（选项1）
 * 原理：删除 = 阻止实例生成（非修改数据）
 *       当is_deleted=true时，RRULE计算出该日期后，直接跳过不生成实例
 *
 * 设计变更：
 * - 旧方案：使用tasks.exdate数组存储排除日期
 * - 新方案：使用task_overrides.is_deleted标记删除
 * - 优势：统一管理覆盖和删除，优先级清晰（is_deleted优先级最高）
 *
 * 关联ADR：
 * - docs/06-AI协作日志/02-架构决策记录(ADR)/ADR-006-RRULE删除机制改用task_overrides.md
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-17
 */

module.exports = {
  /**
   * 添加is_deleted字段
   */
  async up(queryInterface, Sequelize) {
    // 步骤1：添加is_deleted字段
    await queryInterface.addColumn('task_overrides', 'is_deleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '删除标记（true=该日期不生成实例）',
      after: 'override_date' // 放在override_date后面
    });

    // 步骤2：创建复合索引（优化查询性能）
    await queryInterface.addIndex('task_overrides', ['task_id', 'override_date', 'is_deleted'], {
      name: 'idx_task_override_deleted',
      comment: '用于快速查询某任务的删除标记'
    });

    console.log('✅ task_overrides表添加is_deleted字段成功');
  },

  /**
   * 回滚：删除is_deleted字段和索引
   */
  async down(queryInterface, Sequelize) {
    // 步骤1：删除索引
    await queryInterface.removeIndex('task_overrides', 'idx_task_override_deleted');

    // 步骤2：删除字段
    await queryInterface.removeColumn('task_overrides', 'is_deleted');

    console.log('✅ 已回滚is_deleted字段');
  }
};
