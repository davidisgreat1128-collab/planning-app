# 技术栈详解

---

## 后端技术栈

### Node.js + Express
- 版本: Node.js v22.20.0
- 入口文件: `backend/server.js`
- Express应用: `backend/src/app.js`
- 端口: 3000 (开发环境)

### Sequelize ORM (核心!)
- 版本: ^6.35.0
- 配置文件: `backend/src/config/database.js`
- 模型目录: `backend/src/models/`
- **关键配置**: `underscored: true` 实现snake_case↔camelCase自动映射
- **软删除**: `paranoid: true` 所有模型统一配置

### MySQL
- 版本: 8.0.43
- 开发库: `planning_app_dev`
- 生产库: `planning_app_prod`
- 连接配置: `backend/.env.development`

### JWT 认证
- 库: jsonwebtoken ^9.0.0
- 工具函数: `backend/src/utils/jwt.js`
- 中间件: `backend/src/middleware/auth.js`
- 过期时间: 7天

### 数据验证
- 库: Joi ^17.11.0
- 中间件: `backend/src/middleware/validator.js`

### 日志记录
- 库: Winston ^3.11.0
- 中间件: `backend/src/middleware/logger.js`
- 日志目录: `backend/logs/`

---

## 前端技术栈

### UniApp (Vue 3)
- 版本: Vue 3.x
- 创建工具: HBuilderX v4.76
- 项目路径: `frontend/Planning-app/`
- 支持平台: Android / iOS / H5

### Pinia (状态管理)
- 版本: ^2.1.0
- Store目录: `frontend/Planning-app/store/`
- 模块: user / planning / iching

### Axios (HTTP请求)
- 版本: ^1.6.0
- 封装文件: `frontend/Planning-app/utils/request.js`
- 跨域处理: H5端通过代理解决

### 多端差异处理
```javascript
// UniApp条件编译处理平台差异
// #ifdef H5
const BASE_URL = '/api';  // H5代理
// #endif
// #ifdef APP-PLUS
const BASE_URL = 'http://192.168.x.x:3000/api';  // App直连
// #endif
```

---

## 开发工具

| 工具 | 用途 | 配置文件 |
|------|------|---------|
| ESLint | 代码检查 | `.eslintrc.js` |
| Prettier | 代码格式化 | `.prettierrc` |
| Jest | 单元测试 | `backend/package.json` |
| Supertest | API测试 | `backend/tests/` |
| nodemon | 热重载 | `backend/package.json` |
| sequelize-cli | 迁移管理 | `backend/.sequelizerc` |

---

## 数据库架构

### 5个核心表 (待创建)

| 模型 | 表名 | 说明 |
|------|------|------|
| User | users | 用户信息 |
| Planning | plannings | 7大规划记录 |
| Hexagram | hexagrams | 64卦数据 |
| LifeStage | life_stages | 人生阶段 |
| DivinationRecord | divination_records | 占卜记录 |

### 关联关系
```
User hasMany Planning
User hasMany DivinationRecord
User hasOne LifeStage
DivinationRecord belongsTo Hexagram
```
