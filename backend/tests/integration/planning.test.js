'use strict';

/**
 * planning 接口集成测试
 * 覆盖：GET /, POST /, GET /:id, PUT /:id, PATCH /:id/status, DELETE /:id
 */

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, PlanningRecord } = require('../../src/models/index');

// 测试用账号数据（两个用户，用于测试权限隔离）
const userA = {
  email: 'planning_user_a@example.com',
  password: 'Test1234!',
  nickname: '用户A'
};
const userB = {
  email: 'planning_user_b@example.com',
  password: 'Test1234!',
  nickname: '用户B'
};

let tokenA = '';     // 用户A的Token
let tokenB = '';     // 用户B的Token
let recordId = null; // 用户A创建的记录ID

beforeAll(async () => {
  // 同步测试库表结构
  await sequelize.sync({ force: true });

  // 注册用户A，获取Token
  const resA = await request(app)
    .post('/api/v1/auth/register')
    .send(userA);

  if (resA.status !== 201) {
    throw new Error(`用户A注册失败: ${resA.status} ${JSON.stringify(resA.body)}`);
  }
  tokenA = resA.body.data.token;

  // 注册用户B，获取Token
  const resB = await request(app)
    .post('/api/v1/auth/register')
    .send(userB);

  if (resB.status !== 201) {
    throw new Error(`用户B注册失败: ${resB.status} ${JSON.stringify(resB.body)}`);
  }
  tokenB = resB.body.data.token;
}, 30000); // 增加超时时间到 30 秒

afterAll(async () => {
  // 清理测试数据（不在此处关闭连接，避免影响其他测试套件）
  await PlanningRecord.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
});

// ============================================================
describe('POST /api/v1/planning', () => {

  it('创建人生规划（必填字段）→ 201', async () => {
    const res = await request(app)
      .post('/api/v1/planning')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'life', title: '我的人生规划' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('type', 'life');
    expect(res.body.data).toHaveProperty('title', '我的人生规划');
    expect(res.body.data).toHaveProperty('status', 'active'); // 默认状态

    // 保存 recordId 供后续测试使用
    recordId = res.body.data.id;
  });

  it('创建带完整字段的规划 → 201', async () => {
    const res = await request(app)
      .post('/api/v1/planning')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'career',
        title: '职业发展规划',
        content: '五年内成为技术总监',
        startDate: '2026-01-01',
        endDate: '2031-01-01',
        targetScore: 90
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('type', 'career');
    expect(res.body.data).toHaveProperty('targetScore', 90);
  });

  it('缺少必填字段 type → 400', async () => {
    const res = await request(app)
      .post('/api/v1/planning')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '没有类型的规划' });

    expect(res.status).toBe(400);
  });

  it('缺少必填字段 title → 400', async () => {
    const res = await request(app)
      .post('/api/v1/planning')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'life' });

    expect(res.status).toBe(400);
  });

  it('无效的 type 值 → 400', async () => {
    const res = await request(app)
      .post('/api/v1/planning')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'invalid_type', title: '无效类型' });

    expect(res.status).toBe(400);
  });

  it('未登录 → 401', async () => {
    const res = await request(app)
      .post('/api/v1/planning')
      .send({ type: 'life', title: '未登录创建' });

    expect(res.status).toBe(401);
  });
});

// ============================================================
describe('GET /api/v1/planning', () => {

  it('获取列表 → 200，只返回自己的记录', async () => {
    const res = await request(app)
      .get('/api/v1/planning')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    // paginated() 返回 data.list 和 data.pagination
    expect(res.body.data).toHaveProperty('list');
    expect(res.body.data).toHaveProperty('pagination');
    expect(res.body.data.pagination).toHaveProperty('page', 1);
    expect(res.body.data.pagination).toHaveProperty('pageSize', 20);
    // 用户A创建了2条记录
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it('按类型筛选 → 只返回指定类型', async () => {
    const res = await request(app)
      .get('/api/v1/planning?type=life')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    res.body.data.list.forEach((row) => {
      expect(row.type).toBe('life');
    });
  });

  it('分页参数 → 返回正确的页码信息', async () => {
    const res = await request(app)
      .get('/api/v1/planning?page=1&pageSize=1')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.list).toHaveLength(1);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.pageSize).toBe(1);
  });

  it('用户B的列表为空（数据隔离）', async () => {
    const res = await request(app)
      .get('/api/v1/planning')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it('未登录 → 401', async () => {
    const res = await request(app).get('/api/v1/planning');
    expect(res.status).toBe(401);
  });
});

// ============================================================
describe('GET /api/v1/planning/:id', () => {

  it('获取自己的记录详情 → 200', async () => {
    const res = await request(app)
      .get(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', recordId);
    expect(res.body.data).toHaveProperty('title', '我的人生规划');
  });

  it('获取他人的记录 → 403', async () => {
    const res = await request(app)
      .get(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  it('记录不存在 → 404', async () => {
    const res = await request(app)
      .get('/api/v1/planning/99999')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });
});

// ============================================================
describe('PUT /api/v1/planning/:id', () => {

  it('更新自己的记录 → 200', async () => {
    const res = await request(app)
      .put(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '更新后的人生规划', content: '新增了内容' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('title', '更新后的人生规划');
  });

  it('不能通过 PUT 修改 type 字段（白名单保护）→ 200但type未变', async () => {
    const res = await request(app)
      .put(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '合法标题', type: 'habit' }); // type 不在白名单

    expect(res.status).toBe(200);
    // 只更新了title，type 应仍为 life
    expect(res.body.data.type).toBe('life');
  });

  it('空body → 400', async () => {
    const res = await request(app)
      .put(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('更新他人的记录 → 403', async () => {
    const res = await request(app)
      .put(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: '越权修改' });

    expect(res.status).toBe(403);
  });
});

// ============================================================
describe('PATCH /api/v1/planning/:id/status', () => {

  it('更新为 completed → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/planning/${recordId}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status', 'completed');
  });

  it('无效状态值 → 400', async () => {
    const res = await request(app)
      .patch(`/api/v1/planning/${recordId}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'invalid_status' });

    expect(res.status).toBe(400);
  });

  it('更新他人记录状态 → 403', async () => {
    const res = await request(app)
      .patch(`/api/v1/planning/${recordId}/status`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'paused' });

    expect(res.status).toBe(403);
  });
});

// ============================================================
describe('DELETE /api/v1/planning/:id', () => {

  it('删除他人的记录 → 403', async () => {
    const res = await request(app)
      .delete(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  it('删除自己的记录 → 204', async () => {
    const res = await request(app)
      .delete(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(204);
  });

  it('删除后再次查询 → 404（软删除后不可见）', async () => {
    const res = await request(app)
      .get(`/api/v1/planning/${recordId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });
});
