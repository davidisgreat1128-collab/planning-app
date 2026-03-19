-- ============================================================
-- Planning App - MySQL 初始化脚本
-- ============================================================
-- 说明: Docker容器首次启动时自动执行
-- 功能: 创建数据库、配置字符集、初始化权限
-- ============================================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;

-- ============================================================
-- 数据库配置
-- ============================================================

-- 使用生产数据库
USE planning_app_prod;

-- 设置时区
SET time_zone = '+08:00';

-- ============================================================
-- 性能优化配置
-- ============================================================

-- InnoDB配置
SET GLOBAL innodb_buffer_pool_size = 1073741824;  -- 1GB
SET GLOBAL innodb_log_file_size = 268435456;      -- 256MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2;    -- 提升性能
SET GLOBAL innodb_flush_method = O_DIRECT;

-- 查询缓存（MySQL 8.0已移除查询缓存，此处仅作记录）
-- SET GLOBAL query_cache_type = 1;
-- SET GLOBAL query_cache_size = 67108864;  -- 64MB

-- 连接数配置
SET GLOBAL max_connections = 200;
SET GLOBAL max_connect_errors = 1000;

-- ============================================================
-- 安全配置
-- ============================================================

-- 禁止LOAD DATA LOCAL INFILE（防止SQL注入）
SET GLOBAL local_infile = 0;

-- 启用慢查询日志
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;  -- 记录2秒以上的查询

-- ============================================================
-- 初始化完成
-- ============================================================
SELECT '✅ MySQL初始化完成' AS status;
SELECT VERSION() AS mysql_version;
SELECT DATABASE() AS current_database;
SELECT @@character_set_database AS charset;
SELECT @@collation_database AS collation;
