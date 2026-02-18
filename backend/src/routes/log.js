'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const logController = require('../controllers/logController');

router.use(authenticate);

router.post('/', logController.createLog);
router.get('/', logController.getLogs);
router.put('/:id', logController.updateLog);
router.post('/:id/convert-to-task', logController.convertToTask);
router.delete('/:id', logController.deleteLog);

module.exports = router;
