const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }
  jest.setTimeout(20000);
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } });
});

const validUser = {
  name: 'Maxim Tsigalko',
  email: 'user@mail.com',
  password: 'P4ssword',
};

const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('User Registration', () => {
  it('should return 200 ok when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('should save the user to database when request is valid', async () => {
    await postUser();
    const users = await User.findAll();
    expect(users.length).toBe(1);
  });

  it('should hash the password of the user when entered to database', async () => {
    await postUser();
    const users = await User.findAll();
    const user = users[0];

    expect(user.password).not.toBe('P4ssword');
  });

  it('should save the email and name to database', async () => {
    await postUser();
    const users = await User.findAll();
    const user = users[0];

    expect(user.name).toBe('Maxim Tsigalko');
    expect(user.email).toBe('user@mail.com');
  });

  it('should return 400 when name is null on registration request', async () => {
    const response = await postUser({
      name: null,
      email: 'user@mail.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });
});
