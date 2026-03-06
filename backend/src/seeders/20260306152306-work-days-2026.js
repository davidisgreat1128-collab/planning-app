'use strict';

/**
 * 2026年中国法定节假日及调休安排种子数据
 *
 * 数据来源：国务院办公厅关于2026年部分节假日安排的通知
 * 发布日期：2025年11月4日
 *
 * 说明：
 *   - type='holiday': 法定假日（日历显示"休"）
 *   - type='workday': 调休补班（日历显示"班"）
 */
module.exports = {
  async up(queryInterface) {
    const workDays = [
      // ============================================================
      // 元旦（1月1日-3日放假，1月4日周日补班）
      // ============================================================
      { date: '2026-01-01', type: 'holiday', year: 2026, holiday_name: '元旦', remark: '法定假日' },
      { date: '2026-01-02', type: 'holiday', year: 2026, holiday_name: '元旦', remark: '法定假日' },
      { date: '2026-01-03', type: 'holiday', year: 2026, holiday_name: '元旦', remark: '法定假日' },
      { date: '2026-01-04', type: 'workday', year: 2026, holiday_name: '元旦', remark: '调休补班（周日上班）' },

      // ============================================================
      // 春节（2月15日-23日放假，2月14日和2月28日补班）
      // ============================================================
      { date: '2026-02-14', type: 'workday', year: 2026, holiday_name: '春节', remark: '调休补班（周六上班）' },
      { date: '2026-02-15', type: 'holiday', year: 2026, holiday_name: '春节', remark: '除夕前一天' },
      { date: '2026-02-16', type: 'holiday', year: 2026, holiday_name: '春节', remark: '除夕' },
      { date: '2026-02-17', type: 'holiday', year: 2026, holiday_name: '春节', remark: '正月初一' },
      { date: '2026-02-18', type: 'holiday', year: 2026, holiday_name: '春节', remark: '正月初二' },
      { date: '2026-02-19', type: 'holiday', year: 2026, holiday_name: '春节', remark: '正月初三' },
      { date: '2026-02-20', type: 'holiday', year: 2026, holiday_name: '春节', remark: '正月初四' },
      { date: '2026-02-21', type: 'holiday', year: 2026, holiday_name: '春节', remark: '正月初五' },
      { date: '2026-02-22', type: 'holiday', year: 2026, holiday_name: '春节', remark: '正月初六' },
      { date: '2026-02-23', type: 'holiday', year: 2026, holiday_name: '春节', remark: '正月初七' },
      { date: '2026-02-28', type: 'workday', year: 2026, holiday_name: '春节', remark: '调休补班（周六上班）' },

      // ============================================================
      // 清明节（4月4日-6日放假，无调休）
      // ============================================================
      { date: '2026-04-04', type: 'holiday', year: 2026, holiday_name: '清明节', remark: '法定假日' },
      { date: '2026-04-05', type: 'holiday', year: 2026, holiday_name: '清明节', remark: '法定假日' },
      { date: '2026-04-06', type: 'holiday', year: 2026, holiday_name: '清明节', remark: '法定假日' },

      // ============================================================
      // 劳动节（5月1日-5日放假，5月9日周六补班）
      // ============================================================
      { date: '2026-05-01', type: 'holiday', year: 2026, holiday_name: '劳动节', remark: '法定假日' },
      { date: '2026-05-02', type: 'holiday', year: 2026, holiday_name: '劳动节', remark: '法定假日' },
      { date: '2026-05-03', type: 'holiday', year: 2026, holiday_name: '劳动节', remark: '法定假日' },
      { date: '2026-05-04', type: 'holiday', year: 2026, holiday_name: '劳动节', remark: '法定假日' },
      { date: '2026-05-05', type: 'holiday', year: 2026, holiday_name: '劳动节', remark: '法定假日' },
      { date: '2026-05-09', type: 'workday', year: 2026, holiday_name: '劳动节', remark: '调休补班（周六上班）' },

      // ============================================================
      // 端午节（6月19日-21日放假，无调休）
      // ============================================================
      { date: '2026-06-19', type: 'holiday', year: 2026, holiday_name: '端午节', remark: '法定假日' },
      { date: '2026-06-20', type: 'holiday', year: 2026, holiday_name: '端午节', remark: '法定假日' },
      { date: '2026-06-21', type: 'holiday', year: 2026, holiday_name: '端午节', remark: '法定假日' },

      // ============================================================
      // 中秋节（9月25日-27日放假，无调休）
      // ============================================================
      { date: '2026-09-20', type: 'workday', year: 2026, holiday_name: '国庆节', remark: '调休补班（周日上班）' },
      { date: '2026-09-25', type: 'holiday', year: 2026, holiday_name: '中秋节', remark: '法定假日' },
      { date: '2026-09-26', type: 'holiday', year: 2026, holiday_name: '中秋节', remark: '法定假日' },
      { date: '2026-09-27', type: 'holiday', year: 2026, holiday_name: '中秋节', remark: '法定假日' },

      // ============================================================
      // 国庆节（10月1日-7日放假，9月20日和10月10日补班）
      // ============================================================
      { date: '2026-10-01', type: 'holiday', year: 2026, holiday_name: '国庆节', remark: '法定假日' },
      { date: '2026-10-02', type: 'holiday', year: 2026, holiday_name: '国庆节', remark: '法定假日' },
      { date: '2026-10-03', type: 'holiday', year: 2026, holiday_name: '国庆节', remark: '法定假日' },
      { date: '2026-10-04', type: 'holiday', year: 2026, holiday_name: '国庆节', remark: '法定假日' },
      { date: '2026-10-05', type: 'holiday', year: 2026, holiday_name: '国庆节', remark: '法定假日' },
      { date: '2026-10-06', type: 'holiday', year: 2026, holiday_name: '国庆节', remark: '法定假日' },
      { date: '2026-10-07', type: 'holiday', year: 2026, holiday_name: '国庆节', remark: '法定假日' },
      { date: '2026-10-10', type: 'workday', year: 2026, holiday_name: '国庆节', remark: '调休补班（周六上班）' }
    ];

    await queryInterface.bulkInsert('work_days', workDays, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('work_days', { year: 2026 }, {});
  }
};
