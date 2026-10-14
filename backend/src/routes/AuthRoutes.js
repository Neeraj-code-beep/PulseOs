const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Dedicated rate limiter: 5 failed attempts per 15-minute window per client IP
const authRateLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX_FAILED) || 5,
  skipSuccessfulRequests: true, // Only count unsuccessful attempts (status >= 400)
  standardHeaders: true, // Return standard RateLimit headers (draft-6 / draft-7)
  legacyHeaders: false, // Disable X-RateLimit-* legacy headers
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many failed authentication attempts. Please try again in 15 minutes.',
    });
  },
});

// Expose limiter instance for testing and introspection
router.authRateLimiter = authRateLimiter;

// Public routes protected by authentication rate limiting
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);

// Protected route
router.get('/me', authMiddleware, authController.me);

module.exports = router;
