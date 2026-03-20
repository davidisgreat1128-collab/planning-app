# 数据库配置文件说明

## 📁 文件结构

```
database/
├── init.sql          # MySQL 初始化脚本（Docker 启动时执行）
├── my.cnf            # MySQL 配置文件（性能优化、安全配置）
├── schema/           # 数据库表结构设计
├── migrations/       # Sequelize 迁移文件
├── scripts/          # 手动执行的 SQL 脚本
└── seeds/            # 测试数据种子文件
```

## 🔧 配置文件职责划分

### 1. `init.sql` - 初始化脚本

**职责**：仅负责创建数据库和基本设置

**执行时机**：Docker 容器首次启动时（挂载到 `/docker-entrypoint-initdb.d/`）

**包含内容**：
- ✅ 创建数据库（`CREATE DATABASE IF NOT EXISTS`）
- ✅ 设置字符集（`CHARACTER SET utf8mb4`）
- ✅ 设置时区（`SET time_zone = '+08:00'`）

**禁止内容**：
- ❌ `SET GLOBAL` 性能优化参数（应放在 `my.cnf`）
- ❌ 创建表（应由 Sequelize 迁移管理）
- ❌ 复杂业务逻辑

**为什么要这样设计？**
- `SET GLOBAL` 在初始化阶段可能失败（权限/时机问题）
- 保持 `init.sql` 简洁，避免容器启动失败
- 性能配置属于服务器级配置，应该放在 `my.cnf`

---

### 2. `my.cnf` - MySQL 配置文件

**职责**：性能优化、安全配置、字符集配置

**挂载位置**：`/etc/mysql/conf.d/custom.cnf`

**包含内容**：
- ✅ InnoDB 引擎配置（缓冲池、日志文件、刷盘策略）
- ✅ 连接数配置（`max_connections`、`max_connect_errors`）
- ✅ 安全配置（禁用 `local_infile`）
- ✅ 慢查询日志
- ✅ 字符集配置
- ✅ 时区配置

**配置项说明**：

| 配置项 | 值 | 说明 |
|-------|-----|------|
| `innodb_buffer_pool_size` | 1G | InnoDB 缓冲池大小（建议为物理内存的50-80%） |
| `innodb_log_file_size` | 256M | 日志文件大小 |
| `innodb_flush_log_at_trx_commit` | 2 | 每秒刷一次盘（提升性能） |
| `innodb_flush_method` | O_DIRECT | 避免双重缓冲 |
| `max_connections` | 200 | 最大连接数 |
| `slow_query_log` | 1 | 启用慢查询日志 |
| `long_query_time` | 2 | 记录2秒以上的查询 |

---

## 🐳 Docker 挂载配置

在 `docker-compose.yml` 中：

```yaml
mysql:
  volumes:
    - mysql_data:/var/lib/mysql                                  # 数据持久化
    - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # 初始化脚本（只读）
    - ./database/my.cnf:/etc/mysql/conf.d/custom.cnf:ro           # 配置文件（只读）
    - ./backend/logs:/var/log/mysql                               # 日志目录
```

---

## 🚨 常见问题和解决方案

### 问题1：MySQL 容器启动失败（unhealthy）

**可能原因**：
1. `init.sql` 中使用了 `SET GLOBAL` 导致初始化失败
2. `USE <database>` 但数据库不存在（没有 `CREATE DATABASE`）
3. `my.cnf` 配置项错误

**解决方案**：
1. 确保 `init.sql` 只做简单的数据库创建，不做复杂配置
2. 性能优化参数放在 `my.cnf`，不要放在 `init.sql`
3. 检查 Docker 日志：`docker logs planning-app-mysql`

---

### 问题2：字符集不是 utf8mb4

**检查方法**：

```bash
docker exec -it planning-app-mysql mysql -uroot -p -e "SHOW VARIABLES LIKE 'character%';"
```

**正确输出**：

```
+--------------------------+----------------------------+
| Variable_name            | Value                      |
+--------------------------+----------------------------+
| character_set_client     | utf8mb4                    |
| character_set_connection | utf8mb4                    |
| character_set_database   | utf8mb4                    |
| character_set_results    | utf8mb4                    |
| character_set_server     | utf8mb4                    |
| character_set_system     | utf8mb3                    |
+--------------------------+----------------------------+
```

**如果不正确**：
1. 检查 `my.cnf` 是否正确挂载
2. 检查 `init.sql` 中的字符集设置

---

### 问题3：性能配置没有生效

**检查方法**：

```bash
docker exec -it planning-app-mysql mysql -uroot -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
```

**如果显示默认值（128M）而不是 1G**：
1. 检查 `my.cnf` 是否正确挂载
2. 重启容器：`docker-compose restart mysql`
3. 检查 MySQL 错误日志：`docker logs planning-app-mysql | grep -i error`

---

## 📚 相关文档

- [生产部署完整指南](../docs/部署文档/生产部署完整指南.md)
- [数据库表设计](../docs/02-技术设计/数据库表设计.md)
- [Sequelize 迁移指南](../backend/README.md)

---

**最后更新**: 2026-03-20
**维护者**: Claude AI
