const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// POST /api/ai/breakdown
router.post('/breakdown', aiController.breakdownTask);

// POST /api/ai/estimate
router.post('/estimate', aiController.estimateTaskTime);

// POST /api/ai/schedule
router.post('/schedule', aiController.proposeSchedule);

module.exports = router;

