'use strict';

/**
 * 统一API响应工具函数
 *
 * 使用方式:
 * const { success, error, paginated } = require('../utils/response');
 * return success(res, data, '操作成功');
 * return error(res, '参数错误', 400);
 */

/**
 * 成功响应
 * @param {import('express').Response} res - Express response对象
 * @param {*} data - 返回数据
 * @param {string} [message='操作成功'] - 提示信息
 * @param {number} [statusCode=200] - HTTP状态码
 * @returns {import('express').Response}
 */
function success(res, data = null, message = '操作成功', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * 错误响应
 * @param {import('express').Response} res - Express response对象
 * @param {string} [message='服务器错误'] - 错误信息
 * @param {number} [statusCode=500] - HTTP状态码
 * @param {*} [errors=null] - 详细错误信息（用于ValidationError等）
 * @returns {import('express').Response}
 */
function error(res, message = '服务器错误', statusCode = 500, errors = null) {
  const body = {
    success: false,
    code: statusCode,
    message,
    data: null,
    timestamp: new Date().toISOString()
  };

  if (errors !== null) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
}

/**
 * 分页列表响应
 * @param {import('express').Response} res - Express response对象
 * @param {Array} rows - 数据列表
 * @param {number} count - 总数量
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页数量
 * @param {string} [message='获取成功'] - 提示信息
 * @returns {import('express').Response}
 */
function paginated(res, rows, count, page, pageSize, message = '获取成功') {
  const totalPages = Math.ceil(count / pageSize);
  return res.status(200).json({
    success: true,
    code: 200,
    message,
    data: {
      list: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * 创建成功响应 (201)
 * @param {import('express').Response} res - Express response对象
 * @param {*} data - 创建的资源数据
 * @param {string} [message='创建成功'] - 提示信息
 * @returns {import('express').Response}
 */
function created(res, data = null, message = '创建成功') {
  return success(res, data, message, 201);
}

/**
 * 无内容响应 (204)
 * @param {import('express').Response} res - Express response对象
 * @returns {import('express').Response}
 */
function noContent(res) {
  return res.status(204).send();
}

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent
};
