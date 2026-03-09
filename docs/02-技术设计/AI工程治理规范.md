# AI工程治理规范

> **文档性质**: 企业级工程治理规范
> **适用对象**: 所有参与本项目的 AI 实例（Claude、ChatGPT等）
> **强制等级**: ⭐⭐⭐⭐⭐ 最高优先级
> **创建日期**: 2026-03-09
> **基于**: ChatGPT的"AI Engineering Governance Guide"
> **文档版本**: v1.0

---

## 📑 目录

1. [治理目标与原则](#1-治理目标与原则)
2. [四层架构职责边界](#2-四层架构职责边界)
3. [AI编码前的5个必查项](#3-ai编码前的5个必查项)
4. [AI编码的7步标准流程](#4-ai编码的7步标准流程)
5. [代码复用与复杂度控制](#5-代码复用与复杂度控制)
6. [常见违规场景与纠正](#6-常见违规场景与纠正)
7. [架构演进与维护](#7-架构演进与维护)

---

## 1. 治理目标与原则

### 1.1 为什么需要AI工程治理

本项目使用 **AI 辅助开发**。AI 生成代码时必须遵守工程治理规范。

**核心问题**：

- AI倾向于**快速实现功能**，但可能忽视长期可维护性
- AI可能**跨层调用**，破坏架构边界
- AI可能**创建重复代码**，增加维护成本
- AI可能**忽视文件规模**，导致代码腐化

**解决方案**：建立强制性的工程治理规范。

---

### 1.2 治理的核心目标

本规范的目标是：

| 目标 | 说明 |
|------|------|
| 保持代码结构长期稳定 | 架构不因AI修改而退化 |
| 防止架构退化 | 严格的分层边界，禁止跨层调用 |
| 控制代码复杂度 | 文件规模阈值，强制拆分超标文件 |
| 提高可维护性 | 代码复用，减少重复逻辑 |

**AI的职责不是简单实现功能，而是在既定架构下扩展系统能力。**

---

### 1.3 AI的角色定位

**AI是什么**：

- ✅ **架构的执行者**（在规范内编写代码）
- ✅ **技术方案的设计者**（提供多个方案供用户选择）
- ✅ **代码质量的守护者**（自我审查、测试、文档）

**AI不是什么**：

- ❌ **架构的破坏者**（不可为了快速实现而破坏架构）
- ❌ **决策的独裁者**（重大决策必须征得用户同意）
- ❌ **技术债务的制造者**（不可创建重复代码或超标文件）

---

### 1.4 基本原则

**原则1：架构优先于功能**
如果实现某个功能会破坏架构，应优先重构架构，而不是勉强实现。

**原则2：复用优先于创建**
在编写新逻辑前，必须检查系统中是否已有可复用逻辑。

**原则3：清晰优先于简洁**
宁可代码稍长但职责清晰，不可为了简洁而混淆职责。

**原则4：长期优先于短期**
优先考虑代码的长期可维护性，而不是短期开发速度。

---

## 2. 四层架构职责边界

### 2.1 架构概览

本项目遵循**四层架构**（简单场景可退化为三层）：

```
Component 层（UI层）
    ↓ 简单场景：直接调用 Store
    ↓ 复杂场景：调用 Composable
Composable 层（业务流程层）⭐ 可选
    ↓ 协调多个 Store
Store 层（状态管理层）
    ↓ 调用 Repository
Repository 层（数据访问层）
    ↓ 调用 API
API 层（后端接口）
```

**关键决策：Composable层是可选的，不是强制的。**

---

### 2.2 Component 层（UI层）

#### 职责

**Component 负责**：

- ✅ 用户界面渲染（模板、样式）
- ✅ 用户交互处理（点击、输入、拖拽）
- ✅ UI状态管理（加载状态、错误提示、弹窗显示）
- ✅ 简单场景：直接调用 Store
- ✅ 复杂场景：调用 Composable

**Component 不负责**：

- ❌ 复杂业务逻辑（>50行）→ 应提取到 Composable
- ❌ 数据访问（调用API）→ 应由 Repository 负责
- ❌ 跨模块状态管理 → 应由 Store 负责
- ❌ 多Store协调 → 应由 Composable 负责

#### 规模阈值

**Component 层阈值：<800行**

超过800行说明职责过重，应：
- 提取业务逻辑到 Composable
- 拆分为多个子组件
- 提取纯UI组件到 components/

#### 示例

**✅ 正确示例（三层架构 - 简单场景）**：

```vue
<script setup>
import { useCategoryStore } from '@/store/category'

const categoryStore = useCategoryStore()

async function handleCreate() {
  await categoryStore.createCategory({ name: form.value.name })
}
</script>
```

**✅ 正确示例（四层架构 - 复杂场景）**：

```vue
<script setup>
import { useTaskForm } from '@/composables/useTaskForm'

const { form, errors, submitForm } = useTaskForm({ mode: 'create' })

async function handleSubmit() {
  try {
    await submitForm()
    uni.showToast({ title: '保存成功' })
  } catch (error) {
    uni.showToast({ title: error.message })
  }
}
</script>
```

**❌ 错误示例（Component过重）**：

```vue
<script setup>
// ❌ 错误：Component包含100+行业务逻辑
const form = ref({ /* 30+字段 */ })

function validateForm() { /* 50行验证逻辑 */ }
function formatDate() { /* 30行格式化 */ }
async function submitForm() { /* 50行提交逻辑 */ }
</script>
```

---

### 2.3 Composable 层（业务流程层）⭐ 新增

#### 职责

**Composable 负责**：

- ✅ 复杂表单逻辑封装（表单状态、验证、提交）
- ✅ 多Store协调编排（同时操作3+个Store）
- ✅ 页面级业务流程（拖拽状态机、日历计算）
- ✅ 可复用业务逻辑（象限管理、优先级计算）

**Composable 不负责**：

- ❌ 全局状态管理 → 应由 Store 负责
- ❌ 数据持久化操作 → 应由 Repository 负责
- ❌ 纯工具函数（无状态、无副作用）→ 应放 utils/
- ❌ 访问 DOM 或浏览器 API → 应由 Component 负责
- ❌ 直接调用 Repository 或 API → 必须通过 Store

#### 何时使用 Composable

**决策树**：

```
步骤1：判断场景复杂度
  → 简单列表展示、简单CRUD？ → 使用三层架构（跳过Composable）
  → 复杂表单、多Store协调、复杂交互？ → 继续判断

步骤2：判断是否需要 Composable
  → 表单字段 > 15个？ → ✅ 使用 Composable
  → 需要协调 3+ 个 Store？ → ✅ 使用 Composable
  → 多个页面重复业务逻辑？ → ✅ 使用 Composable
  → 复杂交互（拖拽、状态机）？ → ✅ 使用 Composable
  → 否则 → 使用三层架构（跳过Composable）
```

#### 规模阈值

**Composable 层阈值：<600行**

超过600行说明职责过重，应：
- 提取纯工具函数到 utils/
- 拆分为多个 Composable
- 将部分逻辑下沉到 Store

#### 示例

**✅ 正确示例**：

```javascript
// composables/useTaskForm.js
import { ref, computed } from 'vue'
import { useTaskStore } from '@/store/task'
import { useCategoryStore } from '@/store/category'

export function useTaskForm(options = {}) {
  const taskStore = useTaskStore()
  const categoryStore = useCategoryStore()

  // 局部状态（不是全局状态）
  const form = ref({ title: '', categoryId: null })
  const errors = ref({})

  // 业务方法（协调多个Store）
  async function submitForm() {
    if (!validateForm()) throw new Error('验证失败')

    const task = await taskStore.createTask(form.value)
    await categoryStore.linkTaskToCategory(task.id, form.value.categoryId)

    return task
  }

  return { form, errors, submitForm }
}
```

**❌ 错误示例（跨层调用）**：

```javascript
// ❌ 错误：Composable直接调用Repository
import { taskRepository } from '@/repositories/taskRepository'

export function useTaskForm() {
  async function submitForm() {
    await taskRepository.create(form.value)  // ❌ 跨层调用！
  }
}
```

---

### 2.4 Store 层（状态管理层）

#### 职责

**Store 负责**：

- ✅ 全局状态管理（Pinia响应式状态）
- ✅ 调用 Repository 的方法
- ✅ 提供计算属性（computed）
- ✅ 管理简单业务逻辑（如任务四象限分组）

**Store 不负责**：

- ❌ 直接调用 API → 应由 Repository 负责
- ❌ 直接操作 localStorage → 应由 Repository 负责
- ❌ 复杂业务流程（>50行）→ 应由 Composable 协调
- ❌ UI状态管理 → 应由 Component 或 Composable 负责

#### 规模阈值

**Store 层阈值：<400行**

超过400行说明职责过重，应：
- 按功能模块拆分为多个 Store
- 将复杂业务流程提取到 Composable
- 将数据访问逻辑下沉到 Repository

#### 示例

**✅ 正确示例**：

```javascript
// store/category.js
import { defineStore } from 'pinia'
import { computed } from 'vue'
import CategoryRepository from '@/repositories/CategoryRepository'

export const useCategoryStore = defineStore('category', () => {
  // 状态（计算属性，自动从Repository获取）
  const categories = computed(() => CategoryRepository.getAll())

  // Actions（调用Repository）
  async function createCategory(data) {
    return await CategoryRepository.create(data)
  }

  return { categories, createCategory }
})
```

**❌ 错误示例（绕过Repository）**：

```javascript
// ❌ 错误：Store直接调用API
import { categoryApi } from '@/api/category'

async function createCategory(data) {
  const res = await categoryApi.create(data)  // ❌ 绕过Repository！
}
```

---

### 2.5 Repository 层（数据访问层）

#### 职责

**Repository 负责**：

- ✅ 数据 CRUD 操作
- ✅ memoryCache 内存缓存（Map结构）
- ✅ localStorage 持久化
- ✅ operationQueue 离线操作队列
- ✅ 版本控制（乐观锁，version字段）
- ✅ syncWithServer() 后台同步
- ✅ 调用 API

**Repository 不负责**：

- ❌ 业务逻辑 → 应由 Store 或 Composable 负责
- ❌ 访问 Vue 实例 → 应保持纯 JS 逻辑
- ❌ 访问 DOM → 应保持纯逻辑

#### 规模阈值

**Repository 层阈值：<500行**

超过500行说明职责过重，应：
- 按数据实体拆分为多个 Repository
- 提取公共逻辑到 BaseRepository

#### 示例

**✅ 正确示例**：

```javascript
// repositories/CategoryRepository.js
class CategoryRepository {
  constructor() {
    this.memoryCache = new Map()
    this.operationQueue = []
  }

  async create(data) {
    const category = { id: this._generateId(), ...data }
    this.memoryCache.set(category.id, category)
    this._addToQueue({ type: 'create', data: category })
    this._saveToLocalStorage()
    this._debouncedSync()
    return category
  }
}
```

---

### 2.6 跨层调用规则

**允许的调用链**：

- ✅ Component → Composable → Store → Repository → API
- ✅ Component → Store → Repository → API（简单场景）
- ✅ utils/ ← 所有层都可以调用

**禁止的调用链**：

- ❌ Component → Repository（跨层）
- ❌ Component → API（跨层）
- ❌ Composable → Repository（跨层）
- ❌ Composable → API（跨层）
- ❌ Store → API（绕过Repository）

---

## 3. AI编码前的5个必查项

### 3.1 必查项1：架构分层检查

**检查问题**：我要修改/新增的代码应该放在哪一层？

**决策树**：

```
步骤1：识别代码性质
  → 纯工具函数（不依赖Vue响应式）？ → 放 utils/
  → 数据CRUD、缓存、同步？ → 放 Repository
  → 全局状态管理？ → 放 Store
  → 复杂业务流程（表单逻辑、多Store协调）？ → 放 Composable
  → UI渲染、用户交互？ → 放 Component

步骤2：检查调用关系
  ✅ 允许的调用链：
    Component → Composable → Store → Repository → API
    Component → Store → Repository → API（简单场景）
    utils/ ← 所有层都可以调用

  ❌ 禁止的调用链：
    Component → Repository（跨层调用）
    Component → API（跨层调用）
    Composable → Repository（跨层调用）
    Composable → API（跨层调用）
    Store → API（绕过Repository）
```

**检查清单**：

- [ ] 我明确知道这段代码属于哪一层（Component/Composable/Store/Repository/Utils）
- [ ] 我确认这一层的职责边界
- [ ] 我确认调用链符合架构规范（不跨层调用）
- [ ] 如果是新建 Composable，我已确认符合创建条件

---

### 3.2 必查项2：文件大小检查

**检查问题**：修改后文件是否会超过阈值？

**阈值表**：

| 层级 | 阈值 | 检查命令 |
|------|------|---------|
| Component | <800行 | `wc -l <文件路径>` |
| Composable | <600行 | `wc -l <文件路径>` |
| Store | <400行 | `wc -l <文件路径>` |
| Repository | <500行 | `wc -l <文件路径>` |
| Utils | <300行 | `wc -l <文件路径>` |

**检查流程**：

```bash
# 步骤1：检查当前文件行数
wc -l <目标文件>

# 步骤2：评估本次修改行数
# - 简单功能：~50-100行
# - 中等功能：~100-300行
# - 复杂功能：~300-500行

# 步骤3：判断
如果 当前行数 + 预计新增 > 阈值：
  → 先完成当前功能（不打断工作流）
  → 功能完成后，立即执行"超标文件登记流程"
否则：
  → 正常编写代码
```

**检查清单**：

- [ ] 我已运行 `wc -l` 检查目标文件当前行数
- [ ] 我已评估本次修改的代码量
- [ ] 如果会超标，我已确认是否需要先拆分再修改
- [ ] 如果功能完成后超标，我将立即登记到《超标文件追踪清单.md》

---

### 3.3 必查项3：字段命名检查

**检查问题**：我要创建的字段是否已存在？命名是否符合规范？

**强制规范**：

1. **创建新字段前必须先查阅**：`docs/02-技术设计/详细字段映射表.md`
2. **命名规范**：
   - 数据库字段：snake_case（如 user_id、created_at）
   - 后端代码字段：camelCase（如 userId、createdAt）
   - 前端代码字段：camelCase（如 userId、createdAt）
3. **Sequelize 自动映射**：underscored: true（数据库 ↔ 代码自动转换）

**检查流程**：

```bash
# 步骤1：搜索《详细字段映射表》
cat docs/02-技术设计/详细字段映射表.md | grep -i "<关键词>"

# 步骤2：确认字段不存在后
# - 数据库：创建 migration 文件，字段用 snake_case
# - 后端Model：在 Sequelize Model 中定义，字段用 camelCase
# - 前端：在 Repository/Store 中使用，字段用 camelCase

# 步骤3：更新文档
# 在《详细字段映射表.md》对应表格中新增一行
```

**检查清单**：

- [ ] 我已查阅《详细字段映射表.md》确认字段不存在
- [ ] 数据库字段命名使用 snake_case
- [ ] 代码字段命名使用 camelCase
- [ ] 我已更新《详细字段映射表.md》添加新字段记录

---

### 3.4 必查项4：三端兼容检查（UniApp专用）

**检查问题**：我的代码是否兼容 Android / iOS / H5 三端？

**强制规范**：

| 场景 | 禁止写法 | 正确写法 |
|------|---------|---------|
| 输入框双向绑定 | `v-model` | `:value` + `@input` |
| 本地存储 | `localStorage.setItem()` | `uni.setStorageSync()` |
| 网络请求 | `axios.get()` | `uni.request()` 或封装的 `utils/request.js` |
| 路由跳转 | `router.push()` | `uni.navigateTo()` / `uni.reLaunch()` |
| 样式单位 | `px` | `rpx`（自动适配不同屏幕） |

**条件编译写法**：

```vue
<!-- 模板中 -->
<!-- #ifdef H5 -->
<view>仅H5显示</view>
<!-- #endif -->

<!-- #ifdef APP-PLUS -->
<view>仅App显示</view>
<!-- #endif -->

<!-- JS中 -->
// #ifdef H5
console.log('H5环境')
// #endif

// #ifdef APP-PLUS
plus.device.getInfo(...)
// #endif
```

**检查清单**：

- [ ] 我没有使用仅 `v-model`（已改用 `:value` + `@input`）
- [ ] 我没有直接使用 `localStorage`（已改用 `uni.setStorageSync`）
- [ ] 我没有直接使用 `axios`（已使用项目封装的 `utils/request.js`）
- [ ] 我没有使用 `router.push`（已改用 `uni.navigateTo` 等 uni API）
- [ ] 样式单位使用 `rpx`，避免直接写 `px`

---

### 3.5 必查项5：文档同步检查

**检查问题**：我的修改是否需要同步更新文档？

**需要更新文档的场景**：

| 修改类型 | 需要更新的文档 |
|---------|--------------|
| 新增 API 接口 | `docs/03-API文档/<模块名>接口.md` |
| 新增数据库表/字段 | `docs/02-技术设计/详细字段映射表.md` + `database/schema/<表名>.sql` |
| 重大架构决策 | `docs/06-AI协作日志/02-架构决策记录(ADR)/ADR-NNN-主题.md` |
| 新增配置项 | `docs/02-技术设计/配置管理.md` |
| 新增 Composable | `.claude/CLAUDE.md` 第4.4节 + 第7.9节 |
| 创建任何 .md 文件 | `.claude/文档导航.md`（强制登记） |
| 文件超过阈值 | `docs/02-技术设计/超标文件追踪清单.md` |

**检查清单**：

- [ ] 我已确认是否需要更新文档
- [ ] 如果创建了 .md 文件，我已在 `.claude/文档导航.md` 中登记
- [ ] 如果新增了字段，我已更新《详细字段映射表.md》
- [ ] 如果文件超标，我已登记到《超标文件追踪清单.md》

---

## 4. AI编码的7步标准流程

### 4.1 步骤1：理解需求（5分钟）

**目标**：准确理解用户意图，避免返工

**检查清单**：

- [ ] 明确用户要求：具体要实现什么功能？
- [ ] 识别修改范围：涉及哪些文件？哪些层级？
- [ ] 评估复杂度：简单/中等/复杂？预计代码量？
- [ ] 识别风险：是否会破坏现有功能？是否需要重构？

**如果需求不清晰**：使用 AskUserQuestion 工具向用户提问，而不是凭猜测实现。

---

### 4.2 步骤2：执行5个必查项（10分钟）

**强制执行**：

- [ ] 必查项1：架构分层检查 ✅
- [ ] 必查项2：文件大小检查 ✅
- [ ] 必查项3：字段命名检查 ✅
- [ ] 必查项4：三端兼容检查（UniApp） ✅
- [ ] 必查项5：文档同步检查 ✅

**如果任一必查项不通过，立即停止，向用户说明情况。**

---

### 4.3 步骤3：设计方案（15分钟）

**目标**：设计清晰的实现方案，而不是边写边想

**任务**：

- [ ] 绘制调用链图：Component → Composable → Store → Repository → API
- [ ] 确认文件结构：需要新建哪些文件？修改哪些文件？
- [ ] 评估风险：是否会破坏现有功能？是否需要重构？
- [ ] 设计测试策略：如何验证功能？需要哪些测试用例？

**如果方案复杂**：向用户展示方案，征求意见后再实施。

---

### 4.4 步骤4：编写代码（核心）

**编码原则**：

- [ ] 按层级编写：Repository → Store → Composable → Component（自底向上）
- [ ] 每写一个函数添加JSDoc注释（中文）
- [ ] 每完成一层提交一次Git commit（便于回滚）
- [ ] 遵循命名规范：数据库 snake_case，代码 camelCase

**编码禁忌**：

- ❌ 不写注释
- ❌ 跨层调用
- ❌ 创建重复代码
- ❌ 硬编码魔法数字
- ❌ 忽视三端兼容

---

### 4.5 步骤5：自我审查（10分钟）

**检查项**：

- [ ] 运行 ESLint 检查：`npm run lint`（无错误）
- [ ] 检查是否有跨层调用：Component 直接调 Repository？
- [ ] 检查是否有硬编码：魔法数字、魔法字符串？
- [ ] 检查是否有TODO未处理：遗留的TODO必须处理或记录
- [ ] 检查文件大小：是否新增超标文件？

---

### 4.6 步骤6：测试（15分钟）

**测试清单**：

- [ ] 编写单元测试（至少覆盖核心函数）
- [ ] 手动测试三端（H5 + Android + iOS，至少测H5）
- [ ] 测试离线模式（如果涉及数据操作）
- [ ] 测试边界情况（空数据、超长输入、网络异常）

---

### 4.7 步骤7：更新文档和日志（10分钟）

**文档更新**：

- [ ] 更新工作日志：记录今日完成的功能、决策、问题
- [ ] 更新 CURRENT_STATUS.md：当前进度、下一步任务
- [ ] 更新相关文档（API文档、字段映射表、超标清单等）
- [ ] 提交最终Git commit + push

---

## 5. 代码复用与复杂度控制

### 5.1 代码复用策略

**原则**：AI在编写新逻辑前，必须优先检查系统中是否已有可复用逻辑。

**检查流程**：

```
步骤1：明确要实现的功能
  ↓
步骤2：搜索现有代码
  - 使用 Grep 工具搜索关键词
  - 检查相关模块的 Store/Composable
  ↓
步骤3：判断是否可复用
  → 功能完全相同？ → 直接复用
  → 功能部分相同？ → 提取公共逻辑，新建可复用函数
  → 功能完全不同？ → 新建逻辑
```

**复用层级**：

| 层级 | 复用策略 |
|------|---------|
| Component | 提取可复用UI组件到 components/ |
| Composable | 多个页面共享业务逻辑 → 新建 Composable |
| Store | 跨模块状态 → 提取到共享 Store |
| Repository | 相同数据实体 → 复用 Repository |
| Utils | 纯函数工具 → 提取到 utils/ |

**目标**：

- 减少重复代码
- 提高逻辑一致性
- 降低维护成本

---

### 5.2 文件规模管理

**原则**：为了保持代码可读性，文件规模必须受到控制。

**阈值表（重申）**：

| 层级 | 阈值 | 超标策略 |
|------|------|---------|
| Component | <800行 | 提取 Composable / 拆分子组件 |
| Composable | <600行 | 提取 utils/ / 拆分多个 Composable |
| Store | <400行 | 拆分多个 Store |
| Repository | <500行 | 拆分多个 Repository |
| Utils | <300行 | 拆分多个工具文件 |

**超标处理流程**：

```
步骤1：AI发现文件超标
  ↓
步骤2：立即登记到《超标文件追踪清单.md》
  ↓
步骤3：向用户发出提醒
  "⚠️ 文件 xxx.vue 已超标（X行，超标Y%）"
  ↓
步骤4：询问用户是否需要生成拆分方案
  → 用户同意 → 生成评估报告和拆分方案
  → 用户拒绝 → 保持现状，但持续追踪
```

**拆分原则**：

- ✅ 按职责划分
- ✅ 按逻辑边界划分
- ❌ 避免产生新的复杂依赖

**拆分的目标不是减少代码量，而是降低复杂度。**

---

### 5.3 组件复杂度控制

**原则**：组件应该保持简单。

**组件主要职责**：

- 展示数据
- 触发事件

**组件不应成为**：

- ❌ 业务逻辑中心
- ❌ 数据访问中心
- ❌ 状态管理中心

**复杂度信号**（出现以下信号说明组件过于复杂）：

| 信号 | 说明 | 解决方案 |
|------|------|---------|
| 文件 > 800行 | 职责过重 | 提取 Composable |
| 函数 > 50行 | 逻辑复杂 | 拆分为多个小函数 |
| 嵌套 > 4层 | 逻辑复杂 | 提取子函数或子组件 |
| 操作 3+ 个 Store | 协调复杂 | 提取 Composable 协调 |

---

### 5.4 业务逻辑集中管理

**原则**：复杂业务逻辑应集中管理。

**集中位置**：

| 逻辑类型 | 集中位置 |
|---------|---------|
| 复杂表单逻辑 | Composable（如 useTaskForm.js） |
| 多Store协调 | Composable |
| 全局状态管理 | Store |
| 数据访问 | Repository |
| 纯工具函数 | utils/ |

**好处**：

- ✅ 逻辑一致性（修改一处，全局生效）
- ✅ 修改成本降低（不需要修改多个文件）
- ✅ 代码更容易维护（逻辑集中，易于理解）

---

## 6. 常见违规场景与纠正

### 6.1 违规场景1：直接修改代码，跳过5个必查项

**现象**：

- 用户说"帮我在任务表单加个优先级字段"
- AI 直接修改 Component 代码，没有检查架构分层
- 结果：Composable 层已有优先级逻辑，导致重复代码

**违规点**：跳过必查项1（架构分层检查）和必查项3（字段命名检查）

**正确做法**：

1. 执行必查项3（字段命名检查）→ 发现 `priority` 字段已存在
2. 执行必查项1（架构分层检查）→ 发现应该复用 Composable 中的逻辑
3. 修改方案：在 Component 中调用 Composable 的 `getPriorityLabel()` 方法

---

### 6.2 违规场景2：Composable 直接调用 Repository

**现象**：

```javascript
// ❌ 错误写法（Composable 直接调 Repository）
import { taskRepository } from '@/repositories/taskRepository'

export function useTaskForm() {
  async function submitForm() {
    await taskRepository.create(form.value)  // 跨层调用！
  }
}
```

**违规点**：跨层调用，破坏架构分层

**正确做法**：

```javascript
// ✅ 正确写法（Composable 调用 Store）
import { useTaskStore } from '@/store/task'

export function useTaskForm() {
  const taskStore = useTaskStore()

  async function submitForm() {
    await taskStore.createTask(form.value)  // 通过Store调用
  }
}
```

---

### 6.3 违规场景3：文件超标后不登记

**现象**：

- 完成功能后，文件从 750行 → 920行（超过800行阈值）
- AI 没有登记到《超标文件追踪清单.md》
- 用户无法追踪技术债务

**违规点**：跳过必查项2（文件大小检查）

**正确做法**：

1. 运行 `wc -l <文件路径>`
2. 发现超标（920行 > 800行）
3. 更新《超标文件追踪清单.md》，新增一行记录
4. 向用户发出提醒："该文件已超标15%，是否需要生成拆分方案？"

---

### 6.4 违规场景4：创建重复代码

**现象**：

- task-edit.vue 和 AddTaskPanel.vue 有 85% 相同的表单逻辑
- AI 在两个文件中重复编写相同代码
- 导致维护成本倍增

**违规点**：违反代码复用原则

**正确做法**：

1. 识别重复逻辑（表单状态管理、验证、提交）
2. 提取到 Composable：`composables/useTaskForm.js`
3. 两个组件复用同一 Composable
4. 消除 70% 代码重复

---

### 6.5 违规场景5：Component 包含复杂业务逻辑

**现象**：

- Component 文件 3000+ 行
- 包含 100+ 行验证逻辑、50+ 行格式化逻辑、150+ 行提交逻辑
- 导致 Component 难以维护

**违规点**：Component 职责过重

**正确做法**：

1. 提取验证逻辑到 Composable
2. 提取格式化逻辑到 utils/
3. 提取提交逻辑到 Composable
4. Component 只保留 UI 逻辑（<100行）

---

## 7. 架构演进与维护

### 7.1 架构演进原则

**原则1：优先优化结构，而不是增加抽象层**
不要为了抽象而抽象，只有当确实需要时才引入新层级。

**原则2：保持职责清晰**
每一层的职责边界必须清晰，不可混淆。

**原则3：避免产生新的复杂耦合**
架构调整的目标是降低复杂度，而不是增加新的耦合。

**原则4：渐进式演进**

- 简单场景：使用三层架构
- 复杂场景：使用四层架构
- 不强制所有代码迁移到四层

---

### 7.2 技术债务管理

**技术债务来源**：

| 来源 | 说明 | 管理方式 |
|------|------|---------|
| 超标文件 | 文件规模超过阈值 | 登记到《超标文件追踪清单.md》 |
| 重复代码 | 多处重复相同逻辑 | 识别后提取可复用组件/函数 |
| 跨层调用 | 破坏架构分层 | ESLint 检查 + Code Review |
| 缺少测试 | 核心功能无测试覆盖 | 要求每个功能编写测试 |

**管理流程**：

```
步骤1：AI 发现技术债务
  ↓
步骤2：登记到相应文档
  - 超标文件 → 超标文件追踪清单.md
  - 架构问题 → CURRENT_STATUS.md "已知问题"
  ↓
步骤3：向用户提醒
  ↓
步骤4：等待用户决策
  → 立即处理
  → 延后处理（优先级排序）
  → 不处理（记录原因）
```

---

### 7.3 长期维护目标

**目标1：清晰的职责边界**
每一层的职责清晰，不混淆。

**目标2：可控的文件规模**
所有文件规模在阈值内，超标文件有计划拆分。

**目标3：高度可复用的业务逻辑**
复杂业务逻辑集中管理，多处复用。

**目标4：稳定的数据访问结构**
Repository 层稳定，离线队列、缓存、同步机制可靠。

**AI生成的代码必须服务于这些目标。**

---

## 附录

### A. AI 行为约束清单

**必须遵守**：

- ✅ 修改代码前执行5个必查项
- ✅ 按照7步标准流程编码
- ✅ 遵守分层架构，不跨层调用
- ✅ 优先复用现有逻辑
- ✅ 文件超标立即登记
- ✅ 每个函数添加 JSDoc 注释（中文）
- ✅ 编写单元测试
- ✅ 更新相关文档

**禁止行为**：

- ❌ 跳过必查项直接编码
- ❌ 跨层调用（破坏架构）
- ❌ 创建重复代码
- ❌ 文件超标不登记
- ❌ 为了快速实现而破坏架构
- ❌ 不写注释
- ❌ 不写测试
- ❌ 不更新文档

---

### B. 违规等级与后果

**轻微违规**（如忘记更新文档）：

- AI 在下次会话开始时补充更新文档
- 在工作日志中记录违规和纠正过程

**中度违规**（如跨层调用）：

- 立即回滚代码（git reset）
- 重新执行7步流程
- 在工作日志中记录违规原因和改进措施

**严重违规**（如破坏架构、泄露敏感信息）：

- 立即停止所有操作
- 向用户汇报违规情况
- 等待用户指示后再继续

---

### C. AI 自查清单（每次提交代码前）

- [ ] 我已完成5个必查项（架构、文件大小、字段、三端兼容、文档）
- [ ] 我已按照7步流程执行（理解→检查→设计→编码→审查→测试→文档）
- [ ] 我没有跨层调用（Component 不直接调 Repository/API）
- [ ] 我没有创建重复字段（已查阅《详细字段映射表》）
- [ ] 我没有使用禁止的API（localStorage、v-model、axios、router.push）
- [ ] 我已添加JSDoc注释（中文）
- [ ] 我已编写单元测试（至少核心函数）
- [ ] 我已运行 ESLint（无错误）
- [ ] 我已更新工作日志和CURRENT_STATUS.md
- [ ] 我已更新相关文档（如果需要）

**如果以上任一项未完成，禁止提交代码。**

---

**文档版本**：v1.0 | **创建日期**：2026-03-09 | **创建者**：Claude Sonnet 4.5

**本文档为AI工程治理核心规范，所有 AI 实例必须严格遵守。**
