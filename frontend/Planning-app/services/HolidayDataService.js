/**
 * HolidayDataService - 节日数据服务（版本管理）
 *
 * 职责：
 * - 版本号检测和管理
 * - 全量数据加载编排（近3年）
 * - 版本升级时触发数据更新
 *
 * 架构说明（Service层）：
 * - Service 负责业务流程编排和版本控制
 * - Repository 负责数据持久化
 * - 符合单一职责原则（SRP）
 *
 * 使用场景：
 * - App启动时调用 initHolidayData()
 * - 版本升级时自动触发全量加载
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-25
 */

import holidayRepository from '@/repositories/HolidayRepository';
import { getHolidaysByRange, getLunarInfoRange, getWorkDaysByRange } from '@/api/holiday';

// ============================================================
// 版本管理常量
// ============================================================

/** 节日数据版本号存储Key */
const HOLIDAY_DATA_VERSION_KEY = 'planning_app_holiday_data_version';

/**
 * 当前数据版本号
 * ⭐ 每次发布新版本时手动递增
 * 格式：YYYYMMDD（如 20260325）
 */
const CURRENT_DATA_VERSION = '20260325';

/** 加载近N年的数据 */
const LOAD_YEARS_RANGE = 3; // 当前年份 ±1年（共3年）

// ============================================================
// HolidayDataService 类
// ============================================================

class HolidayDataService {
  constructor() {
    /** 是否正在加载中 */
    this.isLoading = false;
  }

  /**
   * 初始化节日数据（App启动时调用）
   * - 检测版本号
   * - 如果版本不匹配，触发全量加载
   * - 如果版本匹配，直接从缓存读取
   * @returns {Promise<object>} { needUpdate, dataVersion, loadedCount }
   */
  async initHolidayData() {
    console.log('[HolidayDataService] ========== 初始化节日数据 ==========');

    try {
      // 步骤1：检测版本号
      const cachedVersion = uni.getStorageSync(HOLIDAY_DATA_VERSION_KEY) || '';
      console.log('[HolidayDataService] 缓存版本:', cachedVersion, '当前版本:', CURRENT_DATA_VERSION);

      const needUpdate = cachedVersion !== CURRENT_DATA_VERSION;

      if (!needUpdate) {
        // 版本匹配：直接从缓存加载
        console.log('[HolidayDataService] 版本匹配，从缓存加载数据');
        const { holidayCount, workDayCount } = holidayRepository.loadFromCache();
        return {
          needUpdate: false,
          dataVersion: cachedVersion,
          loadedCount: holidayCount + workDayCount,
          message: '从缓存加载数据成功'
        };
      }

      // 版本不匹配：触发全量加载
      console.log('[HolidayDataService] 版本不匹配，触发全量加载（近3年数据）');
      return await this.loadFullYearData();
    } catch (err) {
      console.error('[HolidayDataService] 初始化失败:', err);
      // 降级策略：即使失败也尝试从缓存加载
      const { holidayCount, workDayCount } = holidayRepository.loadFromCache();
      return {
        needUpdate: false,
        dataVersion: 'unknown',
        loadedCount: holidayCount + workDayCount,
        message: '初始化失败，使用缓存数据',
        error: err.message
      };
    }
  }

  /**
   * 加载近3年的全量数据
   * - 计算日期范围：当前年份 ±1年
   * - 调用API批量加载
   * - 保存到Repository
   * - 更新版本号
   * @returns {Promise<object>} { needUpdate, dataVersion, loadedCount }
   */
  async loadFullYearData() {
    if (this.isLoading) {
      console.warn('[HolidayDataService] 正在加载中，跳过重复请求');
      return { needUpdate: false, message: '正在加载中' };
    }

    this.isLoading = true;

    try {
      // 步骤1：计算日期范围（近3年）
      const now = new Date();
      const currentYear = now.getFullYear();

      const startYear = currentYear - 1; // 去年
      const endYear = currentYear + 1;   // 明年

      const startDate = `${startYear}-01-01`;
      const endDate = `${endYear}-12-31`;

      console.log('[HolidayDataService] 加载范围:', startDate, '~', endDate, `（${endYear - startYear + 1}年）`);

      // 步骤2：并行调用3个API（节日 + 农历 + 工作日）
      const [holidayRes, lunarRes, workDayRes] = await Promise.all([
        getHolidaysByRange(startDate, endDate),
        getLunarInfoRange(startDate, endDate),
        getWorkDaysByRange(startDate, endDate)
      ]);

      console.log('[HolidayDataService] API响应:', {
        holidays: Object.keys(holidayRes?.holidayMap || {}).length,
        lunar: Object.keys(lunarRes?.lunarMap || {}).length,
        workDays: Object.keys(workDayRes?.workDayMap || {}).length
      });

      // 步骤3：合并数据到Repository
      const { holidayCount, lunarCount, workDayCount } = holidayRepository.mergeServerData(
        holidayRes,
        lunarRes,
        workDayRes
      );

      console.log('[HolidayDataService] 数据合并完成:', {
        holidayCount,
        lunarCount,
        workDayCount,
        total: holidayCount + lunarCount + workDayCount
      });

      // 步骤4：保存到localStorage
      holidayRepository.saveToCache();

      // 步骤5：更新版本号
      uni.setStorageSync(HOLIDAY_DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      console.log('[HolidayDataService] 版本号已更新:', CURRENT_DATA_VERSION);

      return {
        needUpdate: true,
        dataVersion: CURRENT_DATA_VERSION,
        loadedCount: holidayCount + lunarCount + workDayCount,
        message: `全量加载成功（${startYear}-${endYear}共3年数据）`
      };
    } catch (err) {
      console.error('[HolidayDataService] 全量加载失败:', err);
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 手动触发全量重新加载（用于调试或强制刷新）
   * @returns {Promise<object>}
   */
  async forceReload() {
    console.log('[HolidayDataService] 强制重新加载');
    // 清空版本号，触发重新加载
    uni.removeStorageSync(HOLIDAY_DATA_VERSION_KEY);
    return await this.loadFullYearData();
  }

  /**
   * 获取当前数据版本信息
   * @returns {object} { currentVersion, cachedVersion, needUpdate }
   */
  getVersionInfo() {
    const cachedVersion = uni.getStorageSync(HOLIDAY_DATA_VERSION_KEY) || '';
    return {
      currentVersion: CURRENT_DATA_VERSION,
      cachedVersion,
      needUpdate: cachedVersion !== CURRENT_DATA_VERSION
    };
  }
}

// ============================================================
// 单例导出
// ============================================================
const holidayDataService = new HolidayDataService();

export default holidayDataService;
