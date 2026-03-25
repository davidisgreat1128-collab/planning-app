'use strict';

/**
 * Migration: 创建任务完成记录表
 *
 * 目的：为重复任务提供完成记录追踪功能
 * 背景：
 * - 之前使用原始SQL文件创建（database/migrations/create-task-completion-records.sql）
 * - 但该SQL不会被Sequelize CLI自动执行
 * - 导致Docker容器重启后表丢失
 *
 * 解决方案：
 * - 转换为标准的Sequelize Migration格式
 * - 确保Docker容器启动时自动创建表
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-25（补充创建，对应2026-03-15的CompletionRecord Model）
 */

module.exports = {
  /**
   * 创建 task_completion_records 表
   */
  async up(queryInterface, Sequelize) {
    // 检查表是否已存在（兼容不同环境）
    const [results] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'task_completion_records';"
    );

    if (results.length === 0) {
      // 表不存在，创建表
      await queryInterface.createTable('task_completion_records', {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          comment: '完成记录ID'
        },
        task_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          comment: '任务ID',
          references: {
            model: 'tasks',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          comment: '用户ID',
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        completion_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: '完成日期（YYYY-MM-DD）'
        },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'skipped'),
          allowNull: false,
          defaultValue: 'pending',
          comment: '任务状态'
        },
        completed_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: '实际完成时间'
        },
        subtask_completion: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: '子任务完成状态JSON'
        },
        note: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: '用户备注'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: '创建时间'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: '更新时间'
        }
      }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        comment: '任务完成记录表'
      });

      // 添加唯一索引（任务ID + 完成日期）
      await queryInterface.addIndex('task_completion_records', ['task_id', 'completion_date'], {
        name: 'uk_task_date',
        unique: true
      });

      // 添加普通索引
      await queryInterface.addIndex('task_completion_records', ['user_id', 'completion_date'], {
        name: 'idx_user_date'
      });

      await queryInterface.addIndex('task_completion_records', ['task_id'], {
        name: 'idx_task_id'
      });

      await queryInterface.addIndex('task_completion_records', ['completion_date'], {
        name: 'idx_completion_date'
      });

      console.log('✅ task_completion_records表创建成功');
    } else {
      console.log('⚠️ task_completion_records表已存在，跳过创建');
    }
  },

  /**
   * 回滚：删除 task_completion_records 表
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('task_completion_records');
    console.log('✅ 已删除task_completion_records表');
  }
};
