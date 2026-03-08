# useTaskForm 迁移计划 - 分阶段可交接方案

**文档性质**: 企业级重构实施方案
**目标组件**: task-edit.vue (3241行) 与 AddTaskPanel.vue (2598行)
**创建日期**: 2026-03-08
**作者**: Claude Sonnet 4.5
**文档版本**: v1.0

---

## 📋 文档目录

1. [执行摘要](#1-执行摘要)
2. [重构目标与收益](#2-重构目标与收益)
3. [分阶段实施计划](#3-分阶段实施计划)
4. [迁移前准备工作](#4-迁移前准备工作)
5. [阶段1：迁移 task-edit.vue 基础部分](#5-阶段1迁移-task-editvue-基础部分)
6. [阶段2：迁移 task-edit.vue 高级功能](#6-阶段2迁移-task-editvue-高级功能)
7. [阶段3：迁移 AddTaskPanel.vue](#7-阶段3迁移-addtaskpanelvue)
8. [测试验收标准](#8-测试验收标准)
9. [风险控制与回滚方案](#9-风险控制与回滚方案)
10. [Claude 账号切换检查点](#10-claude-账号切换检查点)

---

## 1. 执行摘要

### 1.1 项目背景

根据《task-edit与AddTaskPanel功能重叠架构评估报告》，两个组件存在严重的代码重复问题：

| 指标 | task-edit.vue | AddTaskPanel.vue |
|------|---------------|------------------|
| 文件行数 | 3241行 | 2598行 |
| 超标比例 | 305% | 225% |
| 功能重叠度 | 85% | 85% |
| 健康评分 | 28/100 | 32/100 |

### 1.2 解决方案

已完成 `composables/useTaskForm.js`（850行），提取了85%的重复业务逻辑。

本方案将分3个阶段逐步迁移两个组件使用 `useTaskForm`，确保每个阶段都可以：
- ✅ 独立测试验收
- ✅ 安全回滚
- ✅ 支持 Claude 账号切换

### 1.3 预期收益

| 收益指标 | 重构前 | 重构后 | 改善幅度 |
|---------|--------|--------|---------|
| task-edit.vue 行数 | 3241行 | ~1200行 | ⬇️ 63% |
| AddTaskPanel.vue 行数 | 2598行 | ~1000行 | ⬇️ 62% |
| 代码重复率 | 85% | <5% | ⬇️ 94% |
| 健康评分 | 30/100 | 75/100 | ⬆️ 150% |

---

## 2. 重构目标与收益

### 2.1 核心目标

1. **消除代码重复** - 将85%的重复业务逻辑迁移到 `useTaskForm`
2. **遵循三层架构** - Component → Composable → Store → Repository
3. **提升可维护性** - 修改一处生效全局，减少Bug遗漏
4. **提升可测试性** - 业务逻辑可单独测试

### 2.2 技术收益

**开发效率提升**：
- 新增任务表单场景时，直接复用 `useTaskForm`，节省80%开发时间
- Bug修复时，修改一处生效全局，减少90%遗漏

**代码质量提升**：
- 业务逻辑独立于UI组件，职责单一
- 完整的类型注释和文档，降低理解成本
- 支持单元测试，提升代码可靠性

---

## 3. 分阶段实施计划

### 3.1 总体策略

采用**渐进式迁移**策略，分3个阶段逐步完成：

```
阶段1: task-edit.vue 基础部分（2-3小时）
  ├── 迁移表单数据管理
  ├── 迁移子计划管理
  └── 迁移日期管理
  → 完成后测试验收 → 提交Git → 可切换Claude

阶段2: task-edit.vue 高级功能（2-3小时）
  ├── 迁移四象限管理
  ├── 迁移重复规则管理
  └── 迁移提交/保存逻辑
  → 完成后测试验收 → 提交Git → 可切换Claude

阶段3: AddTaskPanel.vue 迁移（2-3小时）
  ├── 参照 task-edit.vue 迁移经验
  ├── 保留面板特有逻辑
  └── 复用 useTaskForm 核心逻辑
  → 完成后测试验收 → 提交Git → 完成
```

### 3.2 时间安排

| 阶段 | 预计工时 | 风险等级 | Git Commit数 |
|------|---------|---------|-------------|
| 阶段1 | 2-3小时 | 🟢 低 | 1次 |
| 阶段2 | 2-3小时 | 🟡 中 | 1次 |
| 阶段3 | 2-3小时 | 🟢 低 | 1次 |
| **总计** | **6-9小时** | 🟡 中 | **3次** |

---

## 4. 迁移前准备工作

### 4.1 环境检查清单

在开始迁移前，必须确认：

- [ ] `composables/useTaskForm.js` 已提交到Git（commit: d769371）
- [ ] task-edit.vue 当前版本已备份
- [ ] AddTaskPanel.vue 当前版本已备份
- [ ] 已阅读《三层架构设计.md》第7.9节
- [ ] 已阅读《task-edit与AddTaskPanel功能重叠架构评估报告.md》
- [ ] Git工作区干净（无未提交文件）

### 4.2 创建备份分支

```bash
cd D:\MyProject\Planning-app
git checkout develop
git pull origin develop
git checkout -b backup/before-usetaskform-migration
git push origin backup/before-usetaskform-migration
git checkout develop
```

### 4.3 理解 useTaskForm API

在迁移前，必须理解 `useTaskForm` 提供的API：

**核心状态**：
```javascript
const {
  // 表单数据
  form,              // 表单对象
  subtasks,          // 子计划列表
  activeDateTab,     // 当前激活的日期Tab
  customDate,        // 自定义日期

  // 计算属性
  currentQuadrant,   // 当前四象限
  hasFormChanged,    // 表单是否有变化

  // 方法
  addSubtask,        // 添加子计划
  onDateTab,         // 切换日期Tab
  selectQuadrant,    // 选择四象限
  submit,            // 提交表单
  update,            // 更新任务
  loadFromTask,      // 从任务数据加载
  resetForm          // 重置表单
} = useTaskForm({ mode: 'edit', taskId: 'xxx' })
```

---

## 5. 阶段1：迁移 task-edit.vue 基础部分

### 5.1 目标范围

**本阶段迁移内容**：
1. ✅ 表单数据管理（form, subtasks）
2. ✅ 子计划管理（add/remove/toggle）
3. ✅ 日期Tab管理（today/tomorrow/custom）
4. ✅ 基础工具函数（formatDate, calcDays）

**保留不动**：
- 🔸 UI模板（template部分）
- 🔸 样式（style部分）
- 🔸 弹窗状态管理（show*变量）
- 🔸 四象限、重复规则、提醒等高级功能（阶段2处理）

### 5.2 迁移步骤详解

#### 步骤1.1：引入 useTaskForm（5分钟）

**位置**：task-edit.vue 第672-680行（script setup 顶部）

**操作**：在现有 import 语句后添加：

```javascript
// 现有代码（保留）
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from '@/store/task.js';
import { usePlanStore } from '@/store/plan.js';
import DeleteTaskDialog from '@/components/DeleteTaskDialog.vue';
import DateTabBar from '@/components/task/DateTabBar.vue';
import SubtaskList from '@/components/task/SubtaskList.vue';
import CustomDatePicker from '@/components/task/CustomDatePicker.vue';

// ✅ 新增：引入 useTaskForm
import { useTaskForm } from '@/composables/useTaskForm.js';

// ============================================================
// 初始化 useTaskForm
// ============================================================
const taskFormApi = useTaskForm({
  mode: 'edit',  // 编辑模式
  taskId: null,  // 初始为null，onMounted时会设置
  presetDate: ''
});
```

**验证**：
- 无语法错误
- 页面可以正常打开（即使功能暂未切换）

#### 步骤1.2：替换表单数据引用（15分钟）

**操作**：逐步替换表单数据的定义

**原代码（删除）**：
```javascript
// task-edit.vue 约第877-898行
const form = ref({
  title: '',
  description: '',
  isUrgent: false,
  isImportant: false,
  // ... 其他字段
});

const subtasks = ref([]);
const activeDateTab = ref('today');
const customDate = ref('');
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的响应式状态
const { form, subtasks, activeDateTab, customDate } = taskFormApi;
```

**验证**：
- 运行 `npm run dev`
- 打开任务编辑页面
- 查看控制台，无报错

#### 步骤1.3：替换子计划管理函数（10分钟）

**原代码（删除）**：
```javascript
// task-edit.vue 约第813-831行
function handleAddSubtask(title) {
  subtasks.value.unshift({ title, done: false });
}

function handleRemoveSubtask(index) {
  subtasks.value.splice(index, 1);
}

function handleToggleSubtaskDone(index) {
  subtasks.value[index].done = !subtasks.value[index].done;
}
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的方法
const { addSubtask, removeSubtask, toggleSubtaskDone } = taskFormApi;

// 包装函数（保持与组件事件的兼容性）
function handleAddSubtask(title) {
  addSubtask(title);
}

function handleRemoveSubtask(index) {
  removeSubtask(index);
}

function handleToggleSubtaskDone(index) {
  toggleSubtaskDone(index);
}
```

**验证**：
- 测试添加子计划
- 测试删除子计划
- 测试切换子计划完成状态

#### 步骤1.4：替换日期Tab管理（10分钟）

**原代码（删除）**：
```javascript
// task-edit.vue 约第788-807行
function onDateTab(tab) {
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));

  if (tab === 'today') {
    form.value.taskDate = today;
    activeDateTab.value = 'today';
    customDate.value = '';
  } else if (tab === 'tomorrow') {
    form.value.taskDate = tomorrow;
    activeDateTab.value = 'tomorrow';
    customDate.value = '';
  }
  // ...
}
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的方法
const { onDateTab: onDateTabCore } = taskFormApi;

function onDateTab(tab) {
  if (tab === 'other') {
    // 打开自定义日期选择器（组件特有逻辑）
    openCustomDatePicker();
    return;
  }
  // 其他情况交给 useTaskForm 处理
  onDateTabCore(tab);
}
```

**验证**：
- 测试切换"今天"Tab
- 测试切换"明天"Tab
- 测试点击"其他日期"打开日期选择器

#### 步骤1.5：替换工具函数（5分钟）

**原代码（删除）**：
```javascript
// 删除重复的工具函数定义
function formatDate(date) { ... }
function getWeekdayName(date) { ... }
function calcDays(start, end) { ... }
function timeDiffMinutes(start, end) { ... }
function formatDuration(minutes) { ... }
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的工具函数
const {
  formatDate,
  getWeekdayName,
  calcDays,
  timeDiffMinutes,
  formatDuration
} = taskFormApi;
```

**验证**：
- 检查所有使用这些函数的地方是否正常工作

### 5.3 阶段1测试清单

完成上述步骤后，必须通过以下测试：

- [ ] 打开任务编辑页面，无控制台错误
- [ ] 输入任务标题，正常显示
- [ ] 添加子计划，列表正常更新
- [ ] 删除子计划，列表正常更新
- [ ] 切换子计划完成状态，UI正常响应
- [ ] 切换"今天"Tab，日期正确设置
- [ ] 切换"明天"Tab，日期正确设置
- [ ] 点击"其他日期"，弹窗正常打开
- [ ] 选择自定义日期，日期正确显示

### 5.4 阶段1提交

测试通过后，提交代码：

```bash
git add frontend/Planning-app/pages/calendar/task-edit.vue
git commit -m "refactor(task-edit): 阶段1 - 迁移基础功能到 useTaskForm

迁移内容：
- 表单数据管理（form, subtasks, activeDateTab, customDate）
- 子计划管理（add/remove/toggle）
- 日期Tab管理（onDateTab）
- 工具函数（formatDate, calcDays等）

测试验收：
✅ 任务标题输入正常
✅ 子计划添加/删除/切换状态正常
✅ 日期Tab切换正常
✅ 自定义日期选择正常

下一步：阶段2 - 迁移高级功能

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
```

### 5.5 Claude 账号切换检查点 ✅

**阶段1完成后，可以安全切换 Claude 账号**

**新 Claude 接手时需要做的**：
1. 读取 `.claude/CURRENT_STATUS.md`
2. 读取本文档（找到"阶段2"章节）
3. 确认 Git 最新提交包含"阶段1"字样
4. 继续执行阶段2

---

## 6. 阶段2：迁移 task-edit.vue 高级功能

### 6.1 目标范围

**本阶段迁移内容**：
1. ✅ 四象限管理（selectQuadrant）
2. ✅ 重复规则管理（repeatMode, syncRrule）
3. ✅ 表单提交/更新逻辑（submit, update）
4. ✅ 表单验证逻辑（validateForm）
5. ✅ 表单初始化逻辑（loadFromTask）

**保留不动**：
- 🔸 UI模板（template部分）
- 🔸 样式（style部分）
- 🔸 弹窗状态管理（show*变量）
- 🔸 删除任务逻辑（组件特有）

### 6.2 迁移步骤详解

#### 步骤2.1：替换四象限管理（10分钟）

**原代码（删除）**：
```javascript
// 删除四象限选择函数
function selectQuadrant(quadrant) {
  form.value.isUrgent = quadrant.isUrgent;
  form.value.isImportant = quadrant.isImportant;
}

// 删除四象限计算属性
const currentQuadrant = computed(() => {
  if (form.value.isUrgent && form.value.isImportant) return 'q1';
  // ...
});
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的方法和计算属性
const { selectQuadrant, currentQuadrant } = taskFormApi;
```

**验证**：
- 打开四象限选择器
- 选择不同象限，UI正确响应

#### 步骤2.2：替换重复规则管理（15分钟）

**原代码（删除）**：
```javascript
// 删除重复规则相关状态
const repeatMode = ref('none');
const repeatInterval = ref(1);
const repeatWeekDays = ref([]);
const repeatEndDate = ref('');
const monthlyDays = ref([]);
// ... 其他重复规则状态

// 删除重复规则管理函数
function toggleWeekDay(dayNum) { ... }
function toggleMonthlyDay(day) { ... }
function syncRrule() { ... }
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的状态和方法
const {
  repeatMode,
  repeatInterval,
  repeatWeekDays,
  repeatEndDate,
  monthlyDays,
  monthlySubMode,
  monthlyWeekNum,
  monthlyWeekday,
  yearlyMonth,
  yearlyDay,
  toggleWeekDay,
  toggleMonthlyDay,
  syncRrule
} = taskFormApi;
```

**验证**：
- 打开重复规则弹窗
- 选择"每日"模式，设置间隔
- 选择"每周"模式，选择周几
- 选择"每月"模式，选择日期
- 选择"每年"模式，设置月日
- 设置结束日期

#### 步骤2.3：替换表单提交逻辑（20分钟）

**原代码（删除）**：
```javascript
// 删除保存函数
async function handleSave() {
  // 验证表单
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入任务标题', icon: 'none' });
    return;
  }

  // 组装数据
  const taskData = {
    title: form.value.title,
    // ... 20+个字段
  };

  if (isEdit.value) {
    await taskStore.updateTask(taskId.value, taskData);
  } else {
    await taskStore.createTask(taskData);
  }

  uni.showToast({ title: '保存成功', icon: 'success' });
  uni.navigateBack();
}
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的方法
const { submit, update, validateForm, isEdit } = taskFormApi;

async function handleSave() {
  try {
    if (isEdit.value) {
      await update();
      uni.showToast({ title: '更新成功', icon: 'success' });
    } else {
      await submit();
      uni.showToast({ title: '创建成功', icon: 'success' });
    }
    uni.navigateBack();
  } catch (error) {
    console.error('[task-edit] 保存失败:', error);
    // 错误提示已在 useTaskForm 中处理
  }
}
```

**验证**：
- 创建新任务，点击保存，成功提示并返回
- 编辑已有任务，修改后保存，成功提示
- 空标题保存，显示错误提示

#### 步骤2.4：替换表单初始化逻辑（15分钟）

**原代码（删除）**：
```javascript
// 删除 onMounted 中的数据加载逻辑
onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  if (options.taskId) {
    taskId.value = options.taskId;
    const task = taskStore.tasks.find(t => t.id === options.taskId);
    if (task) {
      form.value.title = task.title;
      form.value.description = task.description;
      // ... 20+个字段赋值
      subtasks.value = task.subtasks || [];
    }
  }

  if (options.date) {
    presetDate.value = options.date;
    form.value.taskDate = options.date;
  }
});
```

**新代码（替换为）**：
```javascript
// ✅ 使用 useTaskForm 提供的方法
const { loadFromTask, resetForm, taskId, presetDate } = taskFormApi;

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  if (options.taskId) {
    // 编辑模式：加载任务数据
    const task = taskStore.tasks.find(t => t.id === options.taskId);
    if (task) {
      loadFromTask(task);
    }
  } else {
    // 创建模式：重置表单
    if (options.date) {
      presetDate.value = options.date;
    }
    resetForm();
  }
});
```

**验证**：
- 从日历页点击已有任务，打开编辑页，数据正确加载
- 从日历页点击"+"按钮，打开创建页，表单为空
- 预设日期参数正确设置

### 6.3 阶段2测试清单

完成上述步骤后，必须通过以下测试：

- [ ] 四象限选择器正常工作
- [ ] 重复规则设置（每日/每周/每月/每年）正常
- [ ] 创建新任务，保存成功
- [ ] 编辑已有任务，更新成功
- [ ] 空标题保存，显示错误提示
- [ ] 编辑模式下，数据正确加载
- [ ] 创建模式下，表单为空
- [ ] 预设日期参数正确设置

### 6.4 阶段2提交

测试通过后，提交代码：

```bash
git add frontend/Planning-app/pages/calendar/task-edit.vue
git commit -m "refactor(task-edit): 阶段2 - 迁移高级功能到 useTaskForm

迁移内容：
- 四象限管理（selectQuadrant, currentQuadrant）
- 重复规则管理（repeatMode, syncRrule等）
- 表单提交逻辑（submit, update）
- 表单验证逻辑（validateForm）
- 表单初始化逻辑（loadFromTask, resetForm）

测试验收：
✅ 四象限选择正常
✅ 重复规则设置正常
✅ 创建任务保存成功
✅ 编辑任务更新成功
✅ 表单验证正常
✅ 数据加载正常

下一步：阶段3 - 迁移 AddTaskPanel.vue

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
```

### 6.5 Claude 账号切换检查点 ✅

**阶段2完成后，可以安全切换 Claude 账号**

**新 Claude 接手时需要做的**：
1. 读取 `.claude/CURRENT_STATUS.md`
2. 读取本文档（找到"阶段3"章节）
3. 确认 Git 最新提交包含"阶段2"字样
4. 确认 task-edit.vue 已完成迁移
5. 继续执行阶段3

---

## 7. 阶段3：迁移 AddTaskPanel.vue

### 7.1 目标范围

**本阶段迁移内容**：
1. ✅ 参照 task-edit.vue 迁移经验
2. ✅ 迁移所有公共业务逻辑到 useTaskForm
3. ✅ 保留面板特有逻辑（遮罩、动画）

**保留不动**：
- 🔸 UI模板（template部分）
- 🔸 样式（style部分）
- 🔸 遮罩层逻辑
- 🔸 底部工具栏动画

### 7.2 迁移步骤详解

#### 步骤3.1：引入 useTaskForm（5分钟）

**位置**：AddTaskPanel.vue script setup 顶部

**操作**：添加引入和初始化

```javascript
// ✅ 新增：引入 useTaskForm
import { useTaskForm } from '@/composables/useTaskForm.js';

// Props 定义（保留不动）
const props = defineProps({
  visible: Boolean,
  presetDate: String
});

// Emits 定义（保留不动）
const emit = defineEmits(['update:visible', 'taskCreated']);

// ============================================================
// 初始化 useTaskForm
// ============================================================
const taskFormApi = useTaskForm({
  mode: 'create',  // 面板仅支持创建模式
  taskId: null,
  presetDate: props.presetDate || ''
});
```

#### 步骤3.2：批量替换状态和方法（30分钟）

**操作**：参照阶段1和阶段2的迁移经验，一次性替换所有公共逻辑

**删除的代码**：
```javascript
// 删除所有重复的表单数据定义
const form = ref({ ... });
const subtasks = ref([]);
const activeDateTab = ref('today');
const customDate = ref('');
const repeatMode = ref('none');
// ... 所有重复的状态

// 删除所有重复的函数
function addSubtask() { ... }
function onDateTab() { ... }
function selectQuadrant() { ... }
function toggleWeekDay() { ... }
function syncRrule() { ... }
// ... 所有重复的函数
```

**新代码（一次性替换）**：
```javascript
// ✅ 使用 useTaskForm 提供的所有API
const {
  // 表单数据
  form,
  subtasks,
  activeDateTab,
  customDate,

  // 重复规则状态
  repeatMode,
  repeatInterval,
  repeatWeekDays,
  repeatEndDate,
  monthlyDays,
  monthlySubMode,
  monthlyWeekNum,
  monthlyWeekday,
  yearlyMonth,
  yearlyDay,

  // 计算属性
  currentQuadrant,
  hasFormChanged,
  repeatModeLabel,

  // 方法
  addSubtask,
  removeSubtask,
  toggleSubtaskDone,
  onDateTab,
  setCustomDate,
  selectQuadrant,
  toggleWeekDay,
  toggleMonthlyDay,
  syncRrule,
  submit,
  validateForm,
  resetForm,

  // 工具函数
  formatDate,
  calcDays,
  timeDiffMinutes,
  formatDuration
} = taskFormApi;
```

#### 步骤3.3：替换提交逻辑（10分钟）

**原代码（删除）**：
```javascript
async function handleSubmit() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入任务标题', icon: 'none' });
    return;
  }

  const taskData = { ... };
  await taskStore.createTask(taskData);

  emit('taskCreated', newTask);
  emit('update:visible', false);
  resetForm();
}
```

**新代码（替换为）**：
```javascript
async function handleSubmit() {
  try {
    const newTask = await submit();

    // 触发事件（面板特有逻辑）
    emit('taskCreated', newTask);
    emit('update:visible', false);

    uni.showToast({ title: '创建成功', icon: 'success' });
  } catch (error) {
    console.error('[AddTaskPanel] 创建任务失败:', error);
    // 错误提示已在 useTaskForm 中处理
  }
}
```

#### 步骤3.4：处理面板特有逻辑（10分钟）

**保留的面板特有逻辑**：
```javascript
// ✅ 保留：遮罩层点击关闭
function handleMaskClick() {
  emit('update:visible', false);
}

// ✅ 保留：底部工具栏展开/收起
const toolbarExpanded = ref(false);
function toggleToolbar() {
  toolbarExpanded.value = !toolbarExpanded.value;
}

// ✅ 保留：监听 visible 变化，重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm();  // 使用 useTaskForm 提供的 resetForm
  }
});
```

### 7.3 阶段3测试清单

完成上述步骤后，必须通过以下测试：

- [ ] 打开面板，无控制台错误
- [ ] 输入任务标题，正常显示
- [ ] 添加子计划，列表正常更新
- [ ] 切换日期Tab，日期正确设置
- [ ] 选择四象限，UI正确响应
- [ ] 设置重复规则，保存后正确生成RRULE
- [ ] 创建任务，保存成功，面板关闭
- [ ] 关闭面板重新打开，表单已重置
- [ ] 点击遮罩层，面板关闭

### 7.4 阶段3提交

测试通过后，提交代码：

```bash
git add frontend/Planning-app/components/task/AddTaskPanel.vue
git commit -m "refactor(AddTaskPanel): 阶段3 - 迁移业务逻辑到 useTaskForm

迁移内容：
- 表单数据管理（form, subtasks等）
- 子计划管理（add/remove/toggle）
- 日期Tab管理（onDateTab）
- 四象限管理（selectQuadrant）
- 重复规则管理（repeatMode, syncRrule等）
- 表单提交逻辑（submit）
- 表单验证逻辑（validateForm）
- 工具函数（formatDate, calcDays等）

保留面板特有逻辑：
- 遮罩层点击关闭
- 底部工具栏动画
- Props/Emits事件

测试验收：
✅ 面板打开/关闭正常
✅ 任务创建保存成功
✅ 表单重置正常
✅ 所有业务逻辑正常

完成度：100%

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
```

### 7.5 Claude 账号切换检查点 ✅

**阶段3完成后，整个迁移工作完成**

---

## 8. 测试验收标准

### 8.1 功能测试

**task-edit.vue 测试场景**：

| 测试场景 | 操作步骤 | 预期结果 |
|---------|---------|---------|
| 创建新任务 | 点击"+"按钮 → 输入标题 → 保存 | 成功创建，返回日历页 |
| 编辑任务 | 点击已有任务 → 修改标题 → 保存 | 成功更新，返回日历页 |
| 添加子计划 | 输入子计划标题 → 回车 | 子计划添加到列表 |
| 切换日期 | 点击"明天"Tab | 日期更新为明天 |
| 设置四象限 | 点击优先级 → 选择"重要且紧急" | 徽章显示"!!!!" |
| 设置重复 | 点击重复 → 选择"每周" → 选择周一/周三 → 确定 | RRULE正确生成 |
| 空标题保存 | 标题留空 → 点击保存 | 显示错误提示 |

**AddTaskPanel.vue 测试场景**：

| 测试场景 | 操作步骤 | 预期结果 |
|---------|---------|---------|
| 快速创建任务 | 打开面板 → 输入标题 → 保存 | 成功创建，面板关闭 |
| 遮罩关闭 | 点击遮罩层 | 面板关闭 |
| 表单重置 | 输入数据 → 关闭 → 重新打开 | 表单为空 |

### 8.2 性能测试

| 指标 | 目标值 | 测试方法 |
|------|--------|---------|
| 页面加载时间 | < 200ms | Chrome DevTools Performance |
| 内存占用 | < 50MB | Chrome DevTools Memory |
| 保存响应时间 | < 500ms | 点击保存到提示成功的时间 |

### 8.3 兼容性测试

| 平台 | 测试内容 |
|------|---------|
| H5浏览器 | Chrome、Edge、Safari |
| Android App | 真机测试 |
| iOS App | 真机测试（如有） |

---

## 9. 风险控制与回滚方案

### 9.1 风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 迁移过程引入Bug | 🟡 中 | 🔴 高 | 每个阶段完成后全面测试 |
| 遗漏某些边缘功能 | 🟢 低 | 🟡 中 | 对比原代码逐一确认 |
| 性能下降 | 🟢 低 | 🟡 中 | 性能测试验收 |

### 9.2 回滚方案

**阶段1失败回滚**：
```bash
git reset --hard HEAD~1
git push origin develop --force
```

**阶段2失败回滚**：
```bash
git reset --hard HEAD~1
git push origin develop --force
```

**完全回滚到迁移前**：
```bash
git checkout backup/before-usetaskform-migration
git checkout -b rollback/usetaskform-migration
git push origin rollback/usetaskform-migration
# 通知团队切换到回滚分支
```

### 9.3 应急预案

**如果发现严重Bug**：
1. 立即回滚到上一个稳定版本
2. 在工作日志中记录Bug详情
3. 创建Bug修复分支，修复后重新部署
4. 更新测试清单，防止再次发生

---

## 10. Claude 账号切换检查点

### 10.1 检查点清单

**每个阶段完成后，必须完成以下操作**：

- [ ] 代码已提交到Git
- [ ] Git commit message 包含阶段编号
- [ ] 功能测试全部通过
- [ ] 更新 `.claude/CURRENT_STATUS.md`，标注当前阶段
- [ ] 在本文档中标记"✅ 已完成"

### 10.2 新 Claude 接手指南

**步骤1：阅读文档**
1. 读取 `.claude/CURRENT_STATUS.md`
2. 读取本文档（useTaskForm迁移计划）
3. 读取《task-edit与AddTaskPanel功能重叠架构评估报告.md》

**步骤2：确认进度**
```bash
cd D:\MyProject\Planning-app
git log --oneline -5
# 查找最近的 refactor(task-edit) 或 refactor(AddTaskPanel) 提交
```

**步骤3：定位当前阶段**
- 如果最新提交包含"阶段1"，继续执行阶段2
- 如果最新提交包含"阶段2"，继续执行阶段3
- 如果最新提交包含"阶段3"，整个迁移已完成

**步骤4：运行测试**
```bash
cd frontend/Planning-app
npm run dev
# 手动测试上一个阶段的功能
```

**步骤5：开始下一阶段**
- 按照本文档对应阶段的步骤执行

---

## 📊 附录

### 附录A：迁移前后对比

| 指标 | 迁移前 | 迁移后 | 改善 |
|------|--------|--------|------|
| task-edit.vue 行数 | 3241行 | ~1200行 | ⬇️ 63% |
| AddTaskPanel.vue 行数 | 2598行 | ~1000行 | ⬇️ 62% |
| useTaskForm.js 行数 | 0行 | 850行 | ➕ 新增 |
| 总代码行数 | 5839行 | 3050行 | ⬇️ 48% |
| 代码重复率 | 85% | <5% | ⬇️ 94% |
| 健康评分 | 30/100 | 75/100 | ⬆️ 150% |

### 附录B：相关文档

- [三层架构设计.md](./三层架构设计.md)
- [task-edit与AddTaskPanel功能重叠架构评估报告.md](./task-edit与AddTaskPanel功能重叠架构评估报告.md)
- [详细字段映射表.md](./详细字段映射表.md)
- [CLAUDE.md](../../.claude/CLAUDE.md)

### 附录C：联系方式

**遇到问题时**：
1. 检查本文档的常见问题章节
2. 检查 Git 提交历史
3. 查阅相关技术文档
4. 向唐伯虎汇报（重大问题）

---

**文档结论**:

本方案将 useTaskForm 迁移工作分为3个独立阶段，每个阶段都可以：
- ✅ 独立测试验收
- ✅ 安全提交代码
- ✅ 支持 Claude 账号切换
- ✅ 随时回滚

预计总耗时 6-9 小时，完成后可减少48%代码量，消除94%代码重复，健康评分提升至75分，符合企业级标准。

**下一步**: 等待用户批准后开始执行阶段1。
