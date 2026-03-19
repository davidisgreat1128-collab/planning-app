# 备份文件清单

> **作用**: 追踪所有备份文件的状态、目的、关联重构任务
> **更新规则**: Claude每次创建备份文件时必须在此登记
> **最后更新**: 2026-03-10
> **更新者**: Claude Sonnet 4.5

---

## 🔴 进行中的备份（对应未完成的重构）

| 备份文件 | 源文件 | 备份日期 | 备份目的 | 重构状态 | 关联文档 |
|---------|--------|---------|---------|---------|---------|
| `pages/calendar/task-edit.vue.backup-20260311-重构前-进行中.vue` | `pages/calendar/task-edit.vue` | 2026-03-11 | 按四层架构重构：迁移业务逻辑到Composable层 | 🔧 进行中（2949行→目标1800行） | [超标文件追踪清单.md](../docs/02-技术设计/超标文件追踪清单.md) |

**说明**:
- task-edit.vue（2949行）正在执行新的架构重构方案，目标减少39%代码量
- 分5个阶段执行：数据模型构建、RRULE逻辑、Reminder逻辑、工具函数、清理优化

---

## 🟢 已完成的备份（重构已完成，可考虑删除）

| 备份文件 | 源文件 | 备份日期 | 备份目的 | 重构结果 | 删除日期 |
|---------|--------|---------|---------|---------|---------|
| `pages/calendar/index.vue.backup-20260307-Phase3重构前-已完成.vue` | `pages/calendar/index.vue` | 2026-03-07 | Phase 3重构前的备份（3802行） | ✔️ 已完成（3802→789行，-79%） | 待定 |

**说明**:
- index.vue 的 Phase 3 重构已完成，当前文件大小 789行（符合<800行标准）
- 备份文件原位于项目根目录，已移动到 `backups/pages/calendar/` 并重命名
- 建议保留1-2周，验证无问题后可删除

---

## 🗑️ 已废弃的备份（可安全删除）

| 备份文件 | 删除日期 | 删除原因 |
|---------|---------|---------|
| `frontend/Planning-app/store/category.js.backup` | 2026-03-19 | 未登记的违规备份（存放在源代码目录），已删除 |
| `CHANGELOG.md.bak` | 2026-03-19 | 过期备份，当前版本正常使用中，已删除 |
| `frontend/Planning-app/pages/planning/template/detail_old.vue` | 2026-03-19 | 废弃页面（912行），新版本detail.vue正常使用中，已删除 |

---

## 📋 备份文件使用规则

### Claude 如何使用备份文件

**1. 创建备份时**：
```
步骤1：判断是否需要备份
  - 文件超过1000行 + 重构 → 必须备份
  - 复杂重构（预计改动>500行） → 必须备份
  - 简单修改（<100行） → 不需要备份（Git历史足够）

步骤2：创建backups目录（如果不存在）
  mkdir -p backups/<源文件相对路径>

步骤3：复制文件并重命名
  格式：<原文件名>.backup-<YYYYMMDD>-<目的>-<状态>.<扩展名>
  示例：cp pages/calendar/task-edit.vue backups/pages/calendar/task-edit.vue.backup-20260310-迁移save函数前-进行中.vue

步骤4：在本文件（backups/README.md）中登记
  - 在"进行中的备份"表格中新增一行
  - 填写：备份文件、源文件、日期、目的、状态、关联文档

步骤5：Git commit 记录备份操作
  git add backups/
  git commit -m "backup(<模块>): 创建<文件名>备份（<目的>）"
```

**2. 读取代码时**：
```
❌ 禁止：读取 backups/ 目录中的文件作为当前代码
✅ 正确：只读取源代码目录中的文件（如 pages/、components/）

如果需要查看历史版本：
  方法1：使用 Git 查看历史 commit（推荐）
  方法2：明确告知用户"需要查看备份文件"，经用户确认后再读取
```

**3. 重构完成后**：
```
步骤1：更新本文件（backups/README.md）
  - 将对应备份从"进行中"移到"已完成"
  - 更新重构结果（如：3802行→789行）
  - 填写完成时间

步骤2：询问用户是否删除备份
  格式："✅ <文件名> 重构已完成（<原行数>→<现行数>），是否删除备份文件？
  建议：重构完成后保留1-2周，验证无问题后删除"

步骤3：用户确认后删除
  rm backups/<备份文件>
  在本文件的"已废弃"区域记录删除日期和原因
```

---

### 唐伯虎如何使用备份文件

**查看备份状态**：
```bash
# 查看所有备份文件
cat backups/README.md

# 查看进行中的重构（对应的备份）
# 在本文件的"进行中的备份"表格中查看
```

**恢复备份**（如果重构失败）：
```bash
# 从备份恢复源文件
cp backups/pages/calendar/task-edit.vue.backup-20260308-提取组件前-进行中.vue pages/calendar/task-edit.vue

# 提交恢复操作
git add pages/calendar/task-edit.vue
git commit -m "revert(task): 从备份恢复task-edit.vue（重构失败）"
```

**定期清理**：
```bash
# 查看backups目录大小
du -sh backups/

# 删除单个备份文件
rm backups/pages/calendar/index.vue.backup-20260307-Phase3重构前-已完成.vue

# 删除后在本文件中记录
```

---

## ⚠️ 重要提醒

### 备份文件命名规范

**格式**: `<原文件名>.backup-<日期>-<目的>-<状态>.<扩展名>`

**示例**:
```
✅ 正确命名：
  index.vue.backup-20260307-Phase3重构前-已完成.vue
  task-edit.vue.backup-20260308-提取组件前-进行中.vue

❌ 错误命名：
  index.vue.backup（缺少日期和目的）
  task-edit.bak（非标准扩展名）
```

### 备份文件存放位置

**规则**:
- ✅ 所有备份文件必须存放在 `backups/` 目录
- ❌ 禁止在源代码目录（pages/、components/）中存放备份文件

**目录结构**:
```
backups/
├── pages/
│   └── calendar/
│       └── index.vue.backup-20260307-Phase3重构前-已完成.vue
├── components/
│   └── task/
│       └── (待添加)
└── README.md (本文件)
```

---

## 📊 统计信息

- **进行中的备份**: 1个（task-edit.vue）
- **已完成的备份**: 1个（index.vue）
- **已废弃的备份**: 3个（已于2026-03-19删除）
- **backups/ 目录大小**: 432KB

**检查命令**:
```bash
# 统计备份文件数量
find backups/ -name "*.backup-*.vue" | wc -l

# 查看backups目录大小
du -sh backups/
```

---

## 🔗 相关文档

- [备份文件管理规范.md](../docs/02-技术设计/备份文件管理规范.md) - 完整的备份文件管理规范
- [重构状态追踪清单.md](../docs/02-技术设计/重构状态追踪清单.md) - 追踪重构工作的完成状态
- [超标文件追踪清单.md](../docs/02-技术设计/超标文件追踪清单.md) - 追踪超标文件的拆分进度
- [CLAUDE.md](../.claude/CLAUDE.md) 第7.11节 - Claude AI协作指南中的备份管理规范

---

**文档版本**: v1.0 | **创建时间**: 2026-03-10 | **创建者**: Claude Sonnet 4.5
