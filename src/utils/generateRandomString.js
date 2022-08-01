const crypto = require('crypto');
const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};
module.exports = {
  generateRandomString,
};
