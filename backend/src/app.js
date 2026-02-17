'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { httpLogger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');

const app = express();

// ============================================================
// 安全中间件
// ============================================================
app.use(helmet()); // 设置安全HTTP响应头
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================================
// 解析中间件
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// HTTP请求日志
// ============================================================
app.use(httpLogger);

// ============================================================
// 健康检查接口（不需要身份验证）
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// API路由（后续按模块逐步注册）
// ============================================================
const apiV1 = express.Router();

// TODO: 随业务模块开发逐步取消注释并添加路由
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/user');
// const planningRoutes = require('./routes/planning');
// const ichingRoutes = require('./routes/iching');

// apiV1.use('/auth', authRoutes);
// apiV1.use('/users', userRoutes);
// apiV1.use('/planning', planningRoutes);
// apiV1.use('/iching', ichingRoutes);

app.use('/api/v1', apiV1);

// ============================================================
// 404处理（必须在所有路由之后）
// ============================================================
app.use((req, res, next) => {
  next(new NotFoundError(`接口 ${req.method} ${req.originalUrl}`));
});

// ============================================================
// 全局错误处理（必须在最后，有4个参数）
// ============================================================
app.use(errorHandler);

module.exports = app;
