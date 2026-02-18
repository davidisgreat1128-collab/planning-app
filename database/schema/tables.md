# 数据库表设计文档

> 数据库: `planning_app_dev` / `planning_app_prod`
> 字符集: `utf8mb4` / `utf8mb4_unicode_ci`
> 时区: `+08:00`
> ORM: Sequelize v6，`underscored: true`（DB字段 snake_case ↔ JS属性 camelCase 自动映射）
> 软删除: 所有表包含 `deleted_at` 字段（paranoid: true）

---

## 1. users 用户表

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 主键 |
| email | email | VARCHAR(255) | UNIQUE, NOT NULL | 登录邮箱 |
| passwordHash | password_hash | VARCHAR(255) | NOT NULL | bcrypt哈希密码 |
| nickname | nickname | VARCHAR(50) | NOT NULL | 昵称 |
| avatarUrl | avatar_url | VARCHAR(500) | NULL | 头像URL |
| birthDate | birth_date | DATE | NULL | 出生日期（用于人生阶段计算） |
| currentStage | current_stage | VARCHAR(50) | DEFAULT 'qian_long' | 当前人生阶段 |
| stageScore | stage_score | INT | DEFAULT 0 | 阶段积分 |
| role | role | ENUM('user','admin') | DEFAULT 'user' | 用户角色 |
| isActive | is_active | TINYINT(1) | DEFAULT 1 | 是否激活 |
| lastLoginAt | last_login_at | DATETIME | NULL | 最后登录时间 |
| createdAt | created_at | DATETIME | NOT NULL | 创建时间 |
| updatedAt | updated_at | DATETIME | NOT NULL | 更新时间 |
| deletedAt | deleted_at | DATETIME | NULL | 软删除时间 |

---

## 2. planning_records 规划记录表

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 主键 |
| userId | user_id | INT UNSIGNED | FK→users.id, NOT NULL | 所属用户 |
| type | type | ENUM(...) | NOT NULL | 规划类型(life/career/project/mood/health/time/habit) |
| title | title | VARCHAR(200) | NOT NULL | 规划标题 |
| content | content | TEXT | NULL | 规划内容详情 |
| status | status | ENUM(...) | DEFAULT 'active' | 状态(active/completed/paused/cancelled) |
| startDate | start_date | DATE | NULL | 开始日期 |
| endDate | end_date | DATE | NULL | 结束日期 |
| targetScore | target_score | INT | NULL | 目标分值 |
| currentScore | current_score | INT | DEFAULT 0 | 当前分值 |
| relatedStage | related_stage | VARCHAR(50) | NULL | 关联的人生阶段 |
| ichingAdvice | iching_advice | TEXT | NULL | 易经建议（JSON字符串） |
| createdAt | created_at | DATETIME | NOT NULL | |
| updatedAt | updated_at | DATETIME | NOT NULL | |
| deletedAt | deleted_at | DATETIME | NULL | |

---

## 3. iching_hexagrams 卦象表（初始化数据，64条）

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK | 主键（1-64） |
| code | code | VARCHAR(10) | UNIQUE, NOT NULL | 卦的编号（如 01, 02...） |
| name | name | VARCHAR(20) | NOT NULL | 卦名（如 乾、坤） |
| chineseName | chinese_name | VARCHAR(50) | NOT NULL | 全名（如 乾为天） |
| symbol | symbol | VARCHAR(10) | NOT NULL | 符号（如 ☰） |
| upperTrigram | upper_trigram | VARCHAR(20) | NOT NULL | 上卦 |
| lowerTrigram | lower_trigram | VARCHAR(20) | NOT NULL | 下卦 |
| description | description | TEXT | NULL | 卦辞 |
| judgment | judgment | TEXT | NULL | 彖辞 |
| image | image | TEXT | NULL | 象辞 |
| planningAdvice | planning_advice | JSON | NULL | 各规划类型建议 |
| favorableStages | favorable_stages | JSON | NULL | 适合的人生阶段列表 |
| createdAt | created_at | DATETIME | NOT NULL | |
| updatedAt | updated_at | DATETIME | NOT NULL | |

---

## 4. divination_records 占卜记录表

| 字段 | DB列名 | 类型 | 约束 | 说明 |
|------|--------|------|------|------|
| id | id | INT UNSIGNED | PK, AUTO_INCREMENT | 主键 |
| userId | user_id | INT UNSIGNED | FK→users.id | 用户 |
| question | question | VARCHAR(500) | NOT NULL | 所问事项 |
| method | method | ENUM('random','birthday','manual') | DEFAULT 'random' | 起卦方式 |
| hexagramId | hexagram_id | INT UNSIGNED | FK→iching_hexagrams.id | 得到的卦 |
| changingHexagramId | changing_hexagram_id | INT UNSIGNED | FK→iching_hexagrams.id | 变卦（可空） |
| lines | lines | JSON | NOT NULL | 六爻数据 |
| interpretation | interpretation | TEXT | NULL | 解卦结果 |
| createdAt | created_at | DATETIME | NOT NULL | |
| updatedAt | updated_at | DATETIME | NOT NULL | |
| deletedAt | deleted_at | DATETIME | NULL | |

---

## 关联关系

```
users (1) ─── (N) planning_records
users (1) ─── (N) divination_records
iching_hexagrams (1) ─── (N) divination_records [hexagramId]
iching_hexagrams (1) ─── (N) divination_records [changingHexagramId]
```
