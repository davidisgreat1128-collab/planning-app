# 重复任务批量操作API待实现清单

> **文档性质**: 后端API待办事项追踪
> **优先级**: P2
> **创建时间**: 2026-03-06
> **状态**: 📋 待实现

---

## 📌 问题背景

### 当前问题
在H5拖拽功能测试中发现，重复任务的批量操作API尚未实现，导致以下错误：

```
PATCH http://127.0.0.1:3000/api/v1/tasks/:id/recurrence 404 (Not Found)
```

### 临时方案
- 前端已实现临时降级方案（commit: 02c94b6）
- 使用 `taskStore.updateTask(id, data)` 仅更新当前任务实例
- Toast提示用户："已更改（当前实例）"
- 不影响基础功能使用

---

## 🎯 待实现的后端API

### 1. 更新重复任务（批量）

#### API 1.1: 更新所有实例
```
PATCH /api/v1/tasks/:id/recurrence?scope=all
Content-Type: application/json

Body:
{
  "isUrgent": true,
  "isImportant": false
}

Response 200:
{
  "success": true,
  "message": "已更新所有重复实例",
  "data": {
    "updatedCount": 15
  }
}
```

#### API 1.2: 更新未来实例
```
PATCH /api/v1/tasks/:id/recurrence?scope=future&fromDate=2026-03-06
Content-Type: application/json

Body:
{
  "isUrgent": true,
  "isImportant": false
}

Response 200:
{
  "success": true,
  "message": "已更新未来实例",
  "data": {
    "updatedCount": 10
  }
}
```

### 2. 删除重复任务（批量）

#### API 2.1: 删除所有实例
```
DELETE /api/v1/tasks/:id/recurrence?scope=all

Response 200:
{
  "success": true,
  "message": "已删除所有重复实例",
  "data": {
    "deletedCount": 15
  }
}
```

#### API 2.2: 删除未来实例
```
DELETE /api/v1/tasks/:id/recurrence?scope=future&fromDate=2026-03-06

Response 200:
{
  "success": true,
  "message": "已删除未来实例",
  "data": {
    "deletedCount": 10
  }
}
```

---

## 📝 后端实现要点

### 数据库设计考虑
1. **重复任务主表** (`tasks`):
   - `rrule` 字段：存储重复规则（RRULE格式）
   - `recurrenceId` 字段：重复系列唯一标识（可选）

2. **任务实例表** (`task_occurrences`):
   - `taskId` 字段：关联主任务ID
   - `occurrenceDate` 字段：实例日期
   - `status` 字段：实例状态（可单独覆盖）
   - `deletedAt` 字段：软删除标记

### 批量操作逻辑
1. **scope=all**:
   - 更新主任务的 `isUrgent`/`isImportant` 字段
   - 更新所有未删除的 `task_occurrences` 实例

2. **scope=future**:
   - 更新主任务（如果是未来规则）
   - 更新 `occurrenceDate >= fromDate` 的所有实例

### 错误处理
- 404: 任务不存在或非重复任务
- 400: 参数错误（scope、fromDate格式）
- 409: 并发冲突（乐观锁）

---

## 🔧 前端恢复步骤（API实现后）

### 文件1: `frontend/Planning-app/composables/useTaskQuadrant.js`

**取消注释 line 203-207**:
```javascript
// 当前代码（临时方案）：
console.log('[useTaskQuadrant] ⚠️ 使用临时方案：仅更新当前任务实例（后端API待实现）');
await taskStore.updateTask(task.id, { isUrgent, isImportant });

// 恢复为（API实现后）：
if (option === 1) {
  await updateTaskRecurrence(taskIdToUpdate, { isUrgent, isImportant }, 'all');
} else if (option === 2) {
  await updateTaskRecurrence(taskIdToUpdate, { isUrgent, isImportant }, 'future');
}
```

### 文件2: `frontend/Planning-app/pages/calendar/index.vue`

**取消注释 line 424, 429 的TODO代码**:
```javascript
// 当前代码（临时方案）：
console.log('[index.vue] 完整清空重复任务:', task.id);
// TODO: 调用后端API删除重复任务的所有实例
await taskStore.removeTask(task.id);

// 恢复为（API实现后）：
console.log('[index.vue] 完整清空重复任务:', task.id);
await deleteTaskRecurrence(task.id, 'all');
```

### 文件3: `frontend/Planning-app/api/task.js`

**添加批量删除API封装** (line 128后新增):
```javascript
/**
 * 批量删除重复任务
 * @param {string} taskId - 任务ID
 * @param {string} scope - 'all' | 'future'
 * @param {string} fromDate - scope=future时的起始日期（可选）
 */
export async function deleteTaskRecurrence(taskId, scope, fromDate) {
  const params = { scope };
  if (fromDate) params.fromDate = fromDate;

  return request({
    url: `/tasks/${taskId}/recurrence`,
    method: 'DELETE',
    params
  });
}
```

---

## ✅ 测试验证清单（API实现后）

### 测试场景1: 更新所有实例
- [ ] 创建每日重复任务（连续7天）
- [ ] 拖拽到其他象限，选择"完整更改此条重复计划"
- [ ] 验证所有7个实例的象限都更新
- [ ] 检查数据库：主任务和所有occurrences都更新

### 测试场景2: 更新未来实例
- [ ] 创建每日重复任务（过去3天+未来4天）
- [ ] 拖拽到其他象限，选择"更改当天及未来计划"
- [ ] 验证今天+未来4个实例更新，过去3个不变
- [ ] 检查数据库：主任务和未来occurrences都更新

### 测试场景3: 删除所有实例
- [ ] 拖拽重复任务到删除区域，选择"完整清空"
- [ ] 验证所有实例都被删除（软删除）
- [ ] 日历上不再显示任何该重复任务的实例

### 测试场景4: 删除未来实例
- [ ] 拖拽重复任务到删除区域，选择"删除当天及未来计划"
- [ ] 验证今天+未来实例删除，过去实例保留
- [ ] 日历上仍显示过去的实例

---

## 📚 参考资料

### RRULE规范
- RFC 5545: https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html
- rrule.js库: https://github.com/jakubroztocil/rrule

### 现有数据库表结构
- `backend/src/models/Task.js` - 主任务表
- `backend/src/models/TaskOccurrence.js` - 任务实例表（如果存在）

### 相关前端代码
- `frontend/Planning-app/composables/useTaskQuadrant.js` - 象限切换逻辑
- `frontend/Planning-app/api/task.js` - 任务API封装
- `frontend/Planning-app/components/calendar/DragOverlay.vue` - 对话框组件

---

## 📅 实施时间线（建议）

| 阶段 | 任务 | 预计时间 | 责任人 |
|------|------|---------|--------|
| Phase 1 | 后端API实现 + 单元测试 | 4-6小时 | 后端开发 |
| Phase 2 | 前端代码恢复 + 集成测试 | 2-3小时 | 前端开发 |
| Phase 3 | 完整功能测试 + Bug修复 | 1-2小时 | QA/开发 |
| **总计** | | **7-11小时** | |

---

## 📞 相关Issue/Commit

- 前端临时方案：commit 02c94b6
- 调试日志记录：`D:\MyProject\Planning设计\测试日志\测试前端日志.txt`
- 架构文档：`docs/02-技术设计/系统架构完整结构图.md`

---

**文档版本**: v1.0
**最后更新**: 2026-03-06
**作者**: Claude Sonnet 4.5
