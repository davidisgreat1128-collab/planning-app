# 常见问题解决 FAQ

---

## Q1: Sequelize字段查询报错 "column xxx does not exist"

**原因**: 使用了snake_case而不是camelCase调用Sequelize

**错误示例**:
```javascript
User.findOne({ where: { user_id: 'U123' } })  // ❌ 错误
```

**正确做法**:
```javascript
User.findOne({ where: { userId: 'U123' } })  // ✅ 正确
```

---

## Q2: MySQL连接失败

**检查步骤**:
1. 确认MySQL服务是否启动: `net start MySQL80`
2. 检查 `backend/.env.development` 中的密码是否正确
3. 确认数据库是否存在: `SHOW DATABASES LIKE 'planning_app%';`

**MySQL完整路径** (Windows):
```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql" -u root -p
```

---

## Q3: Git push被拒绝

**原因**: 远程分支有新提交，本地落后

**解决**:
```bash
git pull origin develop --rebase
git push origin develop
```

---

## Q4: ESLint报错但不知道怎么改

**查看规则说明**:
```bash
cd backend && npx eslint src/xxx.js --fix  # 自动修复
```

**常见问题**:
- `no-var`: 把 `var` 改成 `const` 或 `let`
- `prefer-const`: 不会被重新赋值的变量用 `const`
- `no-unused-vars`: 删除未使用的变量

---

## Q5: 前端调用API跨域报错 (H5开发时)

**原因**: H5直接请求后端3000端口跨域

**解决**: 在HBuilderX中配置代理，或后端配置cors允许localhost

**后端cors配置** (已在app.js中配置):
```javascript
app.use(cors({ origin: 'http://localhost:8080' }));
```

---

## Q6: 不知道某个功能该放在哪个文件

**参考分层原则**:
- `controllers/` - 处理HTTP请求/响应，不含业务逻辑
- `services/` - 核心业务逻辑，调用models
- `models/` - 数据库模型定义
- `utils/` - 纯工具函数，不依赖业务
- `middleware/` - Express中间件

---

## Q7: 如何添加新的页面 (UniApp)

1. 在 `frontend/Planning-app/pages/模块名/` 目录下创建 `index.vue`
2. 在 `frontend/Planning-app/pages.json` 中注册路由:
```json
{
  "path": "pages/planning/life/index",
  "style": { "navigationBarTitleText": "人生规划" }
}
```

---

## Q8: 遇到完全不知道怎么处理的技术问题

1. 查阅 `docs/` 对应文档
2. 查阅历史工作日志看是否有类似问题
3. 如果是架构级问题，先记录到工作日志的"问题与风险"
4. 告知唐伯虎，等待指示
5. **不要自己做重大决定**
