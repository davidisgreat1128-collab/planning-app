# 🤖 Claude AI 项目协作完全指南

> **文档性质**: 企业级AI协作核心文档
> **适用对象**: 所有参与本项目的Claude实例
> **重要程度**: ⭐⭐⭐⭐⭐ 最高优先级
> **最后更新**: 2026-03-03
> **文档版本**: v1.2

---

## 📑 目录

1. [🎯 快速开始 - 新Claude必读](#1-快速开始)
2. [📌 项目核心信息](#2-项目核心信息)
3. [🏗️ 技术架构详解](#3-技术架构详解)
4. [📂 项目结构导航](#4-项目结构导航)
5. [🔄 Claude账号切换流程](#5-claude账号切换流程)
6. [📝 工作日志规范](#6-工作日志规范)
7. [💻 开发规范速查](#7-开发规范速查)
8. [🚨 关键注意事项](#8-关键注意事项)
9. [🛠️ 常用命令参考](#9-常用命令参考)
10. [❓ 问题解决指南](#10-问题解决指南)
11. [📞 紧急联系与汇报](#11-紧急联系与汇报)
12. [📋 附录](#12-附录)

---

## 1. 🎯 快速开始

**如果您是新接手本项目的Claude实例，请严格按照以下步骤操作：**

### ⏱️ 15分钟快速接手流程

**步骤1 - 阅读本文档重点章节 (5分钟)**
- 第2节：项目核心信息 ⭐⭐⭐⭐⭐
- 第3节：技术架构详解 ⭐⭐⭐⭐⭐
- 第8节：关键注意事项 ⭐⭐⭐⭐⭐

**步骤2 - 查看当前状态 (3分钟)**
```bash
cat .claude/CURRENT_STATUS.md
# 重点关注：当前阶段、正在进行的任务、下一个Claude应该做什么
```

**步骤3 - 阅读最新工作日志 (5分钟)**
```bash
# 查看最新日志文件
ls -lt docs/06-AI协作日志/01-每日工作日志/2026/
```

**步骤4 - 检查Git状态 (2分钟)**
```bash
cd D:\MyProject\Planning-app
git status
git log --oneline -10
git branch
```

**步骤5 - 确认准备就绪**
- [ ] 已理解项目目标和愿景
- [ ] 已了解技术栈和架构
- [ ] 已掌握当前进度
- [ ] 已知晓下一步任务
- [ ] 已检查Git状态
- [ ] 已理解代码规范

---

## 2. 📌 项目核心信息

### 2.1 项目概述

**项目名称**: Planning App - 基于《易经》的人生规划系统

**项目愿景**:
> 人生就是一场选择题。本项目以《易经》思想为底层逻辑，帮助用户在人生各个维度做出更优选择，趋利避凶，持续成长。

**核心理念**:
- 🌟 自强不息 (乾卦) - 持续进步、主动成长
- 🌏 厚德载物 (坤卦) - 承载万物、稳定内核
- 🔄 变化法则 - 穷则变、变则通、通则久

### 2.2 业务目标 - 7大规划模块

1. 👤 **人生规划** - 人生阶段定位(潜龙勿用→亢龙有悔)、长期目标设计
2. 💼 **职业规划** - 能力模型构建、职业路径推演、风险预判
3. 🚀 **项目规划** - 项目生命周期管理、决策分支模拟
4. 💭 **心情规划** - 情绪记录、情绪周期分析、心态建议
5. 🥗 **饮食规划** - 饮食建议、营养追踪
6. ❤️ **健康规划** - 作息管理、身体状态追踪
7. ⏰ **时间规划** - 时间分配优化、习惯养成

**易经核心功能**:
- 🎴 占卜功能 (基于时间、环境因素生成卦象)
- 📊 人生六阶段判断 (潜龙勿用 → 见龙在田 → 君子乾乾 → 或跃在渊 → 飞龙在天 → 亢龙有悔)
- 💡 决策辅助 (基于当前阶段给出建议)
- 📈 趋势分析 (预测未来发展方向)

### 2.3 项目元信息

| 项目 | 信息 |
|------|------|
| **项目所有者** | 唐伯虎 (INTJ-A人格) |
| **开发模式** | AI全程编写代码，人类负责规范和方向把控 |
| **当前版本** | v0.1.0-alpha (开发中) |
| **开始时间** | 2026-02-17 |
| **GitHub仓库** | git@github.com:davidisgreat1128-collab/planning-app.git |
| **开发分支** | develop |
| **生产分支** | master |

### 2.4 协作模式

**唐伯虎的角色**: 项目方向把控、代码规范审查、最终决策者

**Claude的角色**: 全部代码编写、技术方案设计、文档编写、测试编写、详细工作日志记录

**协作原则**:
1. Claude提出技术方案 → 唐伯虎审查确认
2. Claude编写代码 → 唐伯虎代码审查
3. 重大决策必须征得唐伯虎同意
4. 每次会话结束前必须更新 CURRENT_STATUS.md

---

## 3. 🏗️ 技术架构详解

### 3.1 技术栈概览

```
┌─────────────────────────────────────────────┐
│           前端 (Frontend)                    │
│  UniApp (Vue 3) + Pinia + Axios             │
│  支持: Android + iOS + H5                   │
│  路径: frontend/Planning-app/               │
└─────────────────────┬───────────────────────┘
                      │ RESTful API (JSON)
┌─────────────────────▼───────────────────────┐
│           后端 (Backend)                     │
│  Node.js v22.20.0 + Express + Sequelize ORM │
│  JWT认证 + 中间件 + 业务逻辑                │
│  路径: backend/                              │
└─────────────────────┬───────────────────────┘
                      │ SQL (自动字段映射)
┌─────────────────────▼───────────────────────┐
│          数据库 (Database)                   │
│  MySQL 8.0.43                               │
│  开发库: planning_app_dev                   │
│  生产库: planning_app_prod                  │
└─────────────────────────────────────────────┘
```

### 3.2 核心技术决策

#### 决策1: 使用Sequelize ORM (解决字段命名统一问题)

**问题**: 数据库字段(snake_case) 与 JS代码(camelCase) 命名不统一

**解决方案**: Sequelize ORM + `underscored: true` 全局配置

```javascript
// 数据库存储 (snake_case) ← Sequelize自动映射 → JS代码 (camelCase)
user_id        ←→  userId
user_name      ←→  userName
created_at     ←→  createdAt
is_active      ←→  isActive
```

**全链路统一**:
```
Database(snake_case) → Sequelize自动映射 → Backend(camelCase) → API响应(camelCase) → Frontend(camelCase)
```

#### 决策2: 使用JavaScript (非TypeScript)

**原因**: AI全程编写代码场景下，JavaScript更准确、更易于人类审查

#### 决策3: 单例模式（隐式，通过 Node.js require 缓存）

**问题**: 数据库连接、日志记录器等全局对象需要全局唯一，避免重复创建资源。

**解决方案**: 利用 Node.js `require()` 的模块缓存机制——**同一文件在同一进程中只执行一次，后续调用直接返回缓存结果**，天然实现进程级单例，无需手写 `getInstance()` 模式。

| 单例对象 | 创建位置 | 使用方式 |
|---------|---------|---------|
| Sequelize 实例 | `backend/src/models/index.js` 顶层 `new Sequelize(...)` | 所有 Model/Service `require('../models')` |
| Winston Logger | `backend/src/middleware/logger.js` 顶层 `createLogger(...)` | 所有模块 `require('./logger')` |
| Express App | `backend/src/app.js` 顶层 `express()` | `server.js` `require('./src/app')` |

**新Claude注意**: 不需要、也不应该在各模块内重新 `new Sequelize()` 或 `createLogger()`，统一从上述入口模块 `require` 即可。

#### 决策4: API 集中注册，Route→Controller→Service 分层

**问题**: API 路由分散或路由文件中混入业务逻辑，导致难以维护。

**解决方案**: `app.js` 是唯一的路由注册中心，所有 API 必须经过 **Route → Controller → Service → Model** 四层：

```
app.js（唯一注册入口）
└── /api/v1  (apiV1 Router)
    ├── /auth       → routes/auth.js       → authController       → —
    ├── /users      → routes/user.js       → userController       → —
    ├── /planning   → routes/planning.js   → planningController   → planningService
    │                                      + planProgressController → planProgressService
    ├── /holidays   → routes/holiday.js    → holidayController    → holidayService
    ├── /tasks      → routes/task.js       → taskController       → taskService
    ├── /alarms     → routes/alarm.js      → alarmController      → alarmService
    └── /logs       → routes/log.js        → logController        → logService
```

**强制规范**：
- 路由文件（routes/）只做：引入中间件、定义 Joi Schema、注册路由 → Controller
- 业务逻辑只能写在 Controller / Service，**禁止在路由文件内写内联 `async (req, res) => { ... }` 业务代码**
- 新增接口：先建 Service 函数 → 建 Controller 函数 → 在对应 routes/ 文件注册 → 在 app.js 确认已挂载（一般无需改动）

#### 决策5: UniApp多端统一 (不拆分平台目录)

**原因**: UniApp条件编译机制处理平台差异，无需分目录
```javascript
// #ifdef H5
// H5专用代码
// #endif
// #ifdef APP-PLUS
// App专用代码
// #endif
```

### 3.3 技术栈清单

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 运行环境 | Node.js | v22.20.0 | 后端运行时 |
| 数据库 | MySQL | 8.0.43 | 数据存储 |
| Web框架 | Express | ^4.18.0 | HTTP服务 |
| ORM | Sequelize | ^6.35.0 | 数据库ORM ⭐ |
| 认证 | jsonwebtoken | ^9.0.0 | JWT认证 |
| 加密 | bcrypt | ^5.1.0 | 密码加密 |
| 验证 | Joi | ^17.11.0 | 数据验证 |
| 日志 | Winston | ^3.11.0 | 日志记录 |
| 测试 | Jest | ^29.7.0 | 单元测试 |
| 代码检查 | ESLint | ^8.55.0 | 代码规范 |
| 格式化 | Prettier | ^3.1.0 | 代码格式 |
| 前端框架 | Vue 3 | 3.x | UniApp基础 |
| 状态管理 | Pinia | ^2.1.0 | 状态管理 |
| HTTP请求 | axios | ^1.6.0 | 网络请求 |

### 3.4 数据库连接配置

```
Host: localhost
Port: 3306
User: root
Password: wokao@53231812
Dev DB: planning_app_dev
Prod DB: planning_app_prod
Charset: utf8mb4
```

---

## 4. 📂 项目结构导航

### 4.1 根目录总览

```
D:\MyProject\Planning-app/
├── .claude/              ⭐ Claude AI工作区 (本目录)
├── .github/              GitHub配置 (CI/CD、Issue模板)
├── frontend/
│   └── Planning-app/     UniApp前端项目 (Vue3)
├── backend/              Node.js后端项目
├── database/             数据库设计和脚本
├── docs/                 项目文档 (6大体系)
├── scripts/              项目自动化脚本
├── .gitignore
├── .editorconfig
├── .eslintrc.js
├── .prettierrc
├── CHANGELOG.md
└── README.md
```

### 4.2 `.claude/` 目录 (本目录详解)

```
.claude/
├── CLAUDE.md               ⭐⭐⭐⭐⭐ 本文档 - Claude协作完全指南
├── CURRENT_STATUS.md       ⭐⭐⭐⭐⭐ 实时项目状态 (每次会话必更新!)
├── config.json             Claude工作配置
├── context.json            机器可读上下文
├── handoff-docs/           交接辅助文档
│   ├── quick-start.md      5分钟快速启动
│   ├── tech-stack.md       技术栈详解
│   ├── conventions.md      代码约定速查
│   └── troubleshooting.md  常见问题FAQ
├── templates/              日志模板 (8种)
│   ├── daily-log-template.md
│   ├── adr-template.md
│   ├── code-review-template.md
│   ├── bug-analysis-template.md
│   ├── performance-template.md
│   ├── requirement-template.md
│   ├── refactor-template.md
│   └── learning-notes-template.md
├── prompts/                自定义提示词
│   ├── code-review.md
│   ├── architecture-design.md
│   └── bug-analysis.md
└── scripts/                自动化脚本
    ├── handoff-check.sh    交接检查脚本
    ├── create-log.sh       快速创建日志
    └── update-status.sh    更新状态文档
```

### 4.3 `backend/` 目录详解

```
backend/
├── src/
│   ├── models/            ⭐ Sequelize模型 (核心!)
│   │   ├── index.js       模型汇总 + 关联定义
│   │   ├── User.js        用户模型
│   │   ├── Planning.js    规划模型
│   │   ├── Hexagram.js    卦象模型 (64卦)
│   │   ├── LifeStage.js   人生阶段模型
│   │   └── DivinationRecord.js  占卜记录
│   ├── controllers/       控制器层
│   ├── services/          业务逻辑层
│   │   └── iching/        易经算法核心
│   ├── routes/            RESTful路由
│   ├── middleware/        中间件
│   │   ├── auth.js        JWT认证
│   │   ├── validator.js   数据验证
│   │   ├── logger.js      日志记录
│   │   └── errorHandler.js 错误处理
│   ├── utils/             工具函数
│   │   ├── errors.js      自定义错误类
│   │   ├── response.js    统一响应格式
│   │   ├── crypto.js      加密工具
│   │   └── jwt.js         JWT工具
│   ├── config/            配置文件
│   │   ├── database.js    ⭐ Sequelize配置
│   │   └── constants.js   常量定义
│   ├── migrations/        ⭐ 数据库迁移文件
│   ├── seeders/           ⭐ 初始数据 (64卦)
│   └── app.js             Express应用入口
├── tests/unit/            单元测试
├── tests/integration/     集成测试
├── logs/                  日志目录
├── uploads/               上传文件目录
├── .env.example           环境变量模板
├── .env.development       开发环境配置
├── .sequelizerc           Sequelize配置
├── package.json           依赖管理
└── server.js              服务器启动
```

### 4.4 `frontend/Planning-app/` 目录详解

```
frontend/Planning-app/
├── pages/                 页面 (按功能模块划分)
│   ├── index/             首页
│   ├── planning/          规划模块
│   │   ├── life/          人生规划
│   │   ├── career/        职业规划
│   │   ├── project/       项目规划
│   │   ├── mood/          心情规划
│   │   ├── health/        健康规划
│   │   ├── time/          时间规划
│   │   └── habit/         习惯规划
│   ├── iching/            易经模块
│   │   ├── divination/    占卜功能
│   │   ├── hexagram/      卦象解析
│   │   └── stage/         人生阶段
│   ├── user/              用户中心
│   └── settings/          设置
├── components/            公共组件
│   ├── common/            通用组件
│   ├── planning/          规划组件
│   └── iching/            易经组件
├── composables/           ⭐ Vue 3 Composition API 可复用逻辑
│   └── useAuthGuard.js    访客模式权限守卫
├── utils/                 工具函数
│   ├── request.js         网络请求封装 (axios)
│   ├── storage.js         本地存储封装
│   ├── validator.js       数据验证
│   └── iching.js          易经工具函数
├── store/                 Pinia状态管理
│   ├── index.js           Store入口
│   └── modules/
│       ├── user.js        用户状态
│       ├── planning.js    规划状态
│       └── iching.js      易经状态
├── api/                   API接口封装
│   ├── user.js
│   ├── planning.js
│   └── iching.js
├── config/                配置文件
│   ├── env.dev.js         开发环境
│   ├── env.prod.js        生产环境
│   └── constants.js       常量定义
├── static/                静态资源
├── App.vue                应用入口
├── main.js                主入口
├── manifest.json          应用配置
├── pages.json             路由配置 ⭐
└── uni.scss               全局样式
```

---

## 5. 🔄 Claude账号切换流程

### 5.1 当前Claude会话结束前 (交出清单)

```bash
# 1. 提交所有代码
git add .
git commit -m "feat(xxx): 完成xxx功能"
git push origin develop

# 2. 更新 .claude/CURRENT_STATUS.md
# 必须标注: 完成了什么、正在做什么(精确到行号)、下一步做什么

# 3. 创建今日工作日志
# docs/06-AI协作日志/01-每日工作日志/YYYY/MM-Month/YYYY-MM-DD-任务描述.md

# 4. 更新日志索引
# docs/06-AI协作日志/索引目录.md

# 5. 如有重大决策，创建ADR
# docs/06-AI协作日志/02-架构决策记录(ADR)/ADR-NNN-决策主题.md
```

**自检清单**:
- [ ] 代码已提交到Git
- [ ] CURRENT_STATUS.md已更新
- [ ] 今日工作日志已记录
- [ ] 日志索引已更新
- [ ] 下一步任务已明确写清楚

### 5.2 新Claude会话开始时 (接收清单)

```bash
# 1. 阅读本文档 (5分钟)
cat .claude/CLAUDE.md

# 2. 查看当前状态 (3分钟)
cat .claude/CURRENT_STATUS.md

# 3. 阅读最新工作日志 (5分钟)
ls -lt docs/06-AI协作日志/01-每日工作日志/2026/ | head -3

# 4. 检查Git状态 (2分钟)
git status && git log --oneline -5
```

### 5.3 切换场景示例

**Claude A被迫中断，Claude B接手**:

Claude A在CURRENT_STATUS.md中留下:
```
正在进行: 实现用户登录API
进度: 60%
已完成: 控制器函数创建、密码验证逻辑
当前位置: backend/src/controllers/userController.js 第85行
下一步: 继续写JWT token生成代码(第85-100行)，然后写测试
特别注意: JWT_SECRET在.env中，token过期7天
未提交文件: backend/src/controllers/userController.js (有修改未提交)
```

Claude B接手后:
1. 读CLAUDE.md → 读CURRENT_STATUS.md → 打开指定文件第85行 → 继续工作

---

## 6. 📝 工作日志规范

### 6.1 日志类型和模板

| 类型 | 场景 | 模板 | 命名格式 |
|------|------|------|---------|
| 每日工作日志 | 每天结束 | `templates/daily-log-template.md` | `YYYY-MM-DD-描述.md` |
| ADR | 重大技术决策 | `templates/adr-template.md` | `ADR-NNN-主题.md` |
| 代码审查 | 审查代码后 | `templates/code-review-template.md` | `CR-YYYY-MM-DD-模块.md` |
| Bug分析 | 修复Bug后 | `templates/bug-analysis-template.md` | `BUG-NNN-描述.md` |
| 性能优化 | 优化后 | `templates/performance-template.md` | `PERF-NNN-主题.md` |
| 需求分析 | 分析需求 | `templates/requirement-template.md` | `REQ-NNN-主题.md` |
| 重构 | 重构后 | `templates/refactor-template.md` | `REFACTOR-NNN-范围.md` |
| 学习笔记 | 学习新技术 | `templates/learning-notes-template.md` | 自由命名 |

### 6.2 每日工作日志必须包含

1. 今日目标
2. 工作内容详情 (含代码片段、文件路径)
3. 决策记录 (为什么这样做)
4. 问题与风险
5. 进度报告 (完成度百分比)
6. 明日计划
7. 相关Git commit哈希

### 6.3 日志质量标准

- ✅ 完整性: 背景、过程、结果、反思
- ✅ 可追溯: 时间、版本、文件路径、Git commit
- ✅ 可理解: 清晰结构、代码示例
- ✅ 有价值: 为未来决策提供参考

---

## 7. 💻 开发规范速查

### 7.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 数据库表名 | snake_case复数 | `users`, `planning_records` |
| 数据库字段 | snake_case | `user_name`, `created_at` |
| JS变量/属性 | camelCase | `userName`, `createdAt` |
| JS常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| JS类名 | PascalCase | `UserService` |
| Vue组件 | PascalCase | `UserProfile.vue` |
| 布尔变量 | is/has/should前缀 | `isActive`, `hasPermission` |

### 7.2 Git Commit规范

格式: `<type>(<scope>): <subject>`

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug修复 |
| `docs` | 文档 |
| `refactor` | 重构 |
| `test` | 测试 |
| `chore` | 构建/工具 |

示例: `feat(auth): 实现用户JWT登录功能`

### 7.3 API响应格式

```javascript
// 成功
{ "success": true, "code": 200, "message": "操作成功", "data": {...}, "timestamp": 1708147200000 }

// 失败
{ "success": false, "code": 400, "message": "参数错误", "error": { "field": "email", "message": "格式不正确" } }

// 列表
{ "success": true, "data": { "items": [...], "pagination": { "page": 1, "pageSize": 20, "total": 100 } } }
```

### 7.4 关键代码约定

```javascript
// ✅ Sequelize模型使用camelCase
const user = await User.create({ userId: 'U123', userName: '唐伯虎' });
// ❌ 不要用snake_case
const user = await User.create({ user_id: 'U123' }); // 错误!

// ✅ 使用统一错误类
const { ValidationError, NotFoundError } = require('../utils/errors');
throw new NotFoundError('用户');

// ✅ 使用统一响应格式
const { success, error } = require('../utils/response');
res.json(success(data, '操作成功'));
```

### 7.5 中文优先规范 ⭐ (重要)

**以下所有内容必须使用中文，无例外：**

#### 代码注释必须写中文

```javascript
// ✅ 正确 - 中文注释
/**
 * 根据用户ID获取用户信息
 * @param {number} userId - 用户ID
 * @returns {Promise<object>} 用户对象（不含密码哈希）
 * @throws {NotFoundError} 用户不存在时抛出
 */
async function getUserById(userId) {
  // 查询数据库，软删除的用户不会被查到
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('用户'); // 抛出标准404错误
  }
  return user.toSafeJSON(); // 移除敏感字段后返回
}

// ❌ 错误 - 英文注释
// Get user by ID from database
async function getUserById(userId) { ... }
```

#### 错误信息必须写中文

```javascript
// ✅ 正确
throw new ValidationError('邮箱格式不正确', 'email');
throw new NotFoundError('用户不存在');
return error(res, '服务器内部错误', 500);

// ❌ 错误
throw new ValidationError('Invalid email format');
```

#### 文档文件（.md）必须用中文，文件名也要用中文

```
✅ 正确文件名:
  用户认证接口.md
  数据库表设计.md
  每日工作日志-2026-02-17.md

❌ 错误文件名:
  user-auth-api.md
  database-design.md
  daily-log-2026-02-17.md
```

#### 唯一例外（以下保持英文）
- 代码变量名、函数名、类名（遵循 camelCase/PascalCase 命名规范）
- 数据库表名、字段名（遵循 snake_case）
- 第三方库、框架的专有名词（如 Express、Sequelize、JWT）
- Git commit 中的 type/scope 部分（如 `feat(auth):` 中的 `feat` 和 `auth`）

### 7.6 文档（.md 文件）管理规范

**所有 .md 文件统一归口：** `.claude/文档导航.md` 是全项目 .md 文件的索引入口。

#### 创建新 .md 文件的规则

1. **文件名用中文**，格式：`功能描述.md`（如 `用户认证接口.md`）
2. **创建后必须在 `.claude/文档导航.md` 登记**，否则会成为"孤儿文档"
3. **存放位置规则**：

| 文档类型 | 存放位置 | 示例 |
|---------|---------|------|
| 每日工作日志 | `docs/06-AI协作日志/01-每日工作日志/YYYY/MM-月份/` | `2026-02-17-项目初始化.md` |
| 架构决策(ADR) | `docs/06-AI协作日志/02-架构决策记录/` | `ADR-001-技术栈选型.md` |
| Bug记录 | `docs/06-AI协作日志/03-Bug分析记录/` | `BUG-001-登录超时.md` |
| API接口文档 | `docs/03-API文档/` | `用户认证接口.md` |
| 技术设计文档 | `docs/02-技术设计/` | `数据库表设计.md` |
| Claude协作相关 | `.claude/` 对应子目录 | — |
| GitHub模板 | `.github/` | 保持英文（GitHub平台要求） |

4. **禁止在根目录随意创建 .md 文件**（CHANGELOG.md / README.md 除外）

### 7.7 UniApp 条件编译规范 ⭐ (重要)

**本项目必须兼容三端：Android App / iOS App / H5 浏览器端。**

#### 条件编译写法

```vue
<!-- 模板中 -->
<!-- #ifdef H5 -->
<view>仅 H5 显示的内容</view>
<!-- #endif -->

<!-- #ifdef APP-PLUS -->
<view>仅 App（安卓+苹果）显示的内容</view>
<!-- #endif -->

<!-- #ifdef MP-WEIXIN -->
<view>仅微信小程序显示的内容</view>
<!-- #endif -->
```

```javascript
// JS 中
// #ifdef H5
console.log('H5 环境');
// #endif

// #ifdef APP-PLUS
plus.device.getInfo(...)
// #endif
```

```css
/* 样式中 */
/* #ifdef H5 */
.container { max-width: 750px; margin: 0 auto; }
/* #endif */
```

#### 常用平台标识

| 标识 | 平台 |
|------|------|
| `H5` | 网页浏览器端 |
| `APP-PLUS` | Android + iOS App（统一） |
| `APP-ANDROID` | 仅 Android |
| `APP-IOS` | 仅 iOS |
| `MP-WEIXIN` | 微信小程序（暂不支持） |

#### 强制规范

1. **状态栏高度**：App 端需额外处理状态栏，H5 不需要
   ```vue
   <!-- #ifdef APP-PLUS -->
   <view :style="{ height: statusBarHeight + 'px' }"></view>
   <!-- #endif -->
   ```

2. **输入框**：统一用 `:value` + `@input` 写法，**禁止只用 `v-model`**（H5 和 App 行为不一致）
   ```vue
   <!-- ✅ 三端兼容写法 -->
   <input :value="form.email" @input="form.email = $event.detail.value" />

   <!-- ❌ 禁止仅 v-model（App 端某些场景失效） -->
   <input v-model="form.email" />
   ```

3. **本地存储**：统一用 `uni.setStorageSync` / `uni.getStorageSync`，**禁止直接用 `localStorage`**（App 端不支持）
   ```javascript
   // ✅ 三端兼容
   uni.setStorageSync('key', value);
   // ❌ 仅 H5 生效
   localStorage.setItem('key', value);
   ```

4. **网络请求**：统一用 `uni.request` 封装或项目 `utils/request.js`，**禁止直接用 `axios`**（App 端需特殊处理）

5. **跳转路由**：统一用 `uni.navigateTo` / `uni.reLaunch` 等 uni API，**禁止用 `router.push`**

6. **样式单位**：统一用 `rpx`（自动适配不同屏幕），避免直接写 `px`（不同设备差异大）

### 7.8 文件大小管理规范 ⭐ (重要，2026-03-03新增)

#### 核心原则
- **阈值**：单文件 > 800行触发拆分提醒
- **决策权**：所有拆分必须经用户明确批准，Claude 不得自作主张
- **追踪机制**：所有超标文件必须登记到 `docs/02-技术设计/超标文件追踪清单.md`

#### Claude 工作流程（强制遵守）

**场景1：开发新功能时**
```
步骤1：编写代码前，检查目标文件当前行数
  命令：wc -l <文件路径>

步骤2：评估本次新增代码量
  - 简单功能：~50-100行
  - 中等功能：~100-300行
  - 复杂功能：~300-500行

步骤3：判断是否会超标
  如果 当前行数 + 预计新增 > 800行：
    → 先完成当前功能（不打断工作流）
    → 功能完成后，立即执行"超标文件登记流程"
  否则：
    → 正常编写代码

步骤4：功能完成后，自动检查
  - 运行：wc -l <刚修改的文件>
  - 如果超过800行 → 执行"超标文件登记流程"
```

**场景2：修复Bug时**
```
步骤1：如果目标文件已 > 800行，但修复代码 < 50行：
  → 先修复Bug（优先保证系统稳定）
  → 提交Bug修复commit
  → 执行"超标文件登记流程"

步骤2：如果目标文件已 > 800行，且修复需要大量改动（> 100行）：
  → 在工作日志中说明情况
  → 询问用户："该文件已超标且需大量改动，是否先拆分再修复？"
```

**场景3：超标文件登记流程（标准化流程）**
```
步骤1：更新追踪清单
  文件：docs/02-技术设计/超标文件追踪清单.md
  操作：
    - 在"待处理"表格中新增一行
    - 填写：文件路径、当前行数、超标百分比、发现时间
    - 状态标记为"📋 已标记"

步骤2：向用户发出提醒
  格式：
  """
  ⚠️ 文件大小提醒

  文件：<路径>
  当前行数：<X>行（超标 <Y>%）

  该文件已超过800行阈值，建议考虑拆分。
  已登记到：docs/02-技术设计/超标文件追踪清单.md

  是否需要我生成拆分方案？（输入"是"我将生成完整评估报告）
  """

步骤3：在工作日志中记录
  在当日工作日志的"已知问题和注意事项"章节中添加：
  - ⚠️ <文件路径> 已超标（<X>行），已标记，等待用户决策
```

**场景4：用户要求生成拆分方案**
```
步骤1：生成架构评估报告（参考 index.vue 的评估模板）
  输出：docs/02-技术设计/<文件名>企业级架构评估报告.md
  内容：
    - 健康评分（0-100）
    - 问题识别（P0/P1/P2/P3分级）
    - 职责拆解分析
    - 重构方案建议

步骤2：生成分阶段拆分方案（支持Claude账号切换）
  输出：docs/02-技术设计/<文件名>架构评估任务-分阶段可交接方案.md

步骤3：更新追踪清单
  状态改为"🟡 评估中"
  添加评估报告链接

步骤4：提交给用户审批
  格式：
  """
  📋 拆分方案已完成

  评估报告：<链接>
  分阶段方案：<链接>
  健康评分：<分数>/100
  预估工时：<X>小时

  是否批准执行拆分？（输入"同意拆分"我将开始执行）
  """
```

**场景5：用户批准拆分后**
```
步骤1：更新追踪清单状态为"✅ 方案已批准"

步骤2：按照分阶段方案执行拆分
  - 每完成一个阶段，提交一次Git commit
  - 每个阶段完成后，向用户汇报进度

步骤3：拆分完成后
  - 运行测试验证
  - 更新追踪清单：移动到"已处理"区域
  - 在工作日志中记录拆分成果
```

#### 禁止行为 ❌
- ❌ 未经用户批准，直接拆分任何现有文件
- ❌ 发现超标文件不登记到追踪清单
- ❌ 为了避免超标，故意压缩代码（去空行、去注释）
- ❌ 完成功能后不检查文件大小

#### 强制检查点 ✅
- ✅ 每次编写代码前：检查目标文件行数
- ✅ 每次功能完成后：检查修改的文件是否新增超标
- ✅ 每次会话结束前：检查是否有遗漏的超标文件
- ✅ 每次提交Git前：在commit message中标注文件大小变化（如果>100行变化）

---

### 7.9 三层架构规范 ⭐ (重要，2026-03-04新增)

#### 架构层次划分

**Component 层（UI 层）**
- 职责：用户交互、数据展示
- 只能调用 Store，禁止直接调用 Repository 或 API
- 示例：category-drawer.vue、task-edit.vue、index.vue

**Store 层（状态管理层）**
- 职责：全局状态管理、调用 Repository
- 使用 Pinia defineStore
- 提供计算属性（computed）和 actions
- 示例：store/category.js、store/task.js

**Repository 层（数据访问层）**
- 职责：数据 CRUD、缓存、离线队列、同步
- 管理 memoryCache（Map结构）、localStorage、operationQueue
- 处理版本冲突（乐观锁，version 字段）
- 示例：repositories/CategoryRepository.js、repositories/TaskRepository.js

#### 数据流向

**读取流程**：
```
用户打开页面 → Component 调用 Store.hydrate()
  → Store 调用 Repository.hydrate()
  → Repository 从 localStorage 加载缓存
  → Repository 从服务器同步最新数据
  → Repository 更新 memoryCache
  → Store 通过 computed 自动更新
  → Component 自动重新渲染
```

**写入流程**：
```
用户点击"保存" → Component 调用 Store.createCategory(data)
  → Store 调用 Repository.create(data)
  → Repository 更新 memoryCache
  → Repository 写入 localStorage（debounce 500ms）
  → Repository 添加操作到 operationQueue
  → Repository 后台同步到服务器（debounce 500ms）
  → 服务器返回成功
  → Repository 清理 operationQueue
  → Store 自动更新
  → Component 自动重新渲染
```

#### 强制规范

**禁止行为 ❌**
- ❌ Component 直接调用 API（绕过 Store）
- ❌ Component 直接访问 Repository（破坏分层）
- ❌ Store 直接操作 localStorage（应由 Repository 管理）
- ❌ Repository 访问 Vue 实例或 DOM（应保持纯逻辑）
- ❌ 在路由文件（routes/）内写内联业务逻辑

**必须执行 ✅**
- ✅ Component 只调用 Store 的 actions
- ✅ Store 调用 Repository 的方法
- ✅ Repository 管理所有数据持久化逻辑
- ✅ 所有异步操作返回 Promise
- ✅ App 启动时调用 Store.hydrate()

#### Repository 标准接口

每个 Repository 必须实现以下方法：

```javascript
class BaseRepository {
  async hydrate() { ... }       // 启动时加载数据（localStorage + 服务器）
  getAll() { ... }              // 获取全部（从 memoryCache，已排序）
  getById(id) { ... }           // 按 ID 获取
  async create(data) { ... }    // 创建
  async update(id, data) { ... } // 更新
  async delete(id) { ... }      // 删除（软删除，标记 deletedAt）
  async sync() { ... }          // 同步到服务器
}
```

#### CategoryRepository 企业级实现（完整功能）

```javascript
class CategoryRepository {
  constructor() {
    this.memoryCache = new Map()       // 内存缓存（Map: id → category）
    this.operationQueue = []           // 离线操作队列
    this.saveTimer = null              // Debounce 定时器
    this.isSyncing = false             // 同步状态
    this.lastSyncTime = null           // 最后同步时间
  }

  // 核心功能：
  // 1. memoryCache：Map 结构，O(1) 查找性能
  // 2. localStorage：持久化备份，debounce 500ms 写入
  // 3. operationQueue：离线队列，指数退避重试（1s→2s→4s→8s→16s）
  // 4. version 字段：乐观锁，冲突时本地优先
  // 5. sortOrder 字段：支持拖拽排序
  // 6. deletedAt 字段：软删除，保留数据便于撤销
}
```

详细设计见：`docs/02-技术设计/三层架构设计.md`

#### 离线操作队列规范

**队列结构**：
```javascript
{
  id: 'op_uuid',                      // 操作唯一 ID
  type: 'create' | 'update' | 'delete', // 操作类型
  entityId: 'cat_001',                // 实体 ID
  data: { ... },                      // 操作数据
  timestamp: 1234567890,              // 操作时间戳
  status: 'pending' | 'syncing' | 'failed', // 状态
  retryCount: 0                       // 重试次数（0-5）
}
```

**重试策略**：指数退避
- 第1次失败：1秒后重试
- 第2次失败：2秒后重试
- 第3次失败：4秒后重试
- 第4次失败：8秒后重试
- 第5次失败：16秒后重试
- 超过5次：放弃并从队列移除

#### 版本冲突解决

**策略**：本地优先（单用户场景）

```javascript
// 本地修改
localCategory = { id: 1, name: 'A', version: 5 }

// 服务器最新数据
serverCategory = { id: 1, name: 'B', version: 6 }

// 冲突判断
if (serverCategory.version > localCategory.version) {
  // 服务器版本更新 → 使用服务器版本（覆盖本地）
  this.memoryCache.set(id, serverCategory)
  console.warn(`版本冲突：${serverCategory.name}，使用服务器版本`)
}
// 否则保留本地版本
```

未来多用户场景：改为弹窗让用户选择（详见企业级架构文档）

#### 缓存策略

**Memory Cache**：Map 结构（快速查找，O(1)性能）

**LocalStorage**：持久化备份
- Key: `planning_app_categories` / `planning_app_tasks` / `planning_app_category_queue`
- Debounce 写入：500ms 延迟（避免频繁磁盘I/O）
- 容量限制：5MB（约可存储5000条分类数据）

**同步触发时机**：
1. App 启动时（hydrate）
2. 用户操作后（debounce 500ms）
3. 网络恢复时（online 事件）
4. 定时轮询（可选，每30秒）

#### 使用示例

**Component 层（旧写法 vs 新写法）**：

```javascript
// ❌ 旧写法（直接调用 API）
import { categoryApi } from '@/api/category'

const categories = ref([])

async function saveCategory() {
  const res = await categoryApi.create({ name: form.value.name })
  categories.value.push(res.data)  // 手动更新数组
}

// ✅ 新写法（调用 Store）
import { useCategoryStore } from '@/store/category'

const categoryStore = useCategoryStore()
const categories = categoryStore.categories  // 响应式，自动更新

async function saveCategory() {
  await categoryStore.createCategory({ name: form.value.name })
  // 无需手动更新，categories 自动同步
}
```

**App 启动时（必须调用 hydrate）**：

```javascript
// App.vue
import { useCategoryStore } from '@/store/category'
import { useTaskStore } from '@/store/task'

export default {
  async onLaunch() {
    const categoryStore = useCategoryStore()
    const taskStore = useTaskStore()

    // 加载数据
    await categoryStore.hydrate()
    await taskStore.hydrate()
  }
}
```

#### 阶段2 增强功能（⏸️ 待办，后续添加）

以下为企业级增强功能，当前阶段（2026 Q1）暂不实施：

- ⏸️ **DTO 层**（Data Transfer Object）：统一数据格式，屏蔽前后端差异
- ⏸️ **Validator 层**：数据验证，客户端拦截无效请求（预计减少30%无效API请求）
- ⏸️ **RepositoryFactory**：自动选择最佳存储（内存/LocalStorage/IndexedDB）
- ⏸️ **ErrorRecovery**：容错降级（服务器异常时自动降级到本地模式）
- ⏸️ **PerformanceMonitor**：性能监控（操作耗时、缓存命中率、同步成功率）

详细设计见：`docs/02-技术设计/企业级数据流架构（支持10万+用户）.md`

#### 迁移检查清单

**迁移现有代码时，必须完成以下步骤**：

- [ ] 创建 Repository 类（实现标准接口）
- [ ] 创建 Store（调用 Repository）
- [ ] 移除 Component 中的 `import { xxxApi }` 引用
- [ ] 改为 `import { useXxxStore }`
- [ ] 将所有 `xxxApi.xxx()` 改为 `xxxStore.xxx()`
- [ ] 删除手动更新数组的代码（如 `array.push(...)`）
- [ ] 在 App.vue 的 onLaunch 中调用 `xxxStore.hydrate()`
- [ ] 测试离线模式（关闭服务器，操作后重新上线）
- [ ] 测试缓存恢复（刷新页面，数据仍在）

#### 常见陷阱

**陷阱1：忘记调用 hydrate()**
- 现象：页面空白，数据为空
- 解决：在 App.vue 的 onLaunch 中调用 `store.hydrate()`

**陷阱2：手动更新数组**
- 现象：数据重复（Repository 已更新，Component 又手动 push）
- 解决：删除手动更新代码，依赖 computed 自动更新

**陷阱3：直接调用 API**
- 现象：数据不同步、无离线支持、无缓存
- 解决：移除 API 引用，改为调用 Store

---

## 8. 🚨 关键注意事项

### 绝对禁止 ❌

| 禁止操作 | 原因 |
|---------|------|
| 修改已有迁移文件 | 破坏数据库版本历史 |
| 改变Sequelize的underscored配置 | 破坏全链路字段映射 |
| 使用TypeScript | 与项目决策冲突 |
| 跳过测试编写 | 降低代码质量 |
| 忘记更新工作日志 | 上下文丢失，切换账号失败 |
| 直接修改master分支 | 违反Git Flow |
| 提交.env文件 | 泄露MySQL密码等敏感信息 |
| 使用var声明变量 | 违反ES6规范 |
| 代码注释用英文 | 违反中文优先规范（第7.5节） |
| 新建.md文件用英文命名 | 违反中文优先规范（第7.5节） |
| 创建.md文件不登记导航 | 导致文档成为"孤儿"，无法找到 |
| 在各模块内重新 `new Sequelize()` / `createLogger()` | 违反单例规范（第3.2节决策3），应从入口模块 require |
| 在路由文件（routes/）内写内联业务逻辑 | 违反分层规范（第3.2节决策4），业务逻辑必须在 Controller/Service |
| 输入框仅用 `v-model` | App 端行为不一致，必须用 `:value` + `@input`（第7.7节） |
| 直接用 `localStorage` | App 端不支持，必须用 `uni.setStorageSync`（第7.7节） |
| 直接用 `axios` 发请求 | App 端需特殊处理，必须用项目封装的 `utils/request.js`（第7.7节） |
| 用 `router.push` 跳转 | 必须用 `uni.navigateTo` / `uni.reLaunch` 等 uni API（第7.7节） |

### 必须执行 ✅

| 操作 | 时机 |
|------|------|
| 编写单元测试 | 每个功能完成后 |
| 更新工作日志 | 每天结束时 |
| 更新CURRENT_STATUS.md | 每次会话结束前 |
| 运行ESLint | 提交代码前 |
| 使用JSDoc注释 | 编写每个函数时 |

### 特殊约定

- **密码字段**: 必须叫 `passwordHash` / `password_hash`，绝对不能叫 `password`
- **软删除**: 所有模型都配置 `paranoid: true`，使用 `deletedAt` 字段
- **时区**: MySQL配置 `timezone: '+08:00'` (北京时间)
- **字符集**: 所有表使用 `utf8mb4`，支持emoji

---

## 9. 🛠️ 常用命令参考

```bash
# 启动后端开发服务
cd backend && npm run dev

# 运行测试
cd backend && npm test

# 代码检查
cd backend && npm run lint

# 数据库迁移
cd backend && npm run migrate

# 回滚迁移
cd backend && npm run migrate:undo

# 导入种子数据
cd backend && npm run seed

# 创建迁移文件
cd backend && npx sequelize-cli migration:generate --name create-users-table

# 查看Git状态
git status && git log --oneline -10

# 创建功能分支
git checkout develop && git checkout -b feature/user-auth

# 提交代码
git add . && git commit -m "feat(auth): 描述" && git push origin branch-name

# MySQL操作 (Windows)
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -pwokao@53231812 planning_app_dev
```

---

## 10. ❓ 问题解决指南

| 问题类型 | 解决路径 |
|---------|---------|
| 架构/设计问题 | 查阅 `docs/02-架构设计/` 或 ADR记录 |
| 代码规范问题 | 查阅 `docs/04-开发规范/代码规范.md` |
| 功能实现问题 | 查阅 `docs/03-功能设计/` 对应模块 |
| 数据库问题 | 查阅 `database/schema/` 或 `backend/src/models/` |
| Git流程问题 | 查阅 `docs/04-开发规范/Git工作流规范.md` |
| 完全迷失 | 重读本文档 → CURRENT_STATUS.md → 最近3条日志 → 询问唐伯虎 |

### 发现严重问题时

1. **立即停止工作**
2. **详细记录问题**到工作日志
3. **通知唐伯虎**，说明问题和建议方案
4. **等待指示**，不要自行决定

---

## 11. 📞 紧急联系与汇报

### 向唐伯虎汇报的时机

- 完成重要功能模块
- 遇到技术难题无法解决
- 需要确认功能需求
- 需要做重大技术决策
- 发现严重Bug或安全问题
- Claude账号即将耗尽使用量

### 汇报模板

```
唐伯虎您好，

【当前进度】已完成: xxx (commit: abc123)，正在进行: xxx (60%)

【问题/需确认】问题描述 + 建议方案 + 需要您的决定

【下一步计划】计划完成xxx，预计完成时间xxx

Claude实例 | 2026-02-17
```

---

## 12. 📋 附录

### 重要文件快速索引

| 文件 | 重要性 |
|------|--------|
| `.claude/CLAUDE.md` (本文档) | ⭐⭐⭐⭐⭐ |
| `.claude/CURRENT_STATUS.md` | ⭐⭐⭐⭐⭐ |
| `docs/06-AI协作日志/索引目录.md` | ⭐⭐⭐⭐⭐ |
| `docs/04-开发规范/代码规范.md` | ⭐⭐⭐⭐⭐ |
| `backend/src/models/index.js` | ⭐⭐⭐⭐⭐ |
| `backend/src/config/database.js` | ⭐⭐⭐⭐ |
| `.eslintrc.js` | ⭐⭐⭐⭐ |
| `backend/.env.development` | ⭐⭐⭐⭐ |

### 新Claude每日检查清单

**开始前**: 读CURRENT_STATUS.md → 读最新日志 → 检查git status

**开发中**: 遵循命名规范 → 写测试 → 写JSDoc注释 → 定期提交

**结束时**: 提交代码 → 更新CURRENT_STATUS.md → 写工作日志 → 更新索引

---

**文档版本**: v1.3 | **创建**: 2026-02-17 | **最后更新**: 2026-03-04 | **作者**: Claude Sonnet 4.5

**有任何疑问，优先查阅本文档。实在不确定，询问唐伯虎。**
