const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const aiController = require('../controllers/ai.controller');

// Rate limiter: Max 10 requests per authenticated user per minute
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many AI requests. Please try again shortly.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Secure all AI routes with JWT authentication & rate limiting
router.use(authMiddleware);
router.use(aiRateLimiter);

// POST /api/ai/breakdown
router.post('/breakdown', aiController.breakdownTask);

// POST /api/ai/estimate
router.post('/estimate', aiController.estimateTaskTime);

// POST /api/ai/schedule
router.post('/schedule', aiController.proposeSchedule);

// POST /api/ai/daily-plan
router.post('/daily-plan', aiController.getDailyPlan);

module.exports = router;
