'use strict';

/**
 * Migration: 创建task_overrides表（任务单日覆盖表）
 *
 * 目的：实现阶段一"修改当天"操作（操作1）
 * 原理：存储重复任务在某一天的覆盖字段，NULL字段表示不覆盖（使用任务规则默认值）
 *
 * 关联文档：
 * - docs/02-技术设计/任务系统设计理论/阶段一、重复任务系统设计原则.md
 * - docs/02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-16
 */

module.exports = {
  /**
   * 创建task_overrides表
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_overrides', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        comment: '覆盖记录ID'
      },
      task_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '任务ID',
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '用户ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      override_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '覆盖日期（YYYY-MM-DD）'
      },

      // ⭐ 可覆盖的字段（NULL表示不覆盖，使用任务规则默认值）
      title: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '覆盖标题'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: '覆盖描述'
      },
      is_urgent: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: '覆盖紧急性（四象限）'
      },
      is_important: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: '覆盖重要性（四象限）'
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true,
        defaultValue: null,
        comment: '覆盖开始时间'
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true,
        defaultValue: null,
        comment: '覆盖结束时间'
      },
      is_all_day: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: '覆盖全天标记'
      },

      // 元数据
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '更新时间'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: '任务单日覆盖表'
    });

    // 创建唯一索引：同一任务同一天只能有一条覆盖记录
    await queryInterface.addIndex('task_overrides', ['task_id', 'override_date'], {
      unique: true,
      name: 'uk_task_date',
      comment: '同一任务同一天只能有一条覆盖记录'
    });

    // 创建索引：按用户和日期查询
    await queryInterface.addIndex('task_overrides', ['user_id', 'override_date'], {
      name: 'idx_user_date',
      comment: '按用户和日期查询'
    });

    // 创建索引：按任务ID查询（用于查询某任务的所有覆盖记录）
    await queryInterface.addIndex('task_overrides', ['task_id'], {
      name: 'idx_task_id',
      comment: '按任务ID查询覆盖记录'
    });
  },

  /**
   * 回滚：删除task_overrides表
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('task_overrides');
  }
};
