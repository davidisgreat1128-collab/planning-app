'use strict';

/**
 * auth 接口集成测试
 * 使用真实数据库（planning_app_test），测试完整的HTTP请求链路
 *
 * 运行前提:
 * - MySQL中存在 planning_app_test 数据库
 * - .env.test 配置正确
 */

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models/index');

// ============================================================
// 测试数据
// ============================================================
const testUser = {
  email: 'integration_test@example.com',
  password: 'Test1234!',
  nickname: '集成测试用户'
};

// ============================================================
// 生命周期钩子
// ============================================================
beforeAll(async () => {
  // 同步测试表结构（force:false 不删除已有数据）
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // 清理测试数据，关闭数据库连接
  await User.destroy({ where: {}, force: true });
  await sequelize.close();
});

beforeEach(async () => {
  // 每个测试前清空users表，保证测试独立
  await User.destroy({ where: {}, force: true });
});

// ============================================================
// 测试套件
// ============================================================

describe('POST /api/v1/auth/register', () => {

  it('注册成功 → 201，返回token和用户信息', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('email', testUser.email);
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('邮箱已注册 → 409 ConflictError', async () => {
    // 先注册一次
    await request(app).post('/api/v1/auth/register').send(testUser);

    // 再次注册同邮箱
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('缺少email → 400 ValidationError', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ password: 'Test1234!', nickname: '用户' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('密码不符合规则（纯数字）→ 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test2@example.com', password: '12345678', nickname: '用户' });

    expect(res.status).toBe(400);
  });

  it('昵称过短（1个字符）→ 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test3@example.com', password: 'Test1234!', nickname: 'A' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {

  beforeEach(async () => {
    // 每个测试前注册一个用户
    await request(app).post('/api/v1/auth/register').send(testUser);
  });

  it('登录成功 → 200，返回token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('email', testUser.email);
  });

  it('密码错误 → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('邮箱不存在 → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Test1234!' });

    expect(res.status).toBe(401);
  });

  it('邮箱不区分大小写', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email.toUpperCase(), password: testUser.password });

    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/auth/me', () => {

  it('携带有效Token → 200，返回用户信息', async () => {
    // 先注册并获取token
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    const { token } = registerRes.body.data;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email', testUser.email);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('未携带Token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('Token格式错误 → 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });
});

describe('健康检查', () => {
  it('GET /health → 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
