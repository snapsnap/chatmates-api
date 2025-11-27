const { body, query, param } = require('express-validator');

const searchUserValidator = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
];

const getUserValidator = [
  param('userId')
    .isInt()
    .withMessage('userId must be an integer')
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Name must be between 2 and 150 characters'),
  body('avatar')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Avatar URL must not exceed 255 characters')
];

module.exports = {
  searchUserValidator,
  getUserValidator,
  updateProfileValidator
};