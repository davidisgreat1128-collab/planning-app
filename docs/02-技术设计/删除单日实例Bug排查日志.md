# 删除单日实例Bug排查日志

## 问题描述

**现象**：选择"仅删除当天计划"（选项1）后，该重复任务在当天还能生成实例

**预期行为**：删除后，当天不应该显示该任务实例

**测试时间**：2026-03-17

---

## 排查步骤

### 步骤1：准备测试环境

1. **创建测试任务**
   - 任务名称：`测试EXDATE删除`
   - 重复规则：每日重复
   - 日期范围：2026-03-15 ~ 2026-03-30

2. **确认任务正常显示**
   - 在日历中查看 3月17日
   - 确认能看到"测试EXDATE删除"任务

---

### 步骤2：执行删除操作

1. **拖拽任务到删除区域**
   - 打开浏览器开发者工具（F12）
   - 切换到 Console 标签
   - 拖拽 3月17日的"测试EXDATE删除"任务到删除区域

2. **选择删除选项**
   - 在弹出的红色对话框中，选择"仅删除当天计划"（选项1）
   - 点击"删除"按钮

3. **观察Toast提示**
   - 应该显示：`已删除当天实例`

---

### 步骤3：检查Console日志

**在浏览器Console中，按顺序查找以下日志，并记录关键信息：**

#### 日志1：Repository删除调用
```
🔍 搜索关键词：[TaskRepository] 删除单日实例（EXDATE）

📋 记录以下信息：
- 任务ID: ________________
- 任务标题: ________________
- 删除日期: ________________
```

#### 日志2：后端API响应
```
🔍 搜索关键词：Network面板 → POST /api/v1/tasks/XXX/delete-single-day

📋 记录Response的JSON数据：
{
  "success": true/false,
  "data": {
    "id": ______,
    "title": "______",
    "exdate": [______],  ⭐ 关键：检查这个数组是否包含删除的日期
    "rrule": "______"
  }
}

⚠️ 重点检查：
- exdate数组中是否包含今天的日期（如 "2026-03-17"）
- 如果包含 → 后端逻辑正确 ✅
- 如果不包含 → 后端逻辑有问题 ❌
```

#### 日志3：Store刷新任务列表
```
🔍 搜索关键词：[TaskStore] fetchTasksByDate - 后端返回

📋 记录以下信息：
- 请求日期: ________________
- 返回的任务总数: ________________
- 重复任务数量: ________________
```

#### 日志4：RRULE计算日志（关键！）
```
🔍 搜索关键词：[RRuleCalculationService] 开始计算任务发生日期

📋 找到"测试EXDATE删除"任务的计算日志，记录：

========== [RRuleCalculationService] 开始计算任务发生日期 ==========
任务ID: ________________
任务标题: ________________
RRULE字符串: ________________
EXDATE: ________________  ⭐ 关键：检查这个数组
日期范围: ________________
计算完成，共 __ 个发生日期: ________________

⚠️ 重点检查：
1. EXDATE数组中是否包含今天的日期？
   - 包含 → RRULE应该过滤掉今天 ✅
   - 不包含 → 缓存未更新 ❌

2. "计算完成，共 X 个发生日期"中是否包含今天？
   - 包含 → RRULE未过滤 ❌（即使EXDATE有值）
   - 不包含 → RRULE过滤正确 ✅
```

#### 日志5：Store合并任务日志
```
🔍 搜索关键词：[TaskStore] fetchTasksByDate - 合并后任务数

📋 记录以下信息：
- 合并后任务数: ________________
- 单日任务: ________________
- 跨天任务: ________________
- 重复任务: ________________

⚠️ 重点检查：
- 重复任务数量中，是否还包含"测试EXDATE删除"？
- 如果包含 → 后端未过滤 ❌
- 如果不包含 → 后端过滤正确，问题在前端缓存 ❌
```

---

### 步骤4：检查UI显示

**刷新页面后，再次查看 3月17日：**

```
□ 任务仍然显示在当天 → Bug存在 ❌
□ 任务不再显示在当天 → Bug已修复 ✅
```

---

### 步骤5：检查数据库（可选）

**如果前面步骤都正常，但UI仍显示，检查数据库：**

```bash
# 查询任务的EXDATE字段
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -pwokao@53231812 planning_app_dev -e "SELECT id, title, exdate, rrule FROM tasks WHERE title LIKE '%测试EXDATE%';"

📋 记录结果：
- id: ________________
- title: ________________
- exdate: ________________  ⭐ 应该是 JSON数组，如 ["2026-03-17"]
- rrule: ________________
```

---

## 问题诊断决策树

```
删除后任务仍显示？
  ↓
问题1：POST /delete-single-day 的响应中，exdate是否包含删除日期？
  ├─ 不包含 → 【后端Bug】RecurringTaskService.deleteSingleDay未正确添加到EXDATE
  └─ 包含 → 问题2
  ↓
问题2：[RRuleCalculationService] 日志中，EXDATE是否包含删除日期？
  ├─ 不包含 → 【前端Bug】Repository缓存未更新
  └─ 包含 → 问题3
  ↓
问题3：[RRuleCalculationService] 计算结果是否包含删除日期？
  ├─ 包含 → 【后端Bug】RRuleSet.exdate()未生效
  └─ 不包含 → 问题4
  ↓
问题4：[TaskStore] 合并后的任务数中，是否包含该任务实例？
  ├─ 包含 → 【后端Bug】taskService.getTasksByDate未正确过滤
  └─ 不包含 → 问题5
  ↓
问题5：UI仍然显示该任务？
  └─ 是 → 【前端Bug】UI渲染逻辑未同步Store状态
```

---

## 预期日志示例（正确流程）

### 删除操作
```
[TaskRepository] 删除单日实例（EXDATE）: 测试EXDATE删除 日期: 2026-03-17
```

### API响应
```json
{
  "success": true,
  "data": {
    "id": 116,
    "title": "测试EXDATE删除",
    "exdate": ["2026-03-17"],  ✅ 包含删除日期
    "rrule": "FREQ=DAILY;DTSTART=20260315T000000Z;UNTIL=20260330T235959Z"
  }
}
```

### RRULE计算
```
========== [RRuleCalculationService] 开始计算任务发生日期 ==========
任务ID: 116
任务标题: 测试EXDATE删除
RRULE字符串: FREQ=DAILY;DTSTART=20260315T000000Z;UNTIL=20260330T235959Z
EXDATE: ["2026-03-17"]  ✅ 包含删除日期
日期范围: 2026-03-17 - 2026-03-17
✅ 计算完成，共 0 个发生日期:   ✅ 正确过滤，当天无实例
========== [RRuleCalculationService] 计算结束 ==========
```

### Store合并
```
[TaskStore] fetchTasksByDate - 合并后任务数: 5
  - 单日任务: 3
  - 跨天任务: 1
  - 重复任务: 1  ✅ 不包含"测试EXDATE删除"
```

---

## 测试结果记录

**测试人员**：________________

**测试时间**：2026-03-17 __:__

### 实际日志记录

**日志1 - Repository删除调用**：
```
（粘贴实际日志）
```

**日志2 - API响应**：
```json
（粘贴实际JSON）
```

**日志3 - RRULE计算**：
```
（粘贴实际日志）
```

**日志4 - Store合并**：
```
（粘贴实际日志）
```

**日志5 - UI显示结果**：
```
□ 任务仍显示
□ 任务已隐藏
```

### 问题定位

**根据决策树，问题出在**：
```
□ 后端：RecurringTaskService.deleteSingleDay
□ 前端：Repository缓存更新
□ 后端：RRuleSet.exdate()过滤
□ 后端：taskService.getTasksByDate
□ 前端：UI渲染逻辑
□ 其他：________________
```

### 解决方案

**需要修改的文件**：
```
□ backend/src/services/recurringTaskService.js
□ frontend/Planning-app/repositories/TaskRepository.js
□ backend/src/services/rruleCalculationService.js
□ backend/src/services/taskService.js
□ frontend/Planning-app/store/task.js
□ frontend/Planning-app/pages/calendar/index.vue
□ 其他：________________
```

**具体修改内容**：
```
（请在这里描述需要修改的代码）
```

---

## 附录：相关代码位置

### 后端
- RecurringTaskService.deleteSingleDay: `backend/src/services/recurringTaskService.js:165`
- RRuleCalculationService.calculateOccurrences: `backend/src/services/rruleCalculationService.js:22`
- taskService.getTasksByDate: `backend/src/services/taskService.js:86`
- Task Model exdate getter: `backend/src/models/Task.js:153`

### 前端
- TaskRepository.deleteTaskSingleDay: `frontend/Planning-app/repositories/TaskRepository.js:478`
- taskStore.deleteTaskSingleDay: `frontend/Planning-app/store/task.js:338`
- taskStore.fetchTasksByDate: `frontend/Planning-app/store/task.js:217`
- Composable.confirmDelete: `frontend/Planning-app/composables/useTaskQuadrant.js:324`
