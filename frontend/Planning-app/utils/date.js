/**
 * 日期工具函数
 *
 * 职责:
 * - 提供纯函数的日期计算逻辑
 * - 日期格式化、解析
 * - 周数计算、月份计算
 * - 可单独导入,可单元测试
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-05
 */

// ============================================================
// 日期格式化
// ============================================================

/**
 * 格式化日期为 YYYY-MM-DD
 *
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} YYYY-MM-DD 格式
 *
 * @example
 * formatDate(new Date())  // '2026-03-05'
 * formatDate('2026/03/05')  // '2026-03-05'
 * formatDate(1709654400000)  // '2026-03-05'
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 格式化日期为 YYYY年MM月DD日
 *
 * @param {Date|string|number} date - 日期
 * @returns {string} 中文格式
 */
export function formatDateCN(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}年${m}月${day}日`;
}

/**
 * 格式化时间为 HH:MM
 *
 * @param {Date|string} time - 时间对象或字符串 (HH:MM 或 HH:MM:SS)
 * @returns {string} HH:MM 格式
 */
export function formatTime(time) {
  if (typeof time === 'string') {
    // 已经是字符串,提取前5位
    return time.substring(0, 5);
  }
  const d = new Date(time);
  if (isNaN(d.getTime())) {
    return '';
  }
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:MM:SS
 *
 * @param {Date|string|number} datetime - 日期时间
 * @returns {string} 完整格式
 */
export function formatDateTime(datetime) {
  const d = new Date(datetime);
  if (isNaN(d.getTime())) {
    return '';
  }
  const date = formatDate(d);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${date} ${h}:${m}:${s}`;
}

// ============================================================
// 日期解析
// ============================================================

/**
 * 解析日期字符串为 Date 对象
 *
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD 或 YYYY/MM/DD)
 * @returns {Date|null} Date 对象或 null
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  // 统一替换为 - 分隔符
  const normalized = dateStr.replace(/\//g, '-');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

// ============================================================
// 周数计算
// ============================================================

/**
 * 获取给定日期所在周的周一
 * JS: getDay() 0=周日 1=周一 ... 6=周六
 *
 * @param {Date|string} date - 日期
 * @returns {Date} 周一的日期对象
 *
 * @example
 * getWeekMonday('2026-03-05')  // 2026-03-02 (周一)
 */
export function getWeekMonday(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  const dow = d.getDay(); // 0=周日
  // 距周一的偏移:周日=-6,周一=0,周二=-1...
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取某周的所有日期 (周一~周日)
 *
 * @param {Date|string} date - 周内任意日期
 * @returns {Array<string>} 7个日期字符串 YYYY-MM-DD
 */
export function getWeekDates(date) {
  const monday = getWeekMonday(date);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

/**
 * 获取两个日期之间相差的天数
 *
 * @param {Date|string} date1 - 开始日期
 * @param {Date|string} date2 - 结束日期
 * @returns {number} 天数差值
 */
export function getDaysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================
// 月份计算
// ============================================================

/**
 * 获取某月1号
 *
 * @param {Date|string} date - 日期
 * @returns {Date} 该月1号的日期对象
 */
export function getMonthFirst(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取某月的最后一天
 *
 * @param {Date|string} date - 日期
 * @returns {Date} 该月最后一天的日期对象
 */
export function getMonthLast(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  d.setMonth(d.getMonth() + 1);
  d.setDate(0); // 设置为下个月的第0天,即本月最后一天
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * 获取某月有多少天
 *
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {number} 天数
 */
export function getMonthDays(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * 获取某月的所有日期 (6行7列网格,42格)
 * 从本月1号所在周的周一开始
 *
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {Array<Array<object>>} 6行7列的二维数组
 *
 * @example
 * getMonthDates(2026, 3)
 * // [
 * //   [{ dateStr: '2026-02-23', day: 23, otherMonth: true }, ...],
 * //   ...
 * // ]
 */
export function getMonthDates(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const gridStart = getWeekMonday(firstDay);

  const rows = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + r * 7 + c);
      const dateStr = formatDate(d);
      row.push({
        dateStr,
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        otherMonth: d.getMonth() + 1 !== month
      });
    }
    rows.push(row);
  }
  return rows;
}

// ============================================================
// 相对日期
// ============================================================

/**
 * 获取今天的日期字符串
 *
 * @returns {string} YYYY-MM-DD
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * 获取昨天的日期字符串
 *
 * @returns {string} YYYY-MM-DD
 */
export function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

/**
 * 获取明天的日期字符串
 *
 * @returns {string} YYYY-MM-DD
 */
export function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

/**
 * 获取N天后的日期字符串
 *
 * @param {number} days - 天数 (可为负数)
 * @param {Date|string} from - 起始日期,默认今天
 * @returns {string} YYYY-MM-DD
 */
export function getDateAfterDays(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// ============================================================
// 日期判断
// ============================================================

/**
 * 判断是否为今天
 *
 * @param {Date|string} date - 日期
 * @returns {boolean}
 */
export function isToday(date) {
  return formatDate(date) === getToday();
}

/**
 * 判断是否为同一天
 *
 * @param {Date|string} date1 - 日期1
 * @param {Date|string} date2 - 日期2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  return formatDate(date1) === formatDate(date2);
}

/**
 * 判断是否为周末 (周六或周日)
 *
 * @param {Date|string} date - 日期
 * @returns {boolean}
 */
export function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * 判断是否为工作日 (周一到周五)
 *
 * @param {Date|string} date - 日期
 * @returns {boolean}
 */
export function isWeekday(date) {
  return !isWeekend(date);
}

/**
 * 判断日期是否在指定范围内
 *
 * @param {Date|string} date - 待判断日期
 * @param {Date|string} start - 开始日期
 * @param {Date|string} end - 结束日期
 * @returns {boolean}
 */
export function isInRange(date, start, end) {
  const d = new Date(date).getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return d >= s && d <= e;
}

// ============================================================
// 星期相关
// ============================================================

/**
 * 获取星期几的中文名称
 *
 * @param {Date|string} date - 日期
 * @param {boolean} short - 是否使用短格式 (周一 vs 星期一)
 * @returns {string} 星期名称
 */
export function getWeekdayName(date, short = true) {
  const d = new Date(date);
  const day = d.getDay();
  const longNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const shortNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return short ? shortNames[day] : longNames[day];
}

// ============================================================
// 时间相关
// ============================================================

/**
 * 将分钟数转换为 HH:MM 格式
 *
 * @param {number} minutes - 分钟数
 * @returns {string} HH:MM 格式
 *
 * @example
 * minutesToTime(90)  // '01:30'
 * minutesToTime(1440)  // '24:00'
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 将 HH:MM 格式转换为分钟数
 *
 * @param {string} time - 时间字符串 HH:MM
 * @returns {number} 分钟数
 *
 * @example
 * timeToMinutes('01:30')  // 90
 */
export function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 获取当前时间的分钟数 (从0点开始)
 *
 * @returns {number} 分钟数 (0-1439)
 */
export function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
