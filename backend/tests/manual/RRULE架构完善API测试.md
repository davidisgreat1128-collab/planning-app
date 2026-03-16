# RRULE架构完善 - 4个新API手动测试文档

> **测试时间**: 2026-03-16
> **测试目的**: 验证阶段一Day3新增的4个重复任务操作API
> **前置条件**: 服务器已启动，存在重复任务数据

---

## 前置准备

### 1. 获取测试用的重复任务ID

```sql
-- 查询现有重复任务
SELECT id, title, is_recurring, rrule, exdate, rrule_until
FROM tasks
WHERE is_recurring = 1 AND deleted_at IS NULL
LIMIT 5;

-- 结果：使用 taskId = 6（标题：222，rrule：FREQ=DAILY）
```

### 2. 获取Bearer Token

**登录API**:
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "david",
  "password": "123456"
}

# 响应中的 token 用于后续测试
```

---

## API 1：修改当天 - 创建单日覆盖

**路由**: `POST /api/v1/tasks/:id/modify-single-day`

**场景**: 3月20日这天想临时改个标题和紧急性，其他字段保持默认

### 请求示例

```http
POST http://localhost:3000/api/v1/tasks/6/modify-single-day
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "date": "2026-03-20",
  "updates": {
    "title": "今天改个标题-临时会议",
    "isUrgent": true
  }
}
```

### 预期响应

```json
{
  "success": true,
  "code": 201,
  "message": "单日覆盖创建成功",
  "data": {
    "id": 1,
    "taskId": 6,
    "userId": 1,
    "overrideDate": "2026-03-20",
    "title": "今天改个标题-临时会议",
    "description": null,
    "isUrgent": true,
    "isImportant": null,
    "startTime": null,
    "endTime": null,
    "isAllDay": null,
    "createdAt": "2026-03-16T...",
    "updatedAt": "2026-03-16T..."
  }
}
```

### 验证数据库

```sql
-- 查询覆盖记录
SELECT * FROM task_overrides WHERE task_id = 6 AND override_date = '2026-03-20';

-- 预期结果：有1条记录，title='今天改个标题-临时会议', is_urgent=1, 其他可覆盖字段为NULL
```

### 验证优先级流程

```http
GET http://localhost:3000/api/v1/tasks?date=2026-03-20
Authorization: Bearer <YOUR_TOKEN>

# 预期：taskId=6的任务实例，title为覆盖后的值，isOverridden=true
```

---

## API 2：修改未来 - 拆分任务规则

**路由**: `POST /api/v1/tasks/:id/modify-future`

**场景**: 从3月25日开始，任务内容完全改变（拆分规则）

### 请求示例

```http
POST http://localhost:3000/api/v1/tasks/6/modify-future
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "splitDate": "2026-03-25",
  "updates": {
    "title": "从3月25日起改为新任务",
    "description": "这是拆分后的新规则",
    "isUrgent": true,
    "isImportant": false
  }
}
```

### 预期响应

```json
{
  "success": true,
  "code": 200,
  "message": "规则拆分成功",
  "data": {
    "originalTask": {
      "id": 6,
      "title": "222",
      "rrule": "DTSTART:20260316T000000Z\nRRULE:FREQ=DAILY;UNTIL=20260324T235959Z",
      "rruleUntil": "2026-03-24"
    },
    "newTask": {
      "id": <新任务ID>,
      "title": "从3月25日起改为新任务",
      "description": "这是拆分后的新规则",
      "isUrgent": true,
      "isImportant": false,
      "rrule": "DTSTART:20260325T000000Z\nRRULE:FREQ=DAILY",
      "parentTaskId": 6,
      "splitFromDate": "2026-03-25"
    }
  }
}
```

### 验证数据库

```sql
-- 1. 查看原任务（应该添加了UNTIL）
SELECT id, title, rrule, rrule_until FROM tasks WHERE id = 6;
-- 预期：rrule包含UNTIL=20260324T235959Z，rrule_until='2026-03-24'

-- 2. 查看新任务（从3月25日开始）
SELECT id, title, rrule, parent_task_id, split_from_date
FROM tasks
WHERE parent_task_id = 6;
-- 预期：新任务，rrule从20260325开始，parent_task_id=6，split_from_date='2026-03-25'
```

### 验证日期范围

```sql
-- 3月24日应该查到原任务
-- 3月25日应该查到新任务
-- 3月16日-24日：原任务（taskId=6）
-- 3月25日及之后：新任务（新ID）
```

---

## API 3：删除当天 - 添加到EXDATE

**路由**: `POST /api/v1/tasks/:id/delete-single-day`

**场景**: 3月22日这天不想显示任务（添加到例外日期）

### 请求示例

```http
POST http://localhost:3000/api/v1/tasks/6/delete-single-day
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "date": "2026-03-22"
}
```

### 预期响应

```json
{
  "success": true,
  "code": 200,
  "message": "已添加到例外日期",
  "data": {
    "id": 6,
    "title": "222",
    "rrule": "DTSTART:20260316T000000Z\nRRULE:FREQ=DAILY;UNTIL=20260324T235959Z",
    "exdate": "[\"2026-03-22\"]",
    "updatedAt": "2026-03-16T..."
  }
}
```

### 验证数据库

```sql
-- 查询exdate字段
SELECT id, title, exdate FROM tasks WHERE id = 6;
-- 预期：exdate = '["2026-03-22"]'
```

### 验证不显示

```http
GET http://localhost:3000/api/v1/tasks?date=2026-03-22
Authorization: Bearer <YOUR_TOKEN>

# 预期：taskId=6不在返回结果中（已被EXDATE排除）
```

---

## API 4：删除当天及未来 - 修改UNTIL

**路由**: `POST /api/v1/tasks/:id/delete-future`

**场景**: 从3月30日开始，任务不再重复（设置结束日期为3月29日）

### 请求示例

```http
POST http://localhost:3000/api/v1/tasks/6/delete-future
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "endDate": "2026-03-30"
}
```

### 预期响应

```json
{
  "success": true,
  "code": 200,
  "message": "已修改规则结束时间",
  "data": {
    "id": 6,
    "title": "222",
    "rrule": "DTSTART:20260316T000000Z\nRRULE:FREQ=DAILY;UNTIL=20260329T235959Z",
    "rruleUntil": "2026-03-29",
    "updatedAt": "2026-03-16T..."
  }
}
```

### 验证数据库

```sql
-- 查询rrule和rrule_until字段
SELECT id, title, rrule, rrule_until FROM tasks WHERE id = 6;
-- 预期：
--   rrule包含UNTIL=20260329T235959Z
--   rrule_until = '2026-03-29'
```

### 验证日期范围

```http
# 3月29日应该有任务
GET http://localhost:3000/api/v1/tasks?date=2026-03-29
# 预期：taskId=6存在

# 3月30日应该没有任务
GET http://localhost:3000/api/v1/tasks?date=2026-03-30
# 预期：taskId=6不存在（已超过UNTIL）
```

---

## 测试检查清单

### API 1: 修改当天 ✅
- [ ] 请求成功返回201
- [ ] 数据库task_overrides表有记录
- [ ] NULL字段不覆盖（保持默认值）
- [ ] 非NULL字段覆盖成功
- [ ] GET任务时应用覆盖值（优先级2）

### API 2: 修改未来 ✅
- [ ] 请求成功返回200
- [ ] 原任务添加UNTIL（截止到拆分日期前一天）
- [ ] 创建新任务（从拆分日期开始）
- [ ] 新任务parent_task_id正确
- [ ] 新任务split_from_date正确
- [ ] 日期范围验证通过

### API 3: 删除当天 ✅
- [ ] 请求成功返回200
- [ ] exdate字段更新（JSON数组）
- [ ] 重复请求相同日期报错（已在EXDATE中）
- [ ] GET任务时不显示该日期（优先级1）

### API 4: 删除未来 ✅
- [ ] 请求成功返回200
- [ ] rrule添加UNTIL参数
- [ ] rrule_until字段更新
- [ ] 结束日期前一天有任务
- [ ] 结束日期当天及之后无任务

---

## 常见问题排查

### 问题1：401 Unauthorized
**原因**: Token过期
**解决**: 重新登录获取新token

### 问题2：400 ValidationError
**原因**: 请求参数格式错误
**解决**: 检查日期格式（YYYY-MM-DD），updates必须是对象

### 问题3：404 NotFoundError
**原因**: 任务不存在或不是重复任务
**解决**: 检查taskId是否存在，is_recurring=1

### 问题4：409 Conflict（重复创建覆盖）
**原因**: 同一任务同一日期已有覆盖记录
**解决**: 使用PUT更新已有覆盖，或先删除再创建

---

## 测试完成标准

- ✅ 4个API全部测试通过
- ✅ 数据库表数据正确
- ✅ 优先级流程验证通过（EXDATE → Override → Default）
- ✅ 边界情况测试（重复操作、空updates等）

---

**测试人**: Claude Sonnet 4.5
**测试日期**: 2026-03-16
**测试结果**: ⏳ 待测试
