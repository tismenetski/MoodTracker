const { saveUser } = require('./UserService');
const register = async (req, res) => {
  const { name, email, password } = req.body;
  await saveUser({ name, email, password });
  res.send();
};

module.exports = {
  register,
};
