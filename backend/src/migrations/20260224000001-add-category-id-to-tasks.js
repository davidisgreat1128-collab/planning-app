'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 给 tasks 表新增 category_id 字段，用于关联用户创建的分类
    await queryInterface.addColumn('tasks', 'category_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: null,
      comment: '任务所属分类ID（前端localStorage存储的分类ID）',
      after: 'plan_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tasks', 'category_id');
  }
};
