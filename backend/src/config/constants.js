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

module.exports = {
  LIFE_STAGES,
  PLANNING_TYPES,
  PLANNING_STATUS,
  JWT,
  PAGINATION,
  HTTP_STATUS
};
