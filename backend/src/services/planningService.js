'use strict';

const { Op } = require('sequelize');
const { PlanningRecord } = require('../models/index');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { PAGINATION } = require('../config/constants');

/**
 * 规划记录业务服务
 * 提供规划记录的增删改查功能
 */

/**
 * 获取规划记录列表（分页）
 * @param {number} userId - 当前用户ID（只能查自己的数据）
 * @param {object} query - 查询参数
 * @param {string} [query.type] - 规划类型筛选
 * @param {string} [query.status] - 状态筛选
 * @param {number} [query.page=1] - 页码
 * @param {number} [query.pageSize=20] - 每页数量
 * @returns {Promise<{rows: Array, count: number}>}
 */
async function getList(userId, { type, status, page = 1, pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = {}) {
  // 构建查询条件
  const where = { userId };
  if (type) where.type = type;
  if (status) where.status = status;

  const { rows, count } = await PlanningRecord.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']], // 最新创建的排前面
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });

  return { rows, count };
}

/**
 * 获取单条规划记录详情
 * @param {number} id - 记录ID
 * @param {number} userId - 当前用户ID（用于权限校验）
 * @returns {Promise<PlanningRecord>}
 * @throws {NotFoundError} 记录不存在
 * @throws {ForbiddenError} 无权访问他人数据
 */
async function getDetail(id, userId) {
  const record = await PlanningRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('规划记录');
  }
  // 只能查看自己的记录
  if (record.userId !== userId) {
    throw new ForbiddenError('无权访问该规划记录');
  }
  return record;
}

/**
 * 创建规划记录
 * @param {number} userId - 当前用户ID
 * @param {object} data - 规划数据
 * @param {string} data.type - 规划类型
 * @param {string} data.title - 标题
 * @param {string} [data.content] - 内容
 * @param {string} [data.startDate] - 开始日期
 * @param {string} [data.endDate] - 结束日期
 * @param {number} [data.targetScore] - 目标分值
 * @param {string} [data.relatedStage] - 关联的人生阶段
 * @returns {Promise<PlanningRecord>}
 */
async function create(userId, data) {
  const record = await PlanningRecord.create({
    userId,
    type: data.type,
    title: data.title,
    content: data.content || null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    targetScore: data.targetScore || null,
    relatedStage: data.relatedStage || null
  });
  return record;
}

/**
 * 更新规划记录
 * @param {number} id - 记录ID
 * @param {number} userId - 当前用户ID
 * @param {object} data - 要更新的字段
 * @returns {Promise<PlanningRecord>}
 * @throws {NotFoundError} 记录不存在
 * @throws {ForbiddenError} 无权修改他人数据
 */
async function update(id, userId, data) {
  const record = await getDetail(id, userId);

  // 只允许更新内容字段，status 通过专门的 updateStatus 接口更改
  const allowedFields = ['title', 'content', 'startDate', 'endDate', 'targetScore', 'relatedStage'];
  const updateData = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  await record.update(updateData);
  return record;
}

/**
 * 更新规划状态
 * @param {number} id - 记录ID
 * @param {number} userId - 当前用户ID
 * @param {string} status - 新状态（active/completed/paused/cancelled）
 * @returns {Promise<PlanningRecord>}
 */
async function updateStatus(id, userId, status) {
  const record = await getDetail(id, userId);
  await record.update({ status });
  return record;
}

/**
 * 删除规划记录（软删除）
 * @param {number} id - 记录ID
 * @param {number} userId - 当前用户ID
 * @returns {Promise<void>}
 */
async function remove(id, userId) {
  const record = await getDetail(id, userId);
  await record.destroy(); // paranoid:true → 只设置 deleted_at，不真正删除
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  updateStatus,
  remove
};
