const User = require('./User');
const bcrypt = require('bcrypt');
const { generateRandomString } = require('../utils/generateRandomString');
const sequelize = require('../config/database');
const EmailService = require('../email/EmailService');
const EmailException = require('../email/EmailException');
const InvalidTokenException = require('./InvalidTokenException');
const messages = require('../messages');

const saveUser = async (data) => {
  const { name, email, password } = data;
  const hash = await bcrypt.hash(password, 10);

  const transaction = await sequelize.transaction();
  const user = await User.create(
    {
      name,
      email,
      password: hash,
      activationToken: generateRandomString(32),
    },
    { transaction }
  );
  try {
    await EmailService.sendAccountActivation(user.email, user.activationToken);
    await transaction.commit();
    return user;
  } catch (err) {
    await transaction.rollback();
    throw new EmailException();
  }
};



const findByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });

  return user;
};

const activateUser = async (activationToken) => {
  const user = await User.findOne({ where: { activationToken } });
  if (!user) {
    throw new InvalidTokenException(messages.invalid_activation_token);
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

module.exports = {
  saveUser,
  findByEmail,
  activateUser,
};
