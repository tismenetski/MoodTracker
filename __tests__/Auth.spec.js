const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const messages = require('../src/messages');

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

  it('should return validationErrors field in response body when there are validation errors', async () => {
    const response = await postUser({
      name: null,
      email: 'user@mail.com',
      password: 'P4ssword',
    });
    expect(response.body.validationErrors).not.toBeUndefined();
  });
  it('should return errors when both name and email are null', async () => {
    const response = await postUser({
      name: null,
      email: null,
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });
  it.each`
    field         | value              | expectedMessage
    ${'name'}     | ${null}            | ${messages.invalid_name_empty}
    ${'name'}     | ${'aa'}            | ${messages.invalid_name_length}
    ${'email'}    | ${null}            | ${messages.invalid_email}
    ${'email'}    | ${'mail.com'}      | ${messages.invalid_email}
    ${'email'}    | ${'user.mail.com'} | ${messages.invalid_email}
    ${'email'}    | ${'user@mail'}     | ${messages.invalid_email}
    ${'password'} | ${null}            | ${messages.invalid_password_empty}
    ${'password'} | ${'P4ssw'}         | ${messages.invalid_password_length}
    ${'password'} | ${'alllowercase'}  | ${messages.invalid_password_structure}
    ${'password'} | ${'ALLUPPERCASE'}  | ${messages.invalid_password_structure}
    ${'password'} | ${'1234567890'}    | ${messages.invalid_password_structure}
    ${'password'} | ${'lowerandUPPER'} | ${messages.invalid_password_structure}
    ${'password'} | ${'lower4nd5667'}  | ${messages.invalid_password_structure}
    ${'password'} | ${'UPPER44444'}    | ${messages.invalid_password_structure}
  `(
    'should return $expectedMessage when field is $field and value is $value',
    async ({ field, value, expectedMessage }) => {
      const data = {
        name: 'user',
        email: 'user@mail.com',
        password: 'P4ssword',
      };
      data[field] = value;
      const response = await postUser(data);
      expect(response.body.validationErrors[field]).toBe(expectedMessage);
    }
  );
});
