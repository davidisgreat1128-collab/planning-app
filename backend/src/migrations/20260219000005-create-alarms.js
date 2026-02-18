'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alarms', {
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
      task_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: 'tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '绑定的任务ID（NULL=独立闹铃）'
      },
      sound_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: 'alarm_sounds', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '使用的闹铃音频（NULL=系统默认）'
      },
      label: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: null,
        comment: '闹铃标签/说明'
      },
      // 提醒时间
      alarm_time: {
        type: Sequelize.TIME,
        allowNull: false,
        comment: '闹铃时间（几点几分）'
      },
      alarm_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '闹铃日期（非重复时指定具体日期）'
      },
      // 提前提醒
      remind_before_min: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '提前N分钟提醒（0=准时）'
      },
      // 重复规则
      repeat_type: {
        type: Sequelize.ENUM('none', 'daily', 'weekly', 'custom'),
        allowNull: false,
        defaultValue: 'none',
        comment: '重复类型'
      },
      rrule: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '自定义RRULE（repeat_type=custom时）'
      },
      repeat_days: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
        comment: '重复的星期几，如 1,3,5 代表周一周三周五'
      },
      // 提醒方式
      notify_inapp: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'App内通知'
      },
      notify_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '系统推送通知'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      },
      last_triggered_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: '上次触发时间'
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
      comment: '闹铃配置表'
    });

    await queryInterface.addIndex('alarms', ['user_id'], { name: 'idx_alarms_user' });
    await queryInterface.addIndex('alarms', ['task_id'], { name: 'idx_alarms_task' });
    await queryInterface.addIndex('alarms', ['user_id', 'alarm_date', 'alarm_time'], { name: 'idx_alarms_datetime' });
    await queryInterface.addIndex('alarms', ['is_active'], { name: 'idx_alarms_active' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('alarms');
  }
};
