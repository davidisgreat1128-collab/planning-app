'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
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
        allowNull: false,
        comment: '任务标题'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: '任务详细描述'
      },
      // 四象限优先级（两个布尔值组合）
      is_urgent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否紧急'
      },
      is_important: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否重要'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '任务状态'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: '完成时刻'
      },
      // 时间模式
      is_all_day: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否全天任务（true=全天，false=精确时间）'
      },
      date_type: {
        type: Sequelize.ENUM('single', 'range', 'none'),
        allowNull: false,
        defaultValue: 'single',
        comment: '日期类型：单日/跨天/无日期'
      },
      task_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '任务日期（单日模式）'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '开始日期（跨天模式）'
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '结束日期（跨天模式）'
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true,
        defaultValue: null,
        comment: '开始时间（精确时间模式，用于时间轴）'
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true,
        defaultValue: null,
        comment: '结束时间（精确时间模式）'
      },
      // 重复规则（iCalendar RRULE标准）
      is_recurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否重复任务'
      },
      rrule: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: 'RRULE字符串，如 RRULE:FREQ=WEEKLY;BYDAY=MO'
      },
      rrule_until: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '重复截止日期'
      },
      // 来源追踪
      source_type: {
        type: Sequelize.ENUM('manual', 'from_log', 'from_plan'),
        allowNull: false,
        defaultValue: 'manual',
        comment: '任务来源'
      },
      source_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '来源记录ID（日志ID或规划ID）'
      },
      plan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: 'planning_records', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '所属规划ID（作为子任务时）'
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
      comment: '备忘录任务表'
    });

    await queryInterface.addIndex('tasks', ['user_id'], { name: 'idx_tasks_user_id' });
    await queryInterface.addIndex('tasks', ['user_id', 'task_date'], { name: 'idx_tasks_user_date' });
    await queryInterface.addIndex('tasks', ['user_id', 'start_date', 'end_date'], { name: 'idx_tasks_user_daterange' });
    await queryInterface.addIndex('tasks', ['plan_id'], { name: 'idx_tasks_plan_id' });
    await queryInterface.addIndex('tasks', ['status'], { name: 'idx_tasks_status' });
    await queryInterface.addIndex('tasks', ['deleted_at'], { name: 'idx_tasks_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tasks');
  }
};
