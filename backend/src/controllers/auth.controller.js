const authService = require('../services/auth.service');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const result = await authService.registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server Error';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

/**
 * @desc    Login existing user
 * @route   POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server Error';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /api/auth/me
 */
const me = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const user = await authService.getUserById(userId);

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: { user },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server Error';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  register,
  login,
  me,
};
