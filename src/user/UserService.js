const User = require('./User');
const bcrypt = require('bcrypt');
const {generateRandomString} = require('../utils/generateRandomString');

const saveUser = async (data) => {
  const { name, email, password } = data;
  const hash = await bcrypt.hash(password, 10);

  const activationToken = generateRandomString(32);

  const user = await User.create({
    name,
    email,
    password: hash,
    activationToken
  });
  console.log(user);
  return user;
};


const findByEmail = async (email) => {

  const user =  await User.findOne({where : {email}})
  return user;

}

module.exports = {
  saveUser,findByEmail
};
