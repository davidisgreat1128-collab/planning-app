'use strict';

/**
 * Migration: 给tasks表添加exdate字段
 *
 * 目的：修复生产环境缺失exdate字段导致的500错误
 * 问题：Model中定义了exdate字段，但数据库中不存在
 * 错误：Unknown column 'exdate' in 'field list'
 *
 * exdate字段说明：
 * - 存储RRULE排除日期的JSON数组
 * - 格式：["2026-03-20","2026-04-15"]
 * - 用于重复任务排除特定日期
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-23
 */

module.exports = {
  /**
   * 添加exdate字段
   */
  async up(queryInterface, Sequelize) {
    // 检查字段是否已存在（兼容不同环境）
    const [results] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM `tasks` LIKE 'exdate';"
    );

    if (results.length === 0) {
      // 字段不存在，添加字段
      await queryInterface.addColumn('tasks', 'exdate', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'RRULE排除日期JSON数组（如\'["2026-03-20","2026-04-15"]\'）',
        after: 'rrule_until' // 放在rrule_until后面
      });

      console.log('✅ tasks表添加exdate字段成功');
    } else {
      console.log('⚠️ exdate字段已存在，跳过添加');
    }
  },

  /**
   * 回滚：删除exdate字段
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tasks', 'exdate');
    console.log('✅ 已回滚exdate字段');
  }
};
