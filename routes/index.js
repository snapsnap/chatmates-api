const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/response');

// Import all route modules
const authRoutes = require('./auth');
const chatRoutes = require('./chats');
const uploadRoutes = require('./upload');
const usersRoutes = require('./users');

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API info and available endpoints
 */
router.get('/', (req, res) => {
  successResponse(res, 'Chat API Server', {
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      chats: '/api/chats',
      upload: '/api/upload',
      users: '/api/users',
      health: '/health'
    }
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       example: 123.456
 */
router.get('/health', (req, res) => {
  successResponse(res, 'Server is running', {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/upload', uploadRoutes);
router.use('/users', usersRoutes);

module.exports = router;