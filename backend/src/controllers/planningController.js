'use strict';

const planningService = require('../services/planningService');
const { success, created, paginated, noContent } = require('../utils/response');

/**
 * 规划记录控制器
 * 只处理 HTTP 请求/响应映射，业务逻辑全部在 planningService
 */

/**
 * GET /api/v1/planning
 * 获取当前用户的规划记录列表（支持分页和筛选）
 * 查询参数：type, status, page, pageSize
 */
async function getList(req, res, next) {
  try {
    const { type, status, page = 1, pageSize = 20 } = req.query;
    const { rows, count } = await planningService.getList(req.user.id, {
      type,
      status,
      page,
      pageSize
    });
    return paginated(res, rows, count, parseInt(page), parseInt(pageSize), '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/planning/:id
 * 获取单条规划记录详情
 */
async function getDetail(req, res, next) {
  try {
    const record = await planningService.getDetail(parseInt(req.params.id), req.user.id);
    return success(res, record, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/planning
 * 创建新的规划记录
 */
async function create(req, res, next) {
  try {
    const record = await planningService.create(req.user.id, req.body);
    return created(res, record, '创建成功');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/planning/:id
 * 更新规划记录内容（不含状态）
 */
async function update(req, res, next) {
  try {
    const record = await planningService.update(parseInt(req.params.id), req.user.id, req.body);
    return success(res, record, '更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/planning/:id/status
 * 单独更新规划记录状态
 */
async function updateStatus(req, res, next) {
  try {
    const record = await planningService.updateStatus(
      parseInt(req.params.id),
      req.user.id,
      req.body.status
    );
    return success(res, record, '状态更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/planning/:id
 * 删除规划记录（软删除）
 */
async function remove(req, res, next) {
  try {
    await planningService.remove(parseInt(req.params.id), req.user.id);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  updateStatus,
  remove
};
