# ADR-006: RRULE删除机制改用task_overrides.is_deleted

**状态**: ✅ 已实施
**决策日期**: 2026-03-17
**决策者**: Claude Sonnet 4.5 + 用户唐伯虎
**影响范围**: Backend (Repository/Service/Controller) + Frontend (Repository/API)

---

## 📋 背景

### 问题描述
用户报告："选项1有BUG，执行后，该重复任务在当天还能生成实例"

### 问题定位
经排查发现根本问题不是BUG，而是**设计理念不匹配**：

1. **文档设计方案**（阶段四、RRULE架构完善执行方案.md）：
   - 删除单日实例 → 添加到`tasks.exdate`数组
   - 使用RFC 5545标准的EXDATE机制
   - 在RRULE计算时应用exdate过滤

2. **用户的实际设计原则**：
   ```
   ❗"删除"不是修改数据，而是阻止实例生成
   删除 ≠ 修改字段
   删除 = 阻止实例出现
   ```
   - 删除单日实例 → 创建`task_overrides`记录（is_deleted=true）
   - 统一管理覆盖和删除（同一张表）
   - 优先级清晰：is_deleted（最高）→ 字段覆盖 → 完成记录 → 默认规则

---

## 🎯 决策内容

### 决策1：采用task_overrides.is_deleted方案

**理由**：
1. **统一管理**：覆盖和删除都通过task_overrides表管理
2. **优先级清晰**：is_deleted=true时，直接跳过所有后续逻辑
3. **扩展性强**：未来可添加更多覆盖字段（如标题、时间覆盖）
4. **符合用户设计原则**："删除=阻止生成"而非"删除=修改数据"

### 决策2：完全废弃tasks.exdate字段

**废弃策略**：
- 保留字段结构（不删除列，以防回滚）
- 将所有exdate数据迁移到task_overrides（is_deleted=true）
- 将tasks.exdate设为NULL
- 后端不再读取或更新exdate字段
- 前端不再依赖exdate字段

### 决策3：优先级流程升级

**新优先级流程**（taskService.getTasksByDate）：
```
步骤1：RRULE计算候选日期
  ↓
步骤2：检查is_deleted标记 ⭐ 最高优先级
  · 如果is_deleted=true → continue跳过，不生成实例
  ↓
步骤3：创建任务实例（基础数据来自task表）
  ↓
步骤4：应用字段覆盖（如果存在task_overrides记录）
  ↓
步骤5：查询完成记录（task_completion_records）
  ↓
步骤6：返回实例
```

---

## 🏗️ 实施方案

### 阶段1：数据库Schema变更
- ✅ 创建Migration添加`is_deleted`字段到`task_overrides`
- ✅ 添加复合索引：`idx_task_override_deleted (task_id, override_date, is_deleted)`
- ✅ 数据迁移：7条exdate记录 → task_overrides（is_deleted=true）
- ✅ 将tasks.exdate设为NULL（保留字段结构）

**执行结果**：
```sql
-- 迁移前
SELECT COUNT(*) FROM tasks WHERE exdate IS NOT NULL;
-- 结果：7条

-- 迁移后
SELECT COUNT(*) FROM task_overrides WHERE is_deleted = TRUE;
-- 结果：7条

SELECT COUNT(*) FROM tasks WHERE exdate IS NOT NULL;
-- 结果：0条
```

### 阶段2：后端Repository层
- ✅ TaskOverrideRepository新增方法：
  - `markAsDeleted(taskId, userId, date)`: 标记删除
  - `getDeletedDates(taskId, dates)`: 批量查询删除日期

### 阶段3：后端Service层
- ✅ RecurringTaskService.deleteSingleDay()重写：
  - 旧：`task.exdate.push(date)`
  - 新：`taskOverrideRepository.markAsDeleted(taskId, userId, date)`
- ✅ taskService.getTasksByDate()优先级流程升级：
  - 新增is_deleted检查（步骤2，最高优先级）

### 阶段4：后端Controller层
- ✅ 更新API响应格式：
  - 旧：`{ success: true, data: { ...task, exdate: [...] } }`
  - 新：`{ success: true, data: { taskId, date, isDeleted: true } }`

### 阶段5：前端清理
- ✅ TaskRepository.deleteTaskSingleDay()：移除exdate字段更新逻辑
- ✅ api/task.js：更新注释，删除exdate示例

---

## ✅ 验证结果

### 测试1：数据迁移验证
```sql
SELECT task_id, user_id, override_date, is_deleted
FROM task_overrides
WHERE is_deleted = TRUE
ORDER BY task_id, override_date;
```
**结果**：7条记录，全部is_deleted=TRUE ✅

### 测试2：优先级流程验证
**预期行为**：
- taskId=111, date=2026-03-20：is_deleted=true → 不生成实例 ✅
- taskId=111, date=2026-03-21：无is_deleted标记 → 正常生成实例 ✅

---

## 📊 影响分析

### 优势 ✅
1. **统一管理**：覆盖和删除都在task_overrides表
2. **优先级清晰**：is_deleted一目了然，最高优先级
3. **扩展性强**：可轻松添加更多覆盖字段
4. **符合设计原则**："删除=阻止生成"而非"修改数据"

### 风险 ⚠️
1. **数据迁移风险**：已通过备份表tasks_exdate_backup_20260317规避 ✅
2. **前端兼容性**：已同步更新前端Repository ✅

### 回滚方案 🔙
如需回滚（不推荐）：
```sql
-- 1. 恢复exdate数据
UPDATE tasks t
INNER JOIN tasks_exdate_backup_20260317 b ON t.id = b.id
SET t.exdate = b.exdate;

-- 2. 删除迁移的task_overrides记录
DELETE FROM task_overrides WHERE is_deleted = TRUE;

-- 3. 回滚代码到commit: d998117之前
```

---

## 🔗 相关文档

- [删除单日实例Bug排查日志.md](../../02-技术设计/删除单日实例Bug排查日志.md)
- [阶段四、RRULE架构完善执行方案.md](../../02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md)
- [详细字段映射表.md](../../02-技术设计/详细字段映射表.md)

---

## 📝 相关Commits

```
d998117 feat(rrule): 阶段1-添加task_overrides.is_deleted字段并迁移exdate数据
0a592d7 feat(rrule): 添加数据迁移SQL脚本
153e7b0 feat(rrule): 阶段2-TaskOverrideRepository新增is_deleted方法
41a26ee refactor(rrule): 阶段3-重写删除单日实例逻辑使用is_deleted
53091e5 refactor(rrule): 阶段4-更新Controller API响应格式
2dfe39b refactor(rrule): 阶段5-清理前端exdate引用
```

---

**作者**: Claude Sonnet 4.5
**最后更新**: 2026-03-17
