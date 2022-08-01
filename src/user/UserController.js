const { saveUser } = require('./UserService');
const { sendAccountActivation } = require('../email/EmailService');
const register = async (req, res) => {

  const { name, email, password } = req.body;
  const user = await saveUser({ name, email, password });
  await sendAccountActivation(user.email, user.activationToken);
  res.send();
};

module.exports = {
  register,
};
