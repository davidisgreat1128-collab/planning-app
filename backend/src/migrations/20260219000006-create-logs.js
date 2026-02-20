'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '所属用户ID'
      },
      title: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '日志标题（可选）'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '日志正文（心得/灵感/事件记录）'
      },
      log_type: {
        type: Sequelize.ENUM('note', 'inspiration', 'event', 'plan_update'),
        allowNull: false,
        defaultValue: 'note',
        comment: '日志类型：心得/灵感/事件/规划进度'
      },
      mood_level: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '情绪评分 1-5（可选）'
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: '标签列表，如 ["灵感","工作","读书"]'
      },
      // 时间（精确到分）
      log_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '记录时刻（精确到分，用于时间轴排序）'
      },
      log_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '所属日期（冗余，方便按天查询）'
      },
      // 关联关系
      plan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: 'planning_records', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '关联的规划ID'
      },
      task_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: 'tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '关联的任务ID'
      },
      // 日志转任务
      converted_to_task: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否已转化为任务'
      },
      converted_task_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '转化后的任务ID'
      },
      // 媒体附件
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: '附件路径列表（图片/语音）'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: '日志表（心得/灵感/事件记录，精确到分排序）'
    });

    await queryInterface.addIndex('logs', ['user_id', 'log_time'], { name: 'idx_logs_user_time' });
    await queryInterface.addIndex('logs', ['user_id', 'log_date'], { name: 'idx_logs_user_date' });
    await queryInterface.addIndex('logs', ['plan_id'], { name: 'idx_logs_plan' });
    await queryInterface.addIndex('logs', ['log_type'], { name: 'idx_logs_type' });
    await queryInterface.addIndex('logs', ['deleted_at'], { name: 'idx_logs_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('logs');
  }
};
