const express = require('express');
const router = express.Router();
const {
  createFocusSession,
  getFocusSessions,
  getFocusSummary,
} = require('../controllers/focus.controller');

router.post('/sessions', createFocusSession);
router.get('/sessions', getFocusSessions);
router.get('/summary', getFocusSummary);

module.exports = router;
