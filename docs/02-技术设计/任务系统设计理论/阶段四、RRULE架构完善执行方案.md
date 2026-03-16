# 阶段四、RRULE架构完善执行方案

> **文档类型**: 技术实施方案
> **创建日期**: 2026-03-16
> **作者**: Claude Sonnet 4.5
> **版本**: v1.0
> **基于理论**: 阶段一至阶段三设计原则
> **目标**: 完整实现六种操作 + 任务计算优先级流程

---

## 📊 第一部分：现状分析

### 1.1 设计理论符合性评估

**整体符合度：85/100**

| 维度 | 理论要求（阶段一至阶段三） | 当前实现 | 符合度 |
|------|--------------------------|---------|--------|
| **任务不预生成** | 动态计算，不提前生成实例 | ✅ RRuleCalculationService实时计算 | 100% |
| **三类核心数据** | 任务规则、执行记录、覆盖/删除标记 | ✅ Task表(rrule) + CompletionRecord表 + exdate字段 | 100% |
| **任务生成逻辑** | 获取规则→判断命中→应用删除→应用覆盖→生成实例 | ⚠️ 缺少"应用覆盖"环节 | 80% |
| **六种操作支持** | 修改当天、修改未来、修改全部、删除当天、删除全部、删除未来 | ⚠️ 仅实现4种（缺修改当天、修改未来） | 67% |
| **任务计算优先级** | 删除标记 → 覆盖修改 → 规则默认值 | ⚠️ 仅实现删除标记，缺覆盖修改 | 50% |

**核心问题诊断**:

1. ❌ **缺少task_overrides表** - 无法实现"单日覆盖修改"
2. ❌ **缺少"修改未来"功能** - 无法"拆分任务规则"
3. ❌ **优先级流程不完整** - getTasksByDate()未应用覆盖逻辑

---

### 1.2 已实现功能清单 ✅

#### 后端架构（符合四层架构）

| 层级 | 文件 | 功能 | 状态 |
|------|------|------|------|
| Service | RRuleCalculationService.js | RRULE实时计算、EXDATE支持 | ✅ 完整 |
| Service | taskService.js | getTasksByDate()查询任务 | ✅ 基础版 |
| Repository | CompletionRecordRepository.js | 完成记录CRUD | ✅ 完整 |
| Model | Task.js | 任务模型（rrule、exdate字段） | ✅ 完整 |
| Model | CompletionRecord.js | 完成记录模型 | ✅ 完整 |

#### 已实现的操作（6种中的4种）

| 操作 | 阶段一要求 | 当前实现 | 状态 |
|------|-----------|---------|------|
| 修改全部 | 直接修改任务规则 | ✅ taskStore.updateTask() | 完整 |
| 删除当天 | 单日删除标记（exdate） | ✅ Task.exdate字段 + RRuleSet.exdate() | 完整 |
| 删除全部 | 删除任务规则 | ✅ taskStore.deleteTask() | 完整 |
| 删除未来 | 修改规则结束时间 | ✅ 修改rrule的UNTIL参数（可手动实现） | 基础版 |
| **修改当天** | **创建单日覆盖** | ❌ **缺失** | **未实现** |
| **修改未来** | **拆分任务规则** | ❌ **缺失** | **未实现** |

---

### 1.3 未实现功能清单 ❌

#### 核心缺失1：task_overrides表（单日覆盖）

**用户场景**:
```
用户创建"每日晨跑"任务（7:00-8:00，重要不紧急）
3月17日因临时会议，想改为15:00-16:00，且改为重要且紧急

期望操作：
1. 拖拽3月17日的任务到"红色象限"
2. 选择"仅修改3月17日"
3. 3月18日及之后仍是原来的象限和时间

现状：
❌ 无法实现"仅修改3月17日"
❌ 只能修改全部（影响所有日期）
```

**技术原因**: 缺少存储单日覆盖数据的表

---

#### 核心缺失2：修改未来（拆分任务规则）

**用户场景**:
```
用户创建"每日晨跑"任务（3月1日开始）
3月17日想改变规则：从"每天7:00"改为"每天18:00"

期望操作：
1. 拖拽3月17日的任务到新象限
2. 选择"修改3月17日及未来计划"
3. 3月16日以前保持原规则
4. 3月17日及之后应用新规则

现状：
❌ 选项2点击"确定"后，实际调用的是updateTask()，修改了所有日期
❌ 无法实现"拆分规则"
```

**技术原因**: 缺少规则拆分逻辑（修改原规则UNTIL + 创建新规则）

---

#### 核心缺失3：任务计算优先级流程不完整

**阶段一要求的流程**:
```
查看某一天任务
    ↓
是否删除标记（exdate）？
    ↓ 是 → 不显示
    ↓ 否
是否存在覆盖（task_overrides）？
    ↓ 是 → 使用覆盖值
    ↓ 否
使用任务规则默认值
```

**当前实现**:
```javascript
// taskService.js Line 117-144（简化版）
for (const task of allRecurringTasks) {
  const occurrences = rruleCalculationService.calculateOccurrences(task, date, date);

  if (occurrences.includes(date)) {
    // ✅ 已实现：EXDATE自动过滤（在calculateOccurrences内部）
    // ❌ 缺失：未检查task_overrides表
    // ❌ 缺失：未应用覆盖字段

    const completionRecord = await completionRecordRepository.getByTaskAndDate(task.id, date);
    taskWithStatus.completionRecord = completionRecord;
    taskWithStatus.status = completionRecord ? completionRecord.status : 'pending';

    recurringTasksOnDate.push(taskWithStatus);
  }
}
```

**问题**:
- ✅ EXDATE过滤正确（在RRuleCalculationService内部实现）
- ❌ 缺少覆盖查询和应用逻辑

---

### 1.4 架构健康度评分

| 维度 | 得分 | 说明 |
|------|------|------|
| **理论符合度** | 85/100 | ⚠️ 核心原则符合，部分功能缺失 |
| **架构合理性** | 95/100 | ✅ 四层架构清晰 |
| **功能完整性** | 67/100 | ⚠️ 六种操作仅实现4种 |
| **可维护性** | 90/100 | ✅ 代码规范、注释完整 |
| **扩展性** | 80/100 | ✅ 设计支持扩展，但未完全实现 |

**总分：83/100**

**提升空间：完善方案后可达95/100**

---

## 🎯 第二部分：完善方案设计

### 方案一：数据库架构增强

#### 1.1 创建task_overrides表（单日覆盖表）

**设计原则（基于阶段一）**:
- 存储单日覆盖数据
- 任何字段都可以被覆盖（title、isUrgent、isImportant、startTime等）
- 未覆盖的字段使用NULL，表示"继承任务规则的默认值"

**SQL语句**:

```sql
-- 文件位置：backend/src/migrations/YYYYMMDDHHMMSS-create-task-overrides.js

CREATE TABLE task_overrides (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '覆盖记录ID',
  task_id INT UNSIGNED NOT NULL COMMENT '任务ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  override_date DATE NOT NULL COMMENT '覆盖日期（YYYY-MM-DD）',

  -- ⭐ 可覆盖的字段（NULL表示不覆盖，使用任务规则默认值）
  title VARCHAR(500) DEFAULT NULL COMMENT '覆盖标题',
  description TEXT DEFAULT NULL COMMENT '覆盖描述',
  is_urgent BOOLEAN DEFAULT NULL COMMENT '覆盖紧急性（四象限）',
  is_important BOOLEAN DEFAULT NULL COMMENT '覆盖重要性（四象限）',
  start_time TIME DEFAULT NULL COMMENT '覆盖开始时间',
  end_time TIME DEFAULT NULL COMMENT '覆盖结束时间',
  is_all_day BOOLEAN DEFAULT NULL COMMENT '覆盖全天标记',

  -- 元数据
  created_at DATETIME NOT NULL COMMENT '创建时间',
  updated_at DATETIME NOT NULL COMMENT '更新时间',

  -- 索引
  UNIQUE KEY uk_task_date (task_id, override_date) COMMENT '同一任务同一天只能有一条覆盖记录',
  INDEX idx_user_date (user_id, override_date) COMMENT '按用户和日期查询'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务单日覆盖表';
```

**关键设计决策**:

1. **字段允许NULL** - NULL表示"不覆盖此字段"，使用任务规则的默认值
   ```javascript
   // 示例：仅覆盖象限，不覆盖时间
   {
     taskId: 123,
     overrideDate: '2026-03-17',
     isUrgent: true,     // 覆盖
     isImportant: true,  // 覆盖
     startTime: null,    // 不覆盖，使用任务规则的默认值
     endTime: null       // 不覆盖，使用任务规则的默认值
   }
   ```

2. **UNIQUE约束** - 同一任务同一天只能有一条覆盖记录（避免冲突）

3. **外键索引** - 支持高效查询"某任务的某天是否有覆盖"

---

#### 1.2 修改tasks表（支持规则拆分）

**设计原则（基于阶段一"修改未来"）**:
- 拆分后的子规则需要追溯到父规则
- 记录拆分起始日期（用于数据审计）

**SQL语句**:

```sql
-- 文件位置：backend/src/migrations/YYYYMMDDHHMMSS-add-task-split-fields.js

ALTER TABLE tasks
  ADD COLUMN parent_task_id INT UNSIGNED DEFAULT NULL COMMENT '父任务ID（拆分来源）',
  ADD COLUMN split_from_date DATE DEFAULT NULL COMMENT '拆分起始日期',
  ADD INDEX idx_parent_task (parent_task_id) COMMENT '查询子规则';
```

**拆分示例**:

```javascript
// 原任务（3月1日创建）
{
  id: 100,
  title: '每日晨跑',
  rrule: 'FREQ=DAILY',
  isUrgent: false,
  isImportant: true,
  parentTaskId: null,
  splitFromDate: null
}

// 3月17日用户"修改未来"后，拆分为两条规则：

// 规则A（原任务修改）
{
  id: 100,
  title: '每日晨跑',
  rrule: 'FREQ=DAILY;UNTIL=20260316T235959Z', // ⭐ 添加UNTIL
  isUrgent: false,
  isImportant: true,
  parentTaskId: null,
  splitFromDate: null
}

// 规则B（新任务）
{
  id: 101,
  title: '每日晨跑',
  rrule: 'FREQ=DAILY',
  isUrgent: true,    // ⭐ 新象限
  isImportant: true, // ⭐ 新象限
  parentTaskId: 100,         // ⭐ 标记来源
  splitFromDate: '2026-03-17' // ⭐ 拆分起始日期
}
```

---

#### 1.3 数据库索引优化（立即执行，0成本）

```sql
-- 文件位置：backend/src/migrations/YYYYMMDDHHMMSS-add-task-indexes.js

-- 优化重复任务查询（覆盖索引）
CREATE INDEX idx_user_recurring
  ON tasks(user_id, is_recurring)
  WHERE is_recurring = TRUE
  COMMENT '加速查询用户的重复任务';

-- 优化覆盖记录查询
CREATE INDEX idx_override_lookup
  ON task_overrides(task_id, override_date)
  COMMENT '加速查询某任务某天的覆盖记录';

-- 验证索引效果
EXPLAIN SELECT * FROM tasks WHERE user_id = 1 AND is_recurring = TRUE;
-- 预期结果：Using index (覆盖索引)
```

**预期性能提升**:
- 查询速度：+30%
- 磁盘I/O：-50%

---

### 方案二：六种操作完整实现

#### 2.1 创建TaskOverride Model

**文件位置**: `backend/src/models/TaskOverride.js`

```javascript
'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * TaskOverride 任务单日覆盖模型
 *
 * DB表名: task_overrides
 * 关联:
 *   TaskOverride.belongsTo(Task, { foreignKey: 'taskId', as: 'task' })
 *   TaskOverride.belongsTo(User, { foreignKey: 'userId', as: 'user' })
 *
 * 用途: 覆盖重复任务在某一天的属性
 * 原则: NULL字段表示"不覆盖，使用任务规则默认值"
 */
class TaskOverride extends Model {}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof TaskOverride}
 */
function initTaskOverrideModel(sequelize) {
  TaskOverride.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      taskId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { notNull: { msg: '任务ID不能为空' } }
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { notNull: { msg: '用户ID不能为空' } }
      },
      overrideDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: '覆盖日期不能为空' },
          isDate: { msg: '覆盖日期格式错误' }
        }
      },

      // ⭐ 可覆盖的字段（NULL = 不覆盖）
      title: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      isUrgent: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      isImportant: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null
      },
      isAllDay: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'TaskOverride',
      tableName: 'task_overrides',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ['task_id', 'override_date'],
          name: 'uk_task_date'
        },
        {
          fields: ['user_id', 'override_date'],
          name: 'idx_user_date'
        }
      ]
    }
  );

  return TaskOverride;
}

module.exports = { TaskOverride, initTaskOverrideModel };
```

---

#### 2.2 创建TaskOverrideRepository

**文件位置**: `backend/src/repositories/TaskOverrideRepository.js`

```javascript
/**
 * TaskOverrideRepository - 任务覆盖数据访问层
 *
 * 职责：管理task_overrides表的CRUD操作
 * 符合四层架构：Repository层（数据访问，无业务逻辑）
 */

const { TaskOverride } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

class TaskOverrideRepository {
  /**
   * 获取某任务某天的覆盖记录
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {Promise<object|null>} 覆盖记录（不存在返回null）
   */
  async getByTaskAndDate(taskId, date) {
    return await TaskOverride.findOne({
      where: {
        taskId,
        overrideDate: date
      }
    });
  }

  /**
   * 创建或更新覆盖记录
   * @param {number} taskId - 任务ID
   * @param {number} userId - 用户ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @param {object} overrideData - 覆盖字段（如{ isUrgent: true, isImportant: false }）
   * @returns {Promise<object>} 覆盖记录
   */
  async upsertOverride(taskId, userId, date, overrideData) {
    const [override, created] = await TaskOverride.findOrCreate({
      where: { taskId, overrideDate: date },
      defaults: {
        userId,
        ...overrideData
      }
    });

    // 如果记录已存在，更新字段
    if (!created) {
      await override.update(overrideData);
    }

    return override;
  }

  /**
   * 删除覆盖记录
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {Promise<number>} 删除的记录数
   */
  async deleteOverride(taskId, date) {
    return await TaskOverride.destroy({
      where: {
        taskId,
        overrideDate: date
      }
    });
  }

  /**
   * 获取某任务的所有覆盖记录
   * @param {number} taskId - 任务ID
   * @returns {Promise<object[]>} 覆盖记录数组
   */
  async getAllByTask(taskId) {
    return await TaskOverride.findAll({
      where: { taskId },
      order: [['overrideDate', 'ASC']]
    });
  }

  /**
   * 批量删除某任务的所有覆盖记录（删除任务时调用）
   * @param {number} taskId - 任务ID
   * @returns {Promise<number>} 删除的记录数
   */
  async deleteAllByTask(taskId) {
    return await TaskOverride.destroy({
      where: { taskId }
    });
  }
}

module.exports = new TaskOverrideRepository();
```

---

#### 2.3 创建RecurringTaskService（六种操作）

**文件位置**: `backend/src/services/RecurringTaskService.js`

```javascript
/**
 * RecurringTaskService - 重复任务操作Service
 *
 * 职责：实现阶段一的六种操作
 * 符合四层架构：Service层（业务逻辑）
 */

const { Task } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const taskOverrideRepository = require('../repositories/TaskOverrideRepository');
const rruleCalculationService = require('./RRuleCalculationService');
const dayjs = require('dayjs');

class RecurringTaskService {
  /**
   * 操作1：修改当天（创建单日覆盖）
   *
   * @param {number} taskId - 任务ID
   * @param {number} userId - 用户ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @param {object} updateData - 覆盖字段（如 { isUrgent: true, isImportant: false }）
   * @returns {Promise<object>} 覆盖记录
   *
   * @example
   * // 用户拖拽3月17日的任务到红色象限
   * await updateSingleDay(123, 1, '2026-03-17', { isUrgent: true, isImportant: true });
   */
  async updateSingleDay(taskId, userId, date, updateData) {
    // 验证任务存在且是重复任务
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new NotFoundError('任务');
    }
    if (!task.isRecurring) {
      throw new ValidationError('该任务不是重复任务');
    }

    // 验证该日期在RRULE范围内
    const isValid = rruleCalculationService.isOccurrenceOnDate(task, date);
    if (!isValid) {
      throw new ValidationError('该日期不在任务的重复规则中');
    }

    // 创建或更新覆盖记录
    const override = await taskOverrideRepository.upsertOverride(
      taskId,
      userId,
      date,
      updateData
    );

    return override;
  }

  /**
   * 操作2：修改未来（拆分任务规则）
   *
   * @param {number} taskId - 任务ID
   * @param {number} userId - 用户ID
   * @param {string} fromDate - 从哪天开始修改（YYYY-MM-DD）
   * @param {object} updateData - 新规则的属性
   * @returns {Promise<object>} { originalTask, newTask }
   *
   * @example
   * // 用户拖拽3月17日的任务到红色象限，选择"修改未来"
   * await updateFutureOccurrences(123, 1, '2026-03-17', { isUrgent: true, isImportant: true });
   *
   * // 结果：
   * // - 原任务：3月1日 - 3月16日（保持原象限）
   * // - 新任务：3月17日 - 无限期（红色象限）
   */
  async updateFutureOccurrences(taskId, userId, fromDate, updateData) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new NotFoundError('任务');
    }
    if (!task.isRecurring) {
      throw new ValidationError('该任务不是重复任务');
    }

    // ⭐ 拆分规则
    // 步骤1：修改原任务，添加结束日期（前一天）
    const endDate = dayjs(fromDate).subtract(1, 'day').format('YYYY-MM-DD');

    // 修改原任务的rrule，添加UNTIL
    const originalRrule = task.rrule;
    const untilStr = endDate.replace(/-/g, '') + 'T235959Z';

    const newRrule = originalRrule.includes('UNTIL')
      ? originalRrule.replace(/UNTIL=\d{8}T\d{6}Z/, `UNTIL=${untilStr}`)
      : `${originalRrule};UNTIL=${untilStr}`;

    await Task.update(
      { rrule: newRrule, rruleUntil: endDate },
      { where: { id: taskId } }
    );

    // 步骤2：创建新任务（从fromDate开始，应用updateData）
    const taskData = task.toJSON();
    delete taskData.id;
    delete taskData.createdAt;
    delete taskData.updatedAt;

    const newTask = await Task.create({
      ...taskData,
      ...updateData,
      userId,
      parentTaskId: taskId,        // ⭐ 标记父任务
      splitFromDate: fromDate,      // ⭐ 记录拆分起始日期
      startDate: fromDate,
      rruleUntil: null              // 新任务默认无结束日期
    });

    return {
      originalTask: { id: taskId, rrule: newRrule, rruleUntil: endDate },
      newTask
    };
  }

  /**
   * 操作3：修改全部（直接修改任务规则）
   *
   * @param {number} taskId - 任务ID
   * @param {object} updateData - 更新字段
   * @returns {Promise<number>} 更新的记录数
   */
  async updateAllOccurrences(taskId, updateData) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new NotFoundError('任务');
    }
    if (!task.isRecurring) {
      throw new ValidationError('该任务不是重复任务');
    }

    return await Task.update(updateData, { where: { id: taskId } });
  }

  /**
   * 操作4：删除当天（创建单日删除标记）
   *
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {Promise<object>} 更新后的任务
   *
   * @example
   * // 用户长按3月17日的任务，选择"永久跳过此日期"
   * await deleteSingleDay(123, '2026-03-17');
   */
  async deleteSingleDay(taskId, date) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new NotFoundError('任务');
    }
    if (!task.isRecurring) {
      throw new ValidationError('该任务不是重复任务');
    }

    // 验证该日期在RRULE范围内
    const isValid = rruleCalculationService.isOccurrenceOnDate(task, date);
    if (!isValid) {
      throw new ValidationError('该日期不在任务的重复规则中');
    }

    // 添加到exdate数组
    const exdate = task.exdate || [];
    if (!exdate.includes(date)) {
      exdate.push(date);
    }

    await Task.update({ exdate }, { where: { id: taskId } });

    return { taskId, exdate };
  }

  /**
   * 操作5：完整删除任务（删除任务规则）
   *
   * @param {number} taskId - 任务ID
   * @returns {Promise<number>} 删除的记录数
   */
  async deleteAllOccurrences(taskId) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new NotFoundError('任务');
    }
    if (!task.isRecurring) {
      throw new ValidationError('该任务不是重复任务');
    }

    // 删除任务规则
    const result = await Task.destroy({ where: { id: taskId } });

    // 删除所有覆盖记录（级联清理）
    await taskOverrideRepository.deleteAllByTask(taskId);

    return result;
  }

  /**
   * 操作6：删除当天及未来（修改规则结束时间）
   *
   * @param {number} taskId - 任务ID
   * @param {string} fromDate - 从哪天开始删除（YYYY-MM-DD）
   * @returns {Promise<object>} 更新后的任务
   *
   * @example
   * // 用户选择"删除3月17日及之后的所有任务"
   * await deleteFutureOccurrences(123, '2026-03-17');
   *
   * // 结果：任务规则修改为"3月1日 - 3月16日"
   */
  async deleteFutureOccurrences(taskId, fromDate) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new NotFoundError('任务');
    }
    if (!task.isRecurring) {
      throw new ValidationError('该任务不是重复任务');
    }

    // 修改rrule，添加UNTIL为前一天
    const endDate = dayjs(fromDate).subtract(1, 'day').format('YYYY-MM-DD');
    const untilStr = endDate.replace(/-/g, '') + 'T235959Z';

    const originalRrule = task.rrule;
    const newRrule = originalRrule.includes('UNTIL')
      ? originalRrule.replace(/UNTIL=\d{8}T\d{6}Z/, `UNTIL=${untilStr}`)
      : `${originalRrule};UNTIL=${untilStr}`;

    await Task.update(
      { rrule: newRrule, rruleUntil: endDate },
      { where: { id: taskId } }
    );

    return { taskId, rrule: newRrule, rruleUntil: endDate };
  }
}

module.exports = new RecurringTaskService();
```

---

#### 2.4 增强taskService.js（任务计算优先级流程）

**文件位置**: `backend/src/services/taskService.js`

**修改内容**: getTasksByDate()方法，应用阶段一的优先级流程

```javascript
/**
 * 获取某天的任务列表（增强版：应用优先级流程）
 *
 * 优先级流程（阶段一要求）：
 * 1. 单日删除标记（exdate）→ 不显示
 * 2. 单日覆盖（task_overrides）→ 使用覆盖值
 * 3. 任务规则 → 使用默认值
 *
 * @param {number} userId - 用户ID
 * @param {string} date - 日期（YYYY-MM-DD）
 * @param {boolean} includeCompleted - 是否包含已完成任务
 * @returns {Promise<object>} { single, range, recurring }
 */
async function getTasksByDate(userId, date, includeCompleted = false) {
  const { Op } = require('sequelize');
  const taskOverrideRepository = require('../repositories/TaskOverrideRepository');

  // 状态过滤
  const statusFilter = includeCompleted ? {} : { status: { [Op.ne]: 'completed' } };

  // 1. 单日任务（该日期，非重复）
  const singleTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'single',
      taskDate: date,
      isRecurring: false,
      ...statusFilter
    },
    order: [['createdAt', 'DESC']]
  });

  // 2. 跨天任务（该日期在范围内，非重复）
  const rangeTasks = await Task.findAll({
    where: {
      userId,
      dateType: 'range',
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date },
      isRecurring: false,
      ...statusFilter
    },
    order: [['startDate', 'ASC']]
  });

  // 3. 重复任务（应用优先级流程）
  const allRecurringTasks = await Task.findAll({
    where: {
      userId,
      isRecurring: true
    }
  });

  const recurringTasksOnDate = [];
  const failedTasks = []; // ⭐ 错误处理：记录失败的任务

  for (const task of allRecurringTasks) {
    try {
      // 计算RRULE（EXDATE自动在calculateOccurrences内部过滤）
      const occurrences = rruleCalculationService.calculateOccurrences(task, date, date);

      if (occurrences.includes(date)) {
        // ⭐ 优先级1：单日删除标记（已在calculateOccurrences内部处理）
        // 如果该日期在exdate中，occurrences不会包含该日期，直接跳过

        // ⭐ 优先级2：检查单日覆盖
        const override = await taskOverrideRepository.getByTaskAndDate(task.id, date);

        // 构建任务实例（从任务规则开始）
        let taskInstance = task.toJSON();

        // 应用覆盖字段（NULL字段不覆盖，使用任务规则默认值）
        if (override) {
          if (override.title !== null) taskInstance.title = override.title;
          if (override.description !== null) taskInstance.description = override.description;
          if (override.isUrgent !== null) taskInstance.isUrgent = override.isUrgent;
          if (override.isImportant !== null) taskInstance.isImportant = override.isImportant;
          if (override.startTime !== null) taskInstance.startTime = override.startTime;
          if (override.endTime !== null) taskInstance.endTime = override.endTime;
          if (override.isAllDay !== null) taskInstance.isAllDay = override.isAllDay;

          // ⭐ 标记该任务实例有覆盖（前端可用于特殊显示）
          taskInstance._hasOverride = true;
          taskInstance._overrideId = override.id;
        }

        // ⭐ 优先级3：获取完成记录
        const completionRecord = await completionRecordRepository.getByTaskAndDate(task.id, date);
        taskInstance.completionRecord = completionRecord;
        taskInstance.status = completionRecord ? completionRecord.status : 'pending';

        // 根据includeCompleted过滤
        if (includeCompleted || taskInstance.status === 'pending') {
          recurringTasksOnDate.push(taskInstance);
        }
      }
    } catch (error) {
      // ⭐ 优雅降级：跳过该任务，继续处理其他任务
      console.error(`[RRULE解析失败] 任务ID: ${task.id}, RRULE: ${task.rrule}`, error);
      failedTasks.push({
        taskId: task.id,
        title: task.title,
        rrule: task.rrule,
        error: error.message
      });
      continue;
    }
  }

  return {
    single: singleTasks,
    range: rangeTasks,
    recurring: recurringTasksOnDate,
    // ⭐ 返回警告信息（前端可显示Toast）
    warnings: failedTasks.length > 0 ? {
      message: `${failedTasks.length}个重复任务规则解析失败`,
      failedTasks
    } : null
  };
}
```

---

#### 2.5 注册新路由

**文件位置**: `backend/src/routes/task.js`

```javascript
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// ... 现有路由 ...

/**
 * 重复任务操作路由（六种操作）
 */

// 操作1：修改单日（创建覆盖）
router.put(
  '/recurring/:taskId/single-day',
  auth,
  taskController.updateSingleDayOccurrence
);

// 操作2：修改未来（拆分规则）
router.put(
  '/recurring/:taskId/future',
  auth,
  taskController.updateFutureOccurrences
);

// 操作3：修改全部（已有路由：PUT /tasks/:id）

// 操作4：删除单日（添加exdate）
router.delete(
  '/recurring/:taskId/single-day/:date',
  auth,
  taskController.deleteSingleDayOccurrence
);

// 操作5：删除全部（已有路由：DELETE /tasks/:id）

// 操作6：删除未来（修改结束时间）
router.delete(
  '/recurring/:taskId/future',
  auth,
  taskController.deleteFutureOccurrences
);

module.exports = router;
```

---

#### 2.6 创建Controller方法

**文件位置**: `backend/src/controllers/taskController.js`

```javascript
const recurringTaskService = require('../services/RecurringTaskService');
const { success, error } = require('../utils/response');

/**
 * 操作1：修改重复任务的单日实例
 * PUT /api/v1/tasks/recurring/:taskId/single-day
 * Body: { date: '2026-03-17', isUrgent: true, isImportant: false, ... }
 */
exports.updateSingleDayOccurrence = async (req, res) => {
  const { taskId } = req.params;
  const { date, ...updateData } = req.body;
  const userId = req.user.id;

  const override = await recurringTaskService.updateSingleDay(
    parseInt(taskId),
    userId,
    date,
    updateData
  );

  return success(res, override, '单日覆盖已创建');
};

/**
 * 操作2：修改重复任务的未来所有实例
 * PUT /api/v1/tasks/recurring/:taskId/future
 * Body: { date: '2026-03-17', isUrgent: true, isImportant: false, ... }
 */
exports.updateFutureOccurrences = async (req, res) => {
  const { taskId } = req.params;
  const { date, ...updateData } = req.body;
  const userId = req.user.id;

  const result = await recurringTaskService.updateFutureOccurrences(
    parseInt(taskId),
    userId,
    date,
    updateData
  );

  return success(res, result, '未来实例已更新（规则已拆分）');
};

/**
 * 操作4：删除重复任务的单日实例
 * DELETE /api/v1/tasks/recurring/:taskId/single-day/:date
 */
exports.deleteSingleDayOccurrence = async (req, res) => {
  const { taskId, date } = req.params;

  const result = await recurringTaskService.deleteSingleDay(
    parseInt(taskId),
    date
  );

  return success(res, result, '单日已删除（已添加到exdate）');
};

/**
 * 操作6：删除重复任务的未来实例
 * DELETE /api/v1/tasks/recurring/:taskId/future
 * Body: { date: '2026-03-17' }
 */
exports.deleteFutureOccurrences = async (req, res) => {
  const { taskId } = req.params;
  const { date } = req.body;

  const result = await recurringTaskService.deleteFutureOccurrences(
    parseInt(taskId),
    date
  );

  return success(res, result, '未来实例已删除（规则结束时间已修改）');
};
```

---

### 方案三：前端UI完整支持

#### 3.1 修改DragOverlay.vue（三选项对话框）

**文件位置**: `frontend/Planning-app/components/calendar/DragOverlay.vue`

```vue
<template>
  <uni-popup ref="changeQuadrantDialog" type="center">
    <view class="dialog-container">
      <view class="dialog-header">
        <text class="dialog-title">{{ task?.title }}</text>
        <text class="dialog-subtitle">这是一个重复任务，请选择修改范围：</text>
      </view>

      <view class="dialog-body">
        <radio-group @change="onOptionChange">
          <!-- 选项1：仅修改当天 -->
          <view
            class="option-item"
            :class="{ active: changeQuadrantOption === 1 }"
            @tap="changeQuadrantOption = 1"
          >
            <radio value="1" :checked="changeQuadrantOption === 1" />
            <view class="option-content">
              <text class="option-title">仅修改{{ currentDateLabel }}</text>
              <text class="option-hint">（创建单日覆盖，其他日期不受影响）</text>
            </view>
          </view>

          <!-- 选项2：修改当天及未来 -->
          <view
            class="option-item"
            :class="{ active: changeQuadrantOption === 2 }"
            @tap="changeQuadrantOption = 2"
          >
            <radio value="2" :checked="changeQuadrantOption === 2" />
            <view class="option-content">
              <text class="option-title">修改{{ currentDateLabel }}及未来计划</text>
              <text class="option-hint">（拆分任务规则，{{ prevDateLabel }}之前保持不变）</text>
            </view>
          </view>

          <!-- 选项3：修改全部 -->
          <view
            class="option-item"
            :class="{ active: changeQuadrantOption === 3 }"
            @tap="changeQuadrantOption = 3"
          >
            <radio value="3" :checked="changeQuadrantOption === 3" />
            <view class="option-content">
              <text class="option-title">完整更改此条重复计划</text>
              <text class="option-hint">（修改任务规则，影响所有日期）</text>
            </view>
          </view>
        </radio-group>
      </view>

      <view class="dialog-actions">
        <button class="btn-cancel" @tap="closeChangeQuadrantDialog">取消</button>
        <button class="btn-confirm" type="primary" @tap="confirmChangeQuadrant">确定</button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTaskStore } from '@/store/task';
import dayjs from 'dayjs';

const taskStore = useTaskStore();

const task = ref(null);
const currentDate = ref('');
const changeQuadrantOption = ref(1); // 默认选项1

// 当前日期标签（如"3月17日"）
const currentDateLabel = computed(() => {
  if (!currentDate.value) return '';
  const [year, month, day] = currentDate.value.split('-');
  return `${parseInt(month)}月${parseInt(day)}日`;
});

// 前一天日期标签（如"3月16日"）
const prevDateLabel = computed(() => {
  if (!currentDate.value) return '';
  const prevDate = dayjs(currentDate.value).subtract(1, 'day');
  return `${prevDate.month() + 1}月${prevDate.date()}日`;
});

function onOptionChange(e) {
  changeQuadrantOption.value = parseInt(e.detail.value);
}

/**
 * 显示对话框
 * @param {object} taskData - 任务对象
 * @param {string} date - 日期（YYYY-MM-DD）
 * @param {object} newQuadrant - 新象限 { isUrgent, isImportant }
 */
function showDialog(taskData, date, newQuadrant) {
  task.value = taskData;
  currentDate.value = date;
  newQuadrant.value = newQuadrant;
  changeQuadrantDialog.value.open();
}

/**
 * 确认修改象限
 */
async function confirmChangeQuadrant() {
  const taskId = task.value.id;
  const date = currentDate.value;
  const updateData = newQuadrant.value; // { isUrgent, isImportant }

  try {
    if (changeQuadrantOption.value === 1) {
      // ⭐ 选项1：仅修改当天（创建覆盖）
      await taskStore.updateSingleDayOccurrence(taskId, date, updateData);
      uni.showToast({ title: '已修改当天', icon: 'success' });
    } else if (changeQuadrantOption.value === 2) {
      // ⭐ 选项2：修改未来（拆分规则）
      await taskStore.updateFutureOccurrences(taskId, date, updateData);
      uni.showToast({ title: '已修改未来计划', icon: 'success' });
    } else if (changeQuadrantOption.value === 3) {
      // ⭐ 选项3：修改全部（修改规则）
      await taskStore.updateTask(taskId, updateData);
      uni.showToast({ title: '已修改全部', icon: 'success' });
    }

    // 刷新任务列表
    await taskStore.fetchTasksByDate(date);

    closeChangeQuadrantDialog();
  } catch (error) {
    console.error('[DragOverlay] 修改象限失败:', error);
    uni.showToast({ title: '修改失败', icon: 'none' });
  }
}

function closeChangeQuadrantDialog() {
  changeQuadrantDialog.value.close();
  task.value = null;
  currentDate.value = '';
  changeQuadrantOption.value = 1; // 重置为默认选项
}

// 暴露方法供父组件调用
defineExpose({ showDialog });
</script>

<style scoped>
.dialog-container {
  width: 600rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
}

.dialog-header {
  margin-bottom: 32rpx;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 12rpx;
}

.dialog-subtitle {
  font-size: 24rpx;
  color: #999999;
  display: block;
}

.dialog-body {
  margin-bottom: 32rpx;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
}

.option-item.active {
  background: rgba(25, 137, 250, 0.1);
  border-color: #1989FA;
}

.option-content {
  flex: 1;
  margin-left: 16rpx;
}

.option-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.option-hint {
  font-size: 22rpx;
  color: #999999;
  display: block;
}

.dialog-actions {
  display: flex;
  gap: 16rpx;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn-cancel {
  background: #F0F0F0;
  color: #666666;
}
</style>
```

---

#### 3.2 补全taskStore方法

**文件位置**: `frontend/Planning-app/store/task.js`

```javascript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import TaskRepository from '@/repositories/TaskRepository';
import * as taskApi from '@/api/task';

export const useTaskStore = defineStore('task', () => {
  // ... 现有状态和方法 ...

  /**
   * 操作1：更新重复任务的单日实例（创建覆盖）
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   * @param {object} updateData - 覆盖字段（如 { isUrgent: true, isImportant: false }）
   */
  async function updateSingleDayOccurrence(taskId, date, updateData) {
    try {
      const response = await taskApi.updateSingleDayOccurrence(taskId, { date, ...updateData });

      // 刷新当天任务（覆盖会影响任务显示）
      await fetchTasksByDate(date);

      return response;
    } catch (error) {
      console.error('[taskStore] updateSingleDayOccurrence失败:', error);
      throw error;
    }
  }

  /**
   * 操作2：更新重复任务的未来所有实例（拆分规则）
   * @param {number} taskId - 任务ID
   * @param {string} date - 起始日期（YYYY-MM-DD）
   * @param {object} updateData - 更新字段
   */
  async function updateFutureOccurrences(taskId, date, updateData) {
    try {
      const response = await taskApi.updateFutureOccurrences(taskId, { date, ...updateData });

      // 清除未来30天的缓存（规则已拆分，需要重新获取）
      const dayjs = require('dayjs');
      for (let i = 0; i < 30; i++) {
        const futureDate = dayjs(date).add(i, 'day').format('YYYY-MM-DD');
        await fetchTasksByDate(futureDate);
      }

      // 强制同步到服务器
      await TaskRepository.sync();

      return response;
    } catch (error) {
      console.error('[taskStore] updateFutureOccurrences失败:', error);
      throw error;
    }
  }

  /**
   * 操作4：删除重复任务的单日实例（添加exdate）
   * @param {number} taskId - 任务ID
   * @param {string} date - 日期（YYYY-MM-DD）
   */
  async function deleteSingleDayOccurrence(taskId, date) {
    try {
      const response = await taskApi.deleteSingleDayOccurrence(taskId, date);

      // 刷新当天任务（exdate会隐藏任务）
      await fetchTasksByDate(date);

      return response;
    } catch (error) {
      console.error('[taskStore] deleteSingleDayOccurrence失败:', error);
      throw error;
    }
  }

  /**
   * 操作6：删除重复任务的未来实例（修改结束时间）
   * @param {number} taskId - 任务ID
   * @param {string} date - 起始日期（YYYY-MM-DD）
   */
  async function deleteFutureOccurrences(taskId, date) {
    try {
      const response = await taskApi.deleteFutureOccurrences(taskId, date);

      // 清除未来30天的缓存
      const dayjs = require('dayjs');
      for (let i = 0; i < 30; i++) {
        const futureDate = dayjs(date).add(i, 'day').format('YYYY-MM-DD');
        await fetchTasksByDate(futureDate);
      }

      // 强制同步到服务器
      await TaskRepository.sync();

      return response;
    } catch (error) {
      console.error('[taskStore] deleteFutureOccurrences失败:', error);
      throw error;
    }
  }

  return {
    // ... 现有返回值 ...
    updateSingleDayOccurrence,
    updateFutureOccurrences,
    deleteSingleDayOccurrence,
    deleteFutureOccurrences
  };
});
```

---

#### 3.3 补全taskApi方法

**文件位置**: `frontend/Planning-app/api/task.js`

```javascript
import request from '@/utils/request';

/**
 * 操作1：更新重复任务的单日实例
 * @param {number} taskId - 任务ID
 * @param {object} data - { date, isUrgent, isImportant, ... }
 * @returns {Promise<object>}
 */
export function updateSingleDayOccurrence(taskId, data) {
  return request({
    url: `/tasks/recurring/${taskId}/single-day`,
    method: 'PUT',
    data
  });
}

/**
 * 操作2：更新重复任务的未来实例
 * @param {number} taskId - 任务ID
 * @param {object} data - { date, isUrgent, isImportant, ... }
 * @returns {Promise<object>}
 */
export function updateFutureOccurrences(taskId, data) {
  return request({
    url: `/tasks/recurring/${taskId}/future`,
    method: 'PUT',
    data
  });
}

/**
 * 操作4：删除重复任务的单日实例
 * @param {number} taskId - 任务ID
 * @param {string} date - 日期（YYYY-MM-DD）
 * @returns {Promise<object>}
 */
export function deleteSingleDayOccurrence(taskId, date) {
  return request({
    url: `/tasks/recurring/${taskId}/single-day/${date}`,
    method: 'DELETE'
  });
}

/**
 * 操作6：删除重复任务的未来实例
 * @param {number} taskId - 任务ID
 * @param {object} data - { date }
 * @returns {Promise<object>}
 */
export function deleteFutureOccurrences(taskId, data) {
  return request({
    url: `/tasks/recurring/${taskId}/future`,
    method: 'DELETE',
    data
  });
}
```

---

## 📋 第三部分：分阶段实施计划

### 阶段1：核心功能完善（1周，P0优先级）

**目标**: 完整实现六种操作 + 任务计算优先级流程

#### Day 1-2：数据库架构（2天）

**任务清单**:

- [ ] **创建task_overrides表**
  - [ ] 创建migration文件：`backend/src/migrations/YYYYMMDDHHMMSS-create-task-overrides.js`
  - [ ] 执行migration：`cd backend && npm run migrate`
  - [ ] 验证表创建成功：`SHOW CREATE TABLE task_overrides;`

- [ ] **修改tasks表**
  - [ ] 创建migration文件：`backend/src/migrations/YYYYMMDDHHMMSS-add-task-split-fields.js`
  - [ ] 执行migration：`cd backend && npm run migrate`
  - [ ] 验证字段添加成功：`SHOW COLUMNS FROM tasks LIKE 'parent_task_id';`

- [ ] **数据库索引优化**
  - [ ] 创建migration文件：`backend/src/migrations/YYYYMMDDHHMMSS-add-task-indexes.js`
  - [ ] 执行索引创建
  - [ ] 验证索引生效：`EXPLAIN SELECT * FROM tasks WHERE user_id=1 AND is_recurring=TRUE;`
  - [ ] 预期结果：`Using index`

**验收标准**:
- ✅ task_overrides表存在，包含所有字段
- ✅ tasks表包含parent_task_id、split_from_date字段
- ✅ 所有索引创建成功
- ✅ EXPLAIN显示索引生效

---

#### Day 3-4：后端Service层（2天）

**任务清单**:

- [ ] **创建TaskOverride Model**
  - [ ] 创建文件：`backend/src/models/TaskOverride.js`
  - [ ] 在`backend/src/models/index.js`中注册Model
  - [ ] 定义关联关系：`TaskOverride.belongsTo(Task)` 和 `TaskOverride.belongsTo(User)`

- [ ] **创建TaskOverrideRepository**
  - [ ] 创建文件：`backend/src/repositories/TaskOverrideRepository.js`
  - [ ] 实现5个核心方法：
    - [ ] getByTaskAndDate()
    - [ ] upsertOverride()
    - [ ] deleteOverride()
    - [ ] getAllByTask()
    - [ ] deleteAllByTask()
  - [ ] 编写单元测试

- [ ] **创建RecurringTaskService**
  - [ ] 创建文件：`backend/src/services/RecurringTaskService.js`
  - [ ] 实现六种操作：
    - [ ] updateSingleDay()（操作1）
    - [ ] updateFutureOccurrences()（操作2）
    - [ ] updateAllOccurrences()（操作3）
    - [ ] deleteSingleDay()（操作4）
    - [ ] deleteAllOccurrences()（操作5）
    - [ ] deleteFutureOccurrences()（操作6）
  - [ ] 编写单元测试（每个操作至少3个测试用例）

- [ ] **增强taskService.js**
  - [ ] 修改getTasksByDate()，应用优先级流程
  - [ ] 添加优雅降级错误处理（failedTasks数组）
  - [ ] 编写集成测试

**验收标准**:
- ✅ TaskOverride Model可正常创建、查询、更新、删除
- ✅ RecurringTaskService六种操作全部通过单元测试
- ✅ getTasksByDate()返回结果包含覆盖字段
- ✅ 单元测试覆盖率 >80%

---

#### Day 5-6：前端集成（2天）

**任务清单**:

- [ ] **修改DragOverlay.vue**
  - [ ] 添加三选项UI（参考方案三代码）
  - [ ] 实现confirmChangeQuadrant()方法
  - [ ] 集成taskStore的三个新方法

- [ ] **补全taskStore方法**
  - [ ] 实现updateSingleDayOccurrence()
  - [ ] 实现updateFutureOccurrences()
  - [ ] 实现deleteSingleDayOccurrence()
  - [ ] 实现deleteFutureOccurrences()

- [ ] **补全taskApi方法**
  - [ ] 实现updateSingleDayOccurrence()
  - [ ] 实现updateFutureOccurrences()
  - [ ] 实现deleteSingleDayOccurrence()
  - [ ] 实现deleteFutureOccurrences()

- [ ] **UI测试**
  - [ ] 测试选项1：拖拽任务，选择"仅修改当天"，验证仅当天象限改变
  - [ ] 测试选项2：拖拽任务，选择"修改未来"，验证未来所有日期象限改变
  - [ ] 测试选项3：拖拽任务，选择"修改全部"，验证所有日期象限改变
  - [ ] 测试三端兼容性（H5 + Android + iOS）

**验收标准**:
- ✅ 拖拽重复任务弹出三选项对话框
- ✅ 选项1生效（仅当天改变）
- ✅ 选项2生效（未来所有日期改变）
- ✅ 选项3生效（所有日期改变）
- ✅ 三端UI一致、无崩溃

---

#### Day 7：测试与文档（1天）

**任务清单**:

- [ ] **集成测试**
  - [ ] 端到端测试：创建重复任务 → 拖拽 → 选择三种选项 → 验证结果
  - [ ] 数据一致性测试：覆盖、规则、完成记录三者协同工作
  - [ ] 边界测试：空日期、非重复任务、无权限等

- [ ] **更新API文档**
  - [ ] 更新`docs/03-API文档/任务管理接口.md`
  - [ ] 添加六种操作的接口文档
  - [ ] 添加请求/响应示例

- [ ] **更新设计文档**
  - [ ] 更新`docs/02-技术设计/详细字段映射表.md`（添加task_overrides表字段）
  - [ ] 标记阶段一的六种操作为"已实现"

- [ ] **创建工作日志**
  - [ ] 在`docs/06-AI协作日志/01-每日工作日志/`创建本周日志
  - [ ] 记录实施过程、决策、问题

**验收标准**:
- ✅ 集成测试全部通过
- ✅ API文档完整、准确
- ✅ 字段映射表已更新
- ✅ 工作日志详细、可追溯

---

### 阶段2：性能优化与监控（3天，P1优先级）

**目标**: 支持大规模用户（1000+重复任务）

#### Day 1：优雅降级与错误处理

**任务清单**:

- [ ] **增强错误处理**
  - [ ] taskService.getTasksByDate()添加try-catch（已在方案二实现）
  - [ ] 记录failedTasks数组
  - [ ] 返回warnings字段

- [ ] **前端错误提示**
  - [ ] taskStore接收warnings
  - [ ] 显示Toast提示："X个任务规则异常"
  - [ ] 发送错误日志到服务器（可选）

**验收标准**:
- ✅ 单个RRULE解析失败不影响其他任务
- ✅ 前端显示友好提示
- ✅ 后端日志记录详细错误

---

#### Day 2-3：压力测试与性能优化

**任务清单**:

- [ ] **创建测试数据**
  - [ ] 脚本：创建100/500/1000个重复任务
  - [ ] 覆盖不同频率：每日/每周/每月

- [ ] **压力测试**
  - [ ] 测试getTasksByDate()性能（100/500/1000任务）
  - [ ] 记录响应时间、数据库查询次数、内存占用

- [ ] **性能优化（如需要）**
  - [ ] 如果性能不达标，考虑Redis缓存（参考RRULE分析文档方案B）
  - [ ] 批量查询优化（Task.findAll + 批量覆盖查询）

**验收标准**:
- ✅ 1000个重复任务时，查询耗时 <1s
- ✅ 数据库查询次数可控
- ✅ 无内存泄漏

---

### 阶段3：高级功能（可选，P2优先级）

**目标**: 企业级功能增强（EXDATE UI、COUNT、BYDAY高级用法）

**参考文档**: `docs/02-技术设计/RRULE功能深度分析与企业级改进建议.md`

**实施内容**:
- EXDATE UI完善（长按菜单）
- COUNT支持（重复N次后停止）
- BYDAY高级用法（每月第N个周X）
- BYSETPOS（组合规则）

**预计时间**: 2周

---

## 🔄 第四部分：Claude账号切换指南

### 4.1 当前Claude完成内容总结

**已完成任务**（本会话）:
1. ✅ 深度分析阶段一至阶段三设计理论
2. ✅ 评估当前代码与设计理论的符合度（85/100）
3. ✅ 诊断三大核心缺失：task_overrides表、修改未来功能、优先级流程
4. ✅ 设计完整解决方案（数据库架构、Service层、前端UI）
5. ✅ 创建本执行方案文档（阶段四）

**已创建文件**:
- `docs/02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md`（本文档）

**未执行任务**:
- ❌ 数据库migration文件创建（等待执行）
- ❌ TaskOverride Model创建（等待执行）
- ❌ RecurringTaskService创建（等待执行）
- ❌ 前端UI修改（等待执行）

---

### 4.2 下一个Claude接手清单

#### 接手步骤（10分钟快速启动）

**步骤1：阅读必读文档（5分钟）**
```bash
# 必读1：项目协作规范
cat .claude/CLAUDE.md

# 必读2：当前项目状态
cat .claude/CURRENT_STATUS.md

# 必读3：本执行方案
cat docs/02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md
```

**步骤2：确认开发环境（2分钟）**
```bash
# 检查数据库连接
cd backend
npm run migrate:status

# 检查依赖安装
npm list sequelize dayjs

# 检查Git状态
git status
git branch  # 确认在develop分支
```

**步骤3：确定当前阶段（1分钟）**
- 查看本文档"第三部分：分阶段实施计划"
- 确认当前应该执行哪个阶段的哪一天

**步骤4：开始执行（2分钟）**
- 根据任务清单逐项执行
- 完成一项勾选一项（修改本文档）
- 提交Git commit

---

#### 快速定位代码位置

**关键文件清单**:

| 文件类型 | 文件路径 | 说明 |
|---------|---------|------|
| **数据库** | backend/src/migrations/ | 创建migration文件的位置 |
| **Model** | backend/src/models/TaskOverride.js | 需要创建的Model |
| **Repository** | backend/src/repositories/TaskOverrideRepository.js | 需要创建的Repository |
| **Service** | backend/src/services/RecurringTaskService.js | 需要创建的Service |
| **Service** | backend/src/services/taskService.js | 需要修改getTasksByDate() |
| **Controller** | backend/src/controllers/taskController.js | 需要添加4个新方法 |
| **Route** | backend/src/routes/task.js | 需要注册4个新路由 |
| **前端组件** | frontend/Planning-app/components/calendar/DragOverlay.vue | 需要修改对话框UI |
| **前端Store** | frontend/Planning-app/store/task.js | 需要添加4个新方法 |
| **前端API** | frontend/Planning-app/api/task.js | 需要添加4个新方法 |

---

#### 常见问题FAQ

**Q1: 数据库migration执行失败怎么办？**
```bash
# 查看migration状态
npm run migrate:status

# 回滚最后一次migration
npm run migrate:undo

# 重新执行
npm run migrate
```

**Q2: Sequelize Model关联定义在哪里？**
```
文件位置：backend/src/models/index.js
在这里定义TaskOverride与Task、User的关联关系
```

**Q3: 前端如何测试三端兼容性？**
```
H5: npm run dev（浏览器访问http://localhost:8080）
Android: HBuilderX → 运行 → 运行到手机或模拟器 → Android
iOS: HBuilderX → 运行 → 运行到手机或模拟器 → iOS（需Mac电脑）
```

**Q4: 如何验证优先级流程是否正确？**
```javascript
// 测试步骤：
1. 创建重复任务（每日，重要不紧急）
2. 拖拽3月17日到红色象限，选择"仅修改当天"
3. 查询数据库task_overrides表，应该有一条记录
4. 访问API：GET /tasks?date=2026-03-17
5. 验证返回的任务包含覆盖字段：isUrgent=true, isImportant=true
6. 访问API：GET /tasks?date=2026-03-18
7. 验证返回的任务仍是原象限：isUrgent=false, isImportant=true
```

---

### 4.3 Git工作流

**分支策略**:
```
develop（开发分支）→ 功能开发 → PR审查 → 合并到master（生产分支）
```

**Commit规范**:
```bash
# 格式：<type>(<scope>): <subject>

# 示例：
git commit -m "feat(recurring-task): 创建task_overrides表和migration"
git commit -m "feat(recurring-task): 实现RecurringTaskService六种操作"
git commit -m "feat(recurring-task): 前端DragOverlay支持三选项对话框"
git commit -m "docs(recurring-task): 更新API文档和字段映射表"
```

**推送节点**:
- 每完成一个Day的任务，提交一次commit
- 每完成一个阶段（如阶段1），推送到远程仓库

---

## ✅ 第五部分：验收标准

### 5.1 功能验收清单

#### 核心功能验收（阶段1）

| 功能 | 验收标准 | 测试方法 | 状态 |
|------|---------|---------|------|
| **操作1：修改单日** | 拖拽任务，选择"仅修改当天"，仅当天象限改变 | 手动测试 | ⬜ 待验收 |
| **操作2：修改未来** | 拖拽任务，选择"修改未来"，未来所有日期象限改变 | 手动测试 | ⬜ 待验收 |
| **操作3：修改全部** | 拖拽任务，选择"修改全部"，所有日期象限改变 | 手动测试（已实现） | ⬜ 待验收 |
| **操作4：删除单日** | 长按任务，选择"永久跳过"，该日期不再显示任务 | 手动测试 | ⬜ 待验收 |
| **操作5：删除全部** | 删除重复任务，所有日期任务消失 | 手动测试（已实现） | ⬜ 待验收 |
| **操作6：删除未来** | 删除未来实例，未来日期任务消失，过去日期保留 | 手动测试 | ⬜ 待验收 |
| **优先级流程** | 覆盖字段优先于规则默认值 | 单元测试 + 手动测试 | ⬜ 待验收 |

#### 数据一致性验收

| 场景 | 验收标准 | 测试方法 | 状态 |
|------|---------|---------|------|
| **覆盖与完成记录协同** | 覆盖象限后，完成任务，completionRecord正确关联 | 集成测试 | ⬜ 待验收 |
| **规则拆分后查询** | 拆分规则后，查询前后日期，返回正确的规则 | 集成测试 | ⬜ 待验收 |
| **EXDATE与覆盖冲突** | 同一天既有EXDATE又有覆盖，优先EXDATE（不显示） | 边界测试 | ⬜ 待验收 |

---

### 5.2 性能验收指标（阶段2）

| 指标 | 目标值 | 测试方法 | 实际值 | 状态 |
|------|--------|---------|--------|------|
| **100个重复任务** | <100ms | 压力测试 | - | ⬜ 待测 |
| **500个重复任务** | <500ms | 压力测试 | - | ⬜ 待测 |
| **1000个重复任务** | <1s | 压力测试 | - | ⬜ 待测 |
| **数据库查询次数** | <10次/请求 | 日志分析 | - | ⬜ 待测 |
| **内存占用** | <100MB | 性能监控 | - | ⬜ 待测 |

---

### 5.3 架构符合性检查（符合CLAUDE.md规范）

| 规范 | 检查项 | 符合度 | 状态 |
|------|--------|--------|------|
| **四层架构** | Repository、Service、Controller、Composable分层清晰 | - | ⬜ 待检 |
| **字段命名** | 数据库snake_case、代码camelCase、Sequelize自动映射 | - | ⬜ 待检 |
| **JSDoc注释** | 所有方法包含完整中文JSDoc | - | ⬜ 待检 |
| **三端兼容** | H5、Android、iOS三端UI一致、功能正常 | - | ⬜ 待检 |
| **文档同步** | API文档、字段映射表、工作日志已更新 | - | ⬜ 待检 |
| **单元测试** | 覆盖率 >80% | - | ⬜ 待检 |

---

## 📌 附录

### 附录A：设计理论溯源

本执行方案完全基于以下设计理论文档：

1. **阶段一：重复任务系统设计原则**
   - 核心原则：任务不预生成，动态计算
   - 三类数据：任务规则、执行记录、覆盖/删除标记
   - 六种操作：修改当天、修改未来、修改全部、删除当天、删除全部、删除未来
   - 任务计算优先级：删除标记 → 覆盖修改 → 规则默认值

2. **阶段三：统一设计思路的核心结构**
   - 任务类型：一次性任务 + 重复任务
   - 动态生成：查询任意日期，实时计算重复任务实例

3. **RRULE功能深度分析报告**
   - 当前实现评估
   - 性能优化建议
   - 企业级改进方案

---

### 附录B：关键技术决策记录

| 决策 | 理由 | 影响 |
|------|------|------|
| **使用task_overrides表** | 符合阶段一"单日覆盖"设计，字段灵活扩展 | 支持任意字段覆盖 |
| **拆分规则使用UNTIL** | RRULE标准支持，无需新增字段 | 符合RFC 5545标准 |
| **NULL字段表示不覆盖** | 允许部分覆盖，减少数据冗余 | 查询时需合并逻辑 |
| **优雅降级错误处理** | 单个异常不影响整体，提升可用性 | 需记录failedTasks |
| **三选项对话框** | 明确告知用户影响范围，避免误操作 | UI复杂度增加 |

---

### 附录C：数据库ER图（关键表关系）

```
┌─────────────────┐
│     tasks       │
│─────────────────│
│ id (PK)         │
│ user_id         │
│ title           │
│ is_recurring    │
│ rrule           │
│ exdate (TEXT)   │
│ parent_task_id  │◄────┐ (自关联)
│ split_from_date │     │
└─────────────────┘     │
        │               │
        │ 1             │
        │               │
        │               │
        │ N             │
┌───────▼─────────┐     │
│ task_overrides  │     │
│─────────────────│     │
│ id (PK)         │     │
│ task_id (FK)    │─────┘
│ user_id         │
│ override_date   │
│ title (NULL)    │
│ is_urgent (NULL)│
│ is_important(N) │
└─────────────────┘
        │
        │ 1
        │
        │ N
┌───────▼─────────────────┐
│ task_completion_records │
│─────────────────────────│
│ id (PK)                 │
│ task_id (FK)            │
│ completion_date         │
│ status                  │
│ subtask_completion(JSON)│
└─────────────────────────┘
```

---

### 附录D：前端数据流图

```
用户拖拽任务
    ↓
DragOverlay组件弹出对话框
    ↓
用户选择选项（1/2/3）
    ↓
DragOverlay.confirmChangeQuadrant()
    ↓
taskStore.updateSingleDayOccurrence()      (选项1)
taskStore.updateFutureOccurrences()        (选项2)
taskStore.updateTask()                     (选项3)
    ↓
taskApi.xxx()
    ↓
HTTP PUT请求 → 后端API
    ↓
后端Controller → Service → Repository
    ↓
数据库写入（task_overrides 或 tasks）
    ↓
返回成功响应
    ↓
taskStore.fetchTasksByDate(date)  // 刷新任务列表
    ↓
Repository → Store → Component
    ↓
UI自动重新渲染
```

---

**文档结束**

**下一步**: 执行"第三部分：分阶段实施计划"的"阶段1：Day 1"任务

**预祝**: 架构完善后，项目健康度从85/100提升至95/100 🎉
