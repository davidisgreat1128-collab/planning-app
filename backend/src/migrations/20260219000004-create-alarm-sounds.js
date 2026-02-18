'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alarm_sounds', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'NULL=系统预置音频，有值=用户自定义录音'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '音频名称'
      },
      type: {
        type: Sequelize.ENUM('preset', 'recorded'),
        allowNull: false,
        defaultValue: 'preset',
        comment: '类型：预置/用户录音'
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: '音频文件存储路径（剪辑后的最终文件）'
      },
      duration_sec: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '音频时长（秒）'
      },
      // 录音剪辑信息
      original_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '原始录音文件路径（剪辑前）'
      },
      trim_start_ms: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: '剪辑起始毫秒'
      },
      trim_end_ms: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '剪辑结束毫秒（NULL=到结尾）'
      },
      // 元数据
      file_size_bytes: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '文件大小（字节）'
      },
      mime_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: '文件MIME类型，如 audio/mp3'
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
      comment: '闹铃音频库'
    });

    await queryInterface.addIndex('alarm_sounds', ['user_id'], { name: 'idx_alarm_sounds_user' });
    await queryInterface.addIndex('alarm_sounds', ['type'], { name: 'idx_alarm_sounds_type' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('alarm_sounds');
  }
};
