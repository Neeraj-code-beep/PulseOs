const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

/**
 * Normalizes email address to lowercase and trimmed string.
 */
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().lowercase ? email.trim().toLowerCase() : String(email).trim().toLowerCase();
};

/**
 * Validates email format using standard regex pattern.
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generates JWT token containing only non-sensitive identity payload.
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

/**
 * Sanitizes user document to prevent leakage of passwordHash or internal fields.
 */
const sanitizeUser = (user) => {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Registers a new user account.
 */
const registerUser = async ({ name, email, password }) => {
  // Input validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Name is required.');
    error.statusCode = 400;
    throw error;
  }

  if (name.trim().length > 100) {
    const error = new Error('Name must not exceed 100 characters.');
    error.statusCode = 400;
    throw error;
  }

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    const error = new Error('Valid email address is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Check for duplicate email
  const existingUser = await UserModel.findOne({ email: cleanEmail });
  if (existingUser) {
    const error = new Error('Email is already registered.');
    error.statusCode = 400;
    throw error;
  }

  // Hash password with bcryptjs
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await UserModel.create({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
  });

  const token = generateToken(newUser._id);
  const sanitized = sanitizeUser(newUser);

  return {
    user: sanitized,
    token,
  };
};

/**
 * Authenticates user login credentials.
 */
const loginUser = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 400;
    throw error;
  }

  // Explicitly select passwordHash since select: false is set in schema
  const user = await UserModel.findOne({ email: cleanEmail }).select('+passwordHash');
  if (!user) {
    // Generic error to avoid revealing whether email exists
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);
  const sanitized = sanitizeUser(user);

  return {
    user: sanitized,
    token,
  };
};

/**
 * Gets user profile by ID.
 */
const getUserById = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return sanitizeUser(user);
};

module.exports = {
  normalizeEmail,
  isValidEmail,
  generateToken,
  sanitizeUser,
  registerUser,
  loginUser,
  getUserById,
};
