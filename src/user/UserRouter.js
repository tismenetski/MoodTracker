const express = require('express')
const router = express.Router();
const {register} = require('./UserController');
const userValidator = require('./UserValidator');



router.post('/api/1.0/users' ,userValidator, register);


module.exports = router