const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { 
  searchUserValidator, 
  getUserValidator, 
  updateProfileValidator 
} = require('../validators/userValidator');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users by name or phone
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: John
 *     responses:
 *       200:
 *         description: Users found
 *       400:
 *         description: Invalid query
 */
router.get('/search', searchUserValidator, validate, userController.searchUsers);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/:userId', getUserValidator, validate, userController.getUserById);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               avatar:
 *                 type: string
 *                 example: /uploads/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: No fields to update
 */
router.put('/profile', updateProfileValidator, validate, userController.updateProfile);

module.exports = router;