/**
 * 任务表单验证工具
 *
 * 职责：提供纯函数的表单验证逻辑
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-10
 */

import { timeDiffMinutes } from './date.js'

/**
 * 验证任务表单
 * @param {Object} form - 表单数据对象
 * @param {Array} subtasks - 子任务列表
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateTaskForm(form, subtasks = []) {
  const errors = []

  // 标题必填
  if (!form.title || !form.title.trim()) {
    errors.push('任务标题不能为空')
  }

  // 标题长度限制
  if (form.title && form.title.length > 100) {
    errors.push('任务标题不能超过100个字符')
  }

  // 描述长度限制
  if (form.description && form.description.length > 500) {
    errors.push('任务描述不能超过500个字符')
  }

  // 日期必填
  if (!form.taskDate) {
    errors.push('任务日期不能为空')
  }

  // 如果开启了时间段，需要验证时间
  if (form.hasTimeRange) {
    if (!form.startTime || !form.endTime) {
      errors.push('开启时间段后，开始时间和结束时间都必须填写')
    }
    if (form.startTime && form.endTime) {
      const diff = timeDiffMinutes(form.startTime, form.endTime)
      if (diff <= 0) {
        errors.push('结束时间必须晚于开始时间')
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
