'use strict';

/**
 * 项目常量定义
 */

// 人生六阶段 (基于易经乾卦)
const LIFE_STAGES = {
  QIAN_LONG: { index: 0, name: '潜龙勿用', description: '蓄势阶段，静待时机', minScore: 0 },
  JIAN_LONG: { index: 1, name: '见龙在田', description: '初露头角，稳步前进', minScore: 17 },
  JUN_ZI: { index: 2, name: '君子乾乾', description: '持续努力，精进不止', minScore: 34 },
  YUE_YUAN: { index: 3, name: '或跃在渊', description: '准备突破，审时度势', minScore: 51 },
  FEI_LONG: { index: 4, name: '飞龙在天', description: '高光时刻，大展宏图', minScore: 68 },
  KANG_LONG: { index: 5, name: '亢龙有悔', description: '物极必反，谨防骄傲', minScore: 85 }
};

// 7大规划模块类型
const PLANNING_TYPES = {
  LIFE: 'life',         // 人生规划
  CAREER: 'career',     // 职业规划
  PROJECT: 'project',   // 项目规划
  MOOD: 'mood',         // 心情规划
  DIET: 'diet',         // 饮食规划
  HEALTH: 'health',     // 健康规划
  TIME: 'time'          // 时间规划
};

// 规划状态
const PLANNING_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
};

// JWT配置
const JWT = {
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ALGORITHM: 'HS256'
};

// 分页默认值
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// HTTP状态码
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500
};

// 节日类型
const HOLIDAY_TYPE = {
  CN_SOLAR: 'cn_solar',       // 中国公历节日（元旦/五一/国庆）
  CN_LUNAR: 'cn_lunar',       // 中国农历节日（春节/中秋/端午）
  WESTERN: 'western',         // 西方节日（圣诞/情人节）
  INTL: 'intl',               // 国际节日（妇女节/儿童节）
  SOLAR_TERM: 'solar_term'    // 24节气（立春/雨水...）
};

// 任务状态
const TASK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// 任务日期类型
const TASK_DATE_TYPE = {
  SINGLE: 'single',   // 单日任务
  RANGE: 'range',     // 跨天任务
  NONE: 'none'        // 无日期（纯备忘）
};

// 任务来源类型
const TASK_SOURCE_TYPE = {
  MANUAL: 'manual',         // 手动创建
  FROM_LOG: 'from_log',     // 由日志转化
  FROM_PLAN: 'from_plan'    // 由规划拆分
};

// 日志类型
const LOG_TYPE = {
  NOTE: 'note',               // 心得/感悟
  INSPIRATION: 'inspiration', // 灵感
  EVENT: 'event',             // 事件记录
  PLAN_UPDATE: 'plan_update'  // 规划进度更新
};

// 闹铃重复类型
const ALARM_REPEAT = {
  NONE: 'none',       // 不重复（单次）
  DAILY: 'daily',     // 每天
  WEEKLY: 'weekly',   // 每周
  CUSTOM: 'custom'    // 自定义RRULE
};

// 重复任务实例状态
const OCCURRENCE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

// 专注时段状态
const SESSION_STATUS = {
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  INTERRUPTED: 'interrupted'
};

module.exports = {
  LIFE_STAGES,
  PLANNING_TYPES,
  PLANNING_STATUS,
  JWT,
  PAGINATION,
  HTTP_STATUS,
  HOLIDAY_TYPE,
  TASK_STATUS,
  TASK_DATE_TYPE,
  TASK_SOURCE_TYPE,
  LOG_TYPE,
  ALARM_REPEAT,
  OCCURRENCE_STATUS,
  SESSION_STATUS
};
