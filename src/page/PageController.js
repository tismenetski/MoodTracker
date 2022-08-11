const PageService = require('./PageService');
const DiaryService = require('../diary/DiaryService');
const { validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');
const ForbiddenException = require('../error/ForbiddenException');

const postPage = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationException(errors.array()));
  }

  const diary = await DiaryService.getDiaryByUserId(req.user);
  if (!diary) {
    return next(new ForbiddenException());
  }

  const page = await PageService.createPage({ ...req.body, diaryId: diary.id });
  res.send({ page });
};

const getPages = async (req, res) => {
  const userId = req.user;
  const { page, size } = req.pagination;
  const pages = await PageService.getPages(page, size, userId);

  res.send(pages);
};

module.exports = {
  postPage,
  getPages,
};
