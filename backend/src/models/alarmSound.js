'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * AlarmSound 闹铃音频模型
 *
 * DB表名: alarm_sounds
 * 分两类：
 *   type='preset'   → 系统预置音频（user_id=NULL）
 *   type='recorded' → 用户录音（user_id=用户ID）
 *
 * 录音剪辑流程：
 *   录音 → original_path（原始）→ 剪辑(trim_start_ms~trim_end_ms) → file_path（成品）
 */
class AlarmSound extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof AlarmSound}
 */
function initAlarmSoundModel(sequelize) {
  AlarmSound.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null  // NULL=系统预置
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: '音频名称不能为空' }
        }
      },
      type: {
        type: DataTypes.ENUM('preset', 'recorded'),
        allowNull: false,
        defaultValue: 'preset'
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          notEmpty: { msg: '文件路径不能为空' }
        }
      },
      durationSec: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: '时长不能为负数' }
        }
      },
      // 录音剪辑
      originalPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      trimStartMs: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      trimEndMs: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      // 元数据
      fileSizeBytes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
      },
      mimeType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'AlarmSound',
      tableName: 'alarm_sounds',
      underscored: true,
      timestamps: true,
      paranoid: true  // 软删除
    }
  );

  return AlarmSound;
}

module.exports = initAlarmSoundModel;
