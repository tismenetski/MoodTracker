const {
  saveUser,
  activateUser,
  findByEmail,
  generatePasswordReset,
  findByPasswordResetToken,
} = require('./UserService');
const AuthenticationException = require('../error/AuthenticationException');
const ForbiddenException = require('../error/ForbiddenException');
const NotFoundException = require('../error/NotFoundException');
const messages = require('../messages');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const { validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  await saveUser({ name, email, password });
  res.send({ message: messages.valid_activation_account_sent });
};

const activateAccount = async (req, res, next) => {
  const { token } = req.params;
  try {
    await activateUser(token);
    res.send({ message: messages.valid_activation_token });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AuthenticationException());
  }
  const user = await findByEmail(email);
  if (!user) {
    return next(new AuthenticationException());
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return next(new AuthenticationException());
  }

  if (user.inactive) {
    return next(new ForbiddenException(messages.invalid_login_account_not_activated));
  }

  const token = await jwt.sign({ userId: user.id, name: user.name, email: user.email }, config.security.jwt_secret, {
    expiresIn: '30d',
  });
  res.send({ user: { id: user.id, name: user.name, email: user.email }, token });
};

const passwordReset = async (req, res, next) => {
  const { email } = req.body;

  let user = await findByEmail(email);

  if (!user) {
    return next(new NotFoundException(messages.invalid_password_reset_unknown_mail));
  }

  if (user.inactive) {
    return next(new ForbiddenException());
  }

  try {
    await generatePasswordReset(user);
  } catch (error) {
    return next(error);
  }

  res.send({ message: messages.valid_password_reset_request });
};

const passwordUpdate = async (req, res, next) => {
  const { passwordResetToken, password } = req.body;
  const user = await findByPasswordResetToken(passwordResetToken);
  if (!user) {
    return next(new ForbiddenException(messages.invalid_password_reset_token));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationException(errors.array()));
  }

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = null;
  await user.save();

  res.send({message: messages.password_reset_success});
};

module.exports = {
  register,
  activateAccount,
  login,
  passwordReset,
  passwordUpdate,
};
