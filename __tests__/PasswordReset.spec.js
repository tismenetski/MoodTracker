const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const messages = require('../src/messages');
const bcrypt = require('bcrypt');
const { SMTPServer } = require('smtp-server');
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

const activeUser = { name: 'Maxim Tsigalko', email: 'user1@mail.com', password: 'P4ssword', inactive: false };
const nonExistingMail = 'ttt@mail.com';

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const passwordResetRequest = async (email) => {
  return await request(app).post('/api/1.0/auth/password-reset').send({ email });
};

const putPasswordUpdate = async (body = {}) => {
  return await request(app).put('/api/1.0/auth/password-update').send(body);
};

describe('Password Reset Process', () => {
  it('should return 200 ok if email exists', async () => {
    await addUser();
    const response = await passwordResetRequest(activeUser.email);
    expect(response.status).toBe(200);
  });

  it('should send success message in body if the email is valid and mail was sent', async () => {
    await addUser();
    const response = await passwordResetRequest(activeUser.email);
    expect(response.body.message).toBe(messages.valid_password_reset_request);
  });

  it('should return 404 if email is not known', async () => {
    await addUser({ ...activeUser });
    const response = await passwordResetRequest(nonExistingMail);
    expect(response.status).toBe(404);
  });

  it(`should return error body if email is not known and message should be ${messages.invalid_password_reset_unknown_mail}`, async () => {
    await addUser({ ...activeUser });
    const nowInMillis = new Date().getTime();
    const response = await passwordResetRequest('user3@mail.com');
    expect(response.body.path).toBe('/api/1.0/auth/password-reset');
    expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
    expect(response.body.message).toBe(messages.invalid_password_reset_unknown_mail);
  });

  it('should return 403 email is known but user is still inactive', async () => {
    await addUser({ ...activeUser, inactive: true });
    const response = await passwordResetRequest(activeUser.email);
    expect(response.status).toBe(403);
  });

  it('should create passwordResetToken in user model when sending password reset request', async () => {
    await addUser({ ...activeUser });
    await passwordResetRequest(activeUser.email);
    const users = await User.findAll({});
    const user = users[0];
    expect(user.passwordResetToken).toBeTruthy();
  });

  it('should return the passwordResetToken in the mail body', async () => {
    await addUser({ ...activeUser });
    await passwordResetRequest(activeUser.email);
    const users = await User.findAll({});
    const user = users[0];
    expect(lastMail).toContain(user.passwordResetToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    simulateSmtpFailure = true;
    const user = await addUser();
    const response = await passwordResetRequest(user.email);
    expect(response.status).toBe(502);
  });

  it('returns 403 when trying to update password with bad token', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    const response = await putPasswordUpdate({ passwordResetToken: 'asasdqwe', password: 'P4ssword' });

    expect(response.status).toBe(403);
  });

  it('returns 403 when trying to update password with bad token', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    const response = await putPasswordUpdate({ passwordResetToken: 'asasdqwe', password: 'P4ssword' });
    expect(response.body.message).toBe(messages.invalid_password_reset_token);
  });

  it('returns 403 when both password pattern invalid and the password reset token is invalid', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    const response = await putPasswordUpdate({ passwordResetToken: 'asasdqwe', password: 'aaaaaaa' });
    expect(response.status).toBe(403);
  });

  it('returns 400 when  password pattern invalid and the password reset token is valid', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    const users = await User.findAll({});
    const passwordResetToken = users[0].passwordResetToken;
    const response = await putPasswordUpdate({ passwordResetToken, password: 'aaaaaaa' });
    expect(response.status).toBe(400);
  });

  it.each`
    value              | message
    ${null}            | ${messages.invalid_password_empty}
    ${'P4ssw'}         | ${messages.invalid_password_length}
    ${'alllowercase'}  | ${messages.invalid_password_structure}
    ${'ALLUPPERCASE'}  | ${messages.invalid_password_structure}
    ${'1234567890'}    | ${messages.invalid_password_structure}
    ${'lowerandUPPER'} | ${messages.invalid_password_structure}
    ${'lower4nd5667'}  | ${messages.invalid_password_structure}
    ${'UPPER44444'}    | ${messages.invalid_password_structure}
  `(
    'returns password validation error $message when language is set to $language and the value is $value',
    async ({ message, value }) => {
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      await user.save();
      const response = await putPasswordUpdate({
        password: value,
        passwordResetToken: 'test-token',
      });
      expect(response.body.validationErrors.password).toBe(message);
    }
  );

  it('returns 200 when  password pattern valid and the password reset token is valid', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    const users = await User.findAll({});
    const passwordResetToken = users[0].passwordResetToken;
    const response = await putPasswordUpdate({ passwordResetToken, password: 'P4ssword' });
    expect(response.status).toBe(200);
  });

  it('returns 200 and updates the password in database when password pattern valid and the password reset token is valid', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    let users = await User.findAll({});
    const passwordResetToken = users[0].passwordResetToken;
    await putPasswordUpdate({ passwordResetToken, password: 'P5ssword' });
    users = await User.findAll({});
    const savedUserPassword = users[0].password;
    const matchNewPassword = await bcrypt.compare('P5ssword', savedUserPassword);
    expect(matchNewPassword).toBeTruthy();
  });

  it('returns message in response body when  password pattern valid and the password reset token is valid', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    const users = await User.findAll({});
    const passwordResetToken = users[0].passwordResetToken;
    const response = await putPasswordUpdate({ passwordResetToken, password: 'P5ssword' });
    expect(response.body.message).toBe(messages.password_reset_success);
  });

  it('clears the reset token in database when the password reset process was successful', async () => {
    const user = await addUser();
    await passwordResetRequest(user.email);
    let users = await User.findAll({});
    let passwordResetToken = users[0].passwordResetToken;
     await putPasswordUpdate({ passwordResetToken, password: 'P5ssword' });
     users = await User.findAll({});
     passwordResetToken = users[0].passwordResetToken;
    expect(passwordResetToken).toBeNull();
  });
});
