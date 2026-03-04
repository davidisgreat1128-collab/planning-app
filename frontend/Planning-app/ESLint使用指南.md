# ESLint 使用指南

> **文档目标**: 防止重复声明函数/变量,统一代码风格,提前发现潜在Bug
> **创建日期**: 2026-03-04
> **适用项目**: Planning-app 前端 (UniApp)

---

## 📋 目录

1. [快速开始](#1-快速开始)
2. [核心规则说明](#2-核心规则说明)
3. [常用命令](#3-常用命令)
4. [IDE 集成](#4-ide-集成)
5. [常见问题](#5-常见问题)
6. [规则优先级说明](#6-规则优先级说明)

---

## 1. 快速开始

### 1.1 检查所有页面文件

```bash
cd frontend/Planning-app
npx eslint@8 pages/ --ext .vue,.js
```

### 1.2 检查单个文件

```bash
npx eslint@8 pages/calendar/index.vue
```

### 1.3 自动修复可修复的问题

```bash
npx eslint@8 pages/ --ext .vue,.js --fix
```

**注意**:
- 使用 `npx eslint@8` 确保版本一致(与后端保持 8.x 版本)
- `--fix` 只能修复格式问题(缩进、引号等),无法修复逻辑错误(如重复声明)

---

## 2. 核心规则说明

### 🔴 P0 - 严重Bug预防规则

这些规则会导致 `error` 级别错误,必须修复才能通过检查:

| 规则 | 说明 | 示例 |
|------|------|------|
| `no-redeclare` | **禁止重复声明**(本次配置核心目标) | ❌ `function test() {}; function test() {}` |
| `no-func-assign` | 禁止重新赋值函数声明 | ❌ `function foo() {}; foo = bar;` |
| `no-dupe-keys` | 禁止对象字面量中重复的键 | ❌ `{ a: 1, a: 2 }` |
| `no-duplicate-case` | 禁止重复的 case 标签 | ❌ `case 1: ... case 1: ...` |
| `no-dupe-class-members` | 禁止重复的类成员 | ❌ `class { foo() {} foo() {} }` |
| `no-constant-condition` | 禁止条件中使用常量表达式 | ❌ `if (true) { ... }` |
| `no-unreachable` | 禁止不可达代码 | ❌ `return; console.log('never');` |

### 🟡 P1 - 代码质量规则

这些规则大多是 `warn` 级别,建议修复但不强制:

| 规则 | 说明 | 自动修复 |
|------|------|---------|
| `prefer-const` | 推荐使用 const 声明不会重新赋值的变量 | ✅ |
| `no-unused-vars` | 警告未使用的变量 | ❌ |
| `no-undef` | 禁止使用未声明的变量 | ❌ |
| `eqeqeq` | 要求使用 === 和 !== | ✅ |
| `no-var` | 禁止使用 var(使用 let/const) | ✅ |
| `no-shadow` | 警告变量阴影(内层变量覆盖外层) | ❌ |

### 🟢 P2 - 代码风格规则

这些规则大多可以自动修复:

| 规则 | 要求 | 自动修复 |
|------|------|---------|
| `semi` | 必须使用分号 | ✅ |
| `quotes` | 使用单引号(允许模板字符串) | ✅ |
| `indent` | 2空格缩进 | ✅ |
| `eol-last` | 文件末尾必须有换行 | ✅ |
| `no-trailing-spaces` | 禁止行尾空格 | ✅ |
| `comma-dangle` | 禁止尾随逗号 | ✅ |
| `object-curly-spacing` | 对象花括号内必须有空格 | ✅ |
| `space-before-function-paren` | 函数名和括号之间不要空格 | ✅ |

---

## 3. 常用命令

### 3.1 开发过程中使用

**检查当前正在编辑的文件**:
```bash
npx eslint@8 pages/calendar/index.vue
```

**检查整个模块**:
```bash
npx eslint@8 pages/planning/ --ext .vue,.js
```

**自动修复格式问题**:
```bash
npx eslint@8 pages/calendar/index.vue --fix
```

### 3.2 提交代码前检查

**检查所有页面**:
```bash
npx eslint@8 pages/ --ext .vue,.js
```

**检查所有前端代码**:
```bash
npx eslint@8 . --ext .vue,.js
```

### 3.3 查看详细信息

**只显示错误(不显示警告)**:
```bash
npx eslint@8 pages/ --ext .vue,.js --quiet
```

**输出为JSON格式(用于工具集成)**:
```bash
npx eslint@8 pages/ --ext .vue,.js --format json
```

---

## 4. IDE 集成

### 4.1 VS Code 集成

1. **安装 ESLint 扩展**:
   - 打开 VS Code 扩展面板
   - 搜索 "ESLint"
   - 安装 "ESLint" by Microsoft

2. **配置 VS Code settings.json**:
   ```json
   {
     "eslint.validate": [
       "javascript",
       "javascriptreact",
       "vue"
     ],
     "eslint.workingDirectories": [
       "frontend/Planning-app"
     ],
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

3. **验证配置**:
   - 打开任意 .vue 文件
   - 故意写一个重复声明: `function test() {} function test() {}`
   - 应该看到红色波浪线和错误提示

### 4.2 HBuilderX 集成

HBuilderX 内置 ESLint 支持,但可能需要手动启用:

1. 工具 → 插件安装 → ESLint插件
2. 右键项目 → 配置 → ESLint 验证
3. 选择使用项目根目录的 .eslintrc.js

---

## 5. 常见问题

### Q1: 报错 "Parsing error: Unexpected token"

**原因**: ESLint 无法解析 Vue 单文件组件的语法

**解决方案**:
- 当前配置已简化,不包含 Vue 插件依赖
- 如果需要完整的 Vue 语法支持,需要安装 `eslint-plugin-vue`:
  ```bash
  npm install --save-dev eslint-plugin-vue vue-eslint-parser
  ```

### Q2: 大量 "no-undef" 警告 (uni、wx 等未定义)

**原因**: UniApp 全局变量未声明

**解决方案**:
- 当前配置已包含 UniApp 全局变量声明 (`uni`, `wx`, `plus` 等)
- 如果仍报错,检查 `.eslintrc.js` 的 `globals` 配置

### Q3: "no-shadow" 警告太多

**原因**: 内层作用域变量名与外层重复

**示例**:
```javascript
const userId = 123;
function getUser() {
  const userId = 456;  // ⚠️ no-shadow 警告
}
```

**解决方案**:
- 重命名内层变量(推荐): `const currentUserId = 456;`
- 或临时禁用规则(不推荐): 在文件顶部添加 `/* eslint-disable no-shadow */`

### Q4: 如何临时禁用某个规则?

**单行禁用**:
```javascript
// eslint-disable-next-line no-redeclare
function test() {}
```

**多行禁用**:
```javascript
/* eslint-disable no-redeclare */
function test() {}
function test() {}
/* eslint-enable no-redeclare */
```

**整个文件禁用**:
```javascript
/* eslint-disable no-redeclare */
// 文件内容...
```

### Q5: 自动修复后代码反而出错了

**原因**: ESLint 的 `--fix` 只修复格式,可能改变代码逻辑

**解决方案**:
- 修复前先提交 Git commit
- 修复后运行测试验证功能正常
- 如果出错,使用 `git restore <文件>` 回退

---

## 6. 规则优先级说明

### 优先级定义

| 优先级 | 级别 | 说明 | 处理建议 |
|--------|------|------|---------|
| 🔴 P0 | `error` | 严重Bug,必须修复 | 立即修复,无法跳过 |
| 🟡 P1 | `warn` | 代码质量问题,建议修复 | 提交前修复 |
| 🟢 P2 | `error` | 代码风格问题,可自动修复 | 运行 `--fix` 自动修复 |

### 实际工作流建议

**开发中**:
1. 专注功能实现,暂时忽略警告
2. 编写完一个函数后,运行 ESLint 检查是否有重复声明

**提交前**:
1. 运行 `npx eslint@8 pages/ --ext .vue,.js --fix` 自动修复格式
2. 运行 `npx eslint@8 pages/ --ext .vue,.js` 检查剩余问题
3. 手动修复所有 `error` 级别问题
4. 尽量修复 `warn` 级别问题(未使用变量、变量阴影等)

**重要提交(发布前)**:
1. 运行 `npx eslint@8 . --ext .vue,.js` 检查所有文件
2. 所有错误和警告必须清零

---

## 7. 与项目规范的关系

本 ESLint 配置与项目文档的关系:

| 文档 | 关系 |
|------|------|
| [docs/02-技术设计/代码规范.md](../../docs/02-技术设计/代码规范.md) | ESLint 自动化执行部分代码规范 |
| [BUG-001-index.vue重复声明问题汇总.md](../../docs/06-AI协作日志/03-Bug分析记录/BUG-001-index.vue重复声明问题汇总.md) | ESLint 防止该文档中描述的重复声明问题再次发生 |
| [.claude/CLAUDE.md](../../.claude/CLAUDE.md) 第7.5节 | ESLint 强制执行中文注释、命名规范等 |

---

## 8. 下一步优化建议

### 短期(1-2周)

1. **添加 pre-commit hook**:
   ```bash
   npm install --save-dev husky lint-staged
   ```
   配置自动在 Git commit 前运行 ESLint

2. **CI/CD 集成**:
   在 GitHub Actions 中添加 ESLint 检查步骤

### 中期(1个月)

1. **添加 Vue 插件支持**:
   安装 `eslint-plugin-vue` 获得完整的 Vue 语法检查

2. **自定义规则**:
   根据团队实践,调整规则严格程度

### 长期(2-3个月)

1. **迁移到 TypeScript + ESLint**:
   获得更强的类型检查能力

2. **统一后端和前端 ESLint 配置**:
   提取公共规则到根目录 `.eslintrc.js`

---

**文档版本**: v1.0 | **创建时间**: 2026-03-04 | **作者**: Claude Sonnet 4.5
