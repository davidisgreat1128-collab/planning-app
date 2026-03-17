'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * TaskOverride 任务单日覆盖模型
 *
 * DB表名: task_overrides
 * 关联:
 *   TaskOverride.belongsTo(Task, { foreignKey: 'taskId', as: 'task' })
 *   TaskOverride.belongsTo(User, { foreignKey: 'userId', as: 'user' })
 *
 * 用途: 覆盖重复任务在某一天的属性
 * 原则: NULL字段表示"不覆盖，使用任务规则默认值"
 *
 * 设计理论来源：
 * - docs/02-技术设计/任务系统设计理论/阶段一、重复任务系统设计原则.md（操作1：修改当天）
 * - docs/02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md
 *
 * 使用示例：
 * ```javascript
 * // 场景：用户拖拽3月17日的"每日晨跑"任务到红色象限，选择"仅修改当天"
 * await TaskOverride.create({
 *   taskId: 123,
 *   userId: 1,
 *   overrideDate: '2026-03-17',
 *   isUrgent: true,      // 覆盖紧急性
 *   isImportant: true,   // 覆盖重要性
 *   startTime: null,     // 不覆盖时间，使用任务规则默认值
 *   endTime: null
 * });
 *
 * // 结果：3月17日显示为红色象限，3月18日及之后仍是原象限
 * ```
 */
class TaskOverride extends Model {}

/**
 * 初始化TaskOverride模型
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @returns {typeof TaskOverride}
 */
function initTaskOverrideModel(sequelize) {
  TaskOverride.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        comment: '覆盖记录ID'
      },
      taskId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'task_id',
        validate: {
          notNull: { msg: '任务ID不能为空' },
          isInt: { msg: '任务ID必须是整数' }
        },
        comment: '任务ID'
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'user_id',
        validate: {
          notNull: { msg: '用户ID不能为空' },
          isInt: { msg: '用户ID必须是整数' }
        },
        comment: '用户ID'
      },
      overrideDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'override_date',
        validate: {
          notNull: { msg: '覆盖日期不能为空' },
          isDate: { msg: '覆盖日期格式错误，应为YYYY-MM-DD' }
        },
        comment: '覆盖日期（YYYY-MM-DD）'
      },

      /**
       * 删除标记（最高优先级）
       * true = 该日期不生成实例（阻止实例生成）
       * false = 正常生成实例
       *
       * 设计原则：删除 = 阻止实例生成，而非修改数据
       * 优先级流程：is_deleted（最高）→ 字段覆盖 → 完成记录 → 默认规则
       */
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_deleted',
        comment: '删除标记（true=该日期不生成实例）'
      },

      // ========================================
      // ⭐ 可覆盖的字段（NULL = 不覆盖）
      // ========================================

      /**
       * 覆盖标题
       * NULL = 使用任务规则的默认title
       */
      title: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        validate: {
          len: {
            args: [0, 500],
            msg: '标题长度不能超过500个字符'
          }
        },
        comment: '覆盖标题'
      },

      /**
       * 覆盖描述
       * NULL = 使用任务规则的默认description
       */
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: '覆盖描述'
      },

      /**
       * 覆盖紧急性（四象限）
       * NULL = 使用任务规则的默认isUrgent
       */
      isUrgent: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        field: 'is_urgent',
        comment: '覆盖紧急性（四象限）'
      },

      /**
       * 覆盖重要性（四象限）
       * NULL = 使用任务规则的默认isImportant
       */
      isImportant: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        field: 'is_important',
        comment: '覆盖重要性（四象限）'
      },

      /**
       * 覆盖开始时间
       * NULL = 使用任务规则的默认startTime
       */
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
        field: 'start_time',
        comment: '覆盖开始时间'
      },

      /**
       * 覆盖结束时间
       * NULL = 使用任务规则的默认endTime
       */
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
        field: 'end_time',
        comment: '覆盖结束时间'
      },

      /**
       * 覆盖全天标记
       * NULL = 使用任务规则的默认isAllDay
       */
      isAllDay: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        field: 'is_all_day',
        comment: '覆盖全天标记'
      }
    },
    {
      sequelize,
      modelName: 'TaskOverride',
      tableName: 'task_overrides',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ['task_id', 'override_date'],
          name: 'uk_task_date'
        },
        {
          fields: ['user_id', 'override_date'],
          name: 'idx_user_date'
        },
        {
          fields: ['task_id'],
          name: 'idx_task_id'
        }
      ],
      comment: '任务单日覆盖表'
    }
  );

  return TaskOverride;
}

module.exports = initTaskOverrideModel;
