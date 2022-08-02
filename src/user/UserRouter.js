const express = require('express');
const router = express.Router();
const { register, activateAccount , login } = require('./UserController');
const userValidator = require('./UserValidator');

router.post('/api/1.0/users', userValidator, register);

router.post('/api/1.0/users/token/:token', activateAccount);

router.post('/api/1.0/auth', login);

module.exports = router;
