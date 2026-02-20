'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('plan_progress_logs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      plan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'planning_records', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '关联的规划ID'
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '用户ID（冗余）'
      },
      progress_pct: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
        comment: '完成百分比 0-100'
      },
      note: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '进度备注'
      },
      log_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '关联的日志ID（来自日志记录时）'
      },
      logged_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '记录时刻'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: '规划进度记录表'
    });

    await queryInterface.addIndex('plan_progress_logs', ['plan_id', 'logged_at'], { name: 'idx_progress_plan_time' });
    await queryInterface.addIndex('plan_progress_logs', ['user_id'], { name: 'idx_progress_user' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('plan_progress_logs');
  }
};
