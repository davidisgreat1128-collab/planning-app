'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: '登录邮箱'
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'bcrypt哈希密码，禁止存明文'
      },
      nickname: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '用户昵称'
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '头像URL'
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: '出生日期，用于人生阶段计算'
      },
      current_stage: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'qian_long',
        comment: '当前易经人生阶段'
      },
      stage_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '阶段积分'
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
        comment: '用户角色'
      },
      is_active: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1,
        comment: '账号是否激活'
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: '最后登录时间'
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
      comment: '用户表'
    });

    // 创建索引
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });
    await queryInterface.addIndex('users', ['current_stage'], {
      name: 'idx_users_current_stage'
    });
    await queryInterface.addIndex('users', ['deleted_at'], {
      name: 'idx_users_deleted_at'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};
