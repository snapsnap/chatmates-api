const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Check if phone already exists
    const [existing] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return errorResponse(res, 'Phone already registered', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)',
      [name, phone, passwordHash]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return successResponse(res, 'User registered successfully', {
      token,
      user: { 
        id: result.insertId, 
        name, 
        phone,
        avatar: null,
        created_at: new Date()
      }
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Failed to register user', 500);
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user by phone
    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return successResponse(res, 'Login successful', {
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        phone: user.phone, 
        avatar: user.avatar,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Failed to login', 500);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return errorResponse(res, 'No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query(
      'SELECT id, name, phone, avatar, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, 'User profile retrieved', { user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    } else if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    
    return errorResponse(res, 'Failed to get user profile', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile
};