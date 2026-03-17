# task.js Store 拆分方案

> **文档性质**: 架构设计文档
> **创建时间**: 2026-03-17
> **创建者**: Claude Sonnet 4.5
> **文档版本**: v1.0
> **关联ADR**: ADR-006-重复任务3选项架构符合性检查报告.md

---

## 📋 目录

1. [问题分析](#1-问题分析)
2. [拆分目标](#2-拆分目标)
3. [拆分策略](#3-拆分策略)
4. [详细方案](#4-详细方案)
5. [实施步骤](#5-实施步骤)
6. [风险评估](#6-风险评估)
7. [验收标准](#7-验收标准)

---

## 1. 问题分析

### 1.1 当前状态

| 指标 | 当前值 | 阈值 | 超标情况 |
|------|--------|------|---------|
| 文件行数 | 809 行 | 400 行 | 超标 102% |
| 职责数量 | 3 个 | 1 个 | 违反单一职责原则 |
| 优先级 | P1（高） | - | 影响架构健康度 |

### 1.2 职责分析

**当前 task.js Store 的 3 个职责**：

1. **任务基础管理**（占比 ~40%，~324行）
   - CRUD 操作（create、update、delete）
   - 缓存管理（通过 TaskRepository）
   - 事件通知订阅

2. **重复任务管理**（占比 ~35%，~283行）
   - RRULE 计算（重复实例生成）
   - 3选项逻辑（单日修改/删除、未来修改/删除、全部删除）
   - task_overrides 机制
   - CompletionRecord 管理

3. **任务完成状态管理**（占比 ~25%，~202行）
   - 打卡/取消打卡
   - 完成记录（CompletionRecord）
   - 完成统计

### 1.3 问题原因

**为什么 task.js 会这么大？**

1. **RRULE 功能复杂**：从单一任务扩展到重复任务后，新增了大量 RRULE 相关逻辑
2. **3选项机制**：单日/未来/全部 三种修改/删除选项，每种都需要单独的方法
3. **架构演进**：从 EXDATE 方案升级到 task_overrides 方案，保留了向后兼容代码

### 1.4 拆分依据

| 依据 | 说明 |
|------|------|
| 单一职责原则（SRP） | 每个Store应该只有一个改变的理由 |
| 文件大小阈值 | Store层限制 <400行/文件 |
| 业务边界清晰 | RRULE逻辑独立于基础CRUD |
| 可测试性 | 小文件更易于单元测试 |

---

## 2. 拆分目标

### 2.1 整体目标

- ✅ **降低文件大小**：从 809 行 → 每个文件 <400 行
- ✅ **遵循单一职责**：每个 Store 只负责一个领域
- ✅ **提升可维护性**：业务逻辑分离，便于独立开发
- ✅ **保持架构合规**：100% 符合四层架构规范

### 2.2 性能目标

| 指标 | 目标值 |
|------|--------|
| 单个Store文件行数 | <400 行 |
| 单个函数行数 | <50 行 |
| 架构健康度 | 100/100 |

---

## 3. 拆分策略

### 3.1 拆分方案

**拆分为 3 个 Store**：

```
原 task.js（809行）
    ↓
┌───────────────────┬─────────────────────┬──────────────────────┐
│  task.js          │  taskRecurring.js   │  taskCompletion.js   │
│  基础任务管理      │  重复任务管理        │  完成状态管理         │
│  ~350行           │  ~350行             │  ~250行              │
└───────────────────┴─────────────────────┴──────────────────────┘
```

### 3.2 职责划分

#### Store 1: `task.js`（基础任务管理，~350行）

**职责**：管理任务的基础 CRUD 和缓存

**核心方法**：
- `hydrate()` - 加载任务数据
- `createTask(data)` - 创建任务
- `updateTask(id, data)` - 更新任务
- `deleteTask(id)` - 删除任务
- `getTaskById(id)` - 按 ID 获取任务
- `getTasksByDate(date)` - 按日期获取任务（调用 taskRecurring.getTasksByDate）
- `syncToServer()` - 强制同步到服务器

**依赖**：
- `TaskRepository`（数据访问）
- `taskRecurring` Store（获取重复任务实例）

---

#### Store 2: `taskRecurring.js`（重复任务管理，~350行）

**职责**：管理重复任务的 RRULE 计算和 3选项逻辑

**核心方法**：
- `getTasksByDate(date)` - 计算指定日期的所有任务实例（包含RRULE展开）
- `updateTaskSingleDay(id, data, date)` - 修改单日实例
- `updateTaskFuture(id, data, date)` - 修改未来实例
- `deleteTaskSingleDay(id, date)` - 删除单日实例
- `deleteTaskFuture(id, date)` - 删除未来实例
- `deleteTaskAll(id)` - 删除全部实例
- `applyOverrides(task, date)` - 应用 task_overrides 覆盖

**依赖**：
- `TaskRepository`（数据访问）
- `task` Store（获取基础任务数据）

---

#### Store 3: `taskCompletion.js`（完成状态管理，~250行）

**职责**：管理任务的完成状态和打卡记录

**核心方法**：
- `toggleTaskComplete(taskId, date)` - 切换任务完成状态（打卡/取消打卡）
- `getCompletionRecord(taskId, date)` - 获取完成记录
- `getCompletionStats(date)` - 获取完成统计（完成率）
- `batchToggleComplete(taskIds, date, isDone)` - 批量修改完成状态

**依赖**：
- `TaskRepository`（数据访问）
- `task` Store（获取任务基础数据）

---

### 3.3 数据流向

**原架构（单一 Store）**：
```
Component
    ↓
task.js Store (809行，处理所有逻辑)
    ↓
TaskRepository
    ↓
API
```

**新架构（3个 Store）**：
```
Component
    ↓
┌────────────┬──────────────────┬───────────────────┐
│  task.js   │  taskRecurring.js│  taskCompletion.js│
│  基础CRUD   │  RRULE计算       │  打卡状态         │
└────────────┴──────────────────┴───────────────────┘
         ↓              ↓                 ↓
            TaskRepository（统一数据访问）
                       ↓
                      API
```

**跨 Store 调用规则**：

| 场景 | 调用关系 | 说明 |
|------|---------|------|
| 获取某日任务 | task.getTasksByDate() → taskRecurring.getTasksByDate() | task Store 委托 RRULE 计算给 taskRecurring |
| 打卡任务 | taskCompletion.toggleComplete() → task.getTaskById() | 获取任务基础信息 |
| 修改单日实例 | taskRecurring.updateTaskSingleDay() → task.getTaskById() | 获取任务基础信息 |

---

## 4. 详细方案

### 4.1 task.js（基础任务管理）

**文件路径**：`store/task.js`

**核心代码结构**：

```javascript
import { defineStore } from 'pinia'
import TaskRepository from '@/repositories/TaskRepository'
import { useTaskRecurringStore } from './taskRecurring'

export const useTaskStore = defineStore('task', () => {
  // ========================================
  // 状态
  // ========================================
  const tasks = computed(() => TaskRepository.getAll())

  // ========================================
  // Actions（基础CRUD）
  // ========================================

  /**
   * 启动时加载数据
   */
  async function hydrate() {
    await TaskRepository.hydrate()
  }

  /**
   * 创建任务
   */
  async function createTask(data) {
    return await TaskRepository.create(data)
  }

  /**
   * 更新任务
   */
  async function updateTask(id, data) {
    return await TaskRepository.update(id, data)
  }

  /**
   * 删除任务
   */
  async function deleteTask(id) {
    await TaskRepository.delete(id)
  }

  /**
   * 按日期获取任务（委托给 taskRecurring Store）
   */
  function getTasksByDate(date) {
    const taskRecurringStore = useTaskRecurringStore()
    return taskRecurringStore.getTasksByDate(date)
  }

  /**
   * 强制同步到服务器
   */
  async function syncToServer() {
    await TaskRepository.sync()
  }

  // ========================================
  // 返回公开接口
  // ========================================
  return {
    tasks,
    hydrate,
    createTask,
    updateTask,
    deleteTask,
    getTasksByDate,
    syncToServer
  }
})
```

**预估行数**：~350行

---

### 4.2 taskRecurring.js（重复任务管理）

**文件路径**：`store/taskRecurring.js`

**核心代码结构**：

```javascript
import { defineStore } from 'pinia'
import TaskRepository from '@/repositories/TaskRepository'
import { useTaskStore } from './task'
import { RRule } from 'rrule'

export const useTaskRecurringStore = defineStore('taskRecurring', () => {
  // ========================================
  // Actions（RRULE计算 + 3选项逻辑）
  // ========================================

  /**
   * 获取指定日期的所有任务实例（包含RRULE展开）
   */
  function getTasksByDate(date) {
    const taskStore = useTaskStore()
    const allTasks = taskStore.tasks

    const result = []

    for (const task of allTasks) {
      if (task.isRecurring) {
        // 重复任务：计算RRULE实例
        const instances = calculateRecurringInstances(task, date)
        result.push(...instances)
      } else {
        // 普通任务：直接匹配日期
        if (task.taskDate === date) {
          result.push(task)
        }
      }
    }

    return result
  }

  /**
   * 计算重复任务在指定日期的实例
   */
  function calculateRecurringInstances(task, date) {
    // RRULE 计算逻辑（已有实现）
    // ...
  }

  /**
   * 修改单日实例（创建 task_overrides 记录）
   */
  async function updateTaskSingleDay(id, data, date) {
    return await TaskRepository.updateTaskSingleDay(id, data, date)
  }

  /**
   * 修改未来实例（拆分规则）
   */
  async function updateTaskFuture(id, data, date) {
    return await TaskRepository.updateTaskFuture(id, data, date)
  }

  /**
   * 删除单日实例（标记 is_deleted=true）
   */
  async function deleteTaskSingleDay(id, date) {
    return await TaskRepository.deleteTaskSingleDay(id, date)
  }

  /**
   * 删除未来实例（修改 RRULE UNTIL）
   */
  async function deleteTaskFuture(id, date) {
    return await TaskRepository.deleteTaskFuture(id, date)
  }

  /**
   * 删除全部实例（软删除任务）
   */
  async function deleteTaskAll(id) {
    await TaskRepository.deleteTaskAll(id)
  }

  // ========================================
  // 返回公开接口
  // ========================================
  return {
    getTasksByDate,
    updateTaskSingleDay,
    updateTaskFuture,
    deleteTaskSingleDay,
    deleteTaskFuture,
    deleteTaskAll
  }
})
```

**预估行数**：~350行

---

### 4.3 taskCompletion.js（完成状态管理）

**文件路径**：`store/taskCompletion.js`

**核心代码结构**：

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useTaskCompletionStore = defineStore('taskCompletion', () => {
  // ========================================
  // 状态
  // ========================================
  const completionRecords = ref({}) // key: taskId_date, value: CompletionRecord

  // ========================================
  // Actions（打卡逻辑）
  // ========================================

  /**
   * 切换任务完成状态（打卡/取消打卡）
   */
  async function toggleTaskComplete(taskId, date) {
    const key = `${taskId}_${date}`
    const currentRecord = completionRecords.value[key]
    const isDone = !currentRecord?.isDone

    // 调用后端API
    const record = await request({
      url: `/tasks/${taskId}/completion`,
      method: 'POST',
      data: { date, isDone }
    })

    // 更新本地缓存
    completionRecords.value[key] = record

    return record
  }

  /**
   * 获取完成记录
   */
  async function getCompletionRecord(taskId, date) {
    const key = `${taskId}_${date}`

    // 先检查本地缓存
    if (completionRecords.value[key]) {
      return completionRecords.value[key]
    }

    // 从服务器获取
    const record = await request({
      url: `/tasks/${taskId}/completion/${date}`,
      method: 'GET'
    })

    completionRecords.value[key] = record
    return record
  }

  /**
   * 获取完成统计
   */
  async function getCompletionStats(date) {
    return await request({
      url: `/tasks/completion/stats`,
      method: 'GET',
      params: { date }
    })
  }

  // ========================================
  // 返回公开接口
  // ========================================
  return {
    toggleTaskComplete,
    getCompletionRecord,
    getCompletionStats
  }
})
```

**预估行数**：~250行

---

## 5. 实施步骤

### 5.1 阶段划分

| 阶段 | 任务 | 预计工时 | 优先级 |
|------|------|---------|--------|
| 阶段1 | 创建 taskCompletion.js | 2小时 | P2 |
| 阶段2 | 创建 taskRecurring.js | 3小时 | P1 |
| 阶段3 | 精简 task.js | 2小时 | P1 |
| 阶段4 | 测试验证 | 1小时 | P0 |

**总预估工时**：8 小时

---

### 5.2 详细步骤

#### 阶段1：创建 taskCompletion.js（2小时）⭐ 优先级P2

**为什么先拆 taskCompletion？**
- 依赖最少（不依赖 taskRecurring）
- 逻辑相对独立
- 影响面最小

**步骤**：
1. 创建文件 `store/taskCompletion.js`
2. 从 task.js 中复制以下方法：
   - `toggleTaskComplete()`
   - `getCompletionRecord()`
   - `getCompletionStats()`
3. 修改所有调用这些方法的 Component：
   - 从 `useTaskStore()` 改为 `useTaskCompletionStore()`
4. 测试打卡功能

**验收**：
- [ ] taskCompletion.js 文件 <300行
- [ ] 打卡功能正常工作
- [ ] ESLint 无错误

---

#### 阶段2：创建 taskRecurring.js（3小时）⭐ 优先级P1

**步骤**：
1. 创建文件 `store/taskRecurring.js`
2. 从 task.js 中复制以下方法：
   - `getTasksByDate()`
   - `calculateRecurringInstances()`
   - `updateTaskSingleDay()`
   - `updateTaskFuture()`
   - `deleteTaskSingleDay()`
   - `deleteTaskFuture()`
   - `deleteTaskAll()`
   - `applyOverrides()`
3. 修改 task.js 中的 `getTasksByDate()` 方法：
   ```javascript
   function getTasksByDate(date) {
     const taskRecurringStore = useTaskRecurringStore()
     return taskRecurringStore.getTasksByDate(date)
   }
   ```
4. 修改所有调用 3选项方法的 Component：
   - 从 `useTaskStore()` 改为 `useTaskRecurringStore()`
5. 测试重复任务功能

**验收**：
- [ ] taskRecurring.js 文件 <400行
- [ ] 重复任务 RRULE 计算正常
- [ ] 3选项（单日/未来/全部）功能正常
- [ ] ESLint 无错误

---

#### 阶段3：精简 task.js（2小时）⭐ 优先级P1

**步骤**：
1. 删除已迁移到 taskRecurring.js 的代码
2. 删除已迁移到 taskCompletion.js 的代码
3. 保留基础 CRUD 方法
4. 更新 JSDoc 注释
5. 运行 `wc -l store/task.js` 确认 <400行

**验收**：
- [ ] task.js 文件 <400行
- [ ] 只包含基础 CRUD 方法
- [ ] ESLint 无错误

---

#### 阶段4：测试验证（1小时）⭐ 优先级P0

**测试清单**：
- [ ] 创建普通任务
- [ ] 创建重复任务
- [ ] 修改单日实例
- [ ] 修改未来实例
- [ ] 删除单日实例
- [ ] 删除未来实例
- [ ] 删除全部实例
- [ ] 打卡任务
- [ ] 取消打卡
- [ ] 查看完成统计

**测试方法**：
1. 手动测试（H5端）
2. 检查浏览器Console（无错误）
3. 运行 `npm run lint`（无ESLint错误）

---

## 6. 风险评估

### 6.1 潜在风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| **Component调用错误** | 中 | 高 | 使用全局搜索确保所有调用都已更新 |
| **跨Store依赖混乱** | 低 | 中 | 明确依赖关系图，单向依赖 |
| **性能下降** | 低 | 中 | 3个Store共享同一个Repository，无性能损失 |
| **现有功能破坏** | 低 | 高 | 阶段4全面测试验证 |

### 6.2 回滚方案

**如果出现严重问题**：
1. 立即回滚到拆分前的代码（保留备份）
2. 创建Bug修复任务
3. 延后拆分计划，优先保证功能稳定

**备份策略**：
```bash
# 拆分前创建备份
cp store/task.js backups/store/task.js.backup-20260317-拆分前-待执行
```

---

## 7. 验收标准

### 7.1 功能验收

- [ ] 所有现有功能正常工作（无回归Bug）
- [ ] 3个Store文件均 <400行
- [ ] Component层调用正确（无错误调用）
- [ ] ESLint 无错误
- [ ] 浏览器Console无错误

### 7.2 架构验收

- [ ] 每个Store职责单一（符合SRP原则）
- [ ] 跨Store依赖清晰（单向依赖）
- [ ] 文档已更新（`.claude/CLAUDE.md` 第4.4节）

### 7.3 性能验收

| 指标 | 目标值 | 实际值 |
|------|--------|--------|
| task.js 行数 | <400行 | ___行 |
| taskRecurring.js 行数 | <400行 | ___行 |
| taskCompletion.js 行数 | <300行 | ___行 |
| 架构健康度 | 100/100 | ___/100 |

---

## 附录A：完整依赖关系图

```
Component 层
    ↓
┌────────────┬──────────────────┬───────────────────┐
│  task.js   │  taskRecurring.js│  taskCompletion.js│
│            │         ↑        │         ↑         │
│            └─────────┘        │         │         │
│                    ↑           │         │         │
│                    └───────────┴─────────┘         │
│                                                    │
└─────────────────────┬──────────────────────────────┘
                      ↓
             TaskRepository（统一数据访问）
                      ↓
                     API
```

**依赖规则**：
- ✅ taskRecurring 可以调用 task
- ✅ taskCompletion 可以调用 task
- ❌ task 不能调用 taskRecurring/taskCompletion（只能委托）
- ❌ taskRecurring 不能调用 taskCompletion
- ❌ taskCompletion 不能调用 taskRecurring

---

## 附录B：Component层迁移检查清单

**需要修改的 Component**：

| 文件 | 修改前 | 修改后 |
|------|--------|--------|
| `pages/calendar/index.vue` | `useTaskStore()` | 部分改为 `useTaskRecurringStore()` |
| `pages/calendar/task-edit.vue` | `useTaskStore()` | 部分改为 `useTaskRecurringStore()` |
| `components/task/AddTaskPanel.vue` | `useTaskStore()` | 保持不变（只用基础CRUD） |
| `components/task/TaskCard.vue` | `useTaskStore()` | 部分改为 `useTaskCompletionStore()` |

**全局搜索命令**：
```bash
# 搜索所有调用 useTaskStore() 的文件
grep -r "useTaskStore" frontend/Planning-app/pages/
grep -r "useTaskStore" frontend/Planning-app/components/
```

---

**文档结束**

**下一步操作**：
1. 将本文档登记到 `docs/02-技术设计/超标文件追踪清单.md`
2. 等待用户批准后再执行拆分（遵循 CLAUDE.md 第7.8节强制规范）
3. 如用户批准，按照"阶段1→2→3→4"顺序执行
