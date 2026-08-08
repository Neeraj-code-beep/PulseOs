const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// POST /api/ai/breakdown
router.post('/breakdown', aiController.breakdownTask);

module.exports = router;
