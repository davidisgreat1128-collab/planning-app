'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

router.use(authenticate);

// POST /api/v1/tasks - 创建任务
router.post('/', taskController.createTask);

// GET /api/v1/tasks?date=2026-02-18 或 ?start=...&end=...
router.get('/', taskController.getTasks);

// GET /api/v1/tasks/plan/:planId - 获取规划子任务
router.get('/plan/:planId', taskController.getSubtasksByPlan);

// PUT /api/v1/tasks/:id - 更新任务
router.put('/:id', taskController.updateTask);

// PATCH /api/v1/tasks/occurrences/:id - 更新重复任务实例
router.patch('/occurrences/:id', taskController.updateOccurrence);

// DELETE /api/v1/tasks/:id - 软删除任务
router.delete('/:id', taskController.deleteTask);

module.exports = router;
