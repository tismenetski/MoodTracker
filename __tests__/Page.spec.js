const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const messages = require('../src/messages');
const User = require('../src/user/User');
const Diary = require('../src/diary/Diary');
const Page = require('../src/page/Page');
const bcrypt = require('bcrypt');

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }
  jest.setTimeout(20000);
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } });
  await Diary.destroy({ truncate: { cascade: true } });
  await Page.destroy({ truncate: true });
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

const now = new Date();
const goodPage = {
  date: '2022-08-10',
  time: '20:00',
  title: 'Today i had fun',
  content: 'We ate ice cream and played outside',
};

/**
 * Create the authentication request.
 * @returns {Promise<void>}
 * @param credentials
 */
const postAuthentication = async (credentials = goodCredentials) => {
  return await request(app).post('/api/1.0/auth').send(credentials);
};

const addUser = async (user = { ...validUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const addDiary = async (userId) => {
  const data = {
    name: 'TEST',
    userId,
  };
  return await Diary.create(data);
};

const postPage = async (token, data) => {
  return await request(app).post('/api/1.0/diary/page').set('Authorization', token).send(data);
};

const getPages =  (token) => {
  return  request(app).get('/api/1.0/diary/page').set('Authorization', token);
};

const addPages = async (amount, token) => {
  for (let i = 0; i < amount; i++) {
    await postPage(token, { ...goodPage, title: `The title is ${i + 1}` });
  }
};

describe('Diary Page', () => {
  it('should return 200 ok when trying to create page when credentials are ok', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    const response = await postPage(token, goodPage);
    expect(response.status).toBe(200);
  });

  it('should return 401 when trying to create page when user not authenticated', async () => {
    await addUser();
    const response = await postPage('adasdasd', {});
    expect(response.status).toBe(401);
  });

  it('should return page object when trying to create a page with good credentials', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    const response = await postPage(token, goodPage);
    expect(response.body.page).toBeTruthy();
  });

  it('should return 400 when trying to create a page with invalid data with good credentials', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    const response = await postPage(token, {});
    expect(response.status).toBe(400);
  });

  it.each`
    field        | value                | message
    ${'date'}    | ${null}              | ${messages.invalid_page_date_empty}
    ${'date'}    | ${''}                | ${messages.invalid_page_date_empty}
    ${'date'}    | ${'22222'}           | ${messages.invalid_page_date_not_date}
    ${'time'}    | ${null}              | ${messages.invalid_page_time_empty}
    ${'time'}    | ${''}                | ${messages.invalid_page_time_empty}
    ${'time'}    | ${'25:25'}           | ${messages.invalid_page_time_not_time}
    ${'title'}   | ${null}              | ${messages.invalid_page_title_empty}
    ${'title'}   | ${''}                | ${messages.invalid_page_title_empty}
    ${'title'}   | ${'22'}              | ${messages.invalid_page_title_length}
    ${'title'}   | ${'a'.repeat(401)}   | ${messages.invalid_page_title_length}
    ${'content'} | ${null}              | ${messages.invalid_page_content_empty}
    ${'content'} | ${''}                | ${messages.invalid_page_content_empty}
    ${'content'} | ${'22'}              | ${messages.invalid_page_content_length}
    ${'content'} | ${'a'.repeat(10001)} | ${messages.invalid_page_content_length}
  `('should return $message when field is $field and value is $value', async ({ field, value, message }) => {
    await addUser();
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    const data = { ...goodPage };
    data[field] = value;
    const response = await postPage(token, data);
    expect(response.body.validationErrors[field]).toBe(message);
  });

  it('should return 400 when trying to create page when user doesnt have diary', async () => {
    await addUser();
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    const response = await postPage(token, goodPage);
    expect(response.status).toBe(403);
  });

  it('should return 200 ok when trying to get pages with good credentials', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    const response = await getPages(token);
    expect(response.status).toBe(200);
  });

  it('should return pagination object  when trying to get pages with good credentials', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    const response = await getPages(token);
    expect(response.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });

  it('should return 401 when trying to get pages with bad credentials', async () => {
    const token = 'asdasd';
    const response = await getPages(token);
    expect(response.status).toBe(401);
  });

  it('should return pages only for the specific user', async () => {
    const user1 = await addUser();
    const diary1 = await addDiary(user1.id);
    const responseAuth1 = await postAuthentication();
    const token1 = responseAuth1.body.token;
    await postPage(token1, goodPage);

    const user2 = await addUser();
    await addDiary(user2.id);
    const responseAuth2 = await postAuthentication();
    const token2 = responseAuth2.body.token;
    await postPage(token2, goodPage);

    const response = await getPages(token1);
    expect(response.body.content[0].diaryId).toBe(diary1.id);
  });


  it('should return 6 diary pages when 6 pages created', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    await addPages(6, token);
    const response = await getPages(token);
    expect(response.body.content.length).toBe(6);
  });

  it('should return totalPages 2 when 16 pages are created', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    await addPages(16, token);
    const response = await getPages(token);
    expect(response.body.totalPages).toBe(2);
  });

  it('should return 6 diary pages when requesting page number 2 of pagination when 16 pages are created', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    await addPages(16, token);
    const response = await getPages(token).query({page : 1});
    expect(response.body.content.length).toBe(6);
  });

  it('should return 8 diary pages when requesting page number 2 and size 8 per page of pagination when 16 pages are created', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    await addPages(16, token);
    const response = await getPages(token).query({page : 1 , size : 8});
    expect(response.body.content.length).toBe(8);
  });

  it('should return 10 diary pages when requesting invalid page and invalid size when 16 pages are created', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    await addPages(16, token);
    const response = await getPages(token).query({page : 'page' , size : 'size'});
    expect(response.body.content.length).toBe(10);
  });

  it('should return 5 diary pages when requesting invalid page and invalid size when 5 pages are created', async () => {
    const user = await addUser();
    await addDiary(user.id);
    const responseAuth = await postAuthentication();
    const token = responseAuth.body.token;
    await addPages(5, token);
    const response = await getPages(token).query({page : 'page' , size : 'size'});
    expect(response.body.content.length).toBe(5);
  });
});
