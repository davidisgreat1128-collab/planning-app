'use strict';

/**
 * Migration: 给tasks表添加规则拆分支持字段
 *
 * 目的：实现阶段一"修改未来"操作（操作2）
 * 原理：拆分任务规则时，需要追溯父任务和记录拆分起始日期
 *
 * 新增字段：
 * - parent_task_id: 父任务ID（拆分来源）
 * - split_from_date: 拆分起始日期
 *
 * 关联文档：
 * - docs/02-技术设计/任务系统设计理论/阶段一、重复任务系统设计原则.md
 * - docs/02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-16
 */

module.exports = {
  /**
   * 添加字段
   */
  async up(queryInterface, Sequelize) {
    // 添加parent_task_id字段（父任务ID，用于追溯拆分来源）
    await queryInterface.addColumn('tasks', 'parent_task_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '父任务ID（拆分来源）',
      references: {
        model: 'tasks',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 添加split_from_date字段（拆分起始日期，用于数据审计）
    await queryInterface.addColumn('tasks', 'split_from_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null,
      comment: '拆分起始日期（用于数据审计）'
    });

    // 创建索引：查询某任务的所有子规则
    await queryInterface.addIndex('tasks', ['parent_task_id'], {
      name: 'idx_parent_task',
      comment: '查询某任务的所有子规则'
    });
  },

  /**
   * 回滚：删除字段和索引
   */
  async down(queryInterface, Sequelize) {
    // 删除索引
    await queryInterface.removeIndex('tasks', 'idx_parent_task');

    // 删除字段
    await queryInterface.removeColumn('tasks', 'split_from_date');
    await queryInterface.removeColumn('tasks', 'parent_task_id');
  }
};
