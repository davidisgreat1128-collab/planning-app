# Docker容器重新部署指南

> **目的**: 在服务器上重新部署Docker容器，应用最新的修复（自动运行migration）
> **重要性**: ⭐⭐⭐⭐⭐ 必须执行才能永久解决"Unknown column 'exdate'"错误
> **作者**: Claude Sonnet 4.5
> **日期**: 2026-03-25

---

## 📋 问题回顾

### 之前的问题

1. **3月23日**：手动运行 `npm run migrate` 添加了 `exdate` 字段 ✅
2. **后来某次**：Docker容器重启，数据库被重新初始化，`exdate` 字段丢失 ❌
3. **3月25日**：APP报错 "Unknown column 'exdate' in 'field list'" ❌

### 根本原因

- Docker容器启动时**没有自动运行migration**
- `wait-for-mysql.sh` 只等待MySQL准备好，不执行migration
- 每次容器重启，都需要**手动SSH登录服务器运行migration**

### 永久解决方案

✅ **修改 `wait-for-mysql.sh`**，容器启动时自动运行migration（commit c8d962e）

---

## 🚀 重新部署步骤（服务器上执行）

### 步骤1：SSH登录服务器

```bash
ssh root@154.8.183.203
```

### 步骤2：进入项目目录

```bash
cd ~/planning-app
```

### 步骤3：拉取最新代码

```bash
git fetch origin
git pull origin develop
```

**验证**：确认拉取了 commit c8d962e

```bash
git log --oneline -1
# 应显示：c8d962e fix(docker): 容器启动时自动运行数据库迁移
```

### 步骤4：停止并删除旧容器

```bash
# 停止所有容器
docker-compose down

# 查看是否还有残留容器
docker ps -a

# 如果有，手动删除
docker rm -f planning-backend planning-mysql
```

### 步骤5：重新构建并启动容器

```bash
# 重新构建backend镜像（应用新的wait-for-mysql.sh）
docker-compose build backend

# 启动所有容器
docker-compose up -d

# 查看启动日志（关键：检查是否运行了migration）
docker-compose logs -f backend
```

**预期日志输出**：

```
✅ MySQL 已准备好！
=========================================
🗄️ 运行数据库迁移...
=========================================
Sequelize CLI [Node: 22.20.0, CLI: 6.6.2, ORM: 6.35.0]

Loaded configuration file "src/config/database.js".
Using environment "production".

== 20260323000001-add-exdate-to-tasks: migrating =======
✅ tasks表添加exdate字段成功
== 20260323000001-add-exdate-to-tasks: migrated (0.015s)

✅ Migration 执行成功
=========================================
🚀 启动应用...
=========================================
[2026-03-25 10:30:00] 🚀 服务器启动成功: http://0.0.0.0:3000
```

### 步骤6：验证修复

```bash
# 测试API是否正常
curl http://154.8.183.203/api/v1/tasks?date=2026-03-25 \
  -H "Authorization: Bearer <your_token>"

# 预期：返回200，不再报500错误
```

---

## 🎯 验证清单

部署完成后，确认以下各项：

- [ ] 容器启动日志中显示 "✅ Migration 执行成功"
- [ ] 后端服务正常启动（显示"服务器启动成功"）
- [ ] APP端可以正常加载任务列表（不再报500错误）
- [ ] APP端可以正常创建任务
- [ ] 服务器日志中不再出现 "Unknown column 'exdate'" 错误

---

## 🔄 未来部署流程

**从现在开始**，每次部署只需：

```bash
# 1. 拉取最新代码
git pull origin develop

# 2. 重新构建和启动
docker-compose up -d --build

# 3. 查看日志确认migration执行
docker-compose logs backend | grep -A 5 "运行数据库迁移"
```

**无需手动运行migration**，容器会自动执行！

---

## 🛡️ 数据安全提示

**重要**：如果您担心数据丢失，在执行 `docker-compose down` 前：

```bash
# 备份MySQL数据
docker exec planning-mysql mysqldump -u root -p planning_app_prod > backup-$(date +%Y%m%d).sql

# 输入MySQL密码：wokao@53231812
```

恢复备份：

```bash
# 如果需要恢复
docker exec -i planning-mysql mysql -u root -p planning_app_prod < backup-20260325.sql
```

---

## ❓ 常见问题

### Q1：如果migration执行失败怎么办？

**答**：容器会继续启动（不会因为migration失败而停止），但会打印警告日志。查看日志定位具体错误。

### Q2：如果没有新的migration会怎样？

**答**：Sequelize会输出 "No migrations were executed, database schema was already up to date."，这是正常的。

### Q3：数据库数据会丢失吗？

**答**：不会。Migration只修改schema（表结构），不会删除数据。但为了安全，建议定期备份。

---

## 📞 遇到问题？

如果部署后仍然报错，请提供以下信息：

1. 容器启动日志：`docker-compose logs backend > logs.txt`
2. 服务器日志：查看D:\MyProject\Planning设计\测试日志\服务器.txt
3. APP端错误信息：查看HBuilderX控制台

---

**文档版本**: v1.0
**最后更新**: 2026-03-25
**相关Commit**: c8d962e
