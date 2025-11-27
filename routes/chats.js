const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');
const {
  createChatValidator,
  updateChatValidator,
  getChatValidator,
  getMessagesValidator,
  leaveChatValidator,
  deleteChatValidator
} = require('../validators/chatValidator');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Create a new chat (1-on-1 or group)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 example: [2, 3]
 *               title:
 *                 type: string
 *                 example: Project Team
 *               isGroup:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Chat created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', createChatValidator, validate, chatController.createChat);

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get all chats for current user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 */
router.get('/', chatController.getChats);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   get:
 *     summary: Get chat details and members
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Chat details retrieved
 *       403:
 *         description: Not a member of this chat
 *       404:
 *         description: Chat not found
 */
router.get('/:chatId', getChatValidator, validate, chatController.getChatById);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get messages from a chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to retrieve
 *         example: 20
 *       - in: query
 *         name: before
 *         schema:
 *           type: integer
 *         description: Message ID for pagination
 *         example: 100
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       403:
 *         description: Not a member of this chat
 */
router.get('/:chatId/messages', getMessagesValidator, validate, chatController.getMessages);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   put:
 *     summary: Update chat (title, add members)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Chat Title
 *               addUserIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [4, 5]
 *     responses:
 *       200:
 *         description: Chat updated successfully
 */
router.put('/:chatId', updateChatValidator, validate, chatController.updateChat);

/**
 * @swagger
 * /api/chats/{chatId}/leave:
 *   post:
 *     summary: Leave a chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully left the chat
 *       404:
 *         description: Not a member of this chat
 */
router.post('/:chatId/leave', leaveChatValidator, validate, chatController.leaveChat);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   delete:
 *     summary: Delete chat (creator only)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *       403:
 *         description: Only creator can delete
 *       404:
 *         description: Chat not found
 */
router.delete('/:chatId', deleteChatValidator, validate, chatController.deleteChat);

module.exports = router;