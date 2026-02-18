# 项目当前状态

> **最后更新**: 2026-02-17（第3次会话，Phase 2 规划记录模块完成）
> **更新者**: Claude Sonnet 4.5
> **当前分支**: develop
> **最新commit**: 94c81de feat(planning): 实现用户模块和规划记录模块完整CRUD

---

## 🎯 当前阶段

**阶段名称**: Phase 2 - 后端核心业务 API
**进度**: 🔄 进行中 (约50%)
**已完成模块**: Auth / Users / Planning Records
**待完成模块**: I Ching 易经模块 / 前端联调

---

## ✅ 已完成

### Phase 0 - 项目初始化
- ✅ Git仓库初始化，关联GitHub（develop分支）
- ✅ MySQL数据库：planning_app_dev + planning_app_prod + planning_app_test
- ✅ 后端骨架：Express + Sequelize + 中间件体系
- ✅ 前端骨架：UniApp + Pinia + 7大规划模块目录
- ✅ 数据库设计文档（tables.md / ERD.md）
- ✅ .claude/ 协作文档体系 + 文档导航.md
- ✅ 中文优先规范写入 CLAUDE.md（7.5节、7.6节）
- ✅ 15个英文 .md 文件重命名为中文

### Phase 2 - 后端业务模块
- ✅ **Auth模块**：注册/登录/JWT中间件（11单元+13集成，共24个测试）
- ✅ **Users模块**：获取/更新个人信息/修改密码（8单元+12集成，共20个测试）
- ✅ **Planning Records模块**：
  - Migration建表（planning_records，含ENUM/软删除/4个索引）
  - planningService（getList/getDetail/create/update/updateStatus/remove）
  - planningController + routes/planning.js（含Joi参数校验）
  - 单元测试16个 + 集成测试24个，共40个测试

**全套测试：84/84 通过**

---

## 🔄 待完成（下一步）

### P0 - 下一个Claude应该做的

1. **易经（IChingHexagram）模块**（可选，当前阶段）：
   - 64卦数据表 Migration
   - 初始化数据导入脚本 (`database/scripts/seed-hexagrams.js`)
   - ichingService + ichingController + routes/iching.js
   - 占卦算法（三枚铜钱法）

2. **前端登录/注册页联调**（核心可用功能）：
   - `frontend/Planning-app/pages/user/login.vue`（骨架已存在，需联调后端）
   - `frontend/Planning-app/pages/user/register.vue`（文件不存在，需新建）
   - 联调 `/api/v1/auth/register` 和 `/api/v1/auth/login`
   - Token存储到 store/user.js

3. **TabBar 图标配置**：
   - `pages.json` 中 TabBar 的 `iconPath` 和 `selectedIconPath` 需配置真实图标路径

4. **其余规划类型页面**（career/project/mood/health/time/habit 各目录的 `index.vue`）

---

## ⚠️ 已知问题和注意事项

- ⚠️ `relatedStage` 字段的 isIn 校验用的是 `LIFE_STAGES` 的 `name`（中文），不是英文key
- ⚠️ `PLANNING_TYPES` 中有 `diet`（饮食规划），但前端路由/pages.json 中可能未对应
- ⚠️ bcrypt@6.0.0 在 dependencies（生产必须），supertest@7.2.2 在 devDependencies
- ⚠️ .env.development 含 MySQL 密码，绝对不能提交

---

## 📂 关键路径速查

| 路径 | 说明 |
|------|------|
| `backend/src/config/constants.js` | PLANNING_TYPES / PLANNING_STATUS 等枚举常量 |
| `backend/src/models/index.js` | 模型入口+关联关系 |
| `backend/src/app.js` | Express路由注册中心 |
| `backend/src/routes/planning.js` | 规划记录的6个REST接口 |
| `backend/tests/` | 6个测试文件，84个测试用例 |
| `frontend/Planning-app/pages/user/` | 用户相关页面（login已有骨架） |

---

## 📊 API 接口清单（已完成）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/logout | 退出登录 |
| GET | /api/v1/auth/me | 获取当前用户（需认证） |
| GET | /api/v1/users/me | 获取个人信息 |
| PUT | /api/v1/users/me | 更新个人信息 |
| POST | /api/v1/users/me/password | 修改密码 |
| GET | /api/v1/planning | 规划列表（分页+筛选） |
| POST | /api/v1/planning | 创建规划 |
| GET | /api/v1/planning/:id | 规划详情 |
| PUT | /api/v1/planning/:id | 更新规划内容 |
| PATCH | /api/v1/planning/:id/status | 更新规划状态 |
| DELETE | /api/v1/planning/:id | 删除规划（软删除） |

---

## 🎯 下一个Claude应该做什么

1. 读 `.claude/CLAUDE.md`
2. 读本文档
3. 查看最新Git提交：`git log --oneline -5`
4. 进入 `backend/` 目录，从易经模块或前端联调开始

**文档性质**: 动态文档，每次会话结束前必须更新
