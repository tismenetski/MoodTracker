const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Page = require("../page/Page");

const Model = Sequelize.Model;

class Diary extends Model {}

Diary.init(
  {
    name: {
      type: Sequelize.STRING,
    },

  },
  { sequelize, modelName: 'diary' }
);

Diary.hasMany(Page, { onDelete: 'cascade', foreignKey: 'diaryId' });

module.exports = Diary;
