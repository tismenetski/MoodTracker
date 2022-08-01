const express = require('express');
const UserRouter = require('../src/user/UserRouter');
const errorHandler = require('./error/ErrorHandler');

const app = express();

app.use(express.json());

app.use(UserRouter);

app.use(errorHandler);
module.exports = app;
