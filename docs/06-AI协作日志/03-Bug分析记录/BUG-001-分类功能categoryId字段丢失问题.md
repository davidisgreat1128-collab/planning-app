# Bug分析日志 - BUG-001-分类功能categoryId字段丢失问题

## 🐛 基本信息

- **Bug编号**: BUG-001
- **标题**: 分类功能中任务创建时 categoryId 字段在 HTTP 传输中丢失
- **严重程度**: 🔴 严重
- **优先级**: P0
- **发现日期**: 2026-02-24
- **分析人**: Claude AI (Sonnet 4.5)
- **状态**: ✅ 已修复并验证

---

## 📋 Bug描述

### 现象

用户在特定分类（如"编写软件"分类）下创建任务时，任务的 `categoryId` 字段始终为 `null`，导致任务无法正确关联到分类容器中，所有任务都显示在"无分类"容器里。

### 复现步骤

1. 用户创建自定义分类（如"编写软件"，ID: `1771915507752`）
2. 在该分类下点击"新建任务"
3. 填写任务信息并保存
4. 查看任务列表，发现任务出现在"无分类"容器中，而不是"编写软件"容器
5. 查看后端数据库，`tasks` 表中该任务的 `category_id` 字段为 `NULL`

### 预期行为

- 任务应该关联到选中的分类
- 任务应该显示在"编写软件"分类容器中
- 数据库中 `category_id` 字段应该存储 `"1771915507752"`

### 实际行为

- 任务的 `categoryId` 在传输过程中丢失
- 后端接收到的 `req.body` 中不包含 `categoryId` 字段
- 数据库存储的 `category_id` 为 `NULL`
- 任务显示在"无分类"容器中

---

## 🔍 根因分析

### 问题定位过程

经过系统性的数据流追踪，定位到问题出在**后端路由的 Joi 验证中间件**：

```
前端 AddTaskPanel
  ↓ payload 包含 categoryId: "1771915507752" ✅
TaskStore.addTask(payload)
  ↓ 数据完整 ✅
request.js (uni.request)
  ↓ cleanData 包含 categoryId ✅
HTTP POST → 后端
  ↓ HTTP 传输正常 ✅
Express body-parser
  ↓ req.body 包含 categoryId ✅
❌ Joi Validator 中间件 (task.js:72)
  ↓ createTaskSchema 没有定义 categoryId
  ↓ stripUnknown: true 自动移除该字段
  ↓ req.body 变成没有 categoryId ❌
TaskController
  ↓ req.body.categoryId = undefined
TaskService
  ↓ categoryId = null (解构默认值)
数据库
  ↓ category_id = NULL
```

### 根本原因

**后端路由验证 schema 缺少字段定义**

文件：`backend/src/routes/task.js`

1. **Joi Schema 未定义 categoryId**：
   - `createTaskSchema` 中没有定义 `categoryId` 字段
   - 同样缺少 `reminderTime` 和 `reminderPersistent` 字段

2. **Joi 验证器配置 `stripUnknown: true`**：
   - 位置：`backend/src/middleware/validator.js:32`
   - 作用：自动移除 schema 中未定义的字段
   - 后果：所有未在 schema 中声明的字段都会被静默过滤掉

3. **字段白名单机制**：
   - 本项目采用字段白名单验证机制
   - 任何新增字段都必须在对应的 Joi Schema 中显式声明
   - 否则会被自动过滤，且不会报错

### 问题代码

**backend/src/routes/task.js (第19-35行) - 修复前**：
```javascript
const createTaskSchema = Joi.object({
  title:        Joi.string().trim().min(1).max(200).required(),
  description:  Joi.string().trim().max(2000).allow('', null),
  isUrgent:     Joi.boolean().default(false),
  isImportant:  Joi.boolean().default(false),
  isAllDay:     Joi.boolean().default(true),
  dateType:     Joi.string().valid('single', 'range').default('single'),
  taskDate:     dateStr.when('dateType', { is: 'single', then: Joi.required() }),
  startDate:    dateStr.when('dateType', { is: 'range',  then: Joi.required() }),
  endDate:      dateStr.when('dateType', { is: 'range',  then: Joi.required() }),
  startTime:    timeStr.allow(null),
  endTime:      timeStr.allow(null),
  isRecurring:  Joi.boolean().default(false),
  rrule:        Joi.string().max(500).allow('', null),
  rruleUntil:   dateStr.allow(null),
  planId:       Joi.number().integer().positive().allow(null)
  // ❌ 缺少 categoryId 字段定义
  // ❌ 缺少 reminderTime 字段定义
  // ❌ 缺少 reminderPersistent 字段定义
});
```

**backend/src/middleware/validator.js (第28-34行)**：
```javascript
function validate(schema, options = {}) {
  const joiOptions = {
    abortEarly: false,    // 收集所有错误
    allowUnknown: false,  // 不允许未定义的字段
    stripUnknown: true,   // ⚠️ 自动移除未定义的字段
    ...options
  };
  // ...
}
```

### 修复代码

**backend/src/routes/task.js (第19-38行) - 修复后**：
```javascript
const createTaskSchema = Joi.object({
  title:        Joi.string().trim().min(1).max(200).required(),
  description:  Joi.string().trim().max(2000).allow('', null),
  isUrgent:     Joi.boolean().default(false),
  isImportant:  Joi.boolean().default(false),
  isAllDay:     Joi.boolean().default(true),
  dateType:     Joi.string().valid('single', 'range').default('single'),
  taskDate:     dateStr.when('dateType', { is: 'single', then: Joi.required() }),
  startDate:    dateStr.when('dateType', { is: 'range',  then: Joi.required() }),
  endDate:      dateStr.when('dateType', { is: 'range',  then: Joi.required() }),
  startTime:    timeStr.allow(null),
  endTime:      timeStr.allow(null),
  isRecurring:  Joi.boolean().default(false),
  rrule:        Joi.string().max(500).allow('', null),
  rruleUntil:   dateStr.allow(null),
  planId:       Joi.number().integer().positive().allow(null),
  categoryId:   Joi.string().max(50).allow(null),  // ✅ 新增：分类ID字段
  reminderTime: Joi.string().allow(null),  // ✅ 新增：提醒时间字段
  reminderPersistent: Joi.boolean().allow(null)  // ✅ 新增：持久提醒字段
});

const updateTaskSchema = Joi.object({
  // ... 原有字段
  categoryId:   Joi.string().max(50).allow(null)  // ✅ 新增：支持更新分类
}).min(1);
```

### 附加优化（预防性修复）

虽然根本问题在后端，但同时也优化了前端代码：

**frontend/Planning-app/utils/request.js (第40-51行)**：
```javascript
// 🔧 修复：过滤掉值为 undefined 的字段
// uni.request 在某些平台上会自动过滤 undefined 值，可能导致其他字段也丢失
// 因此在发送前手动过滤，确保只发送有效数据
let cleanData = data;
if (data && typeof data === 'object' && !Array.isArray(data)) {
  cleanData = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      cleanData[key] = data[key];
    }
  });
}
```

**frontend/Planning-app/components/task/AddTaskPanel.vue (第1135-1138行)**：
```javascript
// 分类字段：只有当 categoryId 是有效字符串时才添加该字段
if (props.categoryId && typeof props.categoryId === 'string') {
  payload.categoryId = props.categoryId;
}
```

---

## 🧪 测试验证

### 验证步骤

1. ✅ 后端服务器重启后加载新的 Joi Schema
2. ✅ 在"编写软件"分类下创建测试任务
3. ✅ 检查前端日志：categoryId 正确包含在 payload 中
4. ✅ 检查后端日志：req.body 正确接收到 categoryId
5. ✅ 检查数据库：tasks 表中 category_id 正确存储
6. ✅ 检查前端显示：任务正确出现在"编写软件"分类容器中

### 测试结果

- [x] 原有功能正常（任务创建、四象限分类、时间轴显示）
- [x] Bug已修复（categoryId 正确传输和存储）
- [x] 无新增问题

### 回归测试

- [x] 在"全部"容器中创建任务 → 任务出现在"无分类"容器 ✅
- [x] 在"无分类"容器中创建任务 → 任务留在"无分类"容器 ✅
- [x] 在自定义分类中创建任务 → 任务出现在该分类容器 ✅
- [x] 切换不同分类 → 任务正确过滤显示 ✅
- [x] 提醒功能字段 → 正常传输（reminderTime, reminderPersistent）✅

---

## 📚 经验教训

### 关键发现

1. **Joi 的 stripUnknown 机制是静默的**
   - 不会抛出错误，只会默默过滤掉未定义字段
   - 调试困难，需要逐层追踪数据流

2. **字段白名单需要严格管理**
   - 添加新功能时必须同步更新验证 schema
   - 建议在 schema 中添加详细注释，标注字段用途

3. **数据流调试的系统方法**
   - 从前端到后端逐层添加日志
   - 精确定位数据丢失的环节
   - 不要假设某个环节"应该正常"

### 预防措施

1. **新增字段的完整清单**：
   - [ ] 数据库表添加字段（migration）
   - [ ] Sequelize Model 添加字段定义
   - [ ] **Joi Schema 添加验证规则** ⚠️ 容易遗漏
   - [ ] Service 层处理新字段
   - [ ] Controller 层文档更新
   - [ ] 前端 API 接口调用更新

2. **建议修改 Joi 配置**（待讨论）：
   ```javascript
   // 考虑改为警告模式而非静默过滤
   allowUnknown: true,   // 允许未知字段
   stripUnknown: false,  // 不自动过滤，改为记录警告日志
   ```

3. **添加字段完整性测试**：
   - 集成测试中验证所有字段是否正确传输
   - 数据库测试检查字段是否正确存储

---

## 🔗 相关资源

### 修改的文件

1. **backend/src/routes/task.js**
   - 第19-38行：createTaskSchema 添加 categoryId、reminderTime、reminderPersistent
   - 第40-54行：updateTaskSchema 添加 categoryId

2. **frontend/Planning-app/utils/request.js**
   - 第40-51行：添加 undefined 字段过滤逻辑

3. **frontend/Planning-app/components/task/AddTaskPanel.vue**
   - 第1135-1138行：优化 categoryId 字段添加逻辑

### Git Commit

```bash
# 主要修复
git commit -m "fix(task): 修复 Joi Schema 缺少 categoryId 导致字段丢失的问题

- 在 createTaskSchema 中添加 categoryId、reminderTime、reminderPersistent 字段验证
- 在 updateTaskSchema 中添加 categoryId 字段验证
- 前端添加 undefined 字段过滤逻辑，避免 uni.request 潜在问题
- 优化 AddTaskPanel 中 categoryId 字段处理逻辑
- 清理调试日志

问题根因：Joi 验证器配置 stripUnknown: true，导致未在 schema 中定义的字段被静默过滤

Closes: BUG-001"
```

### 相关文档

- **功能文档**：规划和分类系统设计文档（待创建）
- **技术文档**：[.claude/CLAUDE.md](../../.claude/CLAUDE.md) - 第3.2节决策4（API分层规范）

---

## 📝 附录：完整调试日志记录

### 调试日志1：前端数据传输链路

```
[Calendar] 当前选中的分类ID: 1771915507752
[Calendar] 将传递给 AddTaskPanel 的 categoryId: 1771915507752

[AddTaskPanel] 接收到的 props.categoryId: 1771915507752
[AddTaskPanel] typeof props.categoryId: string
[AddTaskPanel] payload.categoryId: 1771915507752
[AddTaskPanel] "categoryId" in payload: true

[TaskStore] addTask 接收到的数据: {
  "categoryId": "1771915507752",
  ...
}

[Request] 发送的 data: {
  "categoryId": "1771915507752",
  ...
}
```

**结论**：前端数据传输正常 ✅

### 调试日志2：后端接收链路

```
[TaskController] 请求体 req.body: {
  "title": "BUG修复测试",
  "isUrgent": true,
  "isImportant": true,
  "isAllDay": true,
  "dateType": "single",
  "isRecurring": false,
  "taskDate": "2026-02-24"
  // ❌ 没有 categoryId 字段
}
[TaskController] categoryId 字段: undefined

[TaskService] 准备创建任务，categoryId: null
[TaskService] 任务创建成功，返回的 categoryId: null
```

**结论**：字段在到达 Controller 之前就已经丢失 ❌

### 调试日志3：定位 Joi 验证器

检查 `backend/src/routes/task.js:72`：
```javascript
router.post('/', validate(createTaskSchema), taskController.createTask);
```

检查 `createTaskSchema` → **发现缺少 categoryId 定义**

检查 `backend/src/middleware/validator.js:32` → **发现 stripUnknown: true**

**结论**：问题定位成功！字段被 Joi 验证器过滤掉了 🎯

---

**分析人**: Claude AI (Sonnet 4.5)
**分析时间**: 2026-02-24 15:55
**用户确认**: 问题修复成功 ✅
