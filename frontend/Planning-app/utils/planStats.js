/**
 * planStats - 规划统计工具函数
 *
 * 职责:
 * - 计算规划的里程碑统计
 * - 计算规划已进行天数
 * - 计算用户坚持做计划的天数
 *
 * 使用方式:
 * ```javascript
 * import { getPlanTotalMilestones, getPlanCompletedMilestones, getPlanProgressDays, calculatePersistDays } from '@/utils/planStats'
 *
 * const totalMilestones = getPlanTotalMilestones(plan)
 * const completedMilestones = getPlanCompletedMilestones(plan)
 * const progressDays = getPlanProgressDays(plan)
 * const persistDays = calculatePersistDays()
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-11
 */

/**
 * 获取规划的总里程碑数
 * @param {object} plan - 规划对象
 * @returns {number} 总里程碑数
 */
export function getPlanTotalMilestones(plan) {
  return plan.milestones?.length || 0;
}

/**
 * 获取规划已完成的里程碑数
 * @param {object} plan - 规划对象
 * @returns {number} 已完成的里程碑数
 */
export function getPlanCompletedMilestones(plan) {
  if (!plan.milestones || plan.milestones.length === 0) return 0;
  return plan.milestones.filter(m => m.isCompleted).length;
}

/**
 * 获取规划已进行天数
 * 计算方式：当前日期 - 创建日期 + 1
 * @param {object} plan - 规划对象
 * @returns {number} 已进行天数
 */
export function getPlanProgressDays(plan) {
  if (!plan.createTime) return 1;

  const createDate = new Date(plan.createTime);
  const today = new Date();

  // 清除时间部分，只比较日期
  createDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // 计算天数差
  const diffTime = today - createDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 包含创建当天，所以 +1
  return diffDays + 1;
}

/**
 * 计算用户坚持做计划的天数
 * 从首次安装日期开始计算
 * @returns {number} 坚持天数
 */
export function calculatePersistDays() {
  const firstInstallDate = uni.getStorageSync('first_install_date');
  if (!firstInstallDate) {
    return 1;
  }

  const startDate = new Date(firstInstallDate);
  const today = new Date();

  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1;
}

/**
 * 获取规划的完整统计信息
 * @param {object} plan - 规划对象
 * @returns {object} 统计信息对象
 * @returns {number} totalMilestones - 总里程碑数
 * @returns {number} completedMilestones - 已完成里程碑数
 * @returns {number} progressDays - 已进行天数
 */
export function getPlanStats(plan) {
  return {
    totalMilestones: getPlanTotalMilestones(plan),
    completedMilestones: getPlanCompletedMilestones(plan),
    progressDays: getPlanProgressDays(plan)
  };
}
