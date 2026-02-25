# Teleport（传送门）使用说明

## 📖 什么是Teleport

**Teleport** 是 Vue 3 提供的内置组件，允许我们将组件的内容"传送"到 DOM 树的任意位置，而不影响组件的逻辑和数据流。

---

## 🎯 为什么需要Teleport

### 问题场景

在我们的项目中遇到了这样的问题：

```
页面结构：
└─ body
   └─ #app
      └─ AddTaskPanel（任务面板，底部弹窗）
         ├─ category-picker（分类选择器，也是弹窗）
         │  └─ CategoryDialog（新建分类对话框）❌
         └─ 其他内容
```

**问题**：
- CategoryDialog 在 AddTaskPanel 的 DOM 内部
- AddTaskPanel 本身就是一个底部弹窗
- CategoryDialog 的 `position: fixed` 相对于 AddTaskPanel 定位
- 导致 CategoryDialog **只相对于分类选择器居中**，而不是相对于整个屏幕居中

**用户期望**：
- CategoryDialog 应该相对于**整个屏幕**居中
- 就像一个独立的模态对话框

---

## ✅ Teleport 解决方案

### 使用方法

```vue
<template>
  <view class="add-task-panel">
    <!-- 其他内容 -->

    <!-- 使用 teleport 将弹窗传送到 body -->
    <teleport to="body">
      <CategoryDialog
        :visible="showCategoryDialog"
        @update:visible="showCategoryDialog = $event"
        @save="onCategorySave"
      />
    </teleport>
  </view>
</template>
```

### 效果

```
页面结构（修改后）：
└─ body
   ├─ #app
   │  └─ AddTaskPanel（任务面板）
   │     ├─ category-picker（分类选择器）
   │     └─ 其他内容
   │
   └─ CategoryDialog（传送到这里）✅
```

现在 CategoryDialog 的 `position: fixed` 相对于 `body` 定位，实现了真正的全屏居中！

---

## 🔧 技术细节

### 1. Teleport 的工作原理

```vue
<!-- 组件定义在这里 -->
<teleport to="body">
  <MyDialog />
</teleport>

<!-- 但实际渲染到这里 -->
<body>
  <div id="app">...</div>
  <MyDialog />  ← 实际渲染位置
</body>
```

**关键点**：
- 组件的**逻辑**仍然在原来的位置
- 组件的**渲染**被移动到目标位置
- 数据流、事件、生命周期都不受影响

---

### 2. Teleport 的 Props

| 属性 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `to` | string | CSS选择器或DOM元素 | `"body"`, `"#app"`, `".container"` |
| `disabled` | boolean | 是否禁用传送（开发调试用） | `false`（默认） |

**示例**：

```vue
<!-- 传送到 body -->
<teleport to="body">
  <Modal />
</teleport>

<!-- 传送到指定ID的元素 -->
<teleport to="#modals-container">
  <Dialog />
</teleport>

<!-- 条件禁用 -->
<teleport to="body" :disabled="!isMobile">
  <MobileMenu />
</teleport>
```

---

### 3. 多个 Teleport 可以指向同一目标

```vue
<template>
  <teleport to="body">
    <Dialog1 />
  </teleport>

  <teleport to="body">
    <Dialog2 />
  </teleport>
</template>
```

**渲染结果**：
```html
<body>
  <div id="app">...</div>
  <Dialog1 />
  <Dialog2 />
</body>
```

按照 Teleport 在源码中的顺序依次渲染。

---

## 📊 对比：使用 Teleport 前后

### 未使用 Teleport

**问题代码**：
```vue
<view class="add-task-panel">
  <CategoryDialog :visible="showDialog" />
</view>
```

**渲染结果**：
```html
<view class="add-task-panel" style="position: fixed; bottom: 0;">
  <view class="category-dialog-mask" style="position: fixed; top: 0;">
    <!-- fixed 相对于 add-task-panel，不是相对于视口 -->
  </view>
</view>
```

**问题**：
- CategoryDialog 的 `position: fixed` 受父元素影响
- 无法实现真正的全屏居中

---

### 使用 Teleport

**修复代码**：
```vue
<view class="add-task-panel">
  <teleport to="body">
    <CategoryDialog :visible="showDialog" />
  </teleport>
</view>
```

**渲染结果**：
```html
<body>
  <div id="app">
    <view class="add-task-panel" style="position: fixed; bottom: 0;">
      <!-- 原来的内容 -->
    </view>
  </div>

  <!-- CategoryDialog 渲染到这里 -->
  <view class="category-dialog-mask" style="position: fixed; top: 0;">
    <!-- fixed 相对于视口，实现全屏居中 -->
  </view>
</body>
```

**效果**：
- ✅ CategoryDialog 独立于 AddTaskPanel
- ✅ `position: fixed` 相对于整个视口
- ✅ 完美实现全屏居中

---

## 🎨 常见使用场景

### 1. 模态对话框（Modal）

```vue
<template>
  <view class="page">
    <button @tap="showModal = true">打开对话框</button>

    <teleport to="body">
      <Modal :visible="showModal" @close="showModal = false">
        <text>对话框内容</text>
      </Modal>
    </teleport>
  </view>
</template>
```

**优势**：
- 对话框不受页面滚动影响
- z-index 管理更简单
- 避免样式冲突

---

### 2. 全局通知（Toast/Notification）

```vue
<template>
  <teleport to="body">
    <view v-if="showToast" class="toast">
      {{ toastMessage }}
    </view>
  </teleport>
</template>

<style>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
}
</style>
```

---

### 3. 下拉菜单（Dropdown）

```vue
<template>
  <view class="dropdown-trigger" @tap="toggleMenu">
    菜单 ▼
  </view>

  <teleport to="body">
    <view v-if="showMenu" class="dropdown-menu" :style="menuPosition">
      <view class="menu-item">选项1</view>
      <view class="menu-item">选项2</view>
    </view>
  </teleport>
</template>

<script setup>
const menuPosition = computed(() => ({
  top: triggerRect.bottom + 'px',
  left: triggerRect.left + 'px'
}))
</script>
```

---

### 4. 全屏加载遮罩（Loading）

```vue
<template>
  <teleport to="body">
    <view v-if="loading" class="loading-mask">
      <view class="spinner"></view>
      <text>加载中...</text>
    </view>
  </teleport>
</template>

<style>
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
</style>
```

---

## ⚠️ 注意事项

### 1. UniApp 兼容性

在 UniApp 中，`<teleport>` 的支持情况：

| 平台 | 支持情况 | 说明 |
|------|----------|------|
| H5 | ✅ 完全支持 | Vue 3 原生功能 |
| 微信小程序 | ⚠️ 部分支持 | 需要编译器支持 |
| App | ✅ 支持 | nvue 可能有限制 |
| 其他小程序 | ⚠️ 视平台而定 | 建议测试 |

**建议**：
- H5 和 App 平台优先使用
- 小程序平台需要充分测试
- 可以提供降级方案

---

### 2. 降级方案

如果目标平台不支持 `<teleport>`，可以使用条件编译：

```vue
<template>
  <!-- #ifdef H5 || APP-PLUS -->
  <teleport to="body">
    <CategoryDialog :visible="showDialog" />
  </teleport>
  <!-- #endif -->

  <!-- #ifdef MP-WEIXIN -->
  <!-- 小程序降级：直接渲染 -->
  <CategoryDialog :visible="showDialog" />
  <!-- #endif -->
</template>
```

---

### 3. 样式隔离问题

使用 Teleport 后，组件被移到 body，可能会丢失父组件的样式继承：

```vue
<!-- 父组件 -->
<view class="themed-container">
  <teleport to="body">
    <Dialog />  <!-- 无法继承 themed-container 的样式 -->
  </teleport>
</view>
```

**解决方案**：
- 使用全局样式或CSS变量
- 通过 props 传递主题配置
- 在弹窗内部完整定义所需样式

---

### 4. SSR（服务端渲染）

如果项目使用 SSR，需要注意：

```vue
<template>
  <!-- 客户端渲染时才使用 teleport -->
  <teleport to="body" :disabled="isSSR">
    <Modal />
  </teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isSSR = ref(true)

onMounted(() => {
  isSSR.value = false
})
</script>
```

---

## 🧪 测试建议

### 功能测试

- [x] 弹窗能正确全屏居中显示
- [x] 点击遮罩层关闭弹窗
- [x] 弹窗内的交互正常（点击、输入等）
- [x] 数据绑定正常（props、emit）
- [x] 多个弹窗可以同时存在（z-index 正确）

### 兼容性测试

- [x] H5 浏览器测试
- [x] 微信开发者工具测试
- [x] 真机测试（iOS/Android）
- [x] 不同屏幕尺寸测试

### 性能测试

- [x] 弹窗打开/关闭流畅
- [x] 无内存泄漏（反复打开关闭）
- [x] 滚动性能正常

---

## 📝 实际案例：CategoryDialog

### 问题

CategoryDialog 在分类选择器内部，导致只相对于选择器居中：

```vue
<!-- 问题代码 -->
<view class="category-picker">
  <CategoryDialog :visible="showDialog" />
</view>
```

**效果**：
```
┌─────────────────────────┐
│   屏幕                  │
│                         │
│  ┌──────────────────┐  │
│  │ category-picker  │  │
│  │  ┌───────────┐   │  │
│  │  │ Dialog    │   │  │ ← 相对于 picker 居中
│  │  └───────────┘   │  │
│  └──────────────────┘  │
│                         │
└─────────────────────────┘
```

---

### 解决方案

使用 Teleport 将 CategoryDialog 移到 body：

```vue
<!-- 修复代码 -->
<view class="category-picker">
  <teleport to="body">
    <CategoryDialog :visible="showDialog" />
  </teleport>
</view>
```

**效果**：
```
┌─────────────────────────┐
│   屏幕                  │
│                         │
│     ┌───────────┐       │
│     │  Dialog   │       │ ← 相对于屏幕居中
│     └───────────┘       │
│                         │
│  ┌──────────────────┐  │
│  │ category-picker  │  │
│  └──────────────────┘  │
└─────────────────────────┘
```

---

## 🔗 参考资料

- **Vue 3 官方文档**: https://cn.vuejs.org/guide/built-ins/teleport.html
- **UniApp Teleport**: https://uniapp.dcloud.net.cn/tutorial/vue3-api.html#teleport
- **MDN position:fixed**: https://developer.mozilla.org/zh-CN/docs/Web/CSS/position

---

## 📋 总结

### 何时使用 Teleport

✅ **应该使用**：
- 模态对话框（Modal）
- 全局通知（Toast/Notification）
- 全屏遮罩（Loading）
- 下拉菜单（Dropdown）
- 任何需要脱离父组件层级的UI

❌ **不需要使用**：
- 普通的嵌套组件
- 不需要全屏定位的元素
- 目标平台不支持时

### 最佳实践

1. **明确目标**：确认组件需要脱离父组件层级
2. **选择目标**：通常使用 `to="body"`
3. **保持逻辑**：数据流和事件不要因为 DOM 位置改变而改变
4. **测试兼容**：在目标平台充分测试
5. **提供降级**：不支持的平台提供降级方案

---

**最后更新**：2026-02-25
**适用版本**：Vue 3 + UniApp
**相关提交**：commit `6cf71ae`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
