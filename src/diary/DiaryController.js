const { createDiary, getDiaryByUserId, deleteDiaryById , updateDiaryById } = require('./DiaryService');
const ForbiddenException = require('../error/ForbiddenException');
const NotFoundException = require('../error/NotFoundException');
const messages = require('../messages/');

const getDiary = async (req, res) => {
  const userId = req.user;
  const diary = await getDiaryByUserId(userId);

  res.send({ diary });
};

const postDiary = async (req, res, next) => {
  const userId = req.user;

  let checkExistingDiary = await getDiaryByUserId(userId);
  if (checkExistingDiary) {
    return next(new ForbiddenException());
  }

  const diary = await createDiary(req.body);
  res.send({ diary });
};

const deleteDiary = async (req, res, next) => {
  const userId = req.user;

  let existingDiary = await getDiaryByUserId(userId);
  if (!existingDiary) {
    return next(new NotFoundException(messages.invalid_no_diary_for_user));
  }
  await deleteDiaryById(existingDiary.id);
  res.send();
};

const updateDiary = async (req, res, next) => {
  const userId = req.user;
  const data = req.body;

  let existingDiary = await getDiaryByUserId(userId);
  if (!existingDiary) {
    return next(new NotFoundException(messages.invalid_no_diary_for_user));
  }
  const diary  = await updateDiaryById(existingDiary.id,data);
  res.send({diary});
};

module.exports = {
  getDiary,
  postDiary,
  deleteDiary,
  updateDiary
};
