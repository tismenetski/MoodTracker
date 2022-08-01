module.exports = {
  database: {
    database: 'mood-tracker',
    username: 'user',
    password: '',
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
  },
  mail: {
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'delpha.dibbert@ethereal.email',
      pass: '5WysuJPrq1F2w9epAr'
    },
  },
};
