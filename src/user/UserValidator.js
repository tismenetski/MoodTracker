const { check, validationResult } = require('express-validator');
const messages = require('../messages');
const ValidationException = require('../error/ValidationException');
const UserService = require('./UserService');

const validateUser = [
  check('name')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage(messages.invalid_name_empty)
    .bail()
    .isLength({ min: 3 })
    .withMessage(messages.invalid_name_length),
  check('email')
    .isEmail()
    .withMessage(messages.invalid_email)
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error(messages.invalid_email_in_use);
      }
    }),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage(messages.invalid_password_empty)
    .bail()
    .isLength({ min: 8 })
    .withMessage(messages.invalid_password_length)
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage(messages.invalid_password_structure),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      return next(new ValidationException(errors.array()));
    }
    next();
  },
];

module.exports = validateUser;
