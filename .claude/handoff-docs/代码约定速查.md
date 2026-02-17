# 代码约定速查表

> 开发前必读，避免踩坑

---

## 命名约定

| 场景 | 规范 | 示例 |
|------|------|------|
| 数据库表名 | snake_case 复数 | `users`, `planning_records` |
| 数据库字段 | snake_case | `user_name`, `created_at` |
| JS 变量/参数 | camelCase | `userName`, `createdAt` |
| JS 常量 | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_SIZE` |
| JS 类/模型 | PascalCase | `UserService`, `User` |
| Vue 组件 | PascalCase | `UserProfile.vue` |
| 路由文件 | kebab-case | `user-routes.js` |
| 布尔变量 | is/has/should前缀 | `isActive`, `hasPermission` |

---

## Sequelize 约定

```javascript
// ✅ 正确 - 使用 camelCase
const user = await User.create({
  userId: 'U123',
  userName: '唐伯虎',
  isActive: true
});

// ❌ 错误 - 不要用 snake_case
const user = await User.create({
  user_id: 'U123',  // 错误！
  user_name: '唐伯虎'  // 错误！
});
```

---

## API 响应约定

```javascript
// 成功
res.json({ success: true, code: 200, message: '操作成功', data: {...} });

// 失败
res.status(400).json({ success: false, code: 400, message: '参数错误' });

// 使用工具函数
const { success, error } = require('../utils/response');
res.json(success(data));
res.status(400).json(error('参数错误', 400));
```

---

## 错误处理约定

```javascript
const { ValidationError, NotFoundError, AuthenticationError } = require('../utils/errors');

// 参数错误
throw new ValidationError('邮箱格式不正确', 'email');

// 资源不存在
throw new NotFoundError('用户');

// 未授权
throw new AuthenticationError('token已过期');
```

---

## Git Commit 约定

```
feat(auth): 实现用户JWT登录
fix(api): 修复登录超时问题
docs(readme): 更新安装说明
test(user): 添加用户服务单元测试
refactor(planning): 优化规划查询逻辑
```

---

## 文件约定

- **密码字段**: `passwordHash` / `password_hash`（不能叫`password`）
- **软删除**: 所有模型配置 `paranoid: true`
- **时区**: 统一使用北京时间 `+08:00`
- **字符集**: 所有表使用 `utf8mb4`
- **环境变量**: 敏感信息放 `.env.development`，不提交到Git

---

## JSDoc 约定

```javascript
/**
 * 根据用户ID获取用户信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户对象
 * @throws {NotFoundError} 用户不存在时抛出
 */
async function getUserById(userId) { ... }
```
