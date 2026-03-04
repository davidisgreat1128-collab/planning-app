/**
 * 象限判断工具函数
 *
 * 职责:
 * - 提供纯函数的象限判断逻辑
 * - 可单独导入,可单元测试
 * - 无副作用,无外部依赖
 *
 * 四象限模型 (艾森豪威尔矩阵):
 * ```
 *        重要
 *    ┌─────┬─────┐
 *    │ Q2  │ Q1  │
 * 不 ├─────┼─────┤紧急
 * 紧│ Q4  │ Q3  │
 * 急└─────┴─────┘
 *    不重要
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-05
 */

// ============================================================
// 象限判断
// ============================================================

/**
 * 根据任务属性判断所属象限
 *
 * @param {object} task - 任务对象
 * @param {boolean} task.isUrgent - 是否紧急
 * @param {boolean} task.isImportant - 是否重要
 * @returns {string} 'q1' | 'q2' | 'q3' | 'q4'
 *
 * @example
 * getQuadrant({ isUrgent: true, isImportant: true })  // 'q1'
 * getQuadrant({ isUrgent: false, isImportant: true }) // 'q2'
 */
export function getQuadrant(task) {
  if (!task) return 'q4';

  const isUrgent = !!task.isUrgent;
  const isImportant = !!task.isImportant;

  if (isUrgent && isImportant) return 'q1';
  if (!isUrgent && isImportant) return 'q2';
  if (isUrgent && !isImportant) return 'q3';
  return 'q4';
}

/**
 * 根据紧急/重要属性获取象限键
 *
 * @param {boolean} isUrgent - 是否紧急
 * @param {boolean} isImportant - 是否重要
 * @returns {string} 'q1' | 'q2' | 'q3' | 'q4'
 */
export function getQuadrantByFlags(isUrgent, isImportant) {
  if (isUrgent && isImportant) return 'q1';
  if (!isUrgent && isImportant) return 'q2';
  if (isUrgent && !isImportant) return 'q3';
  return 'q4';
}

// ============================================================
// 象限配置
// ============================================================

/**
 * 象限配置映射
 */
export const quadrantConfigs = {
  q1: {
    name: '紧急且重要',
    shortName: '危机处理',
    color: '#FF4D4F',
    bgColor: '#FFF1F0',
    icon: '🔥',
    description: '危机处理、紧急问题',
    priority: 1
  },
  q2: {
    name: '重要不紧急',
    shortName: '规划区',
    color: '#1890FF',
    bgColor: '#E6F7FF',
    icon: '⭐',
    description: '规划、学习、成长',
    priority: 2
  },
  q3: {
    name: '紧急不重要',
    shortName: '琐事区',
    color: '#FAAD14',
    bgColor: '#FFFBE6',
    icon: '⚡',
    description: '琐事、打扰、干扰',
    priority: 3
  },
  q4: {
    name: '不紧急不重要',
    shortName: '消遣区',
    color: '#52C41A',
    bgColor: '#F6FFED',
    icon: '🍃',
    description: '消遣、娱乐、放松',
    priority: 4
  }
};

/**
 * 根据象限键获取配置
 *
 * @param {string} quadrantKey - 象限键 'q1' | 'q2' | 'q3' | 'q4'
 * @returns {object|null} 象限配置对象
 *
 * @example
 * getQuadrantConfig('q1')
 * // { name: '紧急且重要', color: '#FF4D4F', ... }
 */
export function getQuadrantConfig(quadrantKey) {
  return quadrantConfigs[quadrantKey] || null;
}

/**
 * 获取象限名称
 *
 * @param {string} quadrantKey - 象限键
 * @param {boolean} useShortName - 是否使用短名称
 * @returns {string} 象限名称
 */
export function getQuadrantName(quadrantKey, useShortName = false) {
  const config = getQuadrantConfig(quadrantKey);
  if (!config) return '';
  return useShortName ? config.shortName : config.name;
}

/**
 * 获取象限颜色
 *
 * @param {string} quadrantKey - 象限键
 * @param {boolean} useBgColor - 是否返回背景色
 * @returns {string} 颜色值
 */
export function getQuadrantColor(quadrantKey, useBgColor = false) {
  const config = getQuadrantConfig(quadrantKey);
  if (!config) return useBgColor ? '#F5F5F5' : '#999';
  return useBgColor ? config.bgColor : config.color;
}

/**
 * 获取象限图标
 *
 * @param {string} quadrantKey - 象限键
 * @returns {string} 图标字符
 */
export function getQuadrantIcon(quadrantKey) {
  const config = getQuadrantConfig(quadrantKey);
  return config ? config.icon : '';
}

// ============================================================
// 象限转换
// ============================================================

/**
 * 根据象限键获取紧急/重要属性
 *
 * @param {string} quadrantKey - 象限键
 * @returns {object} { isUrgent, isImportant }
 *
 * @example
 * getQuadrantProperties('q1') // { isUrgent: true, isImportant: true }
 */
export function getQuadrantProperties(quadrantKey) {
  const properties = {
    q1: { isUrgent: true, isImportant: true },
    q2: { isUrgent: false, isImportant: true },
    q3: { isUrgent: true, isImportant: false },
    q4: { isUrgent: false, isImportant: false }
  };
  return properties[quadrantKey] || { isUrgent: false, isImportant: false };
}

// ============================================================
// 任务分类
// ============================================================

/**
 * 将任务列表按象限分组
 *
 * @param {Array<object>} tasks - 任务列表
 * @returns {object} { q1: [], q2: [], q3: [], q4: [] }
 *
 * @example
 * const tasks = [
 *   { id: 1, isUrgent: true, isImportant: true },
 *   { id: 2, isUrgent: false, isImportant: true }
 * ]
 * groupTasksByQuadrant(tasks)
 * // { q1: [task1], q2: [task2], q3: [], q4: [] }
 */
export function groupTasksByQuadrant(tasks) {
  const groups = {
    q1: [],
    q2: [],
    q3: [],
    q4: []
  };

  if (!Array.isArray(tasks)) return groups;

  tasks.forEach(task => {
    const quadrant = getQuadrant(task);
    groups[quadrant].push(task);
  });

  return groups;
}

/**
 * 筛选指定象限的任务
 *
 * @param {Array<object>} tasks - 任务列表
 * @param {string} quadrantKey - 象限键
 * @returns {Array<object>} 筛选后的任务列表
 */
export function filterTasksByQuadrant(tasks, quadrantKey) {
  if (!Array.isArray(tasks)) return [];

  const { isUrgent, isImportant } = getQuadrantProperties(quadrantKey);

  return tasks.filter(task =>
    !!task.isUrgent === isUrgent &&
    !!task.isImportant === isImportant
  );
}

// ============================================================
// 象限优先级
// ============================================================

/**
 * 获取象限优先级 (1最高, 4最低)
 *
 * @param {string} quadrantKey - 象限键
 * @returns {number} 优先级 1-4
 */
export function getQuadrantPriority(quadrantKey) {
  const config = getQuadrantConfig(quadrantKey);
  return config ? config.priority : 4;
}

/**
 * 按象限优先级排序任务
 *
 * @param {Array<object>} tasks - 任务列表
 * @returns {Array<object>} 排序后的任务列表
 */
export function sortTasksByQuadrant(tasks) {
  if (!Array.isArray(tasks)) return [];

  return [...tasks].sort((a, b) => {
    const quadrantA = getQuadrant(a);
    const quadrantB = getQuadrant(b);
    return getQuadrantPriority(quadrantA) - getQuadrantPriority(quadrantB);
  });
}

// ============================================================
// 象限统计
// ============================================================

/**
 * 统计各象限的任务数量
 *
 * @param {Array<object>} tasks - 任务列表
 * @returns {object} { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 }
 */
export function countTasksByQuadrant(tasks) {
  const counts = {
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    total: 0
  };

  if (!Array.isArray(tasks)) return counts;

  tasks.forEach(task => {
    const quadrant = getQuadrant(task);
    counts[quadrant]++;
    counts.total++;
  });

  return counts;
}

/**
 * 计算象限占比
 *
 * @param {Array<object>} tasks - 任务列表
 * @returns {object} { q1: 0.25, q2: 0.5, q3: 0.125, q4: 0.125 }
 */
export function calculateQuadrantPercentage(tasks) {
  const counts = countTasksByQuadrant(tasks);
  const total = counts.total;

  if (total === 0) {
    return { q1: 0, q2: 0, q3: 0, q4: 0 };
  }

  return {
    q1: counts.q1 / total,
    q2: counts.q2 / total,
    q3: counts.q3 / total,
    q4: counts.q4 / total
  };
}
