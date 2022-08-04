const express = require('express');
const router = express.Router();
const { register, activateAccount, login, passwordReset, passwordUpdate } = require('./UserController');
const { validateUser ,validatePassword , password } = require('./UserValidator');

router.post('/api/1.0/users', validateUser, register);

router.post('/api/1.0/users/token/:token', activateAccount);

router.post('/api/1.0/auth', login);

router.post('/api/1.0/auth/password-reset', passwordReset);

router.put('/api/1.0/auth/password-update',password, passwordUpdate);

module.exports = router;
