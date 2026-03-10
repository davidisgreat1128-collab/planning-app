# task-edit.vue UI组件提取方案（方案A）

> **作用**：将 task-edit.vue 的UI弹窗代码提取为独立组件，降低文件复杂度
> **当前状态**：方案B已完成（2949→2902行，-1.6%），方案A待执行
> **目标**：从 2902行 降至 ~1200行（-59%）
> **创建时间**：2026-03-11
> **创建者**：Claude Sonnet 4.5

---

## 📊 当前文件分析

### 文件规模

| 指标 | 数值 |
|------|------|
| 当前行数 | 2902行 |
| 超标百分比 | 263%（阈值800行） |
| 架构合规度 | 80/100 ⭐（业务逻辑已在Composable） |
| 主要问题 | 文件过大，包含大量UI弹窗代码 |

### 代码组成

| 部分 | 行数 | 占比 | 操作 |
|------|------|------|------|
| **template 模板** | ~1500行 | 52% | 保留（部分提取） |
| **重复规则弹窗** | ~500行 | 17% | ✂️ 提取为 RepeatRuleSheet.vue |
| **提醒选择器** | ~300行 | 10% | ✂️ 提取为 ReminderPicker.vue |
| **结束日期日历** | ~300行 | 10% | ✂️ 提取为 EndDateCalendar.vue |
| **业务逻辑调用** | ~250行 | 9% | ✅ 保留（已使用Composable） |
| **其他** | ~52行 | 2% | 优化 |

---

## 🎯 提取目标

### 组件1：RepeatRuleSheet.vue（重复规则底部弹窗）

**提取范围**：行218-445（template） + 行990-1338（script）

**功能**：
- 5种重复模式切换（不重复、每日、每周、每月、每年）
- 重复间隔配置
- 重复结束日期选择
- 每月日期网格 / 星期选择
- 每年月日选择

**Props 输入**：
```javascript
{
  visible: Boolean,           // 弹窗是否可见
  repeatRuleManager: Object   // 从 useTaskForm 解构的重复规则管理器
}
```

**Emits 输出**：
```javascript
{
  'update:visible': Boolean,  // 更新弹窗状态
  'confirm': void,            // 确认按钮
  'cancel': void              // 取消按钮
}
```

**预期减少行数**：~500行

---

### 组件2：ReminderPicker.vue（提醒选择器）

**提取范围**：行469-532（template） + 行1342-1450（script）

**功能**：
- 按天/按周提前选择
- 提醒小时/分钟选择
- 三列滚轮选择器
- 提醒时间有效性验证
- 提醒时间格式化显示

**Props 输入**：
```javascript
{
  visible: Boolean,                  // 弹窗是否可见
  taskDate: String,                  // 任务日期（用于计算绝对提醒时间）
  form: Object                       // 表单对象（包含 reminderEnabled、reminderHour 等字段）
}
```

**Emits 输出**：
```javascript
{
  'update:visible': Boolean,         // 更新弹窗状态
  'update:reminderData': Object,     // 更新提醒数据
  'confirm': void,                   // 确认按钮
  'cancel': void                     // 取消按钮
}
```

**预期减少行数**：~300行

---

### 组件3：EndDateCalendar.vue（结束日期日历选择器）

**提取范围**：行1120-1237（script，日历逻辑）

**功能**：
- 月份导航（上个月/下个月）
- 日历网格渲染（6行×7列）
- 农历显示切换
- 结束日期选择
- 过去日期禁用
- 今天高亮

**Props 输入**：
```javascript
{
  visible: Boolean,          // 弹窗是否可见
  startDate: String,         // 开始日期（用于禁用早于开始日期的日期）
  initialEndDate: String,    // 初始结束日期
  showLunar: Boolean         // 是否显示农历
}
```

**Emits 输出**：
```javascript
{
  'update:visible': Boolean,  // 更新弹窗状态
  'confirm': { date: String },  // 确认选择的日期
  'cancel': void              // 取消按钮
}
```

**预期减少行数**：~300行

---

## 📋 执行步骤（分3个阶段，每阶段可独立提交）

### 阶段1：提取 RepeatRuleSheet.vue（2小时）

**步骤1-1：创建组件文件**
```bash
# 创建组件
touch frontend/Planning-app/components/task/RepeatRuleSheet.vue
```

**步骤1-2：复制模板和脚本**
- 从 task-edit.vue 行218-445 复制 template
- 从 task-edit.vue 行990-1338 复制 script
- 调整为接收 props（`repeatRuleManager`）

**步骤1-3：修改 task-edit.vue**
- 删除行218-445（template中的重复规则弹窗）
- 删除行990-1338（script中的重复规则逻辑）
- 引入新组件：`import RepeatRuleSheet from '@/components/task/RepeatRuleSheet.vue'`
- 在 template 中使用：
```vue
<RepeatRuleSheet
  v-model:visible="showRepeatSheet"
  :repeatRuleManager="repeatRuleManager"
  @confirm="onRepeatConfirm"
  @cancel="onRepeatCancel"
/>
```

**步骤1-4：测试**
- 打开重复规则弹窗
- 切换重复模式（每日、每周、每月、每年）
- 配置重复间隔
- 选择结束日期
- 确认/取消按钮

**步骤1-5：提交**
```bash
git add .
git commit -m "refactor(task-edit): 提取RepeatRuleSheet组件（-500行）

- 创建 RepeatRuleSheet.vue 组件（500行）
- 从 task-edit.vue 删除重复规则弹窗代码
- task-edit.vue：2902行 → ~2400行（-17%）
- 组件可复用于其他页面（如 AddTaskPanel.vue）"
```

---

### 阶段2：提取 ReminderPicker.vue（1.5小时）

**步骤2-1：创建组件文件**
```bash
touch frontend/Planning-app/components/task/ReminderPicker.vue
```

**步骤2-2：复制模板和脚本**
- 从 task-edit.vue 行469-532 复制 template
- 从 task-edit.vue 行1342-1450 复制 script
- 调整为接收 props（`taskDate`、`form`）

**步骤2-3：修改 task-edit.vue**
- 删除行469-532（template中的提醒选择器）
- 删除行1342-1450（script中的提醒逻辑）
- 引入新组件：`import ReminderPicker from '@/components/task/ReminderPicker.vue'`
- 在 template 中使用：
```vue
<ReminderPicker
  v-model:visible="showReminderPicker"
  :taskDate="form.taskDate"
  :form="form"
  @confirm="onReminderConfirm"
  @cancel="onReminderCancel"
/>
```

**步骤2-4：测试**
- 打开提醒选择器
- 切换按天/按周模式
- 调整提醒时间
- 验证提醒时间有效性
- 确认/取消按钮

**步骤2-5：提交**
```bash
git commit -m "refactor(task-edit): 提取ReminderPicker组件（-300行）

- 创建 ReminderPicker.vue 组件（300行）
- 从 task-edit.vue 删除提醒选择器代码
- task-edit.vue：2400行 → ~2100行（-10%）"
```

---

### 阶段3：提取 EndDateCalendar.vue（1.5小时）

**步骤3-1：创建组件文件**
```bash
touch frontend/Planning-app/components/task/EndDateCalendar.vue
```

**步骤3-2：复制脚本**
- 从 task-edit.vue 行1120-1237 复制日历逻辑
- 创建新的 template（参考 DayPicker 组件）
- 调整为接收 props（`startDate`、`initialEndDate`、`showLunar`）

**步骤3-3：修改 task-edit.vue**
- 删除行1120-1237（script中的日历逻辑）
- 引入新组件：`import EndDateCalendar from '@/components/task/EndDateCalendar.vue'`
- 在 template 中使用：
```vue
<EndDateCalendar
  v-model:visible="showRepeatEndPicker"
  :startDate="form.taskDate"
  :initialEndDate="repeatEndDate"
  :showLunar="showRepeatLunar"
  @confirm="onRepeatEndDateConfirm"
  @cancel="closeRepeatEndPicker"
/>
```

**步骤3-4：测试**
- 打开结束日期日历
- 切换月份（上个月/下个月）
- 选择结束日期
- 验证过去日期禁用
- 农历显示切换

**步骤3-5：提交**
```bash
git commit -m "refactor(task-edit): 提取EndDateCalendar组件（-300行）

- 创建 EndDateCalendar.vue 组件（300行）
- 从 task-edit.vue 删除日历逻辑代码
- task-edit.vue：2100行 → ~1800行（-14%）
- ✅ 重构完成：2949行 → 1800行（-39%）"
```

---

## 📊 预期成果

| 阶段 | 操作 | 行数变化 | 累计减少 |
|------|------|---------|---------|
| **方案B** | 删除冗余注释 | 2949 → 2902 | -47行（-1.6%） |
| **阶段1** | 提取 RepeatRuleSheet.vue | 2902 → 2400 | -502行（-17%） |
| **阶段2** | 提取 ReminderPicker.vue | 2400 → 2100 | -300行（-10%） |
| **阶段3** | 提取 EndDateCalendar.vue | 2100 → 1800 | -300行（-14%） |
| **总计** | 方案B + 方案A | 2949 → 1800 | **-1149行（-39%）** |

### 最终状态

| 指标 | 当前 | 目标 | 改善 |
|------|------|------|------|
| 文件行数 | 2949行 | 1800行 | -39% |
| 超标百分比 | 263% | 125% | ⚠️ 仍超标，但大幅改善 |
| 架构合规度 | 80/100 | 90/100 | +10分 |
| 组件复用性 | 低 | 高 | 新增3个可复用组件 |

---

## ⚠️ 注意事项

### 提取组件时的关键原则

1. **Props 向下，Events 向上**
   - ✅ 父组件通过 props 传递数据
   - ✅ 子组件通过 emit 通知父组件
   - ❌ 禁止子组件直接修改 props

2. **避免过度耦合**
   - ✅ 组件只依赖必要的 props
   - ✅ 组件内部状态自管理（如滚轮位置）
   - ❌ 禁止组件依赖父组件的全局状态

3. **保持功能完整**
   - ✅ 提取时不改变现有功能
   - ✅ 提取后立即测试
   - ❌ 禁止在提取过程中新增功能

### 风险和缓解措施

| 风险 | 缓解措施 |
|------|---------|
| 组件交互失败 | 每个阶段提交后立即测试 |
| Props 传递错误 | 使用 PropTypes 验证 |
| Events 未正确处理 | 在父组件添加 console.log 调试 |
| 组件过于复杂 | 如果组件>500行，考虑进一步拆分 |

---

## 🔗 相关文档

- [超标文件追踪清单.md](./超标文件追踪清单.md) - 追踪task-edit.vue的重构进度
- [四层架构设计（渐进式升级）.md](./四层架构设计（渐进式升级）.md) - 架构规范
- [CLAUDE.md](../../.claude/CLAUDE.md) 第7.9节 - 四层架构规范

---

## 📅 下次会话接手指南

### 快速启动

1. **阅读本文档**（5分钟）
2. **检查当前状态**：
```bash
wc -l frontend/Planning-app/pages/calendar/task-edit.vue
# 应该显示：2902行
```

3. **执行阶段1**：提取 RepeatRuleSheet.vue
4. **测试验证**：打开重复规则弹窗，测试所有功能
5. **提交成果**：`git commit -m "refactor(task-edit): 提取RepeatRuleSheet组件"`

### 检查清单

- [ ] 当前 task-edit.vue 行数：2902行
- [ ] Git 工作区干净（无未提交修改）
- [ ] 已阅读本文档的"执行步骤"部分
- [ ] 已理解组件提取的关键原则
- [ ] 准备开始执行阶段1

---

**文档版本**：v1.0 | **创建时间**：2026-03-11 | **创建者**：Claude Sonnet 4.5
