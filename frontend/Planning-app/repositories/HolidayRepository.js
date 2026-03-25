/**
 * HolidayRepository - 节日数据访问层
 *
 * 职责：
 * - 节日、农历、工作日数据的缓存管理
 * - localStorage 持久化
 * - 数据合并和优先级处理
 *
 * 架构说明（四层架构 - Repository层）：
 * - Repository 负责所有数据持久化操作
 * - Composable 只负责业务流程编排，调用 Repository
 * - 符合单一职责原则（SRP）
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-25
 */

// ============================================================
// 缓存键名常量
// ============================================================
const HOLIDAY_CACHE_KEY = 'planning_app_holiday_map';
const WORKDAY_CACHE_KEY = 'planning_app_workday_map';

/**
 * HolidayRepository 类
 * 管理节日、农历、工作日数据的缓存和持久化
 */
class HolidayRepository {
  constructor() {
    /** 节日农历缓存 key=YYYY-MM-DD, value=节日名称 */
    this.holidayMap = {};

    /** 工作日调整缓存 key=YYYY-MM-DD, value={ type, holidayName, remark } */
    this.workDayMap = {};
  }

  /**
   * 从 localStorage 加载缓存的节日数据
   * @returns {object} { holidayCount, workDayCount }
   */
  loadFromCache() {
    try {
      const cachedHoliday = uni.getStorageSync(HOLIDAY_CACHE_KEY);
      const cachedWorkDay = uni.getStorageSync(WORKDAY_CACHE_KEY);

      let holidayCount = 0;
      let workDayCount = 0;

      if (cachedHoliday) {
        this.holidayMap = JSON.parse(cachedHoliday);
        holidayCount = Object.keys(this.holidayMap).length;
        console.log('[HolidayRepository] 从缓存加载节日数据:', holidayCount, '条');
      }

      if (cachedWorkDay) {
        this.workDayMap = JSON.parse(cachedWorkDay);
        workDayCount = Object.keys(this.workDayMap).length;
        console.log('[HolidayRepository] 从缓存加载工作日数据:', workDayCount, '条');
      }

      return { holidayCount, workDayCount };
    } catch (err) {
      console.error('[HolidayRepository] 加载缓存失败:', err);
      return { holidayCount: 0, workDayCount: 0 };
    }
  }

  /**
   * 保存节日数据到 localStorage
   */
  saveToCache() {
    try {
      uni.setStorageSync(HOLIDAY_CACHE_KEY, JSON.stringify(this.holidayMap));
      uni.setStorageSync(WORKDAY_CACHE_KEY, JSON.stringify(this.workDayMap));
      console.log('[HolidayRepository] 缓存已保存');
    } catch (err) {
      console.error('[HolidayRepository] 保存缓存失败:', err);
    }
  }

  /**
   * 合并服务器返回的节日数据
   * @param {object} holidayRes - 节日API响应 { holidayMap: { "YYYY-MM-DD": [{ name, type }] } }
   * @param {object} lunarRes - 农历API响应 { lunarMap: { "YYYY-MM-DD": { lunarDayName, lunarFestival } } }
   * @param {object} workDayRes - 工作日API响应 { workDayMap: { "YYYY-MM-DD": { type, holidayName } } }
   * @returns {object} { holidayCount, lunarCount, workDayCount }
   */
  mergeServerData(holidayRes, lunarRes, workDayRes) {
    let holidayCount = 0;
    let lunarCount = 0;
    let workDayCount = 0;

    // 节日: 按优先级排序（中国节日 > 西方节日 > 节气 > 国际节日）
    const hMap = holidayRes?.holidayMap || {};
    Object.entries(hMap).forEach(([date, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        const sorted = [...list].sort((a, b) => {
          const priority = { cn_solar: 1, cn_lunar: 1, western: 2, solar_term: 3, intl: 4 };
          return (priority[a.type] || 999) - (priority[b.type] || 999);
        });
        this.holidayMap[date] = sorted[0].name;
        holidayCount++;
      }
    });

    // 农历: 如果该日期无节日,则显示农历
    const lMap = lunarRes?.lunarMap || {};
    Object.entries(lMap).forEach(([date, info]) => {
      if (!this.holidayMap[date]) {
        // 优先显示农历节日,其次显示月日
        this.holidayMap[date] = info.lunarFestival || info.lunarDayName || '';
        lunarCount++;
      }
    });

    // 工作日调整: 存储到 workDayMap
    const wMap = workDayRes?.workDayMap || {};
    Object.entries(wMap).forEach(([date, info]) => {
      this.workDayMap[date] = info; // { type, holidayName, remark }
      workDayCount++;
    });

    return { holidayCount, lunarCount, workDayCount };
  }

  /**
   * 获取指定日期的节日/农历标签
   * @param {string} dateStr - YYYY-MM-DD
   * @returns {string} 节日名称或农历日期，无数据返回空字符串
   */
  getHolidayLabel(dateStr) {
    return this.holidayMap[dateStr] || '';
  }

  /**
   * 获取指定日期的工作日信息
   * @param {string} dateStr - YYYY-MM-DD
   * @returns {object|null} { type: 'holiday'|'workday', holidayName, remark } 或 null
   */
  getWorkDay(dateStr) {
    return this.workDayMap[dateStr] || null;
  }

  /**
   * 获取所有缓存的节日数据（用于导出）
   * @returns {object} { holidayMap, workDayMap }
   */
  getAllData() {
    return {
      holidayMap: { ...this.holidayMap },
      workDayMap: { ...this.workDayMap }
    };
  }

  /**
   * 清空所有缓存数据
   */
  clear() {
    this.holidayMap = {};
    this.workDayMap = {};
    try {
      uni.removeStorageSync(HOLIDAY_CACHE_KEY);
      uni.removeStorageSync(WORKDAY_CACHE_KEY);
      console.log('[HolidayRepository] 缓存已清空');
    } catch (err) {
      console.error('[HolidayRepository] 清空缓存失败:', err);
    }
  }
}

// ============================================================
// 单例模式（Node.js require缓存机制）
// ============================================================
const holidayRepository = new HolidayRepository();

export default holidayRepository;
