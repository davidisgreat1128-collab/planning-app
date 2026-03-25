/**
 * 节日数据服务（Service层）
 *
 * 职责：
 * 1. 版本管理：检测数据版本，触发更新
 * 2. 业务流程编排：协调Repository和API的调用
 * 3. 全量数据加载：初始化时加载近3年数据
 *
 * ⭐ 架构定位：Service层（Application Logic）
 * - 不负责数据持久化（由HolidayRepository处理）
 * - 不负责UI逻辑（由Composable/Component处理）
 * - 负责复杂业务流程编排和版本控制
 *
 * 创建时间：2026-03-19
 * 更新时间：2026-03-25（修复：分批加载规避后端API限制）
 */

import holidayRepository from '@/repositories/HolidayRepository.js';
import { getHolidaysByRange, getLunarInfoRange, getWorkDaysByRange } from '@/api/holiday.js';

// ============================================================
// 常量定义
// ============================================================

/**
 * 数据版本号（localStorage key）
 */
const HOLIDAY_DATA_VERSION_KEY = 'planning_app_holiday_data_version';

/**
 * 当前数据版本
 * - 格式：YYYYMMDD
 * - 每次发布新版本时手动递增
 * - 版本号变化时触发全量数据加载
 */
const CURRENT_DATA_VERSION = '20260325';

/**
 * 加载年份范围
 * - 当前年份 ±1年（共3年）
 * - 例如：2026年 → 加载 2025、2026、2027
 */
const LOAD_YEARS_RANGE = 3;

/**
 * 分批加载策略：每批次加载N个月
 * - 后端API限制：日期范围最大3个月
 * - 因此设置为3个月/批次
 */
const BATCH_MONTHS = 3;

// ============================================================
// Service 类
// ============================================================

class HolidayDataService {
  constructor() {
    /**
     * 是否正在加载中
     * - 防止重复调用initHolidayData()导致并发问题
     */
    this.isLoading = false;
  }

  /**
   * 初始化节日数据
   * - 启动时由 App.vue 调用
   * - 检查版本号，决定是从缓存加载还是全量更新
   * @returns {Promise<object>} { needUpdate, dataVersion, loadedCount, message }
   */
  async initHolidayData() {
    console.log('[HolidayDataService] ========== 初始化节日数据 ==========');

    try {
      // 步骤1：获取缓存的版本号
      const cachedVersion = uni.getStorageSync(HOLIDAY_DATA_VERSION_KEY) || '';
      console.log('[HolidayDataService] 缓存版本:', cachedVersion, '当前版本:', CURRENT_DATA_VERSION);

      // 步骤2：判断是否需要更新
      const needUpdate = cachedVersion !== CURRENT_DATA_VERSION;

      if (!needUpdate) {
        // 版本匹配 → 从缓存加载
        console.log('[HolidayDataService] 版本匹配，从缓存加载数据');
        const { holidayCount, workDayCount } = holidayRepository.loadFromCache();

        return {
          needUpdate: false,
          dataVersion: cachedVersion,
          loadedCount: holidayCount + workDayCount,
          message: '从缓存加载数据成功'
        };
      }

      // 版本不匹配 → 全量加载
      console.log('[HolidayDataService] 版本不匹配，触发全量加载（近3年数据）');
      return await this.loadFullYearData();

    } catch (err) {
      console.error('[HolidayDataService] 初始化失败:', err);

      // 降级：加载缓存数据
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
   * - ⭐ 分批加载（每次3个月，规避后端API限制）
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

      console.log('[HolidayDataService] 全量加载目标:', `${startYear}-01-01 ~ ${endYear}-12-31（3年）`);

      // 步骤2：生成分批加载策略（每批次3个月）
      const batches = this._generateBatches(startYear, endYear);
      console.log('[HolidayDataService] 分批策略:', batches.length, '个批次，每批次', BATCH_MONTHS, '个月');

      let totalHolidayCount = 0;
      let totalLunarCount = 0;
      let totalWorkDayCount = 0;

      // 步骤3：逐批次加载数据
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`[HolidayDataService] 加载批次 ${i + 1}/${batches.length}:`, batch.startDate, '~', batch.endDate);

        try {
          // 并行调用3个API（节日 + 农历 + 工作日）
          const [holidayRes, lunarRes, workDayRes] = await Promise.all([
            getHolidaysByRange(batch.startDate, batch.endDate),
            getLunarInfoRange(batch.startDate, batch.endDate),
            getWorkDaysByRange(batch.startDate, batch.endDate)
          ]);

          console.log(`[HolidayDataService] 批次 ${i + 1} API响应:`, {
            holidays: Object.keys(holidayRes?.holidayMap || {}).length,
            lunar: Object.keys(lunarRes?.lunarMap || {}).length,
            workDays: Object.keys(workDayRes?.workDayMap || {}).length
          });

          // 合并数据到Repository
          const { holidayCount, lunarCount, workDayCount } = holidayRepository.mergeServerData(
            holidayRes,
            lunarRes,
            workDayRes
          );

          totalHolidayCount += holidayCount;
          totalLunarCount += lunarCount;
          totalWorkDayCount += workDayCount;

        } catch (batchErr) {
          console.error(`[HolidayDataService] 批次 ${i + 1} 加载失败:`, batchErr.message);
          // 继续加载下一个批次，不中断整个流程
        }
      }

      console.log('[HolidayDataService] 所有批次加载完成，总计:', {
        holidays: totalHolidayCount,
        lunar: totalLunarCount,
        workDays: totalWorkDayCount,
        total: totalHolidayCount + totalLunarCount + totalWorkDayCount
      });

      // 步骤4：保存到缓存
      holidayRepository.saveToCache();
      console.log('[HolidayDataService] 数据已保存到localStorage');

      // 步骤5：更新版本号
      uni.setStorageSync(HOLIDAY_DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      console.log('[HolidayDataService] 版本号已更新:', CURRENT_DATA_VERSION);

      return {
        needUpdate: true,
        dataVersion: CURRENT_DATA_VERSION,
        loadedCount: totalHolidayCount + totalLunarCount + totalWorkDayCount,
        message: `全量加载成功（${startYear}-${endYear}共3年数据，${batches.length}个批次）`
      };

    } catch (err) {
      console.error('[HolidayDataService] 全量加载失败:', err);
      throw err;

    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 生成分批加载策略
   * - 将3年时间范围拆分为多个批次（每批次3个月）
   * - 例如：2025-01-01 ~ 2027-12-31 拆分为 12个批次
   * @param {number} startYear - 起始年份（如2025）
   * @param {number} endYear - 结束年份（如2027）
   * @returns {Array<{startDate:string, endDate:string}>} 批次数组
   */
  _generateBatches(startYear, endYear) {
    const batches = [];

    for (let year = startYear; year <= endYear; year++) {
      // 每年拆分为4个批次：Q1, Q2, Q3, Q4
      const quarters = [
        { start: `${year}-01-01`, end: `${year}-03-31` }, // Q1
        { start: `${year}-04-01`, end: `${year}-06-30` }, // Q2
        { start: `${year}-07-01`, end: `${year}-09-30` }, // Q3
        { start: `${year}-10-01`, end: `${year}-12-31` }  // Q4
      ];

      quarters.forEach(q => {
        batches.push({
          startDate: q.start,
          endDate: q.end
        });
      });
    }

    return batches;
  }

  /**
   * 强制重新加载（清除缓存版本号）
   * - 用于用户手动触发全量更新
   * @returns {Promise<object>}
   */
  async forceReload() {
    console.log('[HolidayDataService] 强制重新加载...');
    uni.removeStorageSync(HOLIDAY_DATA_VERSION_KEY);
    return await this.loadFullYearData();
  }

  /**
   * 获取版本信息
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
// 导出单例
// ============================================================

export default new HolidayDataService();
