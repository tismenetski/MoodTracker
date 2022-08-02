module.exports = {
  database: {
    database: 'mood-tracker',
    username: 'user',
    password: '',
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  mail: {
    host: 'localhost',
    port: Math.floor(Math.random() * 2000) + 10000,
    tls: {
      rejectUnauthorized: false,
    },
  },
  security: {
    jwt_secret: 'sdwrdfg422432435345gdfg35tegsfgdfgdsg5345345gfdfgvvccvb',
  },
};
