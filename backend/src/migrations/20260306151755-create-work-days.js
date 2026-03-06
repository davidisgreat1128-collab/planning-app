'use strict';

/**
 * 创建 work_days 表
 *
 * 用途：存储中国法定节假日的工作日调整数据（调休/补班）
 * 示例：
 *   - 2026-01-01 → type='holiday', 备注'元旦'
 *   - 2026-01-04 → type='workday', 备注'元旦调休补班'
 *   - 2026-02-15 → type='holiday', 备注'春节'
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_days', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      date: {
        type: Sequelize.DATEONLY, // YYYY-MM-DD
        allowNull: false,
        unique: true,
        comment: '日期（YYYY-MM-DD）'
      },
      type: {
        type: Sequelize.ENUM('holiday', 'workday'),
        allowNull: false,
        comment: 'holiday=法定假日（休）, workday=调休补班（班）'
      },
      year: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
        comment: '年份（方便按年查询）'
      },
      holiday_name: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '所属节假日名称（如：元旦、春节、国庆节）'
      },
      remark: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: '备注说明'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: '工作日调整表（法定节假日及调休补班）'
    });

    // 索引
    await queryInterface.addIndex('work_days', ['year'], {
      name: 'idx_work_days_year'
    });

    await queryInterface.addIndex('work_days', ['date', 'type'], {
      name: 'idx_work_days_date_type'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('work_days');
  }
};
