'use strict';

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

/**
 * User 模型
 *
 * DB表名: users
 * 字段映射: underscored:true（自动 camelCase ↔ snake_case）
 *
 * 关联关系（在 models/index.js 中配置）:
 *   User.hasMany(PlanningRecord, { foreignKey: 'userId', as: 'planningRecords' })
 *   User.hasMany(DivinationRecord, { foreignKey: 'userId', as: 'divinationRecords' })
 */
class User extends Model {
  /**
   * 验证密码（与数据库中的哈希比对）
   * @param {string} plainPassword - 用户输入的明文密码
   * @returns {Promise<boolean>}
   */
  async comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
  }

  /**
   * 返回安全的用户信息（移除敏感字段）
   * @returns {object}
   */
  toSafeJSON() {
    const { passwordHash: _passwordHash, ...safeData } = this.toJSON();
    return safeData;
  }
}

/**
 * 初始化User模型
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof User}
 */
function initUserModel(sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: { name: 'idx_users_email', msg: '该邮箱已被注册' },
        validate: {
          isEmail: { msg: '请输入有效的邮箱地址' },
          notEmpty: { msg: '邮箱不能为空' }
        }
      },
      // 注意: DB列名为 password_hash（由 underscored:true 自动映射）
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: '密码不能为空' }
        }
      },
      nickname: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: { args: [2, 20], msg: '昵称长度需在2-20个字符之间' },
          notEmpty: { msg: '昵称不能为空' }
        }
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
      },
      currentStage: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'qian_long',
        validate: {
          isIn: {
            args: [['qian_long', 'jian_long', 'jun_zi', 'yue_yuan', 'fei_long', 'kang_long']],
            msg: '无效的人生阶段'
          }
        }
      },
      stageScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: '积分不能为负数' }
        }
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user'
      },
      isActive: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 1
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      // underscored:true 已在 database.js 全局配置，此处显式声明保证可读性
      underscored: true,
      timestamps: true,
      paranoid: true, // 软删除：deletedAt 字段
      hooks: {
        /**
         * 保存前自动哈希密码
         * 只在 passwordHash 字段变更时才重新哈希（防止重复哈希）
         */
        beforeSave: async(user) => {
          if (user.changed('passwordHash')) {
            const saltRounds = 12;
            user.passwordHash = await bcrypt.hash(user.passwordHash, saltRounds);
          }
        }
      }
    }
  );

  return User;
}

module.exports = initUserModel;
