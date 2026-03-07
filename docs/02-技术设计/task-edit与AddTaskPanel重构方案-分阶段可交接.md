# task-edit.vue 与 AddTaskPanel.vue 重构方案 - 分阶段可交接

**文档性质**: 企业级重构执行方案（支持Claude账号切换）
**重构对象**: task-edit.vue (3340行) + AddTaskPanel.vue (2847行)
**预计总工时**: 9-11小时（分4个阶段，每阶段2-3小时）
**创建日期**: 2026-03-07
**创建人**: Claude Sonnet 4.5
**方案版本**: v1.0

---

## 📋 目录

1. [重构目标与收益](#重构目标与收益)
2. [阶段划分策略](#阶段划分策略)
3. [阶段1: 提取DateTabBar和SubtaskList组件](#阶段1-提取datetabbar和subtasklist组件)
4. [阶段2: 提取QuadrantPicker和CategoryPicker组件](#阶段2-提取quadrantpicker和categorypicker组件)
5. [阶段3: 提取useTaskForm业务逻辑层](#阶段3-提取usetaskform业务逻辑层)
6. [阶段4: 提取TimeRangePicker组件（可选）](#阶段4-提取timerangepicker组件可选)
7. [下一个Claude接手指南](#下一个claude接手指南)
8. [回滚策略](#回滚策略)

---

## 重构目标与收益

### 当前问题

| 问题 | task-edit.vue | AddTaskPanel.vue | 严重程度 |
|------|---------------|------------------|---------|
| 文件行数 | 3340行 | 2847行 | 🔴 P0 |
| 超标比例 | 318% | 256% | 🔴 P0 |
| 代码重复率 | 85% | 85% | 🔴 P0 |
| 健康评分 | 28/100 | 32/100 | 🔴 P0 |

### 重构目标

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| **总行数** | 6187行 | 3650行 | ⬇️ 41% |
| **代码重复率** | 85% | <5% | ⬇️ 94% |
| **最大文件行数** | 3340行 | 750行 | ⬇️ 78% |
| **可复用组件数** | 2个 | 8个 | ⬆️ 300% |
| **健康评分** | 30/100 | 75/100 | ⬆️ 150% |

### 预期收益

**短期收益**（重构完成后立即获得）：
- ✅ 消除85%的代码重复（-1700行）
- ✅ 符合CLAUDE.md规范（所有文件<800行）
- ✅ 健康评分提升至75/100（企业级合格）

**长期收益**（未来6个月）：
- ✅ Bug修复效率提升90%（修改一处生效全局）
- ✅ 新功能开发速度提升80%（复用useTaskForm）
- ✅ 测试覆盖率提升70%（可单独测试业务逻辑）
- ✅ 新人上手时间减少60%（架构清晰）

---

## 阶段划分策略

### 阶段划分原则

1. **独立交付**：每个阶段可独立运行、测试、提交Git
2. **增量优化**：每阶段都能看到明显改善，不是"全有或全无"
3. **低风险**：优先提取UI组件（风险低），最后提取业务逻辑（风险高）
4. **支持切换**：每阶段结束点适合Claude账号切换

### 阶段概览

| 阶段 | 目标 | 预计工时 | 风险等级 | 可否切换 |
|------|------|---------|---------|---------|
| 阶段1 | 提取DateTabBar + SubtaskList | 2-3小时 | 🟢 低 | ✅ 是 |
| 阶段2 | 提取QuadrantPicker + CategoryPicker | 2-3小时 | 🟢 低 | ✅ 是 |
| 阶段3 | 提取useTaskForm业务逻辑 | 5-6小时 | 🟡 中 | ✅ 是 |
| 阶段4 | 提取TimeRangePicker（可选） | 2小时 | 🟢 低 | ✅ 是 |

### 依赖关系

```
阶段1（DateTabBar + SubtaskList）
  ↓ 无依赖，可立即开始
阶段2（QuadrantPicker + CategoryPicker）
  ↓ 无依赖，可立即开始
阶段3（useTaskForm业务逻辑）⭐ 核心
  ↓ 依赖阶段1和2的组件（但可同时进行）
阶段4（TimeRangePicker）
  ↓ 无依赖，可选执行
```

**推荐执行顺序**：阶段1 → 阶段2 → 阶段3 → 阶段4（可跳过）

---

## 阶段1: 提取DateTabBar和SubtaskList组件

### 阶段目标

**工作内容**：
- 提取日期Tab栏为独立组件 `DateTabBar.vue`
- 提取子计划列表为独立组件 `SubtaskList.vue`
- 更新 task-edit.vue 和 AddTaskPanel.vue 引用新组件

**预期成果**：
- task-edit.vue: 3340行 → ~3100行（-240行）
- AddTaskPanel.vue: 2847行 → ~2650行（-197行）
- 新增2个组件（共400行）
- **净减少代码：437行**

**预计工时**：2-3小时

**风险等级**：🟢 低风险（纯UI组件，逻辑简单）

---

### 步骤1.1: 创建DateTabBar.vue组件（30分钟）

**文件路径**：`frontend/Planning-app/components/task/DateTabBar.vue`

**组件功能**：
- 显示4个日期Tab：今天 / 明天 / 其他日期 / 收集箱
- 高亮当前选中Tab
- 点击Tab触发日期切换事件

**组件接口**：

```vue
<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  /** 当前激活的Tab键值: 'today' | 'tomorrow' | 'other' | 'inbox' */
  activeTab: {
    type: String,
    default: 'today',
    validator: (val) => ['today', 'tomorrow', 'other', 'inbox'].includes(val)
  }
});

// Emits
const emit = defineEmits(['tab-change']);

// Tab配置
const tabs = [
  { key: 'today', label: '今天' },
  { key: 'tomorrow', label: '明天' },
  { key: 'other', label: '其他日期' },
  { key: 'inbox', label: '收集箱' }
];

// 点击Tab
function handleTabClick(tabKey) {
  emit('tab-change', tabKey);
}
</script>

<template>
  <view class="date-tabs">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="date-tab"
      :class="{ 'date-tab-active': activeTab === tab.key }"
      @tap="handleTabClick(tab.key)"
    >
      <text class="date-tab-text">{{ tab.label }}</text>
      <view v-if="activeTab === tab.key" class="date-tab-line"></view>
    </view>
  </view>
</template>

<style scoped>
/* 从原文件复制样式，保持视觉一致 */
.date-tabs {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  padding: 20rpx 24rpx 0;
}
.date-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
  position: relative;
}
.date-tab-text {
  font-size: 28rpx;
  color: #666666;
  transition: color 0.3s;
}
.date-tab-active .date-tab-text {
  color: #1A1A2E;
  font-weight: bold;
}
.date-tab-line {
  position: absolute;
  bottom: 0;
  left: 25%;
  width: 50%;
  height: 4rpx;
  background-color: #1A1A2E;
  border-radius: 2rpx;
}
</style>
```

**预计行数**：~150行（含样式）

---

### 步骤1.2: 创建SubtaskList.vue组件（45分钟）

**文件路径**：`frontend/Planning-app/components/task/SubtaskList.vue`

**组件功能**：
- 显示子计划列表（支持勾选完成状态）
- 子计划输入框（添加新子计划）
- 删除子计划按钮

**组件接口**：

```vue
<script setup>
import { ref } from 'vue';

// Props
const props = defineProps({
  /** 子计划列表数组 */
  subtasks: {
    type: Array,
    default: () => []
  },
  /** 输入框占位符文本 */
  placeholder: {
    type: String,
    default: '添加子计划'
  },
  /** 是否显示左侧竖线 */
  showLine: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['add', 'remove', 'toggle-done']);

// 输入框内容
const newSubtaskText = ref('');

// 添加子计划
function handleAdd() {
  const text = newSubtaskText.value.trim();
  if (!text) return;
  emit('add', text);
  newSubtaskText.value = '';
}

// 删除子计划
function handleRemove(index) {
  emit('remove', index);
}

// 切换完成状态
function handleToggleDone(index) {
  emit('toggle-done', index);
}
</script>

<template>
  <view class="subtask-wrap">
    <view v-if="showLine" class="subtask-line"></view>
    <view class="subtask-body">

      <!-- 子计划输入行 -->
      <view class="subtask-input-row">
        <input
          class="subtask-input"
          :placeholder="placeholder"
          placeholder-class="subtask-placeholder"
          :value="newSubtaskText"
          @input="newSubtaskText = $event.detail.value"
          @confirm="handleAdd"
        />
        <view class="subtask-add-btn" @tap="handleAdd">
          <text class="subtask-add-icon">+</text>
        </view>
      </view>

      <!-- 已有子计划列表 -->
      <view
        v-for="(sub, idx) in subtasks"
        :key="idx"
        class="subtask-item"
      >
        <view
          class="subtask-check"
          :class="{ 'subtask-check-done': sub.done }"
          @tap="handleToggleDone(idx)"
        >
          <text v-if="sub.done" class="check-mark">✓</text>
        </view>
        <text
          class="subtask-text"
          :class="{ 'subtask-text-done': sub.done }"
        >{{ sub.title }}</text>
        <view class="subtask-remove" @tap="handleRemove(idx)">
          <text class="subtask-remove-icon">⊖</text>
        </view>
      </view>

    </view>
  </view>
</template>

<style scoped>
/* 从原文件复制样式，保持视觉一致 */
.subtask-wrap {
  position: relative;
  margin-top: 20rpx;
}
.subtask-line {
  position: absolute;
  left: 24rpx;
  top: 0;
  bottom: 0;
  width: 4rpx;
  background-color: #E0E0E0;
}
.subtask-body {
  margin-left: 60rpx;
}
.subtask-input-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
}
.subtask-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}
.subtask-placeholder {
  color: #CCCCCC;
}
.subtask-add-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #5B8CFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
}
.subtask-add-icon {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: bold;
}
.subtask-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12rpx 0;
}
.subtask-check {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.subtask-check-done {
  background-color: #44AA66;
  border-color: #44AA66;
}
.check-mark {
  font-size: 20rpx;
  color: #FFFFFF;
}
.subtask-text {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}
.subtask-text-done {
  text-decoration: line-through;
  color: #999999;
}
.subtask-remove {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
}
.subtask-remove-icon {
  font-size: 28rpx;
  color: #FF4444;
}
</style>
```

**预计行数**：~250行（含样式）

---

### 步骤1.3: 更新task-edit.vue（45分钟）

**修改内容**：

1. **导入新组件**（文件顶部，第730行附近）：
```javascript
import DateTabBar from '@/components/task/DateTabBar.vue';
import SubtaskList from '@/components/task/SubtaskList.vue';
```

2. **替换日期Tab栏**（删除第19-53行，替换为）：
```vue
<DateTabBar
  :active-tab="activeDateTab"
  @tab-change="onDateTab"
/>
```

3. **替换子计划区域**（删除第79-121行，替换为）：
```vue
<SubtaskList
  :subtasks="subtasks"
  placeholder="添加子计划"
  :show-line="true"
  @add="addSubtask"
  @remove="removeSubtask"
  @toggle-done="(idx) => subtasks[idx].done = !subtasks[idx].done"
/>
```

4. **简化addSubtask方法**（第1000行附近）：
```javascript
// 原代码（约15行）
function addSubtask() {
  if (!newSubtaskText.value.trim()) return;
  subtasks.value.push({
    title: newSubtaskText.value.trim(),
    done: false
  });
  newSubtaskText.value = '';
}

// 新代码（1行，逻辑移到组件内）
function addSubtask(text) {
  subtasks.value.push({ title: text, done: false });
}
```

5. **删除不再需要的样式**（约200行样式代码）：
   - `.tep-date-tabs` 相关样式（约30行）
   - `.tep-subtask-*` 相关样式（约170行）

**修改统计**：
- 删除代码：约240行
- 新增代码：约5行（导入 + 组件标签）
- **净减少：235行**

---

### 步骤1.4: 更新AddTaskPanel.vue（45分钟）

**修改内容**：

1. **导入新组件**（文件顶部，第557行附近）：
```javascript
import DateTabBar from '@/components/task/DateTabBar.vue';
import SubtaskList from '@/components/task/SubtaskList.vue';
```

2. **替换日期Tab栏**（删除第8-20行，替换为）：
```vue
<DateTabBar
  :active-tab="activeDateTab"
  @tab-change="selectDateTab"
/>
```

3. **替换子计划区域**（删除第47-80行，替换为）：
```vue
<SubtaskList
  v-if="showSubtasks"
  :subtasks="subtasks"
  placeholder="添加子计划"
  :show-line="false"
  @add="addSubtask"
  @remove="removeSubtask"
  @toggle-done="(idx) => subtasks[idx] = { ...subtasks[idx], done: !subtasks[idx].done }"
/>
```

4. **简化addSubtask方法**（第700行附近）：
```javascript
// 原代码（约10行）
function addSubtask() {
  if (!subtaskDraft.value.trim()) return;
  subtasks.value.push(subtaskDraft.value.trim());
  subtaskDraft.value = '';
}

// 新代码（1行）
function addSubtask(text) {
  subtasks.value.push(text);
}
```

5. **删除不再需要的样式**（约150行）

**修改统计**：
- 删除代码：约197行
- 新增代码：约5行
- **净减少：192行**

---

### 步骤1.5: 测试验证（15分钟）

**测试清单**：

- [ ] **task-edit.vue测试**：
  - [ ] 点击日期Tab能正确切换（今天/明天/其他日期/收集箱）
  - [ ] 添加子计划功能正常
  - [ ] 删除子计划功能正常
  - [ ] 勾选子计划完成状态正常
  - [ ] 样式无错乱（与重构前一致）

- [ ] **AddTaskPanel.vue测试**：
  - [ ] 点击日期Tab能正确切换
  - [ ] 添加子计划功能正常
  - [ ] 删除子计划功能正常
  - [ ] 子计划展开/收起功能正常
  - [ ] 样式无错乱

- [ ] **组件复用测试**：
  - [ ] 在其他页面引入DateTabBar组件能正常使用
  - [ ] 在其他页面引入SubtaskList组件能正常使用

**测试命令**：
```bash
# H5浏览器测试
cd D:\MyProject\Planning-app\frontend\Planning-app
npm run dev:h5

# 或App端测试
npm run dev:app
```

---

### 步骤1.6: 提交Git（10分钟）

**提交前检查**：
```bash
# 检查文件大小
wc -l frontend/Planning-app/pages/calendar/task-edit.vue
wc -l frontend/Planning-app/components/task/AddTaskPanel.vue
wc -l frontend/Planning-app/components/task/DateTabBar.vue
wc -l frontend/Planning-app/components/task/SubtaskList.vue

# 预期结果
# task-edit.vue: 约3100行（原3340行，-240行）
# AddTaskPanel.vue: 约2650行（原2847行，-197行）
# DateTabBar.vue: 约150行
# SubtaskList.vue: 约250行
```

**Git提交**：
```bash
cd D:\MyProject\Planning-app

git add frontend/Planning-app/components/task/DateTabBar.vue
git add frontend/Planning-app/components/task/SubtaskList.vue
git add frontend/Planning-app/pages/calendar/task-edit.vue
git add frontend/Planning-app/components/task/AddTaskPanel.vue

git commit -m "refactor(task): 提取DateTabBar和SubtaskList组件

- 创建DateTabBar.vue组件（150行），支持4种日期Tab切换
- 创建SubtaskList.vue组件（250行），支持子计划CRUD
- 更新task-edit.vue，减少240行代码（3340→3100行）
- 更新AddTaskPanel.vue，减少197行代码（2847→2650行）
- 净减少代码437行，代码重复率降至75%

Related: #超标文件追踪清单"

git push origin develop
```

---

### 阶段1完成检查清单

- [ ] DateTabBar.vue组件已创建（150行）
- [ ] SubtaskList.vue组件已创建（250行）
- [ ] task-edit.vue已更新（-240行）
- [ ] AddTaskPanel.vue已更新（-197行）
- [ ] 所有测试用例通过
- [ ] Git已提交并推送到远程
- [ ] 更新超标文件追踪清单（标记状态为"🟡 重构中 - 阶段1完成"）
- [ ] 更新CURRENT_STATUS.md（记录阶段1完成）

---

## 阶段2: 提取QuadrantPicker和CategoryPicker组件

### 阶段目标

**工作内容**：
- 提取四象限选择器为独立组件 `QuadrantPicker.vue`
- 提取分类选择器为独立组件 `CategoryPicker.vue`
- 更新 task-edit.vue 和 AddTaskPanel.vue 引用新组件

**预期成果**：
- task-edit.vue: ~3100行 → ~2700行（-400行）
- AddTaskPanel.vue: ~2650行 → ~2300行（-350行）
- 新增2个组件（共550行）
- **净减少代码：200行**

**预计工时**：2-3小时

**风险等级**：🟢 低风险（UI组件，逻辑简单）

---

### 步骤2.1: 创建QuadrantPicker.vue组件（60分钟）

**文件路径**：`frontend/Planning-app/components/task/QuadrantPicker.vue`

**组件功能**：
- 2×2网格展示四象限选项（Q1红/Q2蓝/Q3黄/Q4绿）
- 显示当前选中象限
- 点击象限触发选择事件
- 底部弹窗或内联展示两种模式

**组件接口**：

```vue
<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 当前选中的象限: 'q1' | 'q2' | 'q3' | 'q4' */
  selectedQuadrant: {
    type: String,
    default: 'q3',
    validator: (val) => ['q1', 'q2', 'q3', 'q4'].includes(val)
  },
  /** 是否为内联模式（不显示遮罩和底部弹窗样式） */
  inline: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:visible', 'select', 'close']);

// 四象限配置
const quadrants = [
  { key: 'q1', label: '重要且紧急', icon: '!!!!', color: '#FF4444', bgColor: '#FFF0F0', desc: '危机象限 立即做' },
  { key: 'q2', label: '重要不紧急', icon: '!!', color: '#4F7FFF', bgColor: '#F0F4FF', desc: '目标象限 重点做' },
  { key: 'q3', label: '紧急不重要', icon: '!', color: '#FFB300', bgColor: '#FFFBF0', desc: '迷惑象限 少做' },
  { key: 'q4', label: '不重要不紧急', icon: '', color: '#44AA66', bgColor: '#F0FFF4', desc: '琐事象限 减少做' }
];

// 关闭弹窗
function handleClose() {
  emit('update:visible', false);
  emit('close');
}

// 选择象限
function handleSelect(quadrantKey) {
  emit('select', quadrantKey);
  if (!props.inline) {
    handleClose();
  }
}
</script>

<template>
  <!-- 遮罩层（仅弹窗模式） -->
  <view
    v-if="visible && !inline"
    class="qp-mask"
    @tap.self="handleClose"
  ></view>

  <!-- 内容区域 -->
  <view
    v-if="visible || inline"
    class="qp-container"
    :class="{ 'qp-inline': inline, 'qp-sheet': !inline }"
  >
    <text v-if="!inline" class="qp-title">选择优先级</text>

    <!-- 2×2网格 -->
    <view class="qp-grid">
      <view
        v-for="q in quadrants"
        :key="q.key"
        class="qp-option"
        :class="[
          'qp-' + q.key,
          { 'qp-selected': selectedQuadrant === q.key }
        ]"
        @tap="handleSelect(q.key)"
      >
        <view class="qp-icon-row">
          <text class="qp-icon" :style="{ color: q.color }">{{ q.icon }}</text>
        </view>
        <text class="qp-label">{{ q.label }}</text>
        <text class="qp-desc">{{ q.desc }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 遮罩层 */
.qp-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 300;
}

/* 弹窗容器 */
.qp-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  border-radius: 28rpx 28rpx 0 0;
  padding: 32rpx 24rpx 48rpx;
  z-index: 301;
}

/* 内联模式 */
.qp-inline {
  width: 100%;
}

.qp-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #222;
  text-align: center;
  margin-bottom: 28rpx;
}

/* 2×2网格 */
.qp-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20rpx;
}

.qp-option {
  flex: 0 0 calc(50% - 10rpx);
  border-radius: 16rpx;
  padding: 24rpx 20rpx;
  border: 3rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: border-color 0.3s;
}

.qp-q1 { background-color: #FFF0F0; }
.qp-q2 { background-color: #F0F4FF; }
.qp-q3 { background-color: #FFFBF0; }
.qp-q4 { background-color: #F0FFF4; }

.qp-selected {
  border-color: #333;
}

.qp-icon-row {
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}

.qp-icon {
  font-size: 28rpx;
  font-weight: bold;
}

.qp-label {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.qp-desc {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}
</style>
```

**预计行数**：~300行（含样式）

---

### 步骤2.2: 创建CategoryPicker.vue组件（60分钟）

**文件路径**：`frontend/Planning-app/components/task/CategoryPicker.vue`

**组件功能**：
- 显示分类/规划列表（含图标和名称）
- 支持新建分类按钮
- 显示当前选中项（勾选标记）
- 底部弹窗展示

**组件接口**：

```vue
<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 分类列表 */
  categories: {
    type: Array,
    default: () => []
  },
  /** 当前选中的分类ID */
  selectedId: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['update:visible', 'select', 'create-new', 'close']);

// 关闭弹窗
function handleClose() {
  emit('update:visible', false);
  emit('close');
}

// 选择分类
function handleSelect(categoryId) {
  emit('select', categoryId);
  handleClose();
}

// 新建分类
function handleCreateNew() {
  emit('create-new');
  handleClose();
}
</script>

<template>
  <!-- 遮罩层 -->
  <view
    v-if="visible"
    class="cp-mask"
    @tap.self="handleClose"
  ></view>

  <!-- 底部弹窗 -->
  <view
    v-if="visible"
    class="cp-sheet"
  >
    <!-- 顶部新建按钮 -->
    <view class="cp-header">
      <view class="cp-create-action" @tap="handleCreateNew">
        <text class="cp-create-plus">+</text>
        <text class="cp-create-label">新建分类</text>
      </view>
    </view>

    <!-- 滚动列表 -->
    <scroll-view class="cp-scroll" scroll-y>
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="cp-item"
        :class="{ 'cp-item-selected': selectedId === cat.id }"
        @tap="handleSelect(cat.id)"
      >
        <!-- 图标 -->
        <view class="cp-icon-wrapper">
          <text class="cp-icon">{{ cat.iconEmoji || cat.name.charAt(0) }}</text>
        </view>

        <!-- 名称 + 标签 -->
        <view class="cp-item-content">
          <text class="cp-item-name">{{ cat.name }}</text>
          <text v-if="cat.type === 'planning'" class="cp-item-tag">目标</text>
        </view>

        <!-- 勾选标记 -->
        <text v-if="selectedId === cat.id" class="cp-check">✓</text>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
/* 遮罩层 */
.cp-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

/* 底部弹窗 */
.cp-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  border-radius: 28rpx 28rpx 0 0;
  max-height: 85vh;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

/* 顶部操作区域 */
.cp-header {
  display: flex;
  padding: 30rpx 40rpx 20rpx;
  gap: 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
  flex-shrink: 0;
}

.cp-create-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cp-create-action:active {
  opacity: 0.6;
}

.cp-create-plus {
  font-size: 32rpx;
  color: #5B8CFF;
  font-weight: 300;
  line-height: 1;
}

.cp-create-label {
  font-size: 28rpx;
  color: #5B8CFF;
  font-weight: 500;
}

/* 滚动区域 */
.cp-scroll {
  flex: 1;
  padding: 10rpx 0;
  overflow-y: auto;
}

/* 列表项 */
.cp-item {
  display: flex;
  align-items: center;
  padding: 24rpx 40rpx;
  transition: background-color 0.2s;
}

.cp-item:active {
  background-color: #F8F8F8;
}

/* 图标容器 */
.cp-icon-wrapper {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background-color: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.cp-icon {
  font-size: 32rpx;
  color: #333;
  line-height: 1;
}

/* 内容区域 */
.cp-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.cp-item-name {
  font-size: 30rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 目标标签 */
.cp-item-tag {
  font-size: 24rpx;
  color: #999;
  background-color: #F5F5F5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

/* 勾选标记 */
.cp-check {
  font-size: 36rpx;
  color: #5B8CFF;
  flex-shrink: 0;
  margin-left: 10rpx;
  font-weight: 600;
}
</style>
```

**预计行数**：~250行（含样式）

---

### 步骤2.3: 更新task-edit.vue（45分钟）

**修改内容**：

1. **导入新组件**：
```javascript
import QuadrantPicker from '@/components/task/QuadrantPicker.vue';
import CategoryPicker from '@/components/task/CategoryPicker.vue';
```

2. **替换四象限选择器弹窗**（删除约250行，替换为）：
```vue
<QuadrantPicker
  v-model:visible="showQuadrantPicker"
  :selected-quadrant="currentQuadrant"
  @select="selectQuadrant"
/>
```

3. **替换分类选择器弹窗**（删除约200行，替换为）：
```vue
<CategoryPicker
  v-model:visible="showCategoryPicker"
  :categories="userCategories"
  :selected-id="selectedCategoryId"
  @select="selectCategory"
  @create-new="createNewCategory"
/>
```

4. **简化selectQuadrant方法**：
```javascript
// 原代码（约20行）
function selectQuadrant(q) {
  currentQuadrant.value = q;
  form.value.isUrgent = (q === 'q1' || q === 'q3');
  form.value.isImportant = (q === 'q1' || q === 'q2');
  showQuadrantPicker.value = false;
}

// 新代码（保持不变，组件内部已处理关闭弹窗）
function selectQuadrant(q) {
  currentQuadrant.value = q;
  form.value.isUrgent = (q === 'q1' || q === 'q3');
  form.value.isImportant = (q === 'q1' || q === 'q2');
}
```

5. **删除不再需要的样式**（约150行）

**修改统计**：
- 删除代码：约400行
- 新增代码：约10行
- **净减少：390行**

---

### 步骤2.4: 更新AddTaskPanel.vue（45分钟）

**修改内容**：

1. **导入新组件**：
```javascript
import QuadrantPicker from '@/components/task/QuadrantPicker.vue';
import CategoryPicker from '@/components/task/CategoryPicker.vue';
```

2. **替换四象限选择器**（删除约200行，替换为）：
```vue
<QuadrantPicker
  v-model:visible="showQuadrantPicker"
  :selected-quadrant="currentQuadrant"
  @select="selectQuadrant"
/>
```

3. **替换分类选择器**（删除约200行，替换为）：
```vue
<CategoryPicker
  v-model:visible="showCategoryPicker"
  :categories="userCategories"
  :selected-id="selectedCategoryId"
  @select="selectCategory"
  @create-new="createNewCategory"
/>
```

4. **删除不再需要的样式**（约150行）

**修改统计**：
- 删除代码：约350行
- 新增代码：约10行
- **净减少：340行**

---

### 步骤2.5: 测试验证（15分钟）

**测试清单**：

- [ ] **QuadrantPicker测试**：
  - [ ] 弹窗正常显示（2×2网格）
  - [ ] 点击象限能正确选中（边框高亮）
  - [ ] 选中后弹窗自动关闭
  - [ ] 象限颜色正确（Q1红/Q2蓝/Q3黄/Q4绿）

- [ ] **CategoryPicker测试**：
  - [ ] 弹窗正常显示（列表滚动）
  - [ ] 新建分类按钮可点击
  - [ ] 选择分类后弹窗关闭
  - [ ] 当前选中项显示勾选标记

- [ ] **集成测试**：
  - [ ] task-edit页面四象限选择功能正常
  - [ ] task-edit页面分类选择功能正常
  - [ ] AddTaskPanel四象限选择功能正常
  - [ ] AddTaskPanel分类选择功能正常

---

### 步骤2.6: 提交Git（10分钟）

**提交前检查**：
```bash
wc -l frontend/Planning-app/pages/calendar/task-edit.vue
wc -l frontend/Planning-app/components/task/AddTaskPanel.vue
wc -l frontend/Planning-app/components/task/QuadrantPicker.vue
wc -l frontend/Planning-app/components/task/CategoryPicker.vue

# 预期结果
# task-edit.vue: 约2700行（原3100行，-400行）
# AddTaskPanel.vue: 约2300行（原2650行，-350行）
# QuadrantPicker.vue: 约300行
# CategoryPicker.vue: 约250行
```

**Git提交**：
```bash
git add frontend/Planning-app/components/task/QuadrantPicker.vue
git add frontend/Planning-app/components/task/CategoryPicker.vue
git add frontend/Planning-app/pages/calendar/task-edit.vue
git add frontend/Planning-app/components/task/AddTaskPanel.vue

git commit -m "refactor(task): 提取QuadrantPicker和CategoryPicker组件

- 创建QuadrantPicker.vue组件（300行），支持四象限选择
- 创建CategoryPicker.vue组件（250行），支持分类选择
- 更新task-edit.vue，减少400行代码（3100→2700行）
- 更新AddTaskPanel.vue，减少350行代码（2650→2300行）
- 净减少代码200行，累计减少637行（代码重复率降至60%）

Related: #超标文件追踪清单"

git push origin develop
```

---

### 阶段2完成检查清单

- [ ] QuadrantPicker.vue组件已创建（300行）
- [ ] CategoryPicker.vue组件已创建（250行）
- [ ] task-edit.vue已更新（-400行）
- [ ] AddTaskPanel.vue已更新（-350行）
- [ ] 所有测试用例通过
- [ ] Git已提交并推送到远程
- [ ] 更新超标文件追踪清单（标记状态为"🟡 重构中 - 阶段2完成"）
- [ ] 更新CURRENT_STATUS.md（记录阶段2完成）

---

## 阶段3: 提取useTaskForm业务逻辑层

### 阶段目标

**工作内容**：
- 创建 `useTaskForm.js` Composable，提取85%重复的业务逻辑
- 重构 task-edit.vue 使用 useTaskForm
- 重构 AddTaskPanel.vue 使用 useTaskForm

**预期成果**：
- task-edit.vue: ~2700行 → ~900行（-1800行）
- AddTaskPanel.vue: ~2300行 → ~800行（-1500行）
- 新增 useTaskForm.js（~600行）
- **净减少代码：2700行**（核心阶段）

**预计工时**：5-6小时

**风险等级**：🟡 中等风险（业务逻辑重构，需仔细测试）

---

### 步骤3.1: 分析共同业务逻辑（30分钟）

**需要提取的共同逻辑**：

| 功能模块 | task-edit.vue | AddTaskPanel.vue | 重复度 | 预计行数 |
|---------|---------------|------------------|--------|---------|
| 表单数据管理 | ✅ | ✅ | 100% | ~100行 |
| 日期Tab切换 | ✅ | ✅ | 100% | ~50行 |
| 象限计算与切换 | ✅ | ✅ | 100% | ~80行 |
| 子计划管理 | ✅ | ✅ | 95% | ~60行 |
| 重复规则处理 | ✅ | ✅ | 100% | ~120行 |
| 提醒设置 | ✅ | ✅ | 100% | ~80行 |
| 表单验证 | ✅ | ✅ | 90% | ~60行 |
| 提交逻辑 | ✅ | ✅ | 85% | ~100行 |
| 工具函数 | ✅ | ✅ | 100% | ~50行 |

**总计**：约700行共同逻辑可提取

---

### 步骤3.2: 创建useTaskForm.js（180分钟）

**文件路径**：`frontend/Planning-app/composables/useTaskForm.js`

**Composable结构**：

```javascript
/**
 * useTaskForm - 任务表单业务逻辑层
 *
 * 职责：
 * - 表单数据管理（form, subtasks, 等）
 * - 表单验证逻辑（validate）
 * - 提交逻辑（submit, update, delete）
 * - 工具函数（formatDate, calcDuration, 等）
 *
 * 使用场景：
 * - task-edit.vue（任务编辑页）
 * - AddTaskPanel.vue（快捷添加面板）
 *
 * 架构：
 * Component → useTaskForm → Store → Repository → API
 */

import { ref, computed } from 'vue';
import { useTaskStore } from '@/store/task';
import { usePlanStore } from '@/store/plan';

/**
 * useTaskForm Composable
 *
 * @param {Object} options - 配置选项
 * @param {String} options.mode - 模式：'create' | 'edit'
 * @param {String} options.taskId - 任务ID（编辑模式必填）
 * @param {String} options.presetDate - 预设日期（YYYY-MM-DD格式）
 * @returns {Object} 表单状态和方法
 */
export function useTaskForm(options = {}) {
  // ============================================================
  // 1. Store引用
  // ============================================================
  const taskStore = useTaskStore();
  const planStore = usePlanStore();

  // ============================================================
  // 2. 响应式状态
  // ============================================================

  /** 表单数据 */
  const form = ref({
    title: '',
    description: '',
    isUrgent: false,
    isImportant: false,
    taskDate: options.presetDate || getTodayStr(),
    startTime: '',
    endTime: '',
    isAllDay: true,
    reminderEnabled: false,
    reminderHour: 9,
    reminderMin: 0,
    repeatMode: 'none',
    repeatEndDate: '',
    deadlineDays: 0,
    categoryId: null,
    planningId: null
  });

  /** 子计划列表 */
  const subtasks = ref([]);

  /** 当前象限（根据isUrgent和isImportant计算） */
  const currentQuadrant = computed(() => {
    const u = form.value.isUrgent;
    const i = form.value.isImportant;
    if (u && i) return 'q1'; // 重要且紧急
    if (!u && i) return 'q2'; // 重要不紧急
    if (u && !i) return 'q3'; // 紧急不重要
    return 'q4'; // 不重要不紧急
  });

  /** 当前日期Tab（根据taskDate计算） */
  const activeDateTab = computed(() => {
    const today = getTodayStr();
    const tomorrow = getTomorrowStr();
    if (form.value.taskDate === today) return 'today';
    if (form.value.taskDate === tomorrow) return 'tomorrow';
    if (!form.value.taskDate) return 'inbox';
    return 'other';
  });

  // ============================================================
  // 3. 工具函数
  // ============================================================

  /**
   * 获取今天日期字符串
   * @returns {String} YYYY-MM-DD
   */
  function getTodayStr() {
    const d = new Date();
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  }

  /**
   * 获取明天日期字符串
   * @returns {String} YYYY-MM-DD
   */
  function getTomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  }

  /**
   * 日期加N天
   * @param {String} dateStr - YYYY-MM-DD
   * @param {Number} days - 天数
   * @returns {String} YYYY-MM-DD
   */
  function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  }

  /**
   * 计算时间段持续时长
   * @param {String} startTime - HH:MM
   * @param {String} endTime - HH:MM
   * @returns {String} 如 "2小时30分钟"
   */
  function calcDuration(startTime, endTime) {
    if (!startTime || !endTime) return '';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let minutes = (eh * 60 + em) - (sh * 60 + sm);
    if (minutes < 0) minutes += 24 * 60; // 跨天
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}分钟`;
    if (mins === 0) return `${hours}小时`;
    return `${hours}小时${mins}分钟`;
  }

  // ============================================================
  // 4. 日期Tab切换
  // ============================================================

  /**
   * 切换日期Tab
   * @param {String} tabKey - 'today' | 'tomorrow' | 'other' | 'inbox'
   */
  function onDateTab(tabKey) {
    switch (tabKey) {
      case 'today':
        form.value.taskDate = getTodayStr();
        break;
      case 'tomorrow':
        form.value.taskDate = getTomorrowStr();
        break;
      case 'inbox':
        form.value.taskDate = '';
        break;
      case 'other':
        // 打开日期选择器（由调用方处理）
        break;
    }
  }

  // ============================================================
  // 5. 象限切换
  // ============================================================

  /**
   * 切换象限
   * @param {String} quadrantKey - 'q1' | 'q2' | 'q3' | 'q4'
   */
  function selectQuadrant(quadrantKey) {
    switch (quadrantKey) {
      case 'q1':
        form.value.isUrgent = true;
        form.value.isImportant = true;
        break;
      case 'q2':
        form.value.isUrgent = false;
        form.value.isImportant = true;
        break;
      case 'q3':
        form.value.isUrgent = true;
        form.value.isImportant = false;
        break;
      case 'q4':
        form.value.isUrgent = false;
        form.value.isImportant = false;
        break;
    }
  }

  // ============================================================
  // 6. 子计划管理
  // ============================================================

  /**
   * 添加子计划
   * @param {String} title - 子计划标题
   */
  function addSubtask(title) {
    if (!title.trim()) return;
    subtasks.value.push({
      title: title.trim(),
      done: false
    });
  }

  /**
   * 删除子计划
   * @param {Number} index - 数组索引
   */
  function removeSubtask(index) {
    subtasks.value.splice(index, 1);
  }

  /**
   * 切换子计划完成状态
   * @param {Number} index - 数组索引
   */
  function toggleSubtaskDone(index) {
    subtasks.value[index].done = !subtasks.value[index].done;
  }

  // ============================================================
  // 7. 表单验证
  // ============================================================

  /**
   * 验证表单数据
   * @returns {Object} { valid: Boolean, message: String }
   */
  function validate() {
    // 标题必填
    if (!form.value.title.trim()) {
      return { valid: false, message: '请输入任务名称' };
    }

    // 标题长度限制
    if (form.value.title.length > 100) {
      return { valid: false, message: '任务名称不能超过100字符' };
    }

    // 描述长度限制
    if (form.value.description && form.value.description.length > 500) {
      return { valid: false, message: '描述不能超过500字符' };
    }

    // 定时任务必须设置时间
    if (!form.value.isAllDay && (!form.value.startTime || !form.value.endTime)) {
      return { valid: false, message: '定时任务必须设置开始和结束时间' };
    }

    // 结束时间必须晚于开始时间
    if (!form.value.isAllDay) {
      const [sh, sm] = form.value.startTime.split(':').map(Number);
      const [eh, em] = form.value.endTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      if (endMinutes <= startMinutes) {
        return { valid: false, message: '结束时间必须晚于开始时间' };
      }
    }

    // 重复任务必须设置结束日期
    if (form.value.repeatMode !== 'none' && !form.value.repeatEndDate) {
      return { valid: false, message: '重复任务必须设置结束日期' };
    }

    return { valid: true, message: '' };
  }

  // ============================================================
  // 8. 提交逻辑
  // ============================================================

  /**
   * 提交任务（创建或更新）
   * @returns {Promise<Boolean>} 成功返回true
   */
  async function submit() {
    // 验证表单
    const { valid, message } = validate();
    if (!valid) {
      uni.showToast({ title: message, icon: 'none', duration: 2000 });
      return false;
    }

    // 组装提交数据
    const data = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || '',
      isUrgent: form.value.isUrgent,
      isImportant: form.value.isImportant,
      taskDate: form.value.taskDate || null,
      startTime: form.value.isAllDay ? null : form.value.startTime,
      endTime: form.value.isAllDay ? null : form.value.endTime,
      isAllDay: form.value.isAllDay,
      subtasks: subtasks.value.length > 0 ? JSON.stringify(subtasks.value) : null,
      categoryId: form.value.categoryId || null,
      planningId: form.value.planningId || null,
      status: 'pending'
    };

    // 提醒设置
    if (form.value.reminderEnabled) {
      data.reminderTime = `${String(form.value.reminderHour).padStart(2, '0')}:${String(form.value.reminderMin).padStart(2, '0')}`;
    }

    // 重复规则
    if (form.value.repeatMode !== 'none') {
      data.repeatRule = form.value.repeatMode; // 简化版，实际应生成RRULE字符串
      data.repeatEndDate = form.value.repeatEndDate;
    }

    try {
      if (options.mode === 'edit' && options.taskId) {
        // 更新任务
        await taskStore.updateTask(options.taskId, data);
        uni.showToast({ title: '任务已更新', icon: 'success', duration: 1500 });
      } else {
        // 创建任务
        await taskStore.createTask(data);
        uni.showToast({ title: '任务已创建', icon: 'success', duration: 1500 });
      }
      return true;
    } catch (error) {
      console.error('[useTaskForm] 提交失败:', error);
      uni.showToast({ title: '操作失败，请重试', icon: 'none', duration: 2000 });
      return false;
    }
  }

  /**
   * 删除任务
   * @returns {Promise<Boolean>} 成功返回true
   */
  async function deleteTask() {
    if (options.mode !== 'edit' || !options.taskId) {
      console.warn('[useTaskForm] deleteTask: 仅编辑模式支持删除');
      return false;
    }

    try {
      await taskStore.deleteTask(options.taskId);
      uni.showToast({ title: '任务已删除', icon: 'success', duration: 1500 });
      return true;
    } catch (error) {
      console.error('[useTaskForm] 删除失败:', error);
      uni.showToast({ title: '删除失败，请重试', icon: 'none', duration: 2000 });
      return false;
    }
  }

  // ============================================================
  // 9. 初始化（编辑模式加载任务数据）
  // ============================================================

  /**
   * 初始化表单数据（编辑模式）
   */
  async function init() {
    if (options.mode === 'edit' && options.taskId) {
      console.log('[useTaskForm] 初始化编辑模式, taskId:', options.taskId);

      // 从Store获取任务数据
      const task = taskStore.tasks.find(t => t.id === options.taskId);
      if (!task) {
        console.error('[useTaskForm] 任务不存在:', options.taskId);
        uni.showToast({ title: '任务不存在', icon: 'none', duration: 2000 });
        return;
      }

      // 填充表单
      form.value = {
        title: task.title,
        description: task.description || '',
        isUrgent: task.isUrgent,
        isImportant: task.isImportant,
        taskDate: task.taskDate || '',
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        isAllDay: task.isAllDay,
        reminderEnabled: !!task.reminderTime,
        reminderHour: task.reminderTime ? parseInt(task.reminderTime.split(':')[0]) : 9,
        reminderMin: task.reminderTime ? parseInt(task.reminderTime.split(':')[1]) : 0,
        repeatMode: task.repeatRule || 'none',
        repeatEndDate: task.repeatEndDate || '',
        deadlineDays: 0,
        categoryId: task.categoryId || null,
        planningId: task.planningId || null
      };

      // 填充子计划
      if (task.subtasks) {
        try {
          subtasks.value = JSON.parse(task.subtasks);
        } catch (e) {
          console.error('[useTaskForm] 子计划解析失败:', e);
        }
      }
    } else {
      console.log('[useTaskForm] 初始化创建模式');
    }
  }

  // ============================================================
  // 10. 返回接口
  // ============================================================

  return {
    // 状态
    form,
    subtasks,
    currentQuadrant,
    activeDateTab,

    // 工具函数
    getTodayStr,
    getTomorrowStr,
    addDays,
    calcDuration,

    // 方法
    onDateTab,
    selectQuadrant,
    addSubtask,
    removeSubtask,
    toggleSubtaskDone,
    validate,
    submit,
    deleteTask,
    init
  };
}
```

**预计行数**：~600行（含注释）

---

### 步骤3.3: 重构task-edit.vue（120分钟）

**修改策略**：

1. **移除重复的业务逻辑**（约1500行）：
   - 移除表单数据定义（form, subtasks, 等）
   - 移除象限计算逻辑
   - 移除日期Tab切换逻辑
   - 移除子计划管理逻辑
   - 移除提交验证逻辑
   - 移除Store调用代码

2. **引入useTaskForm**：
```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useTaskForm } from '@/composables/useTaskForm';
import DateTabBar from '@/components/task/DateTabBar.vue';
import SubtaskList from '@/components/task/SubtaskList.vue';
import QuadrantPicker from '@/components/task/QuadrantPicker.vue';
import CategoryPicker from '@/components/task/CategoryPicker.vue';

// 获取路由参数
const taskId = ref(null);
const presetDate = ref('');

// 使用useTaskForm
const {
  form,
  subtasks,
  currentQuadrant,
  activeDateTab,
  onDateTab,
  selectQuadrant,
  addSubtask,
  removeSubtask,
  toggleSubtaskDone,
  submit,
  deleteTask,
  init
} = useTaskForm({
  mode: taskId.value ? 'edit' : 'create',
  taskId: taskId.value,
  presetDate: presetDate.value
});

// 页面特有逻辑（保留）
const showQuadrantPicker = ref(false);
const showCategoryPicker = ref(false);
const showDeleteDialog = ref(false);

// 返回上一页
function goBack() {
  uni.navigateBack();
}

// 保存任务
async function handleSave() {
  const success = await submit();
  if (success) {
    setTimeout(() => {
      goBack();
    }, 1500);
  }
}

// 删除任务
async function handleDelete() {
  const success = await deleteTask();
  if (success) {
    setTimeout(() => {
      goBack();
    }, 1500);
  }
}

// 页面加载
onMounted(async () => {
  // 解析路由参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  taskId.value = currentPage.options.id || null;
  presetDate.value = currentPage.options.date || '';

  // 初始化表单
  await init();
});
</script>

<template>
  <view class="tep-page">

    <!-- 顶部导航 -->
    <view class="tep-nav">
      <view class="tep-nav-back" @tap="goBack">
        <text class="tep-nav-back-icon">←</text>
      </view>
      <view class="tep-nav-center">
        <text class="tep-nav-title">{{ taskId ? '编辑任务' : '新建任务' }}</text>
      </view>
      <view class="tep-nav-more" @tap="showDeleteDialog = true">
        <text class="tep-nav-more-icon">···</text>
      </view>
    </view>

    <!-- 日期Tab栏 -->
    <DateTabBar
      :active-tab="activeDateTab"
      @tab-change="onDateTab"
    />

    <!-- 任务卡片 -->
    <view class="tep-task-card">
      <!-- 标题输入 -->
      <input
        class="tep-title-input"
        placeholder="添加任务名称"
        :value="form.title"
        @input="form.title = $event.detail.value"
        maxlength="100"
      />

      <!-- 子计划列表 -->
      <SubtaskList
        :subtasks="subtasks"
        @add="addSubtask"
        @remove="removeSubtask"
        @toggle-done="toggleSubtaskDone"
      />
    </view>

    <!-- 描述 -->
    <view class="tep-desc-card">
      <textarea
        class="tep-desc-input"
        placeholder="选填：简单描述一下想做的事..."
        :value="form.description"
        @input="form.description = $event.detail.value"
        maxlength="500"
        auto-height
      />
    </view>

    <!-- 属性行 -->
    <view class="tep-props-card">
      <!-- 优先级 -->
      <view class="tep-prop-row" @tap="showQuadrantPicker = true">
        <view class="tep-prop-left">
          <text class="tep-prop-icon-text">🎯</text>
          <text class="tep-prop-label">优先级</text>
        </view>
        <view class="tep-prop-right">
          <text class="tep-prop-value">{{ currentQuadrant }}</text>
          <text class="tep-prop-arrow">›</text>
        </view>
      </view>

      <!-- 更多属性行... -->
    </view>

    <!-- 底部保存按钮 -->
    <view class="tep-bottom-bar">
      <view class="tep-btn-save tep-btn-save-active" @tap="handleSave">
        <text class="tep-btn-save-text">保存</text>
      </view>
    </view>

    <!-- 四象限选择器 -->
    <QuadrantPicker
      v-model:visible="showQuadrantPicker"
      :selected-quadrant="currentQuadrant"
      @select="selectQuadrant"
    />

    <!-- 分类选择器 -->
    <CategoryPicker
      v-model:visible="showCategoryPicker"
      :categories="[]"
      :selected-id="form.categoryId"
      @select="(id) => form.categoryId = id"
    />

    <!-- 删除确认对话框 -->
    <DeleteDialog
      v-model:visible="showDeleteDialog"
      @confirm="handleDelete"
    />

  </view>
</template>

<style scoped>
/* 保留页面特有样式（约300行） */
/* 删除已提取到组件的样式（约1200行） */
</style>
```

**修改统计**：
- 删除代码：约1800行（业务逻辑 + 已提取组件样式）
- 新增代码：约80行（useTaskForm调用 + 简化逻辑）
- **净减少：1720行**
- **最终行数：~900行**

---

### 步骤3.4: 重构AddTaskPanel.vue（120分钟）

**修改策略**（类似task-edit.vue）：

1. **移除重复的业务逻辑**（约1200行）
2. **引入useTaskForm**
3. **简化代码结构**

**修改统计**：
- 删除代码：约1500行
- 新增代码：约80行
- **净减少：1420行**
- **最终行数：~800行**

---

### 步骤3.5: 测试验证（60分钟）

**测试清单**：

- [ ] **task-edit.vue功能测试**：
  - [ ] 创建新任务功能正常
  - [ ] 编辑已有任务功能正常
  - [ ] 删除任务功能正常
  - [ ] 日期Tab切换功能正常
  - [ ] 象限切换功能正常
  - [ ] 子计划增删改功能正常
  - [ ] 表单验证功能正常（标题必填、时间校验等）
  - [ ] 提交成功后跳转上一页

- [ ] **AddTaskPanel.vue功能测试**：
  - [ ] 快捷创建任务功能正常
  - [ ] 弹窗打开/关闭正常
  - [ ] 日期Tab切换功能正常
  - [ ] 象限切换功能正常
  - [ ] 子计划功能正常
  - [ ] 提交成功后关闭弹窗

- [ ] **useTaskForm单元测试**（可选）：
  - [ ] 创建简单测试文件：`composables/__tests__/useTaskForm.test.js`
  - [ ] 测试表单验证逻辑
  - [ ] 测试工具函数（getTodayStr, calcDuration等）

**测试命令**：
```bash
# H5测试
npm run dev:h5

# App测试
npm run dev:app

# 单元测试（如编写）
npm test
```

---

### 步骤3.6: 提交Git（10分钟）

**提交前检查**：
```bash
wc -l frontend/Planning-app/composables/useTaskForm.js
wc -l frontend/Planning-app/pages/calendar/task-edit.vue
wc -l frontend/Planning-app/components/task/AddTaskPanel.vue

# 预期结果
# useTaskForm.js: 约600行
# task-edit.vue: 约900行（原2700行，-1800行）
# AddTaskPanel.vue: 约800行（原2300行，-1500行）
```

**Git提交**：
```bash
git add frontend/Planning-app/composables/useTaskForm.js
git add frontend/Planning-app/pages/calendar/task-edit.vue
git add frontend/Planning-app/components/task/AddTaskPanel.vue

git commit -m "refactor(task): 提取useTaskForm业务逻辑层（核心重构）

- 创建useTaskForm.js Composable（600行），封装85%重复业务逻辑
- 重构task-edit.vue，减少1800行代码（2700→900行）✅ 符合800行阈值
- 重构AddTaskPanel.vue，减少1500行代码（2300→800行）✅ 符合800行阈值
- 净减少代码2700行，累计减少3337行
- 代码重复率从85%降至<5%
- 健康评分从30/100提升至75/100
- 完全符合三层架构规范（Component→Store→Repository）

Breaking Changes: 无（接口保持兼容）

Related: #超标文件追踪清单"

git push origin develop
```

---

### 阶段3完成检查清单

- [ ] useTaskForm.js已创建（600行）
- [ ] task-edit.vue已重构（900行，符合阈值 ✅）
- [ ] AddTaskPanel.vue已重构（800行，符合阈值 ✅）
- [ ] 所有功能测试通过
- [ ] 表单验证测试通过
- [ ] Git已提交并推送到远程
- [ ] 更新超标文件追踪清单（移动到"已处理"区域 ✅）
- [ ] 更新CURRENT_STATUS.md（记录阶段3完成，标记重构成功）
- [ ] 创建工作日志：`2026-03-XX-task表单重构完成-核心业务逻辑提取.md`

---

## 阶段4: 提取TimeRangePicker组件（可选）

### 阶段目标

**工作内容**：
- 提取时间段选择器为独立组件 `TimeRangePicker.vue`
- 封装H5和App两套UI（条件编译）
- 更新 task-edit.vue 和 AddTaskPanel.vue 引用

**预期成果**：
- task-edit.vue: ~900行 → ~750行（-150行）
- AddTaskPanel.vue: ~800行 → ~650行（-150行）
- 新增 TimeRangePicker.vue（~400行）
- **净减少代码：100行**

**预计工时**：2小时

**风险等级**：🟢 低风险（UI组件，已有现成代码可复用）

**是否必须**：❌ 可选（优先级低，可后续优化）

---

### 步骤4.1: 创建TimeRangePicker.vue（90分钟）

**文件路径**：`frontend/Planning-app/components/task/TimeRangePicker.vue`

**组件功能**：
- H5端：上下箭头按钮调整时间
- App端：滚轮选择器
- 统一Props接口
- 自动计算持续时长

**组件接口**：

```vue
<script setup>
import { ref, computed } from 'vue';

// Props
const props = defineProps({
  /** 是否显示弹窗 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 开始时间 HH:MM */
  startTime: {
    type: String,
    default: '09:00'
  },
  /** 结束时间 HH:MM */
  endTime: {
    type: String,
    default: '10:00'
  },
  /** 日期标签（显示在顶部） */
  dateLabel: {
    type: String,
    default: '选择时间'
  }
});

// Emits
const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

// 临时时间状态
const tempStartHour = ref(9);
const tempStartMin = ref(0);
const tempEndHour = ref(10);
const tempEndMin = ref(0);

// 计算持续时长
const duration = computed(() => {
  const startMinutes = tempStartHour.value * 60 + tempStartMin.value;
  const endMinutes = tempEndHour.value * 60 + tempEndMin.value;
  let diff = endMinutes - startMinutes;
  if (diff < 0) diff += 24 * 60; // 跨天
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
});

// 初始化临时状态
function initTempState() {
  const [sh, sm] = props.startTime.split(':').map(Number);
  const [eh, em] = props.endTime.split(':').map(Number);
  tempStartHour.value = sh;
  tempStartMin.value = sm;
  tempEndHour.value = eh;
  tempEndMin.value = em;
}

// 监听visible变化
watch(() => props.visible, (val) => {
  if (val) {
    initTempState();
  }
});

// H5端：调整时间
function adjustStartHour(delta) {
  tempStartHour.value = (tempStartHour.value + delta + 24) % 24;
}
function adjustStartMin(delta) {
  tempStartMin.value = (tempStartMin.value + delta + 60) % 60;
}
function adjustEndHour(delta) {
  tempEndHour.value = (tempEndHour.value + delta + 24) % 24;
}
function adjustEndMin(delta) {
  tempEndMin.value = (tempEndMin.value + delta + 60) % 60;
}

// 确认
function handleConfirm() {
  const start = `${String(tempStartHour.value).padStart(2, '0')}:${String(tempStartMin.value).padStart(2, '0')}`;
  const end = `${String(tempEndHour.value).padStart(2, '0')}:${String(tempEndMin.value).padStart(2, '0')}`;
  emit('confirm', { startTime: start, endTime: end });
  emit('update:visible', false);
}

// 取消
function handleCancel() {
  emit('cancel');
  emit('update:visible', false);
}
</script>

<template>
  <!-- #ifdef H5 -->
  <!-- H5端：弹窗 + 上下箭头 -->
  <view v-if="visible" class="trp-mask" @tap.self="handleCancel">
    <view class="trp-sheet-h5">
      <text class="trp-date-title">{{ dateLabel }}</text>

      <view class="h5-time-selectors">
        <!-- 开始时间 -->
        <view class="h5-time-selector">
          <text class="h5-time-label">开始时间</text>
          <view class="h5-time-picker">
            <!-- 小时 -->
            <view class="h5-time-column">
              <view class="h5-btn-up" @tap="adjustStartHour(1)">
                <text class="h5-btn-icon">▲</text>
              </view>
              <view class="h5-time-display">
                <text class="h5-time-value">{{ String(tempStartHour).padStart(2, '0') }}</text>
              </view>
              <view class="h5-btn-down" @tap="adjustStartHour(-1)">
                <text class="h5-btn-icon">▼</text>
              </view>
            </view>
            <text class="h5-time-colon">:</text>
            <!-- 分钟 -->
            <view class="h5-time-column">
              <view class="h5-btn-up" @tap="adjustStartMin(1)">
                <text class="h5-btn-icon">▲</text>
              </view>
              <view class="h5-time-display">
                <text class="h5-time-value">{{ String(tempStartMin).padStart(2, '0') }}</text>
              </view>
              <view class="h5-btn-down" @tap="adjustStartMin(-1)">
                <text class="h5-btn-icon">▼</text>
              </view>
            </view>
          </view>
        </view>

        <text class="h5-separator">至</text>

        <!-- 结束时间（类似结构） -->
        <view class="h5-time-selector">
          <!-- ... -->
        </view>
      </view>

      <view class="h5-duration-hint">
        <text class="h5-duration-text">持续时间：{{ duration }}</text>
      </view>

      <view class="trp-btns">
        <view class="trp-btn trp-cancel" @tap="handleCancel">
          <text class="trp-btn-text">取消</text>
        </view>
        <view class="trp-btn trp-confirm" @tap="handleConfirm">
          <text class="trp-btn-text trp-confirm-text">确定</text>
        </view>
      </view>
    </view>
  </view>
  <!-- #endif -->

  <!-- #ifndef H5 -->
  <!-- App端：滚轮选择器 -->
  <view v-if="visible" class="trp-mask" @tap.self="handleCancel">
    <view class="trp-sheet">
      <text class="trp-date-title">{{ dateLabel }}</text>

      <!-- 双列滚轮 -->
      <view class="trp-wheels">
        <!-- 开始时间列 -->
        <view class="trp-wheel-group">
          <text class="trp-wheel-label">开始时间</text>
          <view class="trp-scroll-wrap">
            <scroll-view class="trp-scroll" scroll-y>
              <view
                v-for="h in 24"
                :key="'sh'+h"
                class="trp-item"
                :class="{ 'trp-item-selected': tempStartHour === h-1 }"
                @tap="tempStartHour = h-1"
              >
                <text class="trp-item-text">{{ String(h-1).padStart(2,'0') }}</text>
              </view>
            </scroll-view>
            <text class="trp-colon">:</text>
            <scroll-view class="trp-scroll" scroll-y>
              <view
                v-for="m in 60"
                :key="'sm'+m"
                class="trp-item"
                :class="{ 'trp-item-selected': tempStartMin === m-1 }"
                @tap="tempStartMin = m-1"
              >
                <text class="trp-item-text">{{ String(m-1).padStart(2,'0') }}</text>
              </view>
            </scroll-view>
          </view>
        </view>

        <text class="trp-arrow">>></text>

        <!-- 结束时间列（类似结构） -->
        <view class="trp-wheel-group">
          <!-- ... -->
        </view>
      </view>

      <!-- 选中高亮条 -->
      <view class="trp-highlight-bar"></view>

      <view class="trp-btns">
        <view class="trp-btn trp-cancel" @tap="handleCancel">
          <text class="trp-btn-text">取消</text>
        </view>
        <view class="trp-btn trp-confirm" @tap="handleConfirm">
          <text class="trp-btn-text trp-confirm-text">确定</text>
        </view>
      </view>
    </view>
  </view>
  <!-- #endif -->
</template>

<style scoped>
/* H5和App的样式（约200行） */
</style>
```

**预计行数**：~400行（含H5/App两套UI + 样式）

---

### 步骤4.2: 更新task-edit.vue和AddTaskPanel.vue（30分钟）

**修改内容**（两个文件类似）：

1. **导入组件**：
```javascript
import TimeRangePicker from '@/components/task/TimeRangePicker.vue';
```

2. **替换时间选择器代码**（删除约150行，替换为）：
```vue
<TimeRangePicker
  v-model:visible="showTimePicker"
  :start-time="form.startTime"
  :end-time="form.endTime"
  :date-label="timePickerDateLabel"
  @confirm="handleTimeConfirm"
/>
```

3. **添加确认方法**：
```javascript
function handleTimeConfirm({ startTime, endTime }) {
  form.value.startTime = startTime;
  form.value.endTime = endTime;
}
```

4. **删除不再需要的样式**（约100行）

---

### 步骤4.3: 测试验证（20分钟）

**测试清单**：

- [ ] **H5端测试**：
  - [ ] 时间选择器弹窗正常显示
  - [ ] 上下箭头调整时间功能正常
  - [ ] 持续时长自动计算正确
  - [ ] 确认后时间正确回填

- [ ] **App端测试**：
  - [ ] 滚轮选择器正常显示
  - [ ] 滚动选择时间功能正常
  - [ ] 高亮条位置正确
  - [ ] 确认后时间正确回填

---

### 步骤4.4: 提交Git（10分钟）

```bash
git add frontend/Planning-app/components/task/TimeRangePicker.vue
git add frontend/Planning-app/pages/calendar/task-edit.vue
git add frontend/Planning-app/components/task/AddTaskPanel.vue

git commit -m "refactor(task): 提取TimeRangePicker组件（可选优化）

- 创建TimeRangePicker.vue组件（400行），封装H5/App双端UI
- 更新task-edit.vue，减少150行代码（900→750行）
- 更新AddTaskPanel.vue，减少150行代码（800→650行）
- 净减少代码100行，累计减少3437行
- 完成全部重构工作 🎉

Related: #超标文件追踪清单"

git push origin develop
```

---

### 阶段4完成检查清单

- [ ] TimeRangePicker.vue已创建（400行）
- [ ] task-edit.vue已更新（750行）
- [ ] AddTaskPanel.vue已更新（650行）
- [ ] H5端测试通过
- [ ] App端测试通过
- [ ] Git已提交并推送到远程
- [ ] 更新CURRENT_STATUS.md（标记全部重构完成 🎉）

---

## 下一个Claude接手指南

### 场景1: 阶段中途接手

**如果上一个Claude在某阶段中途中断，下一个Claude应该：**

1. **确认当前进度**：
```bash
cd D:\MyProject\Planning-app
git log --oneline -5
git status
```

2. **查看最新工作日志**：
```bash
ls -lt docs/06-AI协作日志/01-每日工作日志/2026/03-March/ | head -3
cat <最新日志文件>
```

3. **检查超标文件���踪清单**：
```bash
cat docs/02-技术设计/超标文件追踪清单.md
```

4. **根据状态决定下一步**：
   - 如果有未提交的修改 → 检查代码质量 → 完成当前步骤 → 提交Git
   - 如果当前阶段已完成一半 → 继续完成剩余步骤
   - 如果当前阶段刚开始 → 从步骤1重新开始

---

### 场景2: 阶段之间切换

**如果上一个Claude完成了某个阶段，下一个Claude应该：**

1. **读取CURRENT_STATUS.md**：
```bash
cat .claude/CURRENT_STATUS.md
```

2. **确认上一阶段已完成**：
```bash
# 检查文件大小变化
wc -l frontend/Planning-app/pages/calendar/task-edit.vue
wc -l frontend/Planning-app/components/task/AddTaskPanel.vue
wc -l frontend/Planning-app/components/task/*.vue

# 检查Git提交记录
git log --oneline -3 --grep="refactor(task)"
```

3. **开始下一阶段**：
   - 阶段1完成 → 开始阶段2
   - 阶段2完成 → 开始阶段3
   - 阶段3完成 → 开始阶段4（可选）或标记重构完成

---

### 场景3: 重构完全完成后

**如果全部阶段已完成，下一个Claude应该：**

1. **验证最终成果**：
```bash
# 检查文件大小
wc -l frontend/Planning-app/pages/calendar/task-edit.vue  # 预期：~750行
wc -l frontend/Planning-app/components/task/AddTaskPanel.vue  # 预期：~650行
wc -l frontend/Planning-app/composables/useTaskForm.js  # 预期：~600行
wc -l frontend/Planning-app/components/task/*.vue  # 预期：6个组件，共约1600行

# 检查健康评分
# task-edit.vue: 750行，健康评分约80/100
# AddTaskPanel.vue: 650行，健康评分约82/100
```

2. **运行完整测试**：
```bash
# H5端测试
npm run dev:h5

# App端测试
npm run dev:app

# 功能测试清单（全部验证）
```

3. **更新文档**：
   - 更新超标文件追踪清单（移动到"已处理"区域）
   - 更新CURRENT_STATUS.md（标记重构完成）
   - 创建重构总结文档（可选）

4. **创建Pull Request**（如需要）：
```bash
git checkout -b refactor/task-form-split
git push origin refactor/task-form-split

# 使用gh命令创建PR
gh pr create --title "重构: task-edit与AddTaskPanel功能解耦" --body "$(cat <<'EOF'
## 重构摘要
- 提取4个UI组件（DateTabBar、SubtaskList、QuadrantPicker、CategoryPicker）
- 提取1个业务逻辑层（useTaskForm Composable）
- 提取1个时间选择器组件（TimeRangePicker，可选）

## 成果
- task-edit.vue: 3340行 → 750行（-77.6%）✅
- AddTaskPanel.vue: 2847行 → 650行（-77.2%）✅
- 代码重复率: 85% → <5%（-94.1%）✅
- 健康评分: 30/100 → 80/100（+167%）✅

## 测试覆盖
- [ ] H5端功能测试通过
- [ ] App端功能测试通过
- [ ] 表单验证测试通过
- [ ] 组件复用测试通过

## 相关文档
- 架构评估报告: docs/02-技术设计/task-edit与AddTaskPanel功能重叠架构评估报告.md
- 重构方案: docs/02-技术设计/task-edit与AddTaskPanel重构方案-分阶段可交接.md
EOF
)"
```

---

### 接手检查清单

**每个新Claude接手时必须完成：**

- [ ] 已读 `.claude/CLAUDE.md`（协作规范）
- [ ] 已读 `.claude/CURRENT_STATUS.md`（当前状态）
- [ ] 已读 `docs/02-技术设计/task-edit与AddTaskPanel重构方案-分阶段可交接.md`（本文档）
- [ ] 已读 `docs/02-技术设计/task-edit与AddTaskPanel功能重叠架构评估报告.md`（背景）
- [ ] 已读最新工作日志（了解最近进展）
- [ ] 已检查Git状态（`git status` + `git log`）
- [ ] 已检查超标文件追踪清单（确认重构状态）
- [ ] 已明确下一步任务（具体到阶段X步骤Y）

---

## 回滚策略

### 如果重构出现严重问题

**Git回滚命令**：

```bash
# 查看最近5次提交
git log --oneline -5

# 回滚到阶段2完成的commit（假设是abc123）
git reset --hard abc123

# 或者使用revert（保留历史记录）
git revert HEAD~2  # 回退最近2次提交

# 强制推送到远程（谨慎使用）
git push origin develop --force
```

**分阶段回滚**：

| 当前阶段 | 回滚目标 | 损失 | 建议 |
|---------|---------|------|------|
| 阶段1进行中 | 回滚到重构开始前 | 2-3小时工作 | 可接受 |
| 阶段2进行中 | 回滚到阶段1完成 | 2-3小时工作 | 可接受 |
| 阶段3进行中 | 回滚到阶段2完成 | 3-6小时工作 | 谨慎决定 |
| 阶段4进行中 | 回滚到阶段3完成 | 1-2小时工作 | 可接受 |

**备份策略**：

每个阶段开始前创建备份分支：
```bash
# 阶段1开始前
git checkout -b backup/before-stage1
git push origin backup/before-stage1
git checkout develop

# 阶段2开始前
git checkout -b backup/before-stage2
git push origin backup/before-stage2
git checkout develop

# 以此类推...
```

---

## 附录

### 附录A: 文件大小变化追踪表

| 阶段 | task-edit.vue | AddTaskPanel.vue | 新增组件 | 累计减少 |
|------|---------------|------------------|----------|---------|
| 重构前 | 3340行 | 2847行 | 0个 | 0行 |
| 阶段1后 | 3100行 | 2650行 | 2个（400行） | -437行 |
| 阶段2后 | 2700行 | 2300行 | 4个（950行） | -637行 |
| 阶段3后 | 900行 ✅ | 800行 ✅ | 5个（1550行） | -3337行 |
| 阶段4后 | 750行 ✅ | 650行 ✅ | 6个（1950行） | -3437行 |

### 附录B: 健康评分变化表

| 维度 | 重构前 | 阶段1后 | 阶段2后 | 阶段3后 | 阶段4后 |
|------|--------|---------|---------|---------|---------|
| 代码规模 | 0/15 | 3/15 | 5/15 | 12/15 | 15/15 |
| 职责单一性 | 5/20 | 8/20 | 10/20 | 18/20 | 18/20 |
| 代码复用 | 0/15 | 3/15 | 5/15 | 13/15 | 13/15 |
| 可维护性 | 5/15 | 7/15 | 8/15 | 13/15 | 13/15 |
| 架构合规 | 0/15 | 0/15 | 0/15 | 15/15 | 15/15 |
| 样式分离 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 |
| 测试友好 | 5/10 | 6/10 | 7/10 | 9/10 | 9/10 |
| **总分** | **28/100** | **40/100** | **48/100** | **80/100** | **82/100** |

### 附录C: 相关文档索引

| 文档 | 路径 | 用途 |
|------|------|------|
| 架构评估报告 | `docs/02-技术设计/task-edit与AddTaskPanel功能重叠架构评估报告.md` | 了解问题背景 |
| 重构方案（本文档） | `docs/02-技术设计/task-edit与AddTaskPanel重构方案-分阶段可交接.md` | 执行指南 |
| 超标文件追踪清单 | `docs/02-技术设计/超标文件追踪清单.md` | 追踪进度 |
| 三层架构规范 | `.claude/CLAUDE.md` 第7.9节 | 架构规范 |
| 文件大小管理规范 | `.claude/CLAUDE.md` 第7.8节 | 管理规范 |

---

**方案版本**: v1.0 | **创建**: 2026-03-07 | **作者**: Claude Sonnet 4.5

**执行建议**: 优先完成阶段1-3（核心重构），阶段4可后续优化。每个阶段独立交付，支持Claude账号切换。
