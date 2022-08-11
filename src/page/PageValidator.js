const { check, validationResult } = require('express-validator');
const messages = require('../messages');
const ValidationException = require('../error/ValidationException');

const postPageValidator = [
  check('date')
    .not()
    .isEmpty()
    .bail()
    .withMessage(messages.invalid_page_date_empty)
    .isISO8601()
    .toDate()
    .withMessage(messages.invalid_page_date_not_date),
  check('time')
      .not()
      .isEmpty()
      .bail()
      .withMessage(messages.invalid_page_time_empty)
    .matches(/^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/)
    .bail()
    .withMessage(messages.invalid_page_time_not_time),

  check('title')
    .trim()
    .not()
    .isEmpty()
    .bail()
    .withMessage(messages.invalid_page_title_empty)
    .isLength({ min: 3, max: 400 })
    .bail()
    .withMessage(messages.invalid_page_title_length),
  check('content')
    .trim()
    .not()
    .isEmpty()
    .bail()
    .withMessage(messages.invalid_page_content_empty)
    .isLength({ min: 3, max: 10000 })
    .bail()
    .withMessage(messages.invalid_page_content_length),
];

module.exports = {
  postPageValidator,
};
