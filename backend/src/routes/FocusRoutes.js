const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  createFocusSession,
  getFocusSessions,
  getFocusSummary,
} = require('../controllers/focus.controller');

// Secure all Focus routes with JWT authentication
router.use(authMiddleware);

router.post('/sessions', createFocusSession);
router.get('/sessions', getFocusSessions);
router.get('/summary', getFocusSummary);

module.exports = router;
