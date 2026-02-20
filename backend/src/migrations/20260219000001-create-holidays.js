'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holidays', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '节日名称'
      },
      type: {
        type: Sequelize.ENUM('cn_solar', 'cn_lunar', 'western', 'intl', 'solar_term'),
        allowNull: false,
        comment: '节日类型：中国公历/中国农历/西方/国际/节气'
      },
      // 公历节日用（cn_solar / western / intl）
      month: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '公历月（1-12）'
      },
      day: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '公历日（1-31）'
      },
      // 农历节日用（cn_lunar）
      lunar_month: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '农历月（1-12）'
      },
      lunar_day: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        comment: '农历日（1-30）'
      },
      is_leap_month: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否闰月'
      },
      // 特殊规则（如母亲节=5月第2个周日）
      special_rule: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
        comment: '特殊规则描述，如：5月第2个周日'
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: false,
        defaultValue: '#FF4444',
        comment: '节日标记颜色（HEX）'
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: '节日简介'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: '节日与节气静态数据表'
    });

    await queryInterface.addIndex('holidays', ['type'], { name: 'idx_holidays_type' });
    await queryInterface.addIndex('holidays', ['month', 'day'], { name: 'idx_holidays_month_day' });
    await queryInterface.addIndex('holidays', ['lunar_month', 'lunar_day'], { name: 'idx_holidays_lunar' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('holidays');
  }
};
