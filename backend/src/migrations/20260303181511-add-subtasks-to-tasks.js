'use strict';

/**
 * 迁移: 为tasks表添加subtasks字段
 * 字段类型: JSON
 * 用途: 存储任务的子任务列表
 * 格式: [{"title": "子任务1", "done": false}, {"title": "子任务2", "done": true}]
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'subtasks', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: '子任务数组，格式: [{"title": "子任务1", "done": false}]'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tasks', 'subtasks');
  }
};
