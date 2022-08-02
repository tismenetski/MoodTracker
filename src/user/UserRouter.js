const express = require('express');
const router = express.Router();
const { register, activateAccount } = require('./UserController');
const userValidator = require('./UserValidator');

router.post('/api/1.0/users', userValidator, register);

router.post('/api/1.0/users/token/:token', activateAccount);

module.exports = router;
