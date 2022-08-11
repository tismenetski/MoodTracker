const express = require('express');
const UserRouter = require('../src/user/UserRouter');
const DiaryRouter = require('./diary/DiaryRouter');
const PageRouter= require('./page/PageRouter');
const errorHandler = require('./error/ErrorHandler');

const app = express();

app.use(express.json());

app.use(UserRouter);
app.use(DiaryRouter);
app.use(PageRouter);
app.use(errorHandler);
module.exports = app;
