const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const SMTPServer = require('smtp-server').SMTPServer;
const sequelize = require('../src/config/database');
const messages = require('../src/messages');
const config = require('config');

let lastMail, server;
let simulateSmtpFailure = false; // variable used for simulating a mail sending failure situations

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });

  await server.listen(config.mail.port, 'localhost');
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }
  jest.setTimeout(20000);
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } });
});

afterAll(async () => {
  await server.close();
  jest.setTimeout(5000);
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

  it(`should send ${messages.valid_activation_account_sent} message when the email is sent`, async () => {
    const response = await postUser();
    expect(response.body.message).toBe(messages.valid_activation_account_sent);
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

  it(`should return ${messages.invalid_email_in_use} when trying to register with existing email`, async () => {
    await postUser();
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(messages.invalid_email_in_use);
  });

  it(`should return errors for both name null and email already in use`, async () => {
    await postUser();
    const response = await postUser({
      name: null,
      email: 'user@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['name', 'email']);
  });

  it('should create user with inactive set to true', async () => {
    await postUser();
    const users = await User.findAll();
    const user = users[0];
    expect(user.inactive).toBe(true);
  });

  it('should create user with inactive set to true even if we pass inactive false', async () => {
    await postUser({ ...validUser, inactive: false });
    const users = await User.findAll();
    const user = users[0];
    expect(user.inactive).toBe(true);
  });

  it('should create activation token for user', async () => {
    await postUser();
    const users = await User.findAll();
    const user = users[0];
    expect(user.activationToken).toBeTruthy();
  });

  it('should send activation email', async () => {
    await postUser();
    const users = await User.findAll();
    const activationToken = users[0].activationToken;
    expect(lastMail).toContain(activationToken);
  });
});

describe('Account Activation', () => {
  it('should activate the account when the right token is sent', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app).post(`/api/1.0/users/token/${token}`).send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });

  it('should remove the activationToken from the user after successful activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app).post(`/api/1.0/users/token/${token}`).send();
    users = await User.findAll();
    expect(users[0].activationToken).toBeNull();
  });

  it('should not activate the account if the token is wrong', async () => {
    await postUser();
    await request(app).post(`/api/1.0/users/token/123456`).send();
    const users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it.each`
    tokenStatus  | message
    ${'wrong'}   | ${messages.invalid_activation_token}
    ${'correct'} | ${messages.valid_activation_token}
  `('should provide $message when token status is $tokenStatus', async ({ tokenStatus, message }) => {
    await postUser();
    let users = await User.findAll();
    let token = users[0].activationToken;
    if (tokenStatus === 'wrong') {
      token = 'abcdefg';
    }
    const response = await request(app).post(`/api/1.0/users/token/${token}`).send();
    expect(response.body.message).toBe(message);
  });
});

describe('Error Model', () => {
  it('returns path, timestamp, message and validationErrors in response when validation failure', async () => {
    const response = await postUser({ ...validUser, name: null });
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message', 'validationErrors']);
  });
  it('returns path, timestamp and message in response when request fails other than validation error', async () => {
    const token = 'this-token-does-not-exist';
    const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .send();
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message']);
  });
  it('returns path in error body', async () => {
    const token = 'this-token-does-not-exist';
    const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .send();
    const body = response.body;
    expect(body.path).toEqual('/api/1.0/users/token/' + token);
  });
  it('returns timestamp in milliseconds within 5 seconds value in error body', async () => {
    const nowInMillis = new Date().getTime();
    const fiveSecondsLater = nowInMillis + 5 * 1000;
    const token = 'this-token-does-not-exist';
    const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .send();
    const body = response.body;
    expect(body.timestamp).toBeGreaterThan(nowInMillis);
    expect(body.timestamp).toBeLessThan(fiveSecondsLater);
  });
});
