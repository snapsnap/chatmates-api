const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Search users by name or phone
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    const searchTerm = `%${q}%`;
    const [users] = await db.query(
      `SELECT id, name, phone, avatar 
       FROM users 
       WHERE (name LIKE ? OR phone LIKE ?) AND id != ?
       LIMIT 20`,
      [searchTerm, searchTerm, req.userId]
    );

    return successResponse(res, 'Users found', { 
      users, 
      count: users.length 
    });
  } catch (error) {
    console.error('Search users error:', error);
    return errorResponse(res, 'Failed to search users', 500);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await db.query(
      'SELECT id, name, phone, avatar, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, 'User found', { user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, 'Failed to get user', 500);
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    params.push(req.userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [users] = await db.query(
      'SELECT id, name, phone, avatar, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    return successResponse(res, 'Profile updated successfully', { 
      user: users[0] 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

module.exports = {
  searchUsers,
  getUserById,
  updateProfile
};