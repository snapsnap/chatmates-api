const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Name must be between 2 and 150 characters'),
  body('phone')
    .notEmpty()
    .withMessage('Phone is required')
    .trim()
    .matches(/^[0-9+\-() ]+$/)
    .withMessage('Invalid phone format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const loginValidator = [
  body('phone')
    .notEmpty()
    .withMessage('Phone is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  registerValidator,
  loginValidator
};