const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Diary = require('../diary/Diary');

const Model = Sequelize.Model;

class User extends Model {}

User.init(
  {
    name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    inactive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    activationToken: {
      type: Sequelize.STRING,
    },
    passwordResetToken: {
      type: Sequelize.STRING,
    },
  },
  { sequelize, modelName: 'user' }
);

User.hasOne(Diary, { onDelete: 'cascade', foreignKey: 'userId' });

module.exports = User;
