const Diary = require('./Diary');

const createDiary = async (data) => {
  const diary = await Diary.create(data);
  return diary;
};

const getDiaryByUserId = async (userId) => {
  const diary = await Diary.findOne({ where: { userId } });
  return diary;
};

const deleteDiaryById = async (id) => {
  await Diary.destroy({ where: { id } });
};

const updateDiaryById = async (id, data) => {
  const diary = await Diary.findOne({ where: { id } });
  await diary.update(data);

  return diary;
};

module.exports = {
  createDiary,
  getDiaryByUserId,
  deleteDiaryById,
  updateDiaryById,
};
