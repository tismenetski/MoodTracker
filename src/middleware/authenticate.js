const jwt = require('jsonwebtoken');
const config = require('config');
const messages = require('../messages/index');
const AuthenticationException = require('../error/AuthenticationException');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    throw new AuthenticationException(messages.invalid_jwt_token);
  }

  try {
    const user = jwt.verify(token, config.security.jwt_secret);
    const { userId } = user;
    req.user = userId;
    next();
  } catch (error) {
    return next(new AuthenticationException(messages.invalid_jwt_token));
  }
};

module.exports = authenticate;
