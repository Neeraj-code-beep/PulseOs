const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const aiController = require('../controllers/ai.controller');

// Secure all AI routes with JWT authentication
router.use(authMiddleware);

// POST /api/ai/breakdown
router.post('/breakdown', aiController.breakdownTask);

// POST /api/ai/estimate
router.post('/estimate', aiController.estimateTaskTime);

// POST /api/ai/schedule
router.post('/schedule', aiController.proposeSchedule);

module.exports = router;
