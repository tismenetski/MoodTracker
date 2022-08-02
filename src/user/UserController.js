const { saveUser, activateUser } = require('./UserService');
const messages = require('../messages');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  await saveUser({ name, email, password });
  res.send({ message: messages.valid_activation_account_sent });
};

const activateAccount = async (req, res, next) => {
  const { token } = req.params;
  try {
    await activateUser(token);
    res.send({message : messages.valid_activation_token});
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  activateAccount,
};
