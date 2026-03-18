# 数据库表设计文档

> **数据库**: `planning_app_dev` / `planning_app_prod`
> **字符集**: `utf8mb4` / `utf8mb4_unicode_ci`
> **时区**: `+08:00`
> **ORM**: Sequelize v6，`underscored: true`（DB字段 snake_case ↔ JS属性 camelCase 自动映射）
> **软删除**: 所有表包含 `deleted_at` 字段（paranoid: true）
> **最后更新**: 2026-03-18

---

## 目录

1. [users - 用户表](#1-users-用户表)
2. [tasks - 任务表](#2-tasks-任务表)
3. [task_overrides - 重复任务单日覆盖表](#3-task_overrides-重复任务单日覆盖表)
4. [task_completion_records - 任务完成记录表](#4-task_completion_records-任务完成记录表)
5. [task_occurrences - 任务发生记录表](#5-task_occurrences-任务发生记录表)
6. [planning_records - 规划记录表](#6-planning_records-规划记录表)
7. [plan_progress_logs - 规划进度日志表](#7-plan_progress_logs-规划进度日志表)
8. [alarms - 闹钟表](#8-alarms-闹钟表)
9. [alarm_sounds - 闹钟铃声表](#9-alarm_sounds-闹钟铃声表)
10. [holidays - 节假日表](#10-holidays-节假日表)
11. [work_days - 调休工作日表](#11-work_days-调休工作日表)
12. [logs - 日志表](#12-logs-日志表)

---

## 1. users 用户表

**用途**: 存储用户账号信息、人生阶段数据

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 用户唯一ID |
| email | email | VARCHAR(255) | UNIQUE, NOT NULL | 登录邮箱，唯一标识 |
| passwordHash | password_hash | VARCHAR(255) | NOT NULL | bcrypt加密的密码哈希值 |
| nickname | nickname | VARCHAR(50) | NOT NULL | 用户昵称 |
| avatarUrl | avatar_url | VARCHAR(500) | NULL | 头像URL地址 |
| birthDate | birth_date | DATE | NULL | 出生日期，用于人生阶段计算 |
| currentStage | current_stage | VARCHAR(50) | DEFAULT 'qian_long', INDEX | 当前人生阶段（潜龙勿用/见龙在田/...） |
| stageScore | stage_score | INT | DEFAULT 0 | 当前阶段积分 |
| role | role | ENUM('user','admin') | DEFAULT 'user' | 用户角色 |
| isActive | is_active | TINYINT(1) | DEFAULT 1 | 账号是否激活 |
| lastLoginAt | last_login_at | DATETIME | NULL | 最后登录时间 |
| createdAt | created_at | DATETIME | NOT NULL | 账号创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 最后更新时间 |
| deletedAt | deleted_at | DATETIME | NULL, INDEX | 软删除时间（paranoid） |

**索引**:
- PRIMARY KEY (id)
- UNIQUE INDEX (email)
- INDEX (current_stage)
- INDEX (deleted_at)

---

## 2. tasks 任务表

**用途**: 存储所有任务（单日任务、跨天任务、重复任务）

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 任务唯一ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL, INDEX | 所属用户 |
| title | title | VARCHAR(500) | NOT NULL | 任务标题 |
| description | description | TEXT | NULL | 任务描述（富文本） |
| isUrgent | is_urgent | TINYINT(1) | DEFAULT 0 | 是否紧急（时间象限） |
| isImportant | is_important | TINYINT(1) | DEFAULT 0 | 是否重要（时间象限） |
| status | status | ENUM('pending','completed','cancelled') | DEFAULT 'pending', INDEX | 任务状态 |
| completedAt | completed_at | DATETIME | NULL | 完成时间 |
| isAllDay | is_all_day | TINYINT(1) | DEFAULT 1 | 是否全天任务 |
| dateType | date_type | ENUM('single','range','none') | DEFAULT 'single' | 日期类型：单日/跨天/无日期 |
| taskDate | task_date | DATE | NULL | 单日任务日期 |
| startDate | start_date | DATE | NULL | 跨天任务开始日期 |
| endDate | end_date | DATE | NULL | 跨天任务结束日期 |
| startTime | start_time | TIME | NULL | 任务开始时间（非全天） |
| endTime | end_time | TIME | NULL | 任务结束时间（非全天） |
| isRecurring | is_recurring | TINYINT(1) | DEFAULT 0 | 是否为重复任务 |
| rrule | rrule | VARCHAR(500) | NULL | RRULE规则字符串（RFC 5545） |
| rruleUntil | rrule_until | DATE | NULL | 重复任务结束日期 |
| sourceType | source_type | ENUM('manual','from_log','from_plan') | DEFAULT 'manual' | 任务来源 |
| sourceId | source_id | INT UNSIGNED | NULL | 来源ID（log_id或plan_id） |
| planId | plan_id | VARCHAR(50) | NULL, INDEX | 关联的规划ID |
| categoryId | category_id | VARCHAR(50) | NULL | 任务分类ID |
| subtasks | subtasks | JSON | NULL | 子任务列表（JSON数组） |
| exdate | exdate | TEXT | NULL | 例外日期列表（RRULE EXDATE，逗号分隔） |
| parentTaskId | parent_task_id | INT UNSIGNED | NULL, INDEX | 父任务ID（拆分任务来源） |
| splitFromDate | split_from_date | DATE | NULL | 从哪一天拆分出来的 |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |
| deletedAt | deleted_at | DATETIME | NULL, INDEX | 软删除时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (status)
- INDEX (plan_id)
- INDEX (parent_task_id)
- INDEX (deleted_at)

**重要说明**:
- `exdate` 字段存储被删除的重复任务日期（RRULE EXDATE格式）
- `parentTaskId` 用于跟踪任务拆分关系（选项2：修改当天及未来计划）
- `splitFromDate` 记录从哪一天拆分，用于数据追溯

---

## 3. task_overrides 重复任务单日覆盖表

**用途**: 存储重复任务的单日修改记录（RRULE架构核心表）

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 覆盖记录唯一ID |
| taskId | task_id | INT UNSIGNED | FK→tasks.id, NOT NULL, INDEX | 原始任务ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL, INDEX | 所属用户 |
| overrideDate | override_date | DATE | NOT NULL | 覆盖日期（哪一天被修改） |
| isDeleted | is_deleted | TINYINT(1) | DEFAULT 0 | 是否删除该日任务 |
| title | title | VARCHAR(500) | NULL | 覆盖后的标题 |
| description | description | TEXT | NULL | 覆盖后的描述 |
| isUrgent | is_urgent | TINYINT(1) | NULL | 覆盖后的紧急程度 |
| isImportant | is_important | TINYINT(1) | NULL | 覆盖后的重要程度 |
| startTime | start_time | TIME | NULL | 覆盖后的开始时间 |
| endTime | end_time | TIME | NULL | 覆盖后的结束时间 |
| isAllDay | is_all_day | TINYINT(1) | NULL | 覆盖后的全天标志 |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (task_id)
- INDEX (user_id)
- UNIQUE INDEX (task_id, override_date) - 防止重复覆盖

**重要说明**:
- 此表用于实现"选项3：只更新当天计划"功能
- `isDeleted=1` 表示该日任务被删除（软删除）
- 字段为NULL表示该字段未被覆盖，使用原任务值

---

## 4. task_completion_records 任务完成记录表

**用途**: 记录任务的完成情况（支持重复任务的每日打卡）

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 记录唯一ID |
| taskId | task_id | INT UNSIGNED | FK→tasks.id, NOT NULL, INDEX | 任务ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL, INDEX | 用户ID |
| completionDate | completion_date | DATE | NOT NULL, INDEX | 完成日期 |
| status | status | ENUM('pending','completed','skipped') | DEFAULT 'pending' | 完成状态 |
| completedAt | completed_at | DATETIME | NULL | 完成时间戳 |
| subtaskCompletion | subtask_completion | JSON | NULL | 子任务完成状态（JSON） |
| note | note | TEXT | NULL | 完成备注 |
| createdAt | created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (task_id)
- INDEX (user_id)
- INDEX (completion_date)
- UNIQUE INDEX (task_id, user_id, completion_date) - 防止重复打卡

**重要说明**:
- 用于重复任务的打卡功能
- `subtaskCompletion` 存储子任务完成情况（JSON格式）

---

## 5. task_occurrences 任务发生记录表

**用途**: 记录重复任务的每次发生实例（已废弃，保留用于数据迁移）

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 记录ID |
| taskId | task_id | INT UNSIGNED | FK→tasks.id, NOT NULL, INDEX | 原始任务ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL | 用户ID |
| occurDate | occur_date | DATE | NOT NULL | 发生日期 |
| occurStartTime | occur_start_time | TIME | NULL | 发生开始时间 |
| occurEndTime | occur_end_time | TIME | NULL | 发生结束时间 |
| status | status | ENUM('pending','completed','skipped') | DEFAULT 'pending' | 状态 |
| completedAt | completed_at | DATETIME | NULL | 完成时间 |
| overrideTitle | override_title | VARCHAR(500) | NULL | 覆盖标题 |
| overrideNote | override_note | TEXT | NULL | 覆盖备注 |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (task_id)

**重要说明**:
- ⚠️ **已废弃**: RRULE架构升级后不再使用此表
- 保留用于数据迁移和历史数据查询
- 新架构使用 `task_overrides` + `task_completion_records` 替代

---

## 6. planning_records 规划记录表

**用途**: 存储7大规划模块的记录（人生/职业/项目/心情/健康/时间/习惯）

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 规划ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL, INDEX | 所属用户 |
| type | type | ENUM | NOT NULL | 规划类型：life/career/project/mood/health/time/habit |
| title | title | VARCHAR(200) | NOT NULL | 规划标题 |
| content | content | TEXT | NULL | 规划内容详情 |
| status | status | ENUM | DEFAULT 'active', INDEX | active/completed/paused/cancelled |
| startDate | start_date | DATE | NULL | 开始日期 |
| endDate | end_date | DATE | NULL | 结束日期 |
| targetScore | target_score | INT | NULL | 目标分值 |
| currentScore | current_score | INT | DEFAULT 0 | 当前分值 |
| relatedStage | related_stage | VARCHAR(50) | NULL | 关联的人生阶段 |
| ichingAdvice | iching_advice | TEXT | NULL | 易经建议（JSON字符串） |
| allowSubtasks | allow_subtasks | TINYINT(1) | DEFAULT 1 | 是否允许子任务 |
| remindConfig | remind_config | JSON | NULL | 提醒配置 |
| progressPct | progress_pct | TINYINT UNSIGNED | DEFAULT 0 | 进度百分比（0-100） |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |
| deletedAt | deleted_at | DATETIME | NULL, INDEX | 软删除时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (status)
- INDEX (deleted_at)

---

## 7. plan_progress_logs 规划进度日志表

**用途**: 记录规划的进度变化历史

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 日志ID |
| planId | plan_id | INT UNSIGNED | FK→planning_records.id, NOT NULL, INDEX | 规划ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL, INDEX | 用户ID |
| progressPct | progress_pct | TINYINT UNSIGNED | NOT NULL | 进度百分比（0-100） |
| note | note | VARCHAR(500) | NULL | 进度备注 |
| logId | log_id | INT UNSIGNED | NULL | 关联的日志ID |
| loggedAt | logged_at | DATETIME | NOT NULL | 记录时间 |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (plan_id)
- INDEX (user_id)

---

## 8. alarms 闹钟表

**用途**: 存储用户设置的闹钟提醒

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 闹钟ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL, INDEX | 所属用户 |
| taskId | task_id | INT UNSIGNED | FK→tasks.id, NULL, INDEX | 关联任务ID |
| soundId | sound_id | INT UNSIGNED | FK→alarm_sounds.id, NULL, INDEX | 铃声ID |
| label | label | VARCHAR(200) | NULL | 闹钟标签 |
| alarmTime | alarm_time | TIME | NOT NULL | 闹钟时间 |
| alarmDate | alarm_date | DATE | NULL | 闹钟日期（单次闹钟） |
| remindBeforeMin | remind_before_min | INT UNSIGNED | DEFAULT 0 | 提前提醒分钟数 |
| repeatType | repeat_type | ENUM | DEFAULT 'none' | none/daily/weekly/custom |
| rrule | rrule | VARCHAR(500) | NULL | 自定义重复规则（RRULE） |
| repeatDays | repeat_days | VARCHAR(20) | NULL | 重复星期（如"1,3,5"） |
| notifyInapp | notify_inapp | TINYINT(1) | DEFAULT 1 | 是否应用内通知 |
| notifyPush | notify_push | TINYINT(1) | DEFAULT 1 | 是否推送通知 |
| isActive | is_active | TINYINT(1) | DEFAULT 1, INDEX | 是否激活 |
| lastTriggeredAt | last_triggered_at | DATETIME | NULL | 最后触发时间 |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |
| deletedAt | deleted_at | DATETIME | NULL | 软删除时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (task_id)
- INDEX (sound_id)
- INDEX (is_active)

---

## 9. alarm_sounds 闹钟铃声表

**用途**: 存储系统预设和用户录制的铃声

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 铃声ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NULL, INDEX | 用户ID（预设铃声为NULL） |
| name | name | VARCHAR(200) | NOT NULL | 铃声名称 |
| type | type | ENUM('preset','recorded') | DEFAULT 'preset', INDEX | preset:预设 / recorded:录制 |
| filePath | file_path | VARCHAR(500) | NOT NULL | 文件路径 |
| durationSec | duration_sec | INT UNSIGNED | DEFAULT 0 | 时长（秒） |
| originalPath | original_path | VARCHAR(500) | NULL | 原始文件路径 |
| trimStartMs | trim_start_ms | INT UNSIGNED | DEFAULT 0 | 裁剪开始位置（毫秒） |
| trimEndMs | trim_end_ms | INT UNSIGNED | NULL | 裁剪结束位置（毫秒） |
| fileSizeBytes | file_size_bytes | INT UNSIGNED | NULL | 文件大小（字节） |
| mimeType | mime_type | VARCHAR(50) | NULL | MIME类型 |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |
| deletedAt | deleted_at | DATETIME | NULL | 软删除时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (type)

---

## 10. holidays 节假日表

**用途**: 存储中国节假日和节气数据

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 节假日ID |
| name | name | VARCHAR(100) | NOT NULL | 节日名称 |
| type | type | ENUM | NOT NULL, INDEX | cn_solar:阳历 / cn_lunar:农历 / western:西方节日 / intl:国际节日 / solar_term:节气 |
| month | month | TINYINT UNSIGNED | NULL, INDEX | 阳历月份（1-12） |
| day | day | TINYINT UNSIGNED | NULL | 阳历日期（1-31） |
| lunarMonth | lunar_month | TINYINT UNSIGNED | NULL, INDEX | 农历月份（1-12） |
| lunarDay | lunar_day | TINYINT UNSIGNED | NULL | 农历日期（1-30） |
| isLeapMonth | is_leap_month | TINYINT(1) | DEFAULT 0 | 是否闰月 |
| specialRule | special_rule | VARCHAR(100) | NULL | 特殊规则（如"清明:solar_term"） |
| color | color | VARCHAR(7) | DEFAULT '#FF4444' | 显示颜色（16进制） |
| description | description | VARCHAR(500) | NULL | 节日描述 |
| isActive | is_active | TINYINT(1) | DEFAULT 1 | 是否启用 |

**索引**:
- PRIMARY KEY (id)
- INDEX (type)
- INDEX (month)
- INDEX (lunar_month)

**重要说明**:
- 节气使用 `specialRule` 字段标记
- 农历节日需要动态计算阳历日期

---

## 11. work_days 调休工作日表

**用途**: 存储国家法定节假日和调休工作日

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 记录ID |
| date | date | DATE | NOT NULL, UNIQUE | 日期 |
| type | type | ENUM('holiday','workday') | NOT NULL | holiday:法定假日 / workday:调休工作日 |
| year | year | SMALLINT UNSIGNED | NOT NULL, INDEX | 年份（用于查询） |
| holidayName | holiday_name | VARCHAR(50) | NULL | 假日名称（如"春节"） |
| remark | remark | VARCHAR(200) | NULL | 备注说明 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE INDEX (date)
- INDEX (year)

**重要说明**:
- 用于日历显示和工作日计算
- 需要每年更新数据

---

## 12. logs 日志表

**用途**: 存储用户的各类日志记录（笔记、灵感、事件等）

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 日志ID |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL, INDEX | 用户ID |
| title | title | VARCHAR(500) | NULL | 日志标题 |
| content | content | TEXT | NOT NULL | 日志内容 |
| logType | log_type | ENUM | DEFAULT 'note', INDEX | note:笔记 / inspiration:灵感 / event:事件 / plan_update:规划更新 |
| moodLevel | mood_level | TINYINT UNSIGNED | NULL | 心情等级（1-5） |
| tags | tags | JSON | NULL | 标签列表 |
| logTime | log_time | DATETIME | NOT NULL | 日志时间 |
| logDate | log_date | DATE | NOT NULL | 日志日期 |
| planId | plan_id | INT UNSIGNED | FK→planning_records.id, NULL, INDEX | 关联规划ID |
| taskId | task_id | INT UNSIGNED | FK→tasks.id, NULL, INDEX | 关联任务ID |
| convertedToTask | converted_to_task | TINYINT(1) | DEFAULT 0 | 是否已转为任务 |
| convertedTaskId | converted_task_id | INT UNSIGNED | NULL | 转换的任务ID |
| attachments | attachments | JSON | NULL | 附件列表（JSON数组） |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |
| deletedAt | deleted_at | DATETIME | NULL, INDEX | 软删除时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (log_type)
- INDEX (plan_id)
- INDEX (task_id)
- INDEX (deleted_at)

---

## 关联关系图

```
users (1) ─┬─ (N) tasks
           ├─ (N) planning_records
           ├─ (N) alarms
           ├─ (N) alarm_sounds (recorded)
           └─ (N) logs

tasks (1) ─┬─ (N) task_overrides
          ├─ (N) task_completion_records
          ├─ (N) task_occurrences (废弃)
          ├─ (N) alarms
          └─ (N) tasks (parent_task_id, 自关联)

planning_records (1) ─┬─ (N) plan_progress_logs
                      └─ (N) logs

alarm_sounds (1) ─── (N) alarms
```

---

## RRULE架构核心表（2026-03-17升级）

**重复任务系统使用以下表**:

1. **tasks** - 存储任务规则（rrule、exdate、rrule_until）
2. **task_overrides** - 存储单日覆盖记录（选项3：只更新当天）
3. **task_completion_records** - 存储完成记录（打卡功能）

**优先级流程** (taskService.getTasksByDate):
```
1. 计算RRULE发生日期（排除EXDATE）
2. 查询task_overrides（单日覆盖）
3. 应用覆盖字段（优先级2）
4. 使用默认任务规则（优先级3）
```

**六种核心操作**:
- 操作1：修改当天 → 创建task_overrides记录
- 操作2：修改未来 → 修改tasks.rrule_until + 创建新任务
- 操作3：修改全部 → 直接修改tasks记录
- 操作4：删除当天 → task_overrides.is_deleted=1
- 操作5：删除全部 → tasks.deleted_at
- 操作6：删除未来 → 修改tasks.rrule_until

**相关文档**:
- 设计原则: `docs/02-技术设计/任务系统设计理论/阶段一、重复任务系统设计原则.md`
- 核心结构: `docs/02-技术设计/任务系统设计理论/阶段三、统一设计思路的核心结构.md`
- 执行方案: `docs/02-技术设计/任务系统设计理论/阶段四、RRULE架构完善执行方案.md`

---

## 废弃表说明

### task_occurrences
- **状态**: ⚠️ 已废弃（2026-03-17）
- **原因**: RRULE架构升级，改为实时计算 + task_overrides覆盖模式
- **保留**: 用于数据迁移和历史数据查询
- **替代**: task_overrides + task_completion_records

---

## 字段命名规范

**数据库字段** (snake_case):
```sql
user_id, created_at, password_hash, is_active
```

**Sequelize Model** (camelCase，自动映射):
```javascript
userId, createdAt, passwordHash, isActive
```

**前端代码** (camelCase):
```javascript
userId, createdAt, passwordHash, isActive
```

**Sequelize配置**:
```javascript
{
  underscored: true,  // 自动转换 snake_case ↔ camelCase
  paranoid: true,     // 软删除
  timestamps: true    // created_at, updated_at
}
```

---

**文档版本**: v2.0
**最后更新**: 2026-03-18
**更新者**: Claude Sonnet 4.5
