'use strict';

/**
 * users 接口集成测试
 * 覆盖：GET /me、PUT /me、POST /me/password
 */

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models/index');

// 测试用账号数据
const testUser = {
  email: 'user_module_test@example.com',
  password: 'Test1234!',
  nickname: '用户模块测试'
};

let authToken = '';   // 登录后保存的JWT Token
let userId = null;    // 注册后保存的用户ID

beforeAll(async () => {
  await sequelize.sync({ force: true });
}, 30000); // 增加超时时间到 30 秒

afterAll(async () => {
  await User.destroy({ where: {}, force: true });
});

// 每个测试套件前注册并登录，获取Token
beforeAll(async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send(testUser);
  authToken = res.body.data.token;
  userId = res.body.data.user.id;
});

// ============================================================
describe('GET /api/v1/users/me', () => {

  it('携带Token → 200，返回当前用户信息', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email', testUser.email);
    expect(res.body.data).toHaveProperty('nickname', testUser.nickname);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('未登录 → 401', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});

// ============================================================
describe('PUT /api/v1/users/me', () => {

  it('更新昵称 → 200，返回更新后数据', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nickname: '新昵称测试' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('nickname', '新昵称测试');
  });

  it('更新出生日期 → 200', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ birthDate: '1990-05-20' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('birthDate', '1990-05-20');
  });

  it('昵称过短（1字）→ 400', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nickname: 'A' });

    expect(res.status).toBe(400);
  });

  it('出生日期格式错误 → 400', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ birthDate: '1990/05/20' }); // 格式错误，应为YYYY-MM-DD

    expect(res.status).toBe(400);
  });

  it('空body（无更新字段）→ 400', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('尝试修改邮箱 → 200但邮箱未变（白名单保护）', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nickname: '合法修改', email: 'hacker@evil.com' });

    expect(res.status).toBe(200);
    // 邮箱不在白名单，不应被修改
    expect(res.body.data.email).toBe(testUser.email);
  });
});

// ============================================================
describe('POST /api/v1/users/me/password', () => {

  it('旧密码正确 → 204', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ oldPassword: testUser.password, newPassword: 'NewPass456!' });

    expect(res.status).toBe(204);
  });

  it('修改后用新密码能正常登录', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'NewPass456!' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  it('旧密码错误 → 400', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ oldPassword: 'WrongOld!', newPassword: 'NewPass456!' });

    expect(res.status).toBe(400);
  });

  it('新密码不符合强度要求（纯数字）→ 400', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ oldPassword: 'NewPass456!', newPassword: '12345678' });

    expect(res.status).toBe(400);
  });
});
