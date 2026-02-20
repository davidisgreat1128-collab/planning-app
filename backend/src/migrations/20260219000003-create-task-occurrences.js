'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_occurrences', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      task_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '父任务ID（含RRULE的重复任务）'
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '用户ID（冗余存储，便于查询）'
      },
      occur_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '本次发生日期'
      },
      occur_start_time: {
        type: Sequelize.TIME,
        allowNull: true,
        defaultValue: null,
        comment: '本次发生开始时间（继承父任务）'
      },
      occur_end_time: {
        type: Sequelize.TIME,
        allowNull: true,
        defaultValue: null,
        comment: '本次发生结束时间（继承父任务）'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'skipped'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '本次实例状态'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: '完成时刻'
      },
      // 允许单次修改覆盖父任务的标题/描述
      override_title: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '覆盖标题（仅此实例）'
      },
      override_note: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: '本次实例备注'
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
      comment: '重复任务实例表（预生成近3个月）'
    });

    await queryInterface.addIndex('task_occurrences', ['task_id', 'occur_date'], { name: 'idx_occurrences_task_date' });
    await queryInterface.addIndex('task_occurrences', ['user_id', 'occur_date'], { name: 'idx_occurrences_user_date' });
    await queryInterface.addIndex('task_occurrences', ['status'], { name: 'idx_occurrences_status' });

    // 唯一约束：同一任务同一天只有一个实例
    await queryInterface.addIndex('task_occurrences', ['task_id', 'occur_date'], {
      name: 'uk_occurrence_task_date',
      unique: true
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('task_occurrences');
  }
};
