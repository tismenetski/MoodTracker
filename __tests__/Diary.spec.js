const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const messages = require('../src/messages');
const bcrypt = require('bcrypt');
const Diary = require('../src/diary/Diary');

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }
  jest.setTimeout(20000);
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } });
  await Diary.destroy({ truncate: true });
});

afterAll(async () => {
  jest.setTimeout(5000);
});

const validUser = {
  name: 'Maxim Tsigalko',
  email: 'user@mail.com',
  password: 'P4ssword',
  inactive: false,
};

const goodCredentials = {
  email: 'user@mail.com',
  password: 'P4ssword',
};

const badCredentials = {
  email: 'userrrrrr@mail.com',
  password: 'P4ssword123',
};

const addUser = async (user = { ...validUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

/**
 * Create the authentication request.
 * @returns {Promise<void>}
 * @param credentials
 */
const postAuthentication = async (credentials = goodCredentials) => {
  return await request(app).post('/api/1.0/auth').send(credentials);
};

describe('Create Diary', () => {
  it('should create diary object when request with valid token and the diary contains the user id', async () => {
    const user = await addUser();
    const loginResponse = await postAuthentication();
    let data = {
      name: 'Test',
      userId: user.id,
    };
    const response = await request(app)
      .post('/api/1.0/diary')
      .set('Authorization', loginResponse.body.token)
      .send(data);

    const diary = response.body.diary;
    expect(diary).toBeTruthy();
    expect(diary.userId).toBe(user.id);
  });

  it('should return 403 status when a user already have a diary', async () => {
    const user = await addUser();
    const loginResponse = await postAuthentication();
    let data = {
      name: 'Test',
      userId: user.id,
    };
    await request(app).post('/api/1.0/diary').set('Authorization', loginResponse.body.token).send(data);

    const anotherResponse = await request(app)
      .post('/api/1.0/diary')
      .set('Authorization', loginResponse.body.token)
      .send(data);
    expect(anotherResponse.status).toBe(403);
  });
});

describe('Read Diary', () => {
  it('should return 200 when requesting user diary with valid token', async () => {
    await addUser();
    const loginResponse = await postAuthentication();
    const response = await request(app).get('/api/1.0/diary').set('Authorization', loginResponse.body.token).send();
    expect(response.status).toBe(200);
  });

  it('should return diary object  when requesting user diary with valid token', async () => {
    const user = await addUser();
    const loginResponse = await postAuthentication();
    let data = {
      name: 'Test',
      userId: user.id,
    };
    await request(app).post('/api/1.0/diary').set('Authorization', loginResponse.body.token).send(data);
    const response = await request(app).get('/api/1.0/diary').set('Authorization', loginResponse.body.token).send();
    const body = response.body;
    expect(body.diary).toBeTruthy();
  });

  it('should return 401 when requesting user diary with invalid token', async () => {
    await addUser();
    const response = await request(app).get('/api/1.0/diary').set('Authorization', 'BLABLABLA').send();
    expect(response.status).toBe(401);
  });

  it('should return body with error message when requesting user diary with invalid token', async () => {
    await addUser();
    const response = await request(app).get('/api/1.0/diary').set('Authorization', 'BLABLABLA').send();
    expect(response.body.message).toBe(messages.invalid_jwt_token);
  });
});

describe('Update Diary', () => {
  it('should return 200 when requesting to update user diary with valid token', async () => {
    const user = await addUser();
    const loginResponse = await postAuthentication();
    let diary = {
      name: 'Test',
      userId: user.id,
    };
    await request(app).post('/api/1.0/diary').set('Authorization', loginResponse.body.token).send(diary);

    diary = {
      name: 'Test2',
      userId: user.id,
    };
    const response = await request(app)
      .put('/api/1.0/diary')
      .set('Authorization', loginResponse.body.token)
      .send(diary);
    expect(response.status).toBe(200);
    expect(response.body.diary.name).toBe('Test2');
  });

  it('should return 404 when requesting to update user diary with valid token when there is no diary', async () => {
    const user = await addUser();
    const loginResponse = await postAuthentication();
    const diary = {
      name: 'Test2',
      userId: user.id,
    };
    const response = await request(app)
      .put('/api/1.0/diary')
      .set('Authorization', loginResponse.body.token)
      .send(diary);
    expect(response.status).toBe(404);
  });

  it('should return body with error message when requesting to update user diary with valid token when there is no diary', async () => {
    const user = await addUser();
    const loginResponse = await postAuthentication();
    const diary = {
      name: 'Test2',
      userId: user.id,
    };
    const response = await request(app)
      .put('/api/1.0/diary')
      .set('Authorization', loginResponse.body.token)
      .send(diary);
    expect(response.body.message).toBe(messages.invalid_no_diary_for_user);
  });
});

describe('Delete Diary', () => {
  it('should return 200 when requesting to delete user diary with valid token', async () => {
    const user = await addUser();
    const loginResponse = await postAuthentication();
    let data = {
      name: 'Test',
      userId: user.id,
    };
    await request(app).post('/api/1.0/diary').set('Authorization', loginResponse.body.token).send(data);
    const response = await request(app).delete('/api/1.0/diary').set('Authorization', loginResponse.body.token).send();
    expect(response.status).toBe(200);
  });

  it('should return 404 when requesting to delete user diary with valid token when there is no diary', async () => {
    await addUser();
    const loginResponse = await postAuthentication();

    const response = await request(app).delete('/api/1.0/diary').set('Authorization', loginResponse.body.token).send();
    expect(response.status).toBe(404);
  });

  it('should return body with error message when requesting to delete user diary with valid token when there is no diary', async () => {
    await addUser();
    const loginResponse = await postAuthentication();

    const response = await request(app).delete('/api/1.0/diary').set('Authorization', loginResponse.body.token).send();
    expect(response.body.message).toBe(messages.invalid_no_diary_for_user);
  });
});
