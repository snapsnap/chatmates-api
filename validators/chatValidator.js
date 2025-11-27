const { body, query, param } = require('express-validator');

const createChatValidator = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be an array with at least 1 user'),
  body('userIds.*')
    .isInt()
    .withMessage('Each userId must be an integer'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('isGroup')
    .optional()
    .isBoolean()
    .withMessage('isGroup must be a boolean')
];

const updateChatValidator = [
  param('chatId')
    .isInt()
    .withMessage('chatId must be an integer'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('addUserIds')
    .optional()
    .isArray()
    .withMessage('addUserIds must be an array'),
  body('addUserIds.*')
    .optional()
    .isInt()
    .withMessage('Each userId must be an integer')
];

const getChatValidator = [
  param('chatId')
    .isInt()
    .withMessage('chatId must be an integer')
];

const getMessagesValidator = [
  param('chatId')
    .isInt()
    .withMessage('chatId must be an integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),
  query('before')
    .optional()
    .isInt()
    .withMessage('before must be an integer')
];

const leaveChatValidator = [
  param('chatId')
    .isInt()
    .withMessage('chatId must be an integer')
];

const deleteChatValidator = [
  param('chatId')
    .isInt()
    .withMessage('chatId must be an integer')
];

module.exports = {
  createChatValidator,
  updateChatValidator,
  getChatValidator,
  getMessagesValidator,
  leaveChatValidator,
  deleteChatValidator
};