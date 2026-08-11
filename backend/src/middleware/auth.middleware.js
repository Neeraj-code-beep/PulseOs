const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests via Bearer JWT token.
 * Populates req.user = { userId: ... } on verification success.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing.',
      });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_pulseos';
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token payload.',
      });
    }

    // Attach verified user identity from token only (never trust body/query)
    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid authentication token.',
    });
  }
};

module.exports = authMiddleware;
