const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const messages = require('../src/messages');
const config = require('config');
const bcrypt = require('bcrypt');

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } });
});

const badCredentials = { email: null, password: null };
const credentials = { email: 'user1@mail.com', password: 'P4ssword' };
const activeUser = { name: 'Maxim Tsigalko', email: 'user1@mail.com', password: 'P4ssword', inactive: false };

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const postAuthentication = async (credentials) => {
  return await request(app).post('/api/1.0/auth').send(credentials);
};

describe('User Login', () => {
  it('should return 200 ok when credentials are correct', async () => {
    await addUser();
    const response = await postAuthentication(credentials);
    expect(response.status).toBe(200);
  });

  it('should return 401 when request does not contain email or password', async () => {
    await addUser();
    const response = await postAuthentication(badCredentials);
    expect(response.status).toBe(401);
  });

  it('should return 401 when user does not exist', async () => {
    const response = await postAuthentication(badCredentials);
    expect(response.status).toBe(401);
  });

  it('should return 401 when request body email not found in users table', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user@user.com', password: 'P4ssword' });
    expect(response.status).toBe(401);
  });

  it('should return 401 when request body password not matching the password for user', async () => {
    await addUser();
    const response = await postAuthentication({ ...credentials, password: 'aaa' });
    expect(response.status).toBe(401);
  });

  it('returns proper error body when authentication fails', async () => {
    const nowInMillis = new Date().getTime();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const error = response.body;
    expect(error.path).toBe('/api/1.0/auth');
    expect(error.timestamp).toBeGreaterThan(nowInMillis);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it('should return 403 when credentials are correct but user is still inactive', async () => {
    await addUser({ ...activeUser, inactive: true });
    const response = await postAuthentication(credentials);
    expect(response.status).toBe(403);
  });

  it('should return message in response body when credentials are correct but account not activated', async () => {
    await addUser({ ...activeUser, inactive: true });
    const response = await postAuthentication(credentials);
    expect(response.body.message).toBe(messages.invalid_login_account_not_activated);
  });

  it('should return user and token in response body', async () => {
    await addUser();
    const response = await postAuthentication(credentials);
    const body = response.body;
    console.log(body);
    expect(Object.keys(body)).toEqual(['user', 'token']);
  });

  it('should return user in response body only with id,email,name', async () => {
    await addUser();
    const response = await postAuthentication(credentials);
    const user = response.body.user;
    expect(Object.keys(user)).toEqual(['id', 'name', 'email']);
  });

});
