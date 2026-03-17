'use strict';

const { DataTypes, Model } = require('sequelize');
const { TASK_STATUS, TASK_DATE_TYPE, TASK_SOURCE_TYPE } = require('../config/constants');

const TASK_STATUS_VALUES = Object.values(TASK_STATUS);
const TASK_DATE_TYPE_VALUES = Object.values(TASK_DATE_TYPE);
const TASK_SOURCE_TYPE_VALUES = Object.values(TASK_SOURCE_TYPE);

/**
 * Task 备忘录任务模型
 *
 * DB表名: tasks
 * 关联:
 *   Task.belongsTo(User, { foreignKey: 'userId', as: 'user' })
 *   Task.belongsTo(PlanningRecord, { foreignKey: 'planId', as: 'plan' })
 *   Task.hasMany(TaskOccurrence, { foreignKey: 'taskId', as: 'occurrences' })
 *   Task.hasMany(Alarm, { foreignKey: 'taskId', as: 'alarms' })
 *
 * 四象限优先级由 isUrgent + isImportant 两个布尔值组合：
 *   true  + true  = 红色，危机象限（立即做）
 *   true  + false = 黄色，无益象限（快速做）
 *   false + true  = 蓝色，规划象限（持续做）
 *   false + false = 绿色，琐事象限（减少做）
 *   status=completed → 前端显示灰色 + 删除线
 */
class Task extends Model {
  /**
   * 获取四象限分类名称
   */
  getQuadrant() {
    if (this.isUrgent && this.isImportant) return 'crisis';       // 危机象限
    if (this.isUrgent && !this.isImportant) return 'trivial';     // 无益象限
    if (!this.isUrgent && this.isImportant) return 'planning';    // 规划象限
    return 'eliminate';                                             // 琐事象限
  }
}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Task}
 */
function initTaskModel(sequelize) {
  Task.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { notNull: { msg: '用户ID不能为空' } }
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          notEmpty: { msg: '任务标题不能为空' },
          len: { args: [1, 500], msg: '标题长度需在1-500字符之间' }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      // 四象限
      isUrgent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isImportant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM(...TASK_STATUS_VALUES),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: { args: [TASK_STATUS_VALUES], msg: '无效的任务状态' }
        }
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      // 时间模式
      isAllDay: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      dateType: {
        type: DataTypes.ENUM(...TASK_DATE_TYPE_VALUES),
        allowNull: false,
        defaultValue: 'single',
        validate: {
          isIn: { args: [TASK_DATE_TYPE_VALUES], msg: '无效的日期类型' }
        }
      },
      taskDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null
      },
      // 重复规则
      isRecurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      rrule: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      rruleUntil: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      exdate: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: '例外日期JSON数组（如\'["2026-03-20","2026-04-15"]\'）⭐ RRULE架构（2026-03-17）',
        get() {
          const rawValue = this.getDataValue('exdate');
          if (!rawValue) return [];
          try {
            // ⭐ 解析JSON数组格式
            const parsed = JSON.parse(rawValue);
            if (!Array.isArray(parsed)) return [];

            // ⭐⭐ 过滤掉损坏的EXDATE元素（如"[]"空数组字符串）
            // 正常的EXDATE元素应该是日期字符串（如"2026-03-20"）
            // 损坏的数据可能是："[]", "", null等
            const validDates = parsed.filter(item => {
              if (typeof item !== 'string') return false;
              if (item.length === 0) return false;
              if (item === '[]') return false;  // 过滤空数组字符串
              // 验证是否是有效的日期格式（YYYY-MM-DD）
              return /^\d{4}-\d{2}-\d{2}$/.test(item);
            });

            return validDates;
          } catch (err) {
            console.error('[Task Model] exdate JSON解析失败:', rawValue, err);
            return [];
          }
        },
        set(value) {
          if (!value || value.length === 0) {
            this.setDataValue('exdate', null);
          } else if (Array.isArray(value)) {
            // ⭐ 数组转为JSON字符串
            this.setDataValue('exdate', JSON.stringify(value));
          } else if (typeof value === 'string') {
            // ⭐ 如果是JSON字符串，验证后直接存储
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                this.setDataValue('exdate', value);
              } else {
                this.setDataValue('exdate', null);
              }
            } catch (err) {
              this.setDataValue('exdate', null);
            }
          } else {
            this.setDataValue('exdate', null);
          }
        }
      },
      // 来源追踪
      sourceType: {
        type: DataTypes.ENUM(...TASK_SOURCE_TYPE_VALUES),
        allowNull: false,
        defaultValue: 'manual',
        validate: {
          isIn: { args: [TASK_SOURCE_TYPE_VALUES], msg: '无效的任务来源' }
        }
      },
      sourceId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      planId: {
        type: DataTypes.STRING(50),  // 修改：前端规划ID是字符串类型
        allowNull: true,
        defaultValue: null,
        comment: '关联规划ID（前端localStorage存储，字符串类型）'
      },
      // 分类ID（关联用户创建的分类）
      categoryId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: '任务所属分类ID（前端localStorage存储的分类ID）'
      },
      // 子任务列表（JSON格式）
      subtasks: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: '子任务数组，格式: [{"title": "子任务1", "done": false}]'
      }
    },
    {
      sequelize,
      modelName: 'Task',
      tableName: 'tasks',
      underscored: true,
      timestamps: true,
      paranoid: true  // 软删除
    }
  );

  return Task;
}

module.exports = initTaskModel;
