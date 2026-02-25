'use strict';

/**
 * 迁移：将 tasks 表的 plan_id 字段从 INTEGER 改为 VARCHAR(50)
 * 原因：前端规划ID使用字符串类型（Date.now().toString()），不是数据库外键关联
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. 先删除外键约束（如果存在）
      try {
        await queryInterface.removeConstraint('tasks', 'tasks_ibfk_2', { transaction });
      } catch (err) {
        console.log('[Migration] 外键 tasks_ibfk_2 不存在，跳过删除');
      }

      // 2. 修改字段类型
      await queryInterface.changeColumn('tasks', 'plan_id', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: '关联规划ID（前端localStorage存储，字符串类型，非外键）'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // 回滚：改回 INTEGER（注意：如果已有字符串数据，回滚会失败）
    await queryInterface.changeColumn('tasks', 'plan_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null
    });
  }
};
