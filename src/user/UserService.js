const User = require('./User');
const bcrypt = require('bcrypt');
const saveUser = async (data) => {
  const { name, email, password } = data;
  const hash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hash,
  });
};

module.exports = {
  saveUser,
};
