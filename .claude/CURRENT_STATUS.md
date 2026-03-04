# 项目当前状态

> **最后更新**: 2026-03-04（第17次会话，LogRepository 三层架构实施完成）
> **更新者**: Claude Sonnet 4.5
> **当前分支**: develop
> **最新commit**: 79044be（实施 LogRepository 三层架构）

---

## 🎯 当前阶段

**阶段名称**: Phase 3 - 前端日历/时间体系
**进度**: 🔄 进行中 (约75%)
**已完成模块**: Auth / Users / Planning Records / 时间体系后端（5大系统） / 前端日历框架 / 后端企业级改造 / 可折叠日历条
**待完成模块**: 前端业务页面联调 / 日期选择器完善 / 易经模块 / 闹铃功能

---

## ✅ 已完成

### Phase 0 - 项目初始化
- ✅ Git仓库初始化，关联GitHub（develop分支）
- ✅ MySQL数据库：planning_app_dev + planning_app_prod + planning_app_test
- ✅ 后端骨架：Express + Sequelize + 中间件体系
- ✅ 前端骨架：UniApp + Pinia + 7大规划模块目录
- ✅ 数据库设计文档
- ✅ .claude/ 协作文档体系

### Phase 2 - 后端业务模块（commit: 94c81de）
- ✅ **Auth模块**：注册/登录/JWT中间件（24个测试）
- ✅ **Users模块**：获取/更新个人信息/修改密码（20个测试）
- ✅ **Planning Records模块**：完整CRUD（40个测试）
- **全套测试：84/84 通过**

### Phase 3a - 时间体系后端（commit: 16691a5）
- ✅ **数据库迁移**（8个Migration）：
  - holidays 节日节气表
  - tasks 任务表（含四象限isUrgent/isImportant、RRULE重复）
  - task_occurrences 任务实例表
  - alarm_sounds 闹铃音频表
  - alarms 闹铃表
  - logs 日志表（精确到分钟）
  - plan_progress_logs 规划进度记录表
  - alter-planning-records（新增progress_pct字段）
- ✅ **Model**（7个）：Holiday / Task / TaskOccurrence / AlarmSound / Alarm / JournalLog / PlanProgressLog
- ✅ **Service**（5个）：holidayService（含农历/节气计算）/ taskService（含RRULE）/ alarmService / logService（含转任务）/ planProgressService
- ✅ **Controller + Route**（4套）：holiday / task / alarm / log
- ✅ **planning.js路由扩展**：新增进度记录POST/GET两个接口
- ✅ **节日种子数据**：55条（中国公历节日9条 + 农历节日12条 + 24节气 + 西方节日8条 + 国际节日4条）
- ✅ **constants.js**：新增7个常量枚举组
- ✅ **所有84个原有测试继续通过**（无回归）

### Phase 3j - 时间轴视图UI重构（第14次会话，commit: 597fe29）
对应设计图 17.jpg（全部未完成）/ 44.jpg（部分已完成），重写 `calendar/index.vue` 时间轴视图区块：
- ✅ **顶部栏**：`目标和分类 ≡` 左侧（tab样式，白色背景、圆角顶部、阴影）+ `⇌ 时间轴` 右侧标签
- ✅ **全天区域**：
  - `全天` 标签（灰色，左侧宽80rpx）+ 右侧任务条列表（垂直排列）
  - 未完成任务：`tl-bar-q1`(粉红) / `tl-bar-q2`(蓝紫) / `tl-bar-q3`(黄) / `tl-bar-q4`(绿) 彩色实色横条
  - 已完成任务：`tl-bar-done` 淡色半透明（opacity 0.55）+ 删除线文字（`tl-bar-text-done`）
  - 未完成任务优先展示，已完成排在下方（对应 44.jpg 布局）
- ✅ **时间格任务**：定时任务也改为彩色条（`tl-timed-bar`），复用象限颜色 + done 状态
- ✅ **当前时间红线**：保留（仅今天显示），红点+红线定位到当前分钟位置
- ✅ **计算属性拆分**：原 `allDayTasks`（只含未完成）→ 拆成 `allDayTasksPending` + `allDayTasksDone` 两个计算属性

### Phase 3i - 任务详情/编辑页重构（第13次会话，commit: 597fe29）
对应设计图 41.jpg / 42.jpg / 43.jpg，完全重写 `task-edit.vue` 的 template + style，保留全部 JS 逻辑：
- ✅ **顶部导航**：`←` 返回 + 分类名称（无分类/规划名 ∨，点击选择规划）+ `···` 菜单
- ✅ **日期 Tab 栏**：今天 / 明天 / 其他日期 / 收集箱，下划线高亮当前选中，点击切换 `form.taskDate`
- ✅ **任务卡片**（白色圆角卡片）：
  - 圆形复选框（各象限主题色）+ 粗体标题输入（完成时有删除线，对应 43.jpg）
  - 点击复选框切换 `taskDone` 状态
  - 左竖线 + 子计划区域："添加子计划" 输入框 + 已有子计划列表（每条带⊖删除按钮，勾选后删除线）
- ✅ **描述文本框**：独立白色卡片，多行 textarea，placeholder"选填：简单描述..."
- ✅ **属性行卡片**（白色圆角）：
  - 优先级：四色圆点图标 + 彩色优先级徽章（`!!!!重要且紧急`/`!!重要不紧急` 对应图中样式）→ 弹窗选择
  - 提醒：未开启 / 当天HH:MM + ✕ + ⊕ 按钮
  - 完成期限：当天/明天/N月N日 → 打开日历选择器
  - 重复：未开启/每日... → 底部弹窗选择
  - 专注：前往专注 →
- ✅ **装饰分隔线**：点 + 🌿 icon 横排（对应图中 ···🌿··🌿··🌿··🌿···）
- ✅ **创建/完成时间**（isEdit 模式）：`创建时间：2026.02.19 09:20`，`完成时间：暂无 / 2026.02.19 11:45`（43.jpg 已完成有时间）
- ✅ **底部按钮**：有规划时双按钮（`查看目标`轮廓 + `保存`灰色实心），无规划时只有`保存`全宽
- ✅ **优先级选择弹窗**：底部 2×2 网格（四色背景），重复规则简化为底部 list 弹窗
- ✅ **新增 JS**：`taskDone`、`activeDateTab`、`subtasks`、`newSubtaskText`、`showQuadrantPicker`、`showRepeatSheet`、`createdAt`、`completedAt`、`quadrantBadgeIcon/Text`、`deadlineText`、`repeatModeLabel`、`onDateTab()`、`addSubtask()`、`removeSubtask()`、`viewGoal()`、`goFocus()`

### Phase 3h - 四象限视图UI重构（第12次会话，commit: 597fe29）
- ✅ **四象限视图全面重构为笔记本卡片风格**（对应设计图 16.jpg / 37.jpg / 38.jpg / 39.jpg / 40.jpg）：
  - 布局：左上=紧急不重要(Q3黄)，右上=重要且紧急(Q1红)，左下=不重要不紧急(Q4绿)，右下=重要不紧急(Q2蓝)
  - 卡片顶部"回形针"装饰条（`.nb-clips` + `.nb-clip`）
  - 卡片标题栏带彩色下划线（各象限主题色）
  - 未完成任务：彩色圆圈复选框（各象限色边框），点击直接切换完成状态
  - **已完成任务（37.jpg/40.jpg效果）**：灰色实心勾选圆圈 + 文字删除线 + 整体透明度降低，在同象限卡片内紧跟未完成任务后展示
  - **空象限提示**：圆形空图标 + 提示文字（如"无益象限 快速做"、"琐事象限 减少做"）
  - **顶部工具栏**：左侧"目标和分类 ≡"按钮，右侧"⇌ 四象限"模式标签
  - 默认视图改为 `'quadrant'`（四象限）
- ✅ **子任务展开弹窗（38.jpg效果）**：
  - 点击有 `subtasks` 属性的任务 → 弹出半透明遮罩+卡片弹窗
  - 弹窗内：父任务行（带复选框）+ 左边红线分隔 + 子任务列表（勾选/未勾选）
  - 点击遮罩关闭弹窗；弹窗放在根容器（非 scroll-view 内）保证 fixed 定位正确
- ✅ **日历条任务点改为多色双点**：
  - 根据当日任务的象限，最多显示2种颜色点（红/蓝/黄/绿）
  - `getTaskDots(dateStr)` 函数，统计象限Set后取前2种
  - `.task-dots` 横排容器，`.dot-q1/q2/q3/q4` 颜色类
- ✅ **新增计算属性**：
  - `urgentImportantDone` / `notUrgentImportantDone` / `urgentNotImportantDone` / `notUrgentNotImportantDone`：各象限已完成任务分组
- ✅ **新增方法**：
  - `toggleTaskDone(task)`：四象限直接切换完成，带弹窗状态同步
  - `openTaskDetail(task)`：有子任务时展开弹窗，无子任务时跳转编辑
  - `closeSubtaskPopup()` / `toggleSubtask(sub)` / `getQuadrantClass(task)`

### Phase 3k - 三层架构实施（第17次会话，commit: e1a2056）
完整实施 Component → Store → Repository 三层架构，离线优先、乐观锁、指数退避重试：
- ✅ **架构设计文档**（commit: 9dfb3f1）：
  - `docs/02-技术设计/三层架构设计.md`：当前实施指南（数据流图、CategoryRepository 完整示例、迁移检查清单、FAQ）
  - `docs/02-技术设计/企业级数据流架构（支持10万+用户）.md`：未来演进路线图（DTO、Validator、RepositoryFactory、ErrorRecovery、PerformanceMonitor 标注⏸️待办）
  - 更新 `.claude/CLAUDE.md` v1.2 → v1.3：新增 7.9 节"三层架构规范"（强制规范、禁止行为、代码示例）
- ✅ **Repository 层**（commit: 558cfc3 + e1a2056）：
  - `frontend/Planning-app/repositories/CategoryRepository.js`（285行）：
    - memoryCache (Map结构，O(1)查找) + localStorage持久化
    - operationQueue 离线队列（指数退避重试：1s→2s→4s→8s→16s，最多5次）
    - version 字段乐观锁（冲突检测，本地优先策略）
    - sortOrder 字段（支持拖拽排序）
    - deletedAt 软删除（过滤逻辑在 getAll()）
    - 500ms debounce 防抖写入和同步
    - hydrate() 启动流程：_loadFromLocalStorage() → sync() → _replayQueue()
  - `frontend/Planning-app/repositories/TaskRepository.js`（260行）：
    - 简化版 CategoryRepository（单用户场景，version可选）
    - 新增 `getByDate(date)` 方法按日期过滤
    - taskDate 字段替代 dueDate
  - `frontend/Planning-app/repositories/UserRepository.js`（270行，commit: e1a2056）：
    - 简化设计（用户数据无需 memoryCache/operationQueue）
    - 管理 token、userInfo、guest_mode 持久化
    - 集成登录/注册/登出 API 调用
    - 支持访客模式（token = 'guest'）
    - hydrate() 数据完整性检查
  - `frontend/Planning-app/repositories/LogRepository.js`（425行，commit: 79044be）：
    - memoryCache (Map结构) + localStorage持久化
    - operationQueue 离线队列（指数退避重试）
    - 按日期过滤：getByDate(date) 方法
    - 日志转任务：convertToTask(id, taskData) 方法
    - 软删除：deletedAt 字段
    - 同步最近30天数据（避免拉取过多历史）
- ✅ **Store 层重构**（commit: 558cfc3 + 5bd51ce + e1a2056 + 79044be）：
  - `frontend/Planning-app/store/category.js`（190行）：
    - Pinia Composition API，computed 自动映射 Repository.getAll()
    - hydrate() / createCategory() / updateCategory() / deleteCategory() / reorderCategories() 全部调用 Repository
    - 移除所有直接 API 调用
  - `frontend/Planning-app/store/task.js`（重构，commit: 5bd51ce）：
    - 移除 `import { getTasks, createTask, ... } from '@/api/task.js'`
    - 全部改为调用 TaskRepository 方法
    - 保留所有 computed 属性（urgentImportant、notUrgentImportant、doneTasks 等）
    - fetchTasksByDate() 改用 TaskRepository.getByDate()
    - addTask/updateTask/deleteTask 全部调用 Repository
  - `frontend/Planning-app/store/user.js`（重构，commit: e1a2056）：
    - Options API → Composition API
    - 移除所有直接 API 调用和 localStorage 操作
    - 全部改为调用 UserRepository 方法
    - 新增 _syncFromRepository() 同步响应式状态
    - 新增 isGuest 计算属性
  - `frontend/Planning-app/store/log.js`（重构，commit: 79044be）：
    - 移除所有直接 API 调用
    - 全部改为调用 LogRepository 方法
    - logs 改为 computed 属性（自动从 Repository 获取）
    - 新增 logsCount 计算属性
    - 保持 API 兼容（addLog/editLog/toTask/removeLog）
- ✅ **App.vue 数据水合**（commit: 5bd51ce + e1a2056 + 79044be）：
  - onLaunch 改为 async，导入 4 个 Store
  - 启动时 Promise.all 并行调用 4 个 Store 的 hydrate()（user + category + task + log）
  - 加载缓存 + 同步服务器 + 重放离线队列
  - 简化登录状态判断（使用 userStore.isLoggedIn）
- ✅ **修复 profile.vue**（commit: e1a2056）：
  - 移除直接给 userStore.token 赋值（违反三层架构）
  - 使用 userStore.isLoggedIn 和 isGuest 计算属性
  - 移除冗余的 getToken 导入

### Phase 3g - 可折叠日历条（第11次会话，commit: fb742ef）
- ✅ **calendar/index.vue 完整重写**：实现周/月双模式日历条，手势驱动展开/折叠
  - `weekDays = ['周一','周二','周三','周四','周五','周六','周日']`（周一起，符合中国习惯）
  - `calendarMode: ref('week')` 状态机，`'week'` | `'month'` 两种模式
  - `getWeekMonday(date)`：计算给定日期所在周的周一（JS getDay() 0=周日，diff = dow===0 ? -6 : 1-dow）
  - `monthRows` 计算属性：6×7 = 42天二维数组，以当月1号所在周的周一为起点，`otherMonth` 标记补位日期（灰色显示）
  - 日历条手势：水平 >50px → 切周/月，垂直向下 >60px → 展开月视图，垂直向上 >60px → 折叠回周视图
  - 内容区手势：月模式 + scrollTop=0 + 上滑 → 折叠
  - 点击月视图日期自动折叠回周视图
  - CSS：补位日期灰色（`.other-month .date-num { color: #CCC }`），今天虚线圆圈边框
  - 同步修复所有字段名：`task.status 'done'` → `'completed'`，`dueTime` → `startTime`，`loggedAt` → `logTime`
- ✅ **lint 修复**：移除未使用的 `contentTouchStartX` 变量（声明 + 赋值两处）
- ✅ **lint 修复**：`onContentTouchMove(e)` 未使用参数 `e` → 改为无参数

### Phase 3f - 联调 Bug 修复（第10次会话，commit: 680a131）
- ✅ **根因分析**：task/log/holiday/alarm 四个 Controller 误用 `res.json(success(data))` 写法
  - `response.js` 的 `success(res, data, msg)` 第一参数是 Express `res` 对象
  - 新建 Controller 写成了 `res.json(success(data, msg))`，导致 `success()` 收到 data 当 res，触发 `res.status is not a function`
  - 修复：全部改为 `return success(res, data, msg)` / `return created(res, data, msg)`
- ✅ **holidayService.getLunarInfo()**：`lunar.isLeap()` → `lunar.getMonth() < 0`
  - lunar-javascript 无 `isLeap()` 方法，闰月通过 `getMonth()` 返回负数标识

### Phase 3e - 前端登录/注册页完善（第9次会话，commit: 6b1f031）
- ✅ **login.vue 重构**：Options API → `<script setup>`，`@click` → `@tap`
- ✅ **register.vue 重构**：Options API → `<script setup>`，`@click` → `@tap`
- ✅ **确认 App.vue 登录守卫完整**：onLaunch 恢复 token → 无 token 跳转登录页
- ✅ **确认 pages.json 路由完整**：login / register / profile / calendar 所有页面已注册
- ✅ **确认前端架构完整可联调**：
  - request.js：uni.request 封装，自动注入 Token，401 自动跳转登录
  - storage.js：多端兼容（H5 用 localStorage，App 用 uni.getStorageSync）
  - config/index.js：开发环境 `http://127.0.0.1:3000/api/v1`

### Phase 3d - 前端字段对齐完整（第8次会话，commit: 982300f）
- ✅ **store/task.js 字段对齐**：
  - import 移除不存在的 `updateTaskStatus`
  - 四象限计算属性状态枚举 `'done'` → `'completed'`（urgentImportant / notUrgentImportant / urgentNotImportant / notUrgentNotImportant / doneTasks 共5处）
  - `timelineTasks` 改用 `t.startTime` 和 `!t.isAllDay`
  - `fetchTasksByDate` 正确解析后端 `{ single, range, recurring }` 三分结构
  - `addTask` 用 `data.taskDate` 替代 `data.dueDate`
  - `toggleDone` 用 `updateTask(id, { status })` 替代不存在的 `updateTaskStatus`
- ✅ **calendar/index.vue 字段对齐**：
  - `currentWeekDates` hasTask 判断：`t.dueDate` → `t.taskDate`
  - `allDayTasks`：`!t.dueTime` → `t.isAllDay`，状态判断 `'done'` → `'completed'`
  - `getTasksAtHour`：`t.dueTime` → `t.startTime`
- ✅ **task-edit.vue 完善**（第8次会话，commit: b1e959a）：picker 替换、isAllDay switch、字段名对齐
- ✅ **profile.vue 完善**（第8次会话，commit: b4d360c）：`<script setup>`、蓝色渐变头部、账号信息展示

### Phase 3c - 企业级后端改造（第7次会话，commit: 3305790）
- ✅ **Bug修复：successCreated → created**（5处，分布于 task/log/alarm Controller 和 planning 路由）
- ✅ **新建 planProgressController.js**：从路由文件抽取内联业务逻辑，完成 Route→Controller→Service 分层
- ✅ **server.js 完善**：优雅关闭增加 `db.sequelize.close()` 关闭连接池 + `uncaughtException` 处理
- ✅ **Joi 参数校验统一**（routes/task + alarm + log）：
  - `routes/task.js`：createTaskSchema / updateTaskSchema / getTasksQuerySchema + idParamSchema
  - `routes/alarm.js`：createAlarmSchema / updateAlarmSchema / createAlarmSoundSchema / trimSoundSchema
  - `routes/log.js`：createLogSchema / updateLogSchema / convertToTaskSchema / getLogsQuerySchema
  - 所有 `:id` 参数 `validateParams` 保护
- ✅ **errorHandler 改用 winston**：移除 `console.error`，改用 `logger.warn/error`；4xx 用 warn、5xx 用 error
- ✅ **前端 API 字段名对齐**：
  - `api/task.js`：`dueDate/dueTime` → `taskDate/startTime/endTime/dateType`；新增 `createSingleTask / createTimedTask / updateOccurrence / getSubtasksByPlan`；删除不存在的 `getTaskDetail / updateTaskStatus`
  - `api/log.js`：`startDate/endDate` → `start/end`；`loggedAt` → `logTime`；`convertLogToTask` 支持传入 `taskData`

### Phase 3b - 前端日历框架（第5-6次会话）
- ✅ **pages.json更新**：
  - 新增日历相关页面（calendar/index、task-edit、log-edit、view、focus）
  - TabBar 更新为4个Tab（做计划 / 视图 / 专注 / 我的）
  - 日历主页设为第一个Tab（首页入口）
- ✅ **API封装**（`frontend/Planning-app/api/`）：
  - `holiday.js`：getHolidays / getHolidaysByDate
  - `task.js`：getTasks / getTaskDetail / createTask / updateTask / updateTaskStatus / deleteTask
  - `log.js`：getLogs / createLog / updateLog / convertLogToTask / deleteLog
- ✅ **Pinia Store**：
  - `store/task.js`：四象限计算属性 / 时间轴排序 / CRUD方法
  - `store/log.js`：日志CRUD / 转任务方法
- ✅ **pages/calendar/index.vue**（主日历页）：
  - 周历条（7天，左右滑动切周）
  - 今日红线（时间轴视图，每分钟更新）
  - 三种视图：时间轴 / 四象限 / 列表
  - 四象限颜色标注（红/蓝/黄/绿）
  - FAB悬浮按钮（+ 展开：加任务 / 记日志）
  - 节日节气标注（调用holidayAPI）
  - 日志列表 + 一键转任务
- ✅ **pages/calendar/task-edit.vue**（任务创建/编辑）：
  - 四象限选择器（图形化）
  - 截止日期/时间选择
  - 重复规则（RRULE 6种选项）
  - 关联规划占位
  - 编辑模式删除按钮
- ✅ **pages/calendar/log-edit.vue**（日志记录）：
  - 大号时间显示（精确到分钟）
  - 时间修改弹窗（支持快速选择）
  - 日志转任务功能
  - 关联任务/规划占位
- ✅ **pages/calendar/view.vue**（视图选择，TabBar占位）
- ✅ **pages/calendar/focus.vue**（专注/番茄钟，TabBar占位）

### Phase 3k - index.vue架构评估（第16次会话，2026-03-03）
- ✅ **深度分析 pages/calendar/index.vue**（3802行超大文件）：
  - 文件行数：3802行（超标661%）
  - 函数数量：73个（超标143%）
  - 响应式状态：54+个（超标170%）
  - 识别15项问题（2个P0严重Bug + 4个P1高风险 + 4个P2中风险 + 5个P3低风险）
  - P0问题：函数重复声明5处、变量重复声明12处
  - 识别9大职责领域（日历渲染、四象限管理、拖拽系统、弹窗状态机、任务CRUD、节日加载、时间线视图、访客模式、H5鼠标模拟）
- ✅ **创建架构评估完整文档体系**（遵循CLAUDE.md规范，全部中文）：
  - `docs/02-技术设计/index.vue架构评估任务-分阶段可交接方案.md`（~300行）
    - 任务拆分为4个独立子任务（每个1.5-2.5小时）
    - 支持Claude账号切换的交接文档规范
    - 包含"下一个Claude接手指南"（3种场景）
  - `docs/02-技术设计/index.vue企业级架构评估报告-完整版.md`（~800行）
    - 健康评分：35/100（高风险）
    - 四阶段评估：问题识别 → 职责拆解 → 架构升级方向 → 渐进式重构策略
    - 12步绞杀者模式重构路线图
    - 优先级矩阵（P0→P1→P2→P3）
  - `docs/06-AI协作日志/01-每日工作日志/2026/03-March/2026-03-03-index.vue架构评估文档创建.md`（~100行）
- ✅ **本次为纯文档工作，未修改任何代码**（遵循用户指示"先不要动代码"）

---

## 🔄 待完成（下一步）

### ⚠️ 重要提示：三层架构迁移基本完成

**本次会话已完成**（commit: 79044be）：
- ✅ CategoryRepository + TaskRepository + UserRepository + LogRepository 创建（4个主要 Repository）
- ✅ category.js + task.js + user.js + log.js Store 重构为三层架构
- ✅ App.vue 并行加载所有 Store 数据（Promise.all，4个）
- ✅ 架构设计文档 + CLAUDE.md 规范更新

**仍需迁移的 Store**（次要功能，优先级最低）：
- ⏸️ **store/planning.js**：规划CRUD，需创建 PlanningRepository（管理 planning_records 表）
  - 注：规划功能使用频率低，可后续迁移

### P0 - 下一个Claude应该做的（2个选项，建议优先级：选项A > 选项B）

**选项A：执行 index.vue 架构评估任务1 - 紧急Bug识别报告**（推荐，2小时）
- 目标：基于评估报告，生成详细的P0级Bug修复清单
- 输入：读取 `docs/02-技术设计/index.vue企业级架构评估报告-完整版.md` 中的问题1和问题2
- 工作内容：
  1. 定位所有函数重复声明的精确位置（文件名:行号）
  2. 定位所有变量重复声明的精确位置
  3. 分析影响范围和潜在风险
  4. 生成详细修复清单（按优先级排序）

**选项B：继续三层架构迁移 - 创建 LogRepository**（1.5小时）
- 目标：将 store/log.js 改造为三层架构
- 创建 `frontend/Planning-app/repositories/LogRepository.js`
- 管理日志数据的 CRUD 和持久化
- 重构 store/log.js 调用 Repository

---

## ⚠️ 已知问题和注意事项

### 🔴 文件大小超标（高优先级）
- ⚠️ **已建立追踪机制**：所有超标文件已登记到 `docs/02-技术设计/超标文件追踪清单.md`
- ⚠️ **6个文件超过800行阈值**：
  - P0级（>2000行）：`pages/calendar/index.vue`（3802行）、`task-edit.vue`（3340行）、`AddTaskPanel.vue`（2847行）
  - P1级（1000-2000行）：`plan/detail.vue`（1392行）、`category-drawer.vue`（1221行）
  - P2级（800-1000行）：`plan/create.vue`（1122行）
- ⚠️ **index.vue 已完成评估**：状态🟡评估中，等待您审批拆分方案
- ⚠️ **管理规范已建立**：详见 `.claude/CLAUDE.md` 第7.8节 + `docs/02-技术设计/代码规范.md` 第8节

### 其他已知问题
- ⚠️ `holiday API` 已对齐（返回 `holidayMap` / `lunarMap` 对象，`calendar/index.vue` 已适配）
- ⚠️ `relatedStage` 字段的校验用的是中文 name
- ⚠️ .env.development 含 MySQL 密码，绝对不能提交
- ⚠️ bcrypt@6.0.0 在 dependencies（生产必须），supertest@7.2.2 在 devDependencies
- ⚠️ `routes/log.js` 的 `getLogsQuerySchema` 用 `.or('date', 'start')` 约束，前端调用必须传其中之一
- ⚠️ `pages.json` TabBar 没有配置图标文件（`iconPath`），视觉上只显示文字

---

## 📂 关键路径速查

| 路径 | 说明 |
|------|------|
| **文件大小管理（2026-03-03新增）** | |
| `docs/02-技术设计/超标文件追踪清单.md` | ⭐ 追踪所有超标文件（当前6个），拆分进度管理 |
| `.claude/CLAUDE.md` 第7.8节 | 文件大小管理规范（5种场景标准流程） |
| `docs/02-技术设计/代码规范.md` 第8节 | 文件大小约束（800行阈值、拆分建议） |
| **后端核心** | |
| `backend/src/config/constants.js` | 所有枚举常量（PLANNING_TYPES / TASK_STATUS / 等） |
| `backend/src/models/index.js` | 模型入口+关联关系 |
| `backend/src/app.js` | Express路由注册中心 |
| `backend/src/routes/planning.js` | 规划记录REST接口+进度接口 |
| `backend/tests/` | 6个测试文件，84个测试用例 |
| **前端核心** | |
| `frontend/Planning-app/pages/calendar/index.vue` | **日历主页（核心）** ⚠️ 3802行超标 |
| `frontend/Planning-app/pages/calendar/task-edit.vue` | 任务创建/编辑 ⚠️ 3340行超标 |
| `frontend/Planning-app/pages/calendar/log-edit.vue` | 日志记录 |
| `frontend/Planning-app/api/task.js` | 任务API封装 |
| `frontend/Planning-app/api/log.js` | 日志API封装 |
| `frontend/Planning-app/store/task.js` | 任务Pinia Store（含四象限计算） |
| `frontend/Planning-app/store/log.js` | 日志Pinia Store |

---

## 📊 API 接口清单（已完成）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/logout | 退出登录 |
| GET | /api/v1/auth/me | 获取当前用户 |
| GET | /api/v1/users/me | 获取个人信息 |
| PUT | /api/v1/users/me | 更新个人信息 |
| POST | /api/v1/users/me/password | 修改密码 |
| GET | /api/v1/planning | 规划列表（分页+筛选） |
| POST | /api/v1/planning | 创建规划 |
| GET | /api/v1/planning/:id | 规划详情 |
| PUT | /api/v1/planning/:id | 更新规划内容 |
| PATCH | /api/v1/planning/:id/status | 更新规划状态 |
| DELETE | /api/v1/planning/:id | 删除规划（软删除） |
| POST | /api/v1/planning/:id/progress | 记录规划进度 |
| GET | /api/v1/planning/:id/progress | 获取进度历史 |
| GET | /api/v1/holidays | 获取节日节气列表 |
| GET | /api/v1/tasks | 任务列表（分页+日期筛选） |
| POST | /api/v1/tasks | 创建任务 |
| GET | /api/v1/tasks/:id | 任务详情 |
| PUT | /api/v1/tasks/:id | 更新任务 |
| PATCH | /api/v1/tasks/:id/status | 更新任务状态 |
| DELETE | /api/v1/tasks/:id | 删除任务（软删除） |
| GET | /api/v1/alarms | 闹铃列表 |
| POST | /api/v1/alarms | 创建闹铃 |
| DELETE | /api/v1/alarms/:id | 删除闹铃 |
| GET | /api/v1/logs | 日志列表 |
| POST | /api/v1/logs | 创建日志 |
| PUT | /api/v1/logs/:id | 更新日志 |
| POST | /api/v1/logs/:id/convert-to-task | 日志转任务 |
| DELETE | /api/v1/logs/:id | 删除日志 |

---

## 🎯 下一个Claude应该做什么

1. 读 `.claude/CLAUDE.md`
2. 读本文档
3. 查看最新Git提交：`git log --oneline -5`
4. **重点**：在 `frontend/` 目录进行前端联调，验证日历主页能正常展示
5. 完善 `task-edit.vue` 的日期时间选择器

---

## 🚀 即开即用：接手指令（直接复制给新Claude）

> 请先读 `D:\MyProject\Planning-app\.claude\CLAUDE.md` 和 `CURRENT_STATUS.md`。
>
> **当前状态**（2026-03-03 第16次会话）：
> - 最新commit: `3e11a48`（移除子任务保存功能的所有调试日志）
> - 当前分支: `develop`
> - **重要发现**：`pages/calendar/index.vue`（3802行）存在严重Bug，已完成企业级架构评估
>
> **第16次会话完成内容**：
> - ✅ 深度分析 `index.vue`：识别15项问题（2个P0严重Bug + 4个P1高风险 + 4个P2中风险 + 5个P3低风险）
> - ✅ 创建3个文档（~1200行）：
>   1. `docs/02-技术设计/index.vue架构评估任务-分阶段可交接方案.md`（任务拆分方案）
>   2. `docs/02-技术设计/index.vue企业级架构评估报告-完整版.md`（完整评估报告）
>   3. `docs/06-AI协作日志/01-每日工作日志/2026/03-March/2026-03-03-index.vue架构评估文档创建.md`（工作日志）
> - ✅ **未修改任何代码**（遵循用户指示"先不要动代码，你先开始文档方面的工作吧"）
>
> **下一步任务**（强烈建议优先级：选项A > 选项B > 选项C > 选项D）：
>
> **🔴 选项A：执行架构评估任务1 - 紧急Bug识别报告**（推荐，2小时）
> - 读取评估报告，定位所有P0级Bug的精确位置
> - 生成详细Bug清单：`docs/06-AI协作日志/03-Bug分析记录/BUG-001-index.vue重复声明问题汇总.md`
> - 这是修复Bug前的必要准备，避免遗漏影响范围
>
> **🟡 选项B：执行架构评估任务2 - 职责拆解方案设计**（推荐，2.5小时）
> - 基于9大职责领域，设计Composable和组件拆分方案
> - 输出文档：`docs/02-技术设计/index.vue重构方案-职责拆解设计.md`
>
> **🟠 选项C：直接修复P0级Bug**（高风险，5小时）
> - 修复函数重复声明（5处）和变量重复声明（12处）
> - 风险：未做详细分析，建议先执行选项A
>
> **🟢 选项D：继续前端业务功能开发**
> - 实现 AddTaskPanel.vue 的3个功能按钮（时间段/重复/提醒）
> - 或进行实际联调验证
>
> **必读文档**（按顺序）：
> 1. `.claude/CLAUDE.md`（协作规范）
> 2. `.claude/CURRENT_STATUS.md`（本文档）
> 3. `docs/02-技术设计/index.vue架构评估任务-分阶段可交接方案.md`（任务拆分）
> 4. `docs/02-技术设计/index.vue企业级架构评估报告-完整版.md`（评估报告）
>
> **字段规范**（勿改）：
> - 后端任务字段：`taskDate` / `startTime` / `endTime` / `isAllDay` / `dateType`
> - 任务状态枚举：`'pending'` / `'completed'` / `'skipped'`
> - 响应结构：`GET /api/v1/tasks?date=` 返回 `{ date, single: [], range: [], recurring: [] }`
>
> **已知问题**：
> - ⚠️ **index.vue 存在P0级Bug**：函数重复声明5处、变量重复声明12处（详见评估报告）
> - `pages.json` TabBar 没有配置图标文件（`iconPath`），视觉上只显示文字
> - `routes/log.js` GET 接口要求 `date` 或 `start` 参数必填，前端不能裸调 `getLogs({})`
> - AddTaskPanel 的时间段/重复/提醒是 `uni.showToast('开发中')` 的 placeholder

---

## 📋 本文档更新规范

每次会话结束前，Claude必须更新以下字段：

| 字段 | 位置 | 说明 |
|------|------|------|
| 最后更新日期 | 文档顶部 | 格式：YYYY-MM-DD（第X次会话，简述） |
| 最新commit | 文档顶部 | `git log --oneline -1` 的输出 |
| 当前阶段进度 | 🎯当前阶段 | 百分比+已完成模块列表 |
| 本次完成内容 | ✅已完成 | 新增小节，列出本次创建/修改的文件 |
| 下一步待做 | 🔄待完成 | 精确到文件名/函数名 |
| 接手指令 | 🚀即开即用 | **每次必须刷新**，写清楚从哪里继续 |

**文档性质**: 动态文档，每次会话结束前必须更新
