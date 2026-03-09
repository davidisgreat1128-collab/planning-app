# 🤖 Claude AI 项目协作完全指南

> **文档性质**: 企业级AI协作核心文档
> **适用对象**: 所有参与本项目的Claude实例
> **重要程度**: ⭐⭐⭐⭐⭐ 最高优先级
> **最后更新**: 2026-03-05
> **文档版本**: v1.3

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
├── composables/           ⭐ Vue 3 Composition API - 业务流程层
│   ├── useAuthGuard.js    访客模式权限守卫
│   ├── useTaskForm.js     任务表单逻辑（复杂表单场景）
│   ├── useCalendar.js     日历业务逻辑（页面业务流程）
│   ├── useDragDrop.js     拖拽状态机（复杂交互）
│   ├── useTaskQuadrant.js 象限管理逻辑（可复用业务逻辑）
│   └── useTaskFormUtils.js 任务表单工具函数（业务工具）
│
│   职责：
│   ✅ 复杂表单逻辑封装（如useTaskForm管理表单状态、验证、提交）
│   ✅ 多Store协调编排（如同时操作taskStore + categoryStore + planStore）
│   ✅ 页面级业务流程（如useDragDrop拖拽状态机）
│   ✅ 可复用业务逻辑（如useTaskQuadrant象限管理，多个页面共享）
│   ❌ 禁止全局状态管理（应放Store）
│   ❌ 禁止数据持久化操作（应放Repository）
│   ❌ 禁止纯工具函数（应放utils/）
│   规模限制：<600行/文件
│
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

### 4.4.1 Composable层使用场景判断 ⭐ 重要

**何时使用Composable层？**

| 场景 | 示例 | 复杂度 | 是否使用Composable |
|------|------|--------|------------------|
| 复杂表单逻辑 | useTaskForm（表单状态、验证、提交）| >100行 | ✅ 使用 |
| 多Store协调 | 同时操作taskStore + categoryStore + planStore | 调用2个以上Store | ✅ 使用 |
| 页面业务流程 | useDragDrop（拖拽状态机）| 复杂状态机 | ✅ 使用 |
| 可复用业务逻辑 | useTaskQuadrant（多个页面共享）| 被2个以上页面使用 | ✅ 使用 |
| 简单列表展示 | 直接调用taskStore.tasks | <50行 | ❌ 直接用Store |
| 简单CRUD | taskStore.addTask(data) | 单个Store方法 | ❌ 直接用Store |
| 纯工具函数 | formatDate()、calcDays() | 无状态、无副作用 | ❌ 放utils/ |

**代码示例**：

```javascript
// ✅ 场景1：复杂表单逻辑 - 使用Composable
// composables/useTaskForm.js
export function useTaskForm(taskId) {
  const taskStore = useTaskStore()
  const form = ref({ title: '', date: '', quadrant: 'q4' })

  function validateForm() { /* 验证逻辑 */ }
  async function submit() {
    if (!validateForm()) return
    await taskStore.updateTask(taskId, form.value)
  }

  return { form, validateForm, submit }
}

// ✅ 场景2：多Store协调 - 使用Composable
// composables/useTaskEditor.js
export function useTaskEditor(taskId) {
  const taskStore = useTaskStore()
  const categoryStore = useCategoryStore()
  const planStore = usePlanStore()

  async function saveTask(data) {
    // 同时操作多个Store
    await taskStore.updateTask(taskId, data)
    await categoryStore.updateCategoryCount(data.categoryId)
    await planStore.updatePlanProgress(data.planId)
  }

  return { saveTask }
}

// ✅ 场景3：简单场景 - 直接用Store
// Component中
const taskStore = useTaskStore()
const tasks = taskStore.tasks  // 直接获取数据

async function deleteTask(id) {
  await taskStore.deleteTask(id)  // 直接调用Store方法
}

// ❌ 错误示例：纯工具函数不应放Composable
// composables/useUtils.js（错误！）
export function useUtils() {
  function formatDate(date) { return date.toISOString() }
  return { formatDate }
}

// ✅ 正确示例：纯工具函数应放utils/
// utils/date.js
export function formatDate(date) {
  return date.toISOString()
}
```

**判断流程图**：

```
开始修改代码
    ↓
问题1：这是纯工具函数吗？
    ├─ 是 → 放 utils/
    └─ 否 → 问题2
    ↓
问题2：这是全局状态管理吗？
    ├─ 是 → 放 Store
    └─ 否 → 问题3
    ↓
问题3：这是数据CRUD/缓存/同步吗？
    ├─ 是 → 放 Repository
    └─ 否 → 问题4
    ↓
问题4：逻辑复杂度>100行 或 调用2个以上Store？
    ├─ 是 → 放 Composable
    └─ 否 → 问题5
    ↓
问题5：会被2个以上页面使用吗？
    ├─ 是 → 放 Composable
    └─ 否 → 保留在 Component
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
- **决策权**：所有拆分必须经用户明确批准，Claude 不得自作主张
- **追踪机制**：所有超标文件必须登记到 `docs/02-技术设计/超标文件追踪清单.md`

#### 文件规模阈值（分层级管理）⭐ 2026-03-09更新

不同架构层级有不同的文件规模阈值，以保持代码可读性和可维护性：

| 层级 | 阈值 | 理由 | 检查命令 |
|------|------|------|---------|
| **Component 层** | <800行 | UI层应保持轻量，超过800行说明职责过重 | `wc -l pages/**/*.vue` |
| **Composable 层** ⭐ | <600行 | 业务流程层应职责单一，超过600行建议拆分 | `wc -l composables/*.js` |
| **Store 层** | <400行 | 状态管理应简洁，超过400行说明职责过重 | `wc -l store/*.js` |
| **Repository 层** | <500行 | 数据访问层相对固定，超过500行建议拆分 | `wc -l repositories/*.js` |
| **Utils 工具函数** | <300行 | 纯工具函数应短小精悍 | `wc -l utils/*.js` |

**为什么Composable层阈值是600行？**
- Composable层负责业务流程编排，比Component简单但比Store复杂
- 600行是一个合理的中间值，既能容纳复杂业务逻辑，又不至于过于臃肿
- 如果Composable超过600行，通常说明：
  1. 包含了纯工具函数（应提取到utils/）
  2. 包含了多个不相关的业务逻辑（应拆分为多个Composable）
  3. 包含了全局状态管理（应移到Store）

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

**场景4：创建新Composable时**（标准化流程）⭐ 新增
```
步骤1：明确职责边界
  问自己：这个Composable属于以下哪类？
  - 复杂表单逻辑？（如useTaskForm）
  - 多Store协调？（如useTaskEditor）
  - 页面业务流程？（如useDragDrop）
  - 可复用逻辑？（如useTaskQuadrant）

步骤2：检查是否应该放Composable
  ✅ 如果是纯工具函数 → 应放utils/，不要放Composable
  ✅ 如果是全局状态 → 应放Store，不要放Composable
  ✅ 如果是数据持久化 → 应放Repository，不要放Composable

步骤3：控制文件大小
  - 目标：<600行
  - 如超过600行，考虑拆分：
    - 提取纯工具函数到utils/
    - 提取可复用逻辑到新Composable
    - 提取状态管理到Store

步骤4：编写代码时检查
  - 每完成100行代码，检查是否有工具函数可提取
  - 每完成功能后，运行：wc -l composables/<文件名>
  - 如接近600行（>540行，90%阈值），立即登记到超标文件追踪清单

步骤5：命名规范
  ✅ 正确命名：useTaskForm、useTaskEditor、useTaskFormUtils
  ❌ 错误命名：taskHelpers（应放utils/）、getTask（应是Store方法）
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

### 7.9 四层架构规范 ⭐ (重要，2026-03-04新增，2026-03-09升级为四层)

#### 架构演进说明（三层 → 四层）

**为什么从三层升级到四层？**

在项目发展过程中，我们发现三层架构（Component → Store → Repository）在以下场景中遇到了问题：

1. **问题1：复杂表单逻辑无处安放**
   - Component 层：放Component太重（useTaskForm有821行业务逻辑）
   - Store 层：不适合放Store（不是全局状态，是单个页面的临时状态）
   - Repository 层：更不适合（Repository只负责数据访问）

2. **问题2：多Store协调逻辑分散**
   - 任务编辑需要同时操作 taskStore + categoryStore + planStore
   - 这种协调逻辑放Component里会导致Component过重
   - 放Store里也不合适（跨Store调用破坏单一职责）

3. **问题3：可复用业务逻辑散落**
   - 象限管理逻辑在 task-edit.vue 和 AddTaskPanel.vue 中重复
   - 拖拽逻辑散落在多个组件中
   - 这些逻辑提取到Composable后，消除了70%代码重复

**解决方案：在Component和Store之间增加Composable层**

**关键决策：Composable层是可选的，不是强制的** ⭐

```
简单场景（保留三层架构）：
Component → Store → Repository → API
  ↑
  └─ 用于简单列表展示、简单CRUD等场景

复杂场景（使用四层架构）：
Component → Composable → Store → Repository → API
  ↑
  └─ 用于复杂表单、多Store协调、页面业务流程等场景
```

**升级策略：平滑升级，向后兼容**
- ✅ 简单场景继续使用三层架构（Component → Store → Repository）
- ✅ 复杂场景使用四层架构（Component → Composable → Store → Repository）
- ✅ 现有代码无需修改，新代码遵循四层规范
- ✅ Composable层是业务需要时才使用，不是所有场景都强制使用

**成功案例**：

**案例1：useTaskForm**
- 问题：task-edit.vue（3265行）和AddTaskPanel.vue（2598行）功能重复85%
- 解决：提取useTaskForm.js（821行），消除70%代码重复
- 成果：架构健康度从30/100提升至75/100

**案例2：useDragDrop**
- 问题：拖拽逻辑散落在index.vue的多个函数中（200+行）
- 解决：提取useDragDrop.js（433行），独立的状态机
- 成果：index.vue从3802行降至789行（-80%）

**案例3：useCalendar**
- 问题：日历计算逻辑混在index.vue中（300+行）
- 解决：提取useCalendar.js（558行）+ utils/date.js（416行纯函数）
- 成果：逻辑清晰，可测试性大幅提升

---

#### 四层架构层次划分

**Component 层（UI 层）**
- 职责：用户交互、数据展示、UI渲染
- 调用规则：
  - ✅ 简单场景：直接调用 Store
  - ✅ 复杂场景：调用 Composable
  - ❌ 禁止直接调用 Repository 或 API
- 文件规模：<800行/文件
- 示例：category-drawer.vue、task-edit.vue、index.vue

**Composable 层（业务流程层）** ⭐ 新增

- 职责：
  - ✅ **复杂表单逻辑封装**（如 useTaskForm 管理表单状态、验证、提交）
  - ✅ **多Store协调编排**（如同时操作 taskStore + categoryStore + planStore）
  - ✅ **页面级业务流程**（如 useDragDrop 拖拽状态机、useCalendar 日历计算）
  - ✅ **可复用业务逻辑**（如 useTaskQuadrant 象限管理，多个页面共享）
- 禁止职责：
  - ❌ 全局状态管理（应放 Store）
  - ❌ 数据持久化操作（应放 Repository）
  - ❌ 纯工具函数（应放 utils/）
  - ❌ 访问 DOM 或浏览器 API（应放 Component）
- 调用规则：
  - ✅ 可以调用 Store（编排多个Store）
  - ✅ 可以调用其他 Composable（组合使用）
  - ✅ 可以调用 utils/（纯函数工具）
  - ❌ 禁止直接调用 Repository 或 API
- 文件规模：<600行/文件
- 命名规范：useXxx.js（如 useTaskForm.js、useCalendar.js）
- 示例：
  - `composables/useTaskForm.js` - 任务表单逻辑（821行，管理表单状态+验证+提交）
  - `composables/useCalendar.js` - 日历业务逻辑（558行，日期计算+节假日+事件管理）
  - `composables/useDragDrop.js` - 拖拽状态机（433行，拖拽状态+手势识别）
  - `composables/useTaskQuadrant.js` - 象限管理逻辑（可复用于多个页面）

**Store 层（状态管理层）**
- 职责：全局状态管理、调用 Repository
- 使用 Pinia defineStore
- 提供计算属性（computed）和 actions
- 文件规模：<400行/文件
- 示例：store/category.js、store/task.js

**Repository 层（数据访问层）**
- 职责：数据 CRUD、缓存、离线队列、同步
- 管理 memoryCache（Map结构）、localStorage、operationQueue
- 处理版本冲突（乐观锁，version 字段）
- 文件规模：<500行/文件
- 示例：repositories/CategoryRepository.js、repositories/TaskRepository.js

#### 数据流向

**三层架构数据流（简单场景）**：

```
读取：用户打开页面 → Component 调用 Store.hydrate()
  → Store 调用 Repository.hydrate()
  → Repository 从 localStorage 加载缓存
  → Repository 从服务器同步最新数据
  → Repository 更新 memoryCache
  → Store 通过 computed 自动更新
  → Component 自动重新渲染

写入：用户点击"保存" → Component 调用 Store.createCategory(data)
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

**四层架构数据流（复杂场景）** ⭐ 新增：

```
场景1：复杂表单提交（如任务编辑）
用户填写表单 → Component 调用 Composable.submitTask()
  → Composable 验证表单数据
  → Composable 调用 taskStore.updateTask(data)
  → Composable 调用 categoryStore.updateCategory(data)  // 多Store协调
  → Composable 调用 planStore.linkTaskToPlan(data)
  → 各 Store 分别调用对应的 Repository
  → Repository 更新缓存、写入localStorage、同步服务器
  → Composable 处理成功/失败逻辑
  → Component 显示结果（成功提示/错误信息）

场景2：页面业务流程（如日历拖拽）
用户拖拽任务 → Component 调用 Composable.handleDragStart()
  → Composable 初始化拖拽状态机（状态：idle → dragging）
  → 用户移动 → Component 调用 Composable.handleDragMove()
  → Composable 更新拖拽坐标、计算目标日期
  → 用户放下 → Component 调用 Composable.handleDragEnd()
  → Composable 调用 taskStore.moveTask(taskId, newDate)
  → Store 调用 Repository.update()
  → Repository 同步到服务器
  → 拖拽状态机转换：dragging → idle
  → Component 自动重新渲染

场景3：可复用业务逻辑（如象限管理）
页面A和页面B都需要象限管理 → 两个Component分别调用 useTaskQuadrant()
  → Composable 提供统一的象限切换、颜色获取、优先级计算逻辑
  → 避免在两个Component中重复编写相同业务逻辑
  → 保持业务逻辑的一致性和可维护性
```

#### 强制规范

**禁止行为 ❌**
- ❌ Component 直接调用 API（绕过 Store/Composable）
- ❌ Component 直接访问 Repository（破坏分层）
- ❌ Composable 直接调用 API 或 Repository（必须通过 Store）⭐ 新增
- ❌ Composable 中写全局状态管理逻辑（应放 Store）⭐ 新增
- ❌ Composable 中写数据持久化逻辑（应放 Repository）⭐ 新增
- ❌ Composable 中访问 DOM 或浏览器 API（应放 Component）⭐ 新增
- ❌ 把纯工具函数放 Composable（应放 utils/）⭐ 新增
- ❌ Store 直接操作 localStorage（应由 Repository 管理）
- ❌ Repository 访问 Vue 实例或 DOM（应保持纯逻辑）
- ❌ 在路由文件（routes/）内写内联业务逻辑

**必须执行 ✅**
- ✅ **简单场景**：Component 直接调用 Store 的 actions（三层架构）
- ✅ **复杂场景**：Component 调用 Composable → Composable 调用 Store（四层架构）⭐ 新增
- ✅ Composable 只能调用 Store、其他 Composable、utils/（不能跨层调用）⭐ 新增
- ✅ Store 调用 Repository 的方法
- ✅ Repository 管理所有数据持久化逻辑
- ✅ 所有异步操作返回 Promise
- ✅ App 启动时调用 Store.hydrate()
- ✅ Composable 文件命名遵循 useXxx.js 规范 ⭐ 新增

#### Composable层使用指南 ⭐ 新增

**何时创建 Composable？**

参考决策树（第7.8节"场景4"）：

| 场景 | 是否创建 Composable | 理由 |
|------|-------------------|------|
| 简单列表展示（如分类列表） | ❌ 不需要 | Component 直接调用 Store 即可（三层架构） |
| 简单 CRUD（增删改查） | ❌ 不需要 | Component 直接调用 Store 即可（三层架构） |
| 复杂表单（>15个字段，多个验证规则） | ✅ 需要 | 提取 useXxxForm.js 管理表单状态 |
| 需要同时操作 3+ 个 Store | ✅ 需要 | 提取 Composable 协调 Store |
| 多个页面重复相同业务逻辑 | ✅ 需要 | 提取可复用 Composable |
| 页面级复杂交互（拖拽、手势） | ✅ 需要 | 提取状态机 Composable |

**Composable 标准结构**：

```javascript
// composables/useTaskForm.js（标准模板）

import { ref, computed } from 'vue'
import { useTaskStore } from '@/store/task'
import { useCategoryStore } from '@/store/category'
import { usePlanStore } from '@/store/plan'

/**
 * 任务表单业务逻辑
 * @param {object} options - 配置选项
 * @param {string} options.mode - 'create' | 'edit'
 * @param {string} options.taskId - 任务ID（编辑模式需要）
 * @returns {object} 表单状态和方法
 */
export function useTaskForm(options = {}) {
  // ============================================================
  // 1. 引入 Store（可以引入多个）
  // ============================================================
  const taskStore = useTaskStore()
  const categoryStore = useCategoryStore()
  const planStore = usePlanStore()

  // ============================================================
  // 2. 响应式状态（局部状态，不放 Store）
  // ============================================================
  const form = ref({
    title: '',
    description: '',
    categoryId: null,
    planId: null,
    quadrant: 'q4',
    startDate: null,
    endDate: null
  })
  const errors = ref({})
  const isSubmitting = ref(false)

  // ============================================================
  // 3. 计算属性（基于 Store 数据）
  // ============================================================
  const isFormValid = computed(() => {
    return form.value.title.length > 0 && Object.keys(errors.value).length === 0
  })

  // ============================================================
  // 4. 业务方法（协调多个 Store）
  // ============================================================

  /**
   * 验证表单
   * @returns {boolean} 是否通过验证
   */
  function validateForm() {
    errors.value = {}
    if (!form.value.title) {
      errors.value.title = '标题不能为空'
    }
    if (form.value.title.length > 100) {
      errors.value.title = '标题不能超过100个字符'
    }
    return Object.keys(errors.value).length === 0
  }

  /**
   * 提交表单（协调多个 Store）
   * @returns {Promise<object>} 创建/更新后的任务对象
   */
  async function submitForm() {
    if (!validateForm()) {
      throw new Error('表单验证失败')
    }

    isSubmitting.value = true
    try {
      // 协调多个 Store
      const task = await taskStore.createTask(form.value)
      if (form.value.categoryId) {
        await categoryStore.linkTaskToCategory(task.id, form.value.categoryId)
      }
      if (form.value.planId) {
        await planStore.linkTaskToPlan(task.id, form.value.planId)
      }
      return task
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    form.value = {
      title: '',
      description: '',
      categoryId: null,
      planId: null,
      quadrant: 'q4',
      startDate: null,
      endDate: null
    }
    errors.value = {}
  }

  // ============================================================
  // 5. 返回公开接口
  // ============================================================
  return {
    // 状态
    form,
    errors,
    isSubmitting,
    // 计算属性
    isFormValid,
    // 方法
    validateForm,
    submitForm,
    resetForm
  }
}
```

**在 Component 中使用 Composable**：

```vue
<!-- task-edit.vue -->
<script setup>
import { useTaskForm } from '@/composables/useTaskForm'

// 调用 Composable
const { form, errors, isFormValid, submitForm, resetForm } = useTaskForm({
  mode: 'create'
})

// Component 只处理 UI 逻辑
async function handleSubmit() {
  try {
    await submitForm()
    uni.showToast({ title: '保存成功', icon: 'success' })
    uni.navigateBack()
  } catch (error) {
    uni.showToast({ title: error.message, icon: 'none' })
  }
}
</script>

<template>
  <view class="form">
    <input v-model="form.title" placeholder="任务标题" />
    <text v-if="errors.title" class="error">{{ errors.title }}</text>
    <button :disabled="!isFormValid" @tap="handleSubmit">保存</button>
  </view>
</template>
```

**常见陷阱 ⚠️**：

| 陷阱 | 现象 | 解决方案 |
|------|------|---------|
| 在 Composable 中写全局状态 | 多个页面状态互相干扰 | 全局状态必须放 Store |
| 在 Composable 中直接调用 API | 数据不同步、无缓存、无离线支持 | 必须通过 Store 调用 |
| 把纯工具函数放 Composable | Composable 过重、难以复用 | 纯函数应放 utils/ |
| Composable 超过 600 行 | 职责过重、难以维护 | 拆分为多个 Composable 或提取 utils/ |

---

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

详细设计见：`docs/02-技术设计/四层架构设计（渐进式升级）.md`

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

**示例1：简单场景（三层架构）**：

```javascript
// ❌ 旧写法（直接调用 API）
import { categoryApi } from '@/api/category'

const categories = ref([])

async function saveCategory() {
  const res = await categoryApi.create({ name: form.value.name })
  categories.value.push(res.data)  // 手动更新数组
}

// ✅ 三层架构写法（Component → Store → Repository）
import { useCategoryStore } from '@/store/category'

const categoryStore = useCategoryStore()
const categories = categoryStore.categories  // 响应式，自动更新

async function saveCategory() {
  await categoryStore.createCategory({ name: form.value.name })
  // 无需手动更新，categories 自动同步
}
```

**示例2：复杂场景（四层架构）** ⭐ 新增：

```vue
<!-- task-edit.vue（复杂表单场景） -->
<script setup>
// ❌ 旧写法（Component 过重，700+行业务逻辑）
import { ref } from 'vue'
import { useTaskStore } from '@/store/task'
import { useCategoryStore } from '@/store/category'
import { usePlanStore } from '@/store/plan'

const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const planStore = usePlanStore()

const form = ref({ /* 30+ 个字段 */ })
const errors = ref({})

function validateForm() { /* 100+ 行验证逻辑 */ }
function formatDate() { /* 50+ 行格式化逻辑 */ }
async function submitForm() {
  // 协调 3 个 Store，150+ 行代码
  // 这些业务逻辑混在 Component 中，导致 Component 过重
}

// ✅ 四层架构写法（Component → Composable → Store → Repository）
import { useTaskForm } from '@/composables/useTaskForm'

// Component 只需 30 行代码，业务逻辑全部在 Composable
const { form, errors, isFormValid, submitForm } = useTaskForm({ mode: 'create' })

async function handleSubmit() {
  try {
    await submitForm()  // Composable 处理所有业务逻辑
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message, icon: 'none' })
  }
}
</script>
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

**三层架构迁移（简单场景）**：

- [ ] 创建 Repository 类（实现标准接口）
- [ ] 创建 Store（调用 Repository）
- [ ] 移除 Component 中的 `import { xxxApi }` 引用
- [ ] 改为 `import { useXxxStore }`
- [ ] 将所有 `xxxApi.xxx()` 改为 `xxxStore.xxx()`
- [ ] 删除手动更新数组的代码（如 `array.push(...)`）
- [ ] 在 App.vue 的 onLaunch 中调用 `xxxStore.hydrate()`
- [ ] 测试离线模式（关闭服务器，操作后重新上线）
- [ ] 测试缓存恢复（刷新页面，数据仍在）

**四层架构迁移（复杂场景）** ⭐ 新增：

- [ ] 判断是否需要 Composable（参考第7.8节"场景4"决策树）
- [ ] 创建 Composable 文件（命名：useXxx.js）
- [ ] 从 Component 中提取业务逻辑到 Composable：
  - [ ] 表单状态管理（form、errors、isSubmitting）
  - [ ] 验证逻辑（validateForm）
  - [ ] 多 Store 协调逻辑（同时操作多个 Store）
  - [ ] 格式化/转换逻辑（formatDate、transformData）
- [ ] 在 Composable 中调用 Store（不直接调用 API/Repository）
- [ ] Component 只保留 UI 逻辑（事件处理、Toast 提示、路由跳转）
- [ ] 确保 Composable 文件 <600 行（超过则拆分）
- [ ] 测试业务逻辑（表单验证、多 Store 协调）
- [ ] 测试 UI 交互（成功提示、错误提示）

#### 常见陷阱

**三层架构常见陷阱**：

**陷阱1：忘记调用 hydrate()**
- 现象：页面空白，数据为空
- 解决：在 App.vue 的 onLaunch 中调用 `store.hydrate()`

**陷阱2：手动更新数组**
- 现象：数据重复（Repository 已更新，Component 又手动 push）
- 解决：删除手动更新代码，依赖 computed 自动更新

**陷阱3：直接调用 API**
- 现象：数据不同步、无离线支持、无缓存
- 解决：移除 API 引用，改为调用 Store

**四层架构常见陷阱** ⭐ 新增：

**陷阱4：在 Composable 中写全局状态**
- 现象：多个页面打开时，状态互相干扰（如页面A的表单影响页面B）
- 原因：Composable 中的 ref() 是局部状态，但业务逻辑误以为是全局的
- 解决：全局状态必须放 Store（如 Pinia store），Composable 只管理局部状态

**陷阱5：Composable 直接调用 Repository**
- 现象：数据不同步、缓存失效、离线队列失效
- 原因：跨层调用破坏了架构分层（Composable 应该调用 Store，不能跳过 Store）
- 解决：Composable 只能调用 Store，由 Store 调用 Repository

**陷阱6：把纯工具函数放 Composable**
- 现象：Composable 文件过大（>600行）、难以复用
- 原因：误把不依赖 Vue 响应式的纯函数放 Composable
- 解决：纯工具函数（如日期格式化、字符串处理）应放 `utils/`

**陷阱7：过度使用 Composable**
- 现象：简单的 CRUD 也创建 Composable，导致目录结构复杂
- 原因：误以为所有场景都需要 Composable
- 解决：简单场景直接用三层架构（Component → Store → Repository），只有复杂场景才用四层

### 7.9 字段管理规范 ⭐ (新增，2026-03-05)

#### 核心原则

**在创建任何新字段前，必须先查阅《详细字段映射表》确认字段是否已存在。**

#### 强制检查清单 ✅

**步骤1：创建新字段前**
```bash
# 必读文档
cat docs/02-技术设计/详细字段映射表.md

# 在文档中搜索关键词，确认字段不存在
# 例如：要创建"任务优先级"字段，先搜索 "priority" 或 "优先级"
```

**步骤2：确认字段不存在后**
1. 按照命名规范创建字段（数据库用 snake_case，代码用 camelCase）
2. 在数据库创建字段（通过 migration 文件）
3. 在后端 Model 中定义字段（Sequelize）
4. 更新前端 Repository/Store（如需要）
5. **⭐ 立即更新《详细字段映射表.md》，添加新字段到对应表格**

**步骤3：更新文档**
- 在《详细字段映射表.md》对应的表格中新增一行
- 填写：逻辑含义、前端字段、后端字段、数据库字段、类型、说明

#### 禁止行为 ❌

- ❌ 不查阅《详细字段映射表》就创建新字段
- ❌ 创建字段后不更新文档
- ❌ 字段命名不遵循规范（数据库必须 snake_case）
- ❌ 创建语义重复的字段（如 taskTitle 和 title 同时存在）

#### 常见场景

**场景1：需要在 Task 表增加"优先级"字段**
```
步骤1：查阅《详细字段映射表》Task 表，搜索 "priority" 或 "优先级"
步骤2：确认不存在后，创建 migration：
  - 数据库字段：priority (ENUM: 'low', 'medium', 'high')
步骤3：更新 Task.js Model：
  - 后端字段：priority (camelCase)
步骤4：更新《详细字段映射表》，新增一行：
  | 优先级 | priority | priority | priority | ENUM | low/medium/high |
步骤5：在工作日志中记录此次字段变更
```

**场景2：前端需要"任务标签"功能**
```
步骤1：查阅《详细字段映射表》，搜索 "tag" 或 "label"
步骤2：发现已存在 subtasks(JSON) 字段，考虑是否复用或新建
步骤3：如需新建，按上述流程执行
```

#### 参考文档

- 📄 [详细字段映射表.md](../../docs/02-技术设计/详细字段映射表.md)
- 📄 [系统架构完整结构图.md](../../docs/02-技术设计/系统架构完整结构图.md)
- 📄 [代码规范.md](../../docs/02-技术设计/代码规范.md) 第2节：字段命名规范

---

## 8. 🤖 AI工程治理核心清单

> **目的**: 确保 Claude 修改代码前进行系统性检查，防止架构退化、代码腐化
> **强制等级**: ⭐⭐⭐⭐⭐ 最高优先级
> **更新时间**: 2026-03-09
> **适用范围**: 所有代码修改、新增、重构场景

---

### 8.1 修改代码前的5个必查项 ⭐ 强制执行

**在开始编写任何代码之前，必须完成以下5项检查。违反任一项将导致架构退化。**

#### 必查项1：架构分层检查

**检查问题**：我要修改/新增的代码应该放在哪一层？

**决策树**：

```
步骤1：识别代码性质
  → 纯工具函数（不依赖Vue响应式）？ → 放 utils/
  → 数据CRUD、缓存、同步？ → 放 Repository
  → 全局状态管理？ → 放 Store
  → 复杂业务流程（表单逻辑、多Store协调）？ → 放 Composable
  → UI渲染、用户交互？ → 放 Component

步骤2：检查调用关系
  ✅ 允许的调用链：
    Component → Composable → Store → Repository → API
    Component → Store → Repository → API（简单场景）
    utils/ ← 所有层都可以调用

  ❌ 禁止的调用链：
    Component → Repository（跨层调用）
    Component → API（跨层调用）
    Composable → Repository（跨层调用）
    Composable → API（跨层调用）
    Store → API（绕过Repository）
```

**检查清单**：

- [ ] 我明确知道这段代码属于哪一层（Component/Composable/Store/Repository/Utils）
- [ ] 我确认这一层的职责边界（参考第7.9节"四层架构层次划分"）
- [ ] 我确认调用链符合架构规范（不跨层调用）
- [ ] 如果是新建 Composable，我已确认符合创建条件（参考第7.8节"场景4"决策树）

---

#### 必查项2：文件大小检查

**检查问题**：修改后文件是否会超过阈值？

**阈值表**（第7.8节）：

| 层级 | 阈值 | 检查命令 |
|------|------|---------|
| Component | <800行 | `wc -l <文件路径>` |
| Composable | <600行 | `wc -l <文件路径>` |
| Store | <400行 | `wc -l <文件路径>` |
| Repository | <500行 | `wc -l <文件路径>` |
| Utils | <300行 | `wc -l <文件路径>` |

**检查流程**：

```bash
# 步骤1：检查当前文件行数
wc -l <目标文件>

# 步骤2：评估本次修改行数
# - 简单功能：~50-100行
# - 中等功能：~100-300行
# - 复杂功能：~300-500行

# 步骤3：判断
如果 当前行数 + 预计新增 > 阈值：
  → 先完成当前功能（不打断工作流）
  → 功能完成后，立即执行"超标文件登记流程"（第7.8节"场景3"）
否则：
  → 正常编写代码
```

**检查清单**：

- [ ] 我已运行 `wc -l` 检查目标文件当前行数
- [ ] 我已评估本次修改的代码量
- [ ] 如果会超标，我已确认是否需要先拆分再修改
- [ ] 如果功能完成后超标，我将立即登记到《超标文件追踪清单.md》

---

#### 必查项3：字段命名检查

**检查问题**：我要创建的字段是否已存在？命名是否符合规范？

**强制规范**（第7.10节）：

1. **创建新字段前必须先查阅**：`docs/02-技术设计/详细字段映射表.md`
2. **命名规范**：
   - 数据库字段：snake_case（如 user_id、created_at）
   - 后端代码字段：camelCase（如 userId、createdAt）
   - 前端代码字段：camelCase（如 userId、createdAt）
3. **Sequelize 自动映射**：underscored: true（数据库 ↔ 代码自动转换）

**检查流程**：

```bash
# 步骤1：搜索《详细字段映射表》
cat docs/02-技术设计/详细字段映射表.md | grep -i "<关键词>"

# 步骤2：确认字段不存在后
# - 数据库：创建 migration 文件，字段用 snake_case
# - 后端Model：在 Sequelize Model 中定义，字段用 camelCase
# - 前端：在 Repository/Store 中使用，字段用 camelCase

# 步骤3：更新文档
# 在《详细字段映射表.md》对应表格中新增一行
```

**检查清单**：

- [ ] 我已查阅《详细字段映射表.md》确认字段不存在
- [ ] 数据库字段命名使用 snake_case
- [ ] 代码字段命名使用 camelCase
- [ ] 我已更新《详细字段映射表.md》添加新字段记录

---

#### 必查项4：三端兼容检查（UniApp专用）

**检查问题**：我的代码是否兼容 Android / iOS / H5 三端？

**强制规范**（第7.7节）：

| 场景 | 禁止写法 | 正确写法 |
|------|---------|---------|
| 输入框双向绑定 | `v-model` | `:value` + `@input` |
| 本地存储 | `localStorage.setItem()` | `uni.setStorageSync()` |
| 网络请求 | `axios.get()` | `uni.request()` 或封装的 `utils/request.js` |
| 路由跳转 | `router.push()` | `uni.navigateTo()` / `uni.reLaunch()` |
| 样式单位 | `px` | `rpx`（自动适配不同屏幕） |

**条件编译写法**：

```vue
<!-- 模板中 -->
<!-- #ifdef H5 -->
<view>仅H5显示</view>
<!-- #endif -->

<!-- #ifdef APP-PLUS -->
<view>仅App显示</view>
<!-- #endif -->

<!-- JS中 -->
// #ifdef H5
console.log('H5环境')
// #endif

// #ifdef APP-PLUS
plus.device.getInfo(...)
// #endif
```

**检查清单**：

- [ ] 我没有使用仅 `v-model`（已改用 `:value` + `@input`）
- [ ] 我没有直接使用 `localStorage`（已改用 `uni.setStorageSync`）
- [ ] 我没有直接使用 `axios`（已使用项目封装的 `utils/request.js`）
- [ ] 我没有使用 `router.push`（已改用 `uni.navigateTo` 等 uni API）
- [ ] 样式单位使用 `rpx`，避免直接写 `px`

---

#### 必查项5：文档同步检查

**检查问题**：我的修改是否需要同步更新文档？

**需要更新文档的场景**：

| 修改类型 | 需要更新的文档 |
|---------|--------------|
| 新增 API 接口 | `docs/03-API文档/<模块名>接口.md` |
| 新增数据库表/字段 | `docs/02-技术设计/详细字段映射表.md` + `database/schema/<表名>.sql` |
| 重大架构决策 | `docs/06-AI协作日志/02-架构决策记录(ADR)/ADR-NNN-主题.md` |
| 新增配置项 | `docs/02-技术设计/配置管理.md` |
| 新增 Composable | `.claude/CLAUDE.md` 第4.4节 + 第7.9节 |
| 创建任何 .md 文件 | `.claude/文档导航.md`（强制登记） |
| 文件超过800行 | `docs/02-技术设计/超标文件追踪清单.md` |

**检查清单**：

- [ ] 我已确认是否需要更新文档
- [ ] 如果创建了 .md 文件，我已在 `.claude/文档导航.md` 中登记
- [ ] 如果新增了字段，我已更新《详细字段映射表.md》
- [ ] 如果文件超标，我已登记到《超标文件追踪清单.md》

---

### 8.2 AI修改代码的7步标准流程 ⭐ 强制执行

**每次修改代码都必须按照此流程执行，禁止跳过任何步骤。**

#### 步骤1：理解需求（5分钟）

- [ ] 明确用户要求：具体要实现什么功能？
- [ ] 识别修改范围：涉及哪些文件？哪些层级？
- [ ] 评估复杂度：简单/中等/复杂？预计代码量？

#### 步骤2：执行5个必查项（10分钟）

- [ ] 必查项1：架构分层检查 ✅
- [ ] 必查项2：文件大小检查 ✅
- [ ] 必查项3：字段命名检查 ✅
- [ ] 必查项4：三端兼容检查（UniApp） ✅
- [ ] 必查项5：文档同步检查 ✅

**如果任一必查项不通过，立即停止，向用户说明情况。**

#### 步骤3：设计方案（15分钟）

- [ ] 绘制调用链图：Component → Composable → Store → Repository → API
- [ ] 确认文件结构：需要新建哪些文件？修改哪些文件？
- [ ] 评估风险：是否会破坏现有功能？是否需要重构？

#### 步骤4：编写代码（核心）

- [ ] **按层级编写**：Repository → Store → Composable → Component（自底向上）
- [ ] **每写一个函数添加JSDoc注释**（中文）
- [ ] **每完成一层提交一次Git commit**（便于回滚）
- [ ] **遵循命名规范**：数据库 snake_case，代码 camelCase

#### 步骤5：自我审查（10分钟）

- [ ] 运行 ESLint 检查：`npm run lint`
- [ ] 检查是否有跨层调用（Component 直接调 Repository？）
- [ ] 检查是否有硬编码（魔法数字、魔法字符串？）
- [ ] 检查是否有TODO未处理

#### 步骤6：测试（15分钟）

- [ ] 编写单元测试（至少覆盖核心函数）
- [ ] 手动测试三端（H5 + Android + iOS，至少测H5）
- [ ] 测试离线模式（如果涉及数据操作）
- [ ] 测试边界情况（空数据、超长输入、网络异常）

#### 步骤7：更新文档和日志（10分钟）

- [ ] 更新工作日志：记录今日完成的功能、决策、问题
- [ ] 更新 CURRENT_STATUS.md：当前进度、下一步任务
- [ ] 更新相关文档（API文档、字段映射表、超标清单等）
- [ ] 提交最终Git commit + push

---

### 8.3 常见违规场景和纠正方法

#### 违规场景1：直接修改代码，跳过5个必查项

**现象**：
- 用户说"帮我在任务表单加个优先级字段"
- Claude 直接修改 Component 代码，没有检查架构分层
- 结果：Composable 层已有优先级逻辑，导致重复代码

**正确做法**：
1. 执行必查项3（字段命名检查）→ 发现 `priority` 字段已存在
2. 执行必查项1（架构分层检查）→ 发现应该复用 Composable 中的逻辑
3. 修改方案：在 Component 中调用 Composable 的 `getPriorityLabel()` 方法

---

#### 违规场景2：Composable 直接调用 Repository

**现象**：
```javascript
// ❌ 错误写法（Composable 直接调 Repository）
import { taskRepository } from '@/repositories/taskRepository'

export function useTaskForm() {
  async function submitForm() {
    await taskRepository.create(form.value)  // 跨层调用！
  }
}
```

**正确做法**：
```javascript
// ✅ 正确写法（Composable 调用 Store）
import { useTaskStore } from '@/store/task'

export function useTaskForm() {
  const taskStore = useTaskStore()

  async function submitForm() {
    await taskStore.createTask(form.value)  // 通过Store调用
  }
}
```

---

#### 违规场景3：文件超标后不登记

**现象**：
- 完成功能后，文件从 750行 → 920行（超过800行阈值）
- Claude 没有登记到《超标文件追踪清单.md》
- 用户无法追踪技术债务

**正确做法**（第7.8节"场景3"）：
1. 运行 `wc -l <文件路径>`
2. 发现超标（920行 > 800行）
3. 更新《超标文件追踪清单.md》，新增一行记录
4. 向用户发出提醒："该文件已超标15%，是否需要生成拆分方案？"

---

### 8.4 AI自查清单（每次提交代码前）

```
□ 我已完成5个必查项（架构、文件大小、字段、三端兼容、文档）
□ 我已按照7步流程执行（理解→检查→设计→编码→审查→测试→文档）
□ 我没有跨层调用（Component 不直接调 Repository/API）
□ 我没有创建重复字段（已查阅《详细字段映射表》）
□ 我没有使用禁止的API（localStorage、v-model、axios、router.push）
□ 我已添加JSDoc注释（中文）
□ 我已编写单元测试（至少核心函数）
□ 我已运行 ESLint（无错误）
□ 我已更新工作日志和CURRENT_STATUS.md
□ 我已更新相关文档（如果需要）
```

**如果以上任一项未完成，禁止提交代码。**

---

### 8.5 违规后果和纠正机制

**轻微违规**（如忘记更新文档）：
- Claude 在下次会话开始时补充更新文档
- 在工作日志中记录违规和纠正过程

**中度违规**（如跨层调用）：
- 立即回滚代码（git reset）
- 重新执行7步流程
- 在工作日志中记录违规原因和改进措施

**严重违规**（如破坏架构、泄露敏感信息）：
- 立即停止所有操作
- 向用户汇报违规情况
- 等待用户指示后再继续

---

## 9. 🚨 关键注意事项

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
| **Composable 直接调用 Repository** ⭐ | 破坏四层架构分层，必须通过 Store 调用（第7.9节） |
| **Composable 直接调用 API** ⭐ | 破坏四层架构分层，必须通过 Store 调用（第7.9节） |
| **在 Composable 中写全局状态** ⭐ | 全局状态必须放 Store，Composable 只管理局部状态（第7.9节） |
| **在 Composable 中写数据持久化逻辑** ⭐ | 数据持久化必须放 Repository，Composable 只协调业务流程（第7.9节） |
| **把纯工具函数放 Composable** ⭐ | 纯函数应放 utils/，Composable 是业务流程层（第7.9节） |
| **修改代码前跳过第8节"5个必查项"** ⭐ | 导致架构退化、代码腐化、技术债务累积（第8节） |

### 必须执行 ✅

| 操作 | 时机 |
|------|------|
| 编写单元测试 | 每个功能完成后 |
| 更新工作日志 | 每天结束时 |
| 更新CURRENT_STATUS.md | 每次会话结束前 |
| 运行ESLint | 提交代码前 |
| 使用JSDoc注释 | 编写每个函数时 |
| **执行第8节"5个必查项"** ⭐ | **修改任何代码之前**（架构、文件大小、字段、三端兼容、文档） |
| **创建 Composable 前判断必要性** ⭐ | 新建 Composable 前（参考第7.8节"场景4"决策树） |
| **Composable 文件命名用 useXxx.js** ⭐ | 创建 Composable 时（如 useTaskForm.js、useCalendar.js） |
| **检查文件大小是否超标** ⭐ | 功能完成后（参考第7.8节阈值表） |

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
