'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('planning_records', {
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
      type: {
        type: Sequelize.ENUM('life', 'career', 'project', 'mood', 'health', 'time', 'habit'),
        allowNull: false,
        comment: '规划类型：人生/职业/项目/情绪/健康/时间/习惯'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '规划标题'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: '规划详细内容'
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'paused', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
        comment: '规划状态'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '开始日期'
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '结束日期'
      },
      target_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: '目标分值'
      },
      current_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '当前分值'
      },
      related_stage: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: '关联的人生阶段'
      },
      iching_advice: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: '易经建议（JSON字符串）'
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
      comment: '规划记录表'
    });

    // 创建索引
    await queryInterface.addIndex('planning_records', ['user_id'], {
      name: 'idx_planning_user_id'
    });
    await queryInterface.addIndex('planning_records', ['user_id', 'type'], {
      name: 'idx_planning_user_type'
    });
    await queryInterface.addIndex('planning_records', ['status'], {
      name: 'idx_planning_status'
    });
    await queryInterface.addIndex('planning_records', ['deleted_at'], {
      name: 'idx_planning_deleted_at'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('planning_records');
  }
};
