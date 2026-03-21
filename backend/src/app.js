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

// CORS 配置（支持域名访问 + Cookie）
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['*'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,  // 允许携带 Cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
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
// API路由
// ============================================================
console.log('🔧 App.js: 开始加载路由...');

const apiV1 = express.Router();

console.log('  加载 routes/auth.js...');
const authRoutes = require('./routes/auth');
console.log('  ✅ auth 路由加载成功');

console.log('  加载 routes/user.js...');
const userRoutes = require('./routes/user');
console.log('  ✅ user 路由加载成功');

console.log('  加载 routes/planning.js...');
const planningRoutes = require('./routes/planning');
console.log('  ✅ planning 路由加载成功');

console.log('  加载 routes/holiday.js...');
const holidayRoutes = require('./routes/holiday');
console.log('  ✅ holiday 路由加载成功');

console.log('  加载 routes/task.js...');
const taskRoutes = require('./routes/task');
console.log('  ✅ task 路由加载成功');

console.log('  加载 routes/alarm.js...');
const alarmRoutes = require('./routes/alarm');
console.log('  ✅ alarm 路由加载成功');

console.log('  加载 routes/log.js...');
const logRoutes = require('./routes/log');
console.log('  ✅ log 路由加载成功');

// const ichingRoutes = require('./routes/iching');

console.log('🔧 App.js: 开始注册路由到 Express...');
apiV1.use('/auth', authRoutes);
apiV1.use('/users', userRoutes);
apiV1.use('/planning', planningRoutes);
apiV1.use('/holidays', holidayRoutes);
apiV1.use('/tasks', taskRoutes);
apiV1.use('/alarms', alarmRoutes);
apiV1.use('/logs', logRoutes);
// apiV1.use('/iching', ichingRoutes);

app.use('/api/v1', apiV1);
console.log('✅ App.js: 所有路由注册成功');

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
