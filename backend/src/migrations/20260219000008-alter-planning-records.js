'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 给 planning_records 表新增字段，支持子任务和提醒配置
    await queryInterface.addColumn('planning_records', 'allow_subtasks', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否允许拆分子任务',
      after: 'iching_advice'
    });

    await queryInterface.addColumn('planning_records', 'remind_config', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: '提醒配置JSON，支持固定时间和进度提醒两种模式',
      after: 'allow_subtasks'
    });

    await queryInterface.addColumn('planning_records', 'progress_pct', {
      type: Sequelize.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '当前进度百分比 0-100',
      after: 'remind_config'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('planning_records', 'allow_subtasks');
    await queryInterface.removeColumn('planning_records', 'remind_config');
    await queryInterface.removeColumn('planning_records', 'progress_pct');
  }
};
