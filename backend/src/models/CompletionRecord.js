/**
 * 任务完成记录模型
 * 文件位置: backend/src/models/CompletionRecord.js
 */

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CompletionRecord extends Model {
    /**
     * 获取安全的JSON格式（隐藏敏感字段）
     * @returns {object} 安全的JSON对象
     */
    toSafeJSON() {
      const json = this.toJSON();
      return json;
    }

    /**
     * 检查所有子任务是否完成
     * @returns {boolean} 是否所有子任务都已完成
     */
    areAllSubtasksCompleted() {
      if (!this.subtaskCompletion || typeof this.subtaskCompletion !== 'object') {
        return false;
      }
      const subtaskIds = Object.keys(this.subtaskCompletion);
      if (subtaskIds.length === 0) return false;

      return subtaskIds.every(id => this.subtaskCompletion[id]?.isDone === true);
    }
  }

  CompletionRecord.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        comment: '完成记录ID'
      },
      taskId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'task_id',
        comment: '任务ID'
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'user_id',
        comment: '用户ID'
      },
      completionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'completion_date',
        comment: '完成日期（YYYY-MM-DD）'
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'skipped'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '任务状态'
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
        comment: '实际完成时间'
      },
      subtaskCompletion: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'subtask_completion',
        comment: '子任务完成状态JSON',
        get() {
          const rawValue = this.getDataValue('subtaskCompletion');
          if (!rawValue) return {};
          // 如果是字符串，解析为对象
          if (typeof rawValue === 'string') {
            try {
              return JSON.parse(rawValue);
            } catch (e) {
              return {};
            }
          }
          return rawValue;
        }
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '用户备注'
      }
    },
    {
      sequelize,
      modelName: 'CompletionRecord',
      tableName: 'task_completion_records',
      underscored: true,
      timestamps: true,
      paranoid: false, // 完成记录不需要软删除
      indexes: [
        {
          unique: true,
          fields: ['task_id', 'completion_date'],
          name: 'uk_task_date'
        },
        {
          fields: ['user_id', 'completion_date'],
          name: 'idx_user_date'
        },
        {
          fields: ['task_id'],
          name: 'idx_task_id'
        },
        {
          fields: ['completion_date'],
          name: 'idx_completion_date'
        }
      ]
    }
  );

  return CompletionRecord;
};
