module.exports = function InvalidTokenException(message) {
  this.message = message || 'account_activation_failure';
  this.status = 400;
};
