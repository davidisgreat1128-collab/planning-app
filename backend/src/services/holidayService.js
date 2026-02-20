'use strict';

const { Holiday } = require('../models');
const { Solar, Lunar } = require('lunar-javascript');

/**
 * 节日Service
 * 负责节日数据查询和农历节日的公历日期转换
 */

/**
 * 获取指定年份的所有节日（含农历节日的公历日期转换）
 * @param {number} year - 公历年份
 * @returns {Promise<Array>} 节日列表，每项含 solarDate 字段（YYYY-MM-DD）
 */
async function getHolidaysByYear(year) {
  const holidays = await Holiday.findAll({
    where: { isActive: true },
    order: [['type', 'ASC'], ['month', 'ASC'], ['day', 'ASC']]
  });

  const result = [];

  for (const holiday of holidays) {
    const h = holiday.toJSON();

    if (h.type === 'cn_lunar') {
      // 农历节日：转换为当年公历日期
      try {
        const solarDate = lunarToSolar(year, h.lunarMonth, h.lunarDay, h.isLeapMonth);
        if (solarDate) {
          result.push({ ...h, solarDate });
        }
      } catch {
        // 某些年份农历闰月不存在，跳过
      }
    } else if (h.type === 'solar_term') {
      // 节气：用农历库计算当年节气公历日期
      const solarDate = getSolarTermDate(year, h.name);
      if (solarDate) {
        result.push({ ...h, solarDate });
      }
    } else if (h.specialRule) {
      // 特殊规则（如母亲节=5月第2个周日）
      const solarDate = calcSpecialRuleDate(year, h.specialRule);
      if (solarDate) {
        result.push({ ...h, solarDate });
      }
    } else if (h.month && h.day) {
      // 普通公历节日（固定月日）
      const solarDate = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
      result.push({ ...h, solarDate });
    }
  }

  // 按公历日期排序
  result.sort((a, b) => (a.solarDate > b.solarDate ? 1 : -1));
  return result;
}

/**
 * 获取指定月份的节日（用于月历显示）
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {Promise<Object>} key=YYYY-MM-DD, value=节日信息数组
 */
async function getHolidaysByMonth(year, month) {
  const allHolidays = await getHolidaysByYear(year);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const map = {};
  for (const h of allHolidays) {
    if (h.solarDate && h.solarDate.startsWith(monthStr)) {
      if (!map[h.solarDate]) map[h.solarDate] = [];
      map[h.solarDate].push(h);
    }
  }
  return map;
}

/**
 * 获取指定日期范围内的节日（用于周历）
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Object>} key=YYYY-MM-DD, value=节日信息数组
 */
async function getHolidaysByRange(startDate, endDate) {
  const startYear = parseInt(startDate.substring(0, 4));
  const endYear = parseInt(endDate.substring(0, 4));

  let allHolidays = [];
  for (let y = startYear; y <= endYear; y++) {
    const yearly = await getHolidaysByYear(y);
    allHolidays = allHolidays.concat(yearly);
  }

  const map = {};
  for (const h of allHolidays) {
    if (h.solarDate && h.solarDate >= startDate && h.solarDate <= endDate) {
      if (!map[h.solarDate]) map[h.solarDate] = [];
      map[h.solarDate].push(h);
    }
  }
  return map;
}

/**
 * 获取指定公历日期的农历信息
 * @param {string} date - YYYY-MM-DD
 * @returns {{ lunarYear: number, lunarMonth: number, lunarDay: number, lunarDayName: string, lunarMonthName: string, isLeapMonth: boolean }}
 */
function getLunarInfo(date) {
  const [year, month, day] = date.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  // lunar-javascript 约定：闰月的 getMonth() 返回负数（如闰二月返回 -2）
  const rawMonth = lunar.getMonth();
  const isLeapMonth = rawMonth < 0;

  return {
    lunarYear: lunar.getYear(),
    lunarMonth: Math.abs(rawMonth),
    lunarDay: lunar.getDay(),
    lunarDayName: lunar.getDayInChinese(),     // 如"初一"、"十五"
    lunarMonthName: lunar.getMonthInChinese(), // 如"正月"、"腊月"
    isLeapMonth,
    yearInGanZhi: lunar.getYearInGanZhi(),     // 如"丙午"
    zodiac: lunar.getYearShengXiao()            // 生肖
  };
}

/**
 * 批量获取日期范围内每天的农历信息（用于月历渲染）
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Object} key=YYYY-MM-DD, value=农历信息
 */
function getLunarInfoRange(startDate, endDate) {
  const map = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = cur.toISOString().split('T')[0];
    map[dateStr] = getLunarInfo(dateStr);
    cur.setDate(cur.getDate() + 1);
  }
  return map;
}

// ============================================================
// 内部工具函数
// ============================================================

/**
 * 农历日期转公历日期
 * @param {number} year - 公历年
 * @param {number} lunarMonth - 农历月
 * @param {number} lunarDay - 农历日
 * @param {boolean} isLeap - 是否闰月
 * @returns {string|null} YYYY-MM-DD 或 null
 */
function lunarToSolar(year, lunarMonth, lunarDay, _isLeap = false) {
  try {
    // 先找该公历年对应的农历年（春节前后可能跨年）
    // 尝试当年农历
    const lunar = Lunar.fromYmd(year, lunarMonth, lunarDay);
    const solar = lunar.getSolar();
    // 验证转换结果的公历年是否接近目标年（允许差1年，因为农历年和公历年不完全对齐）
    if (Math.abs(solar.getYear() - year) <= 1) {
      return `${solar.getYear()}-${String(solar.getMonth()).padStart(2, '0')}-${String(solar.getDay()).padStart(2, '0')}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 计算24节气的公历日期
 * @param {number} year
 * @param {string} termName - 节气名，如"立春"
 * @returns {string|null} YYYY-MM-DD
 */
function getSolarTermDate(year, termName) {
  try {
    // lunar-javascript 提供节气查询
    const solar = Solar.fromYmd(year, 1, 1);
    const lunar = solar.getLunar();
    // 遍历该年的节气列表
    const terms = lunar.getJieQiTable ? lunar.getJieQiTable() : null;
    if (terms && terms[termName]) {
      const s = terms[termName];
      return `${s.getYear()}-${String(s.getMonth()).padStart(2, '0')}-${String(s.getDay()).padStart(2, '0')}`;
    }
    // 备用：直接从年份计算节气（使用Solar类）
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        try {
          const s = Solar.fromYmd(year, m, d);
          const jieQi = s.getLunar().getJieQi();
          if (jieQi === termName) {
            return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
        } catch { continue; }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 计算特殊规则节日的公历日期
 * 规则格式："5月第2个周日" / "6月第3个周日"
 * @param {number} year
 * @param {string} rule
 * @returns {string|null}
 */
function calcSpecialRuleDate(year, rule) {
  // 解析规则，如 "5月第2个周日"
  const match = rule.match(/(\d+)月第(\d+)个(周[一二三四五六日])/);
  if (!match) return null;

  const month = parseInt(match[1]);
  const nth = parseInt(match[2]);
  const weekdayMap = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0 };
  const targetWeekday = weekdayMap[match[3]];

  // 找该月第nth个目标星期几
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() === targetWeekday) {
      count++;
      if (count === nth) {
        return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

module.exports = {
  getHolidaysByYear,
  getHolidaysByMonth,
  getHolidaysByRange,
  getLunarInfo,
  getLunarInfoRange
};
