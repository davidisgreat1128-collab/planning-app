-- ============================================================
-- Planning App - MySQL 初始化脚本
-- ============================================================
-- 说明: Docker容器首次启动时自动执行（/docker-entrypoint-initdb.d/）
-- 功能: 仅创建数据库和设置字符集
-- 注意: 性能优化配置应放在 my.cnf，不应该在此文件
-- ============================================================

-- 创建生产数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS planning_app_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 切换到生产数据库
USE planning_app_prod;

-- 设置会话字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 设置时区为北京时间
SET time_zone = '+08:00';

-- ============================================================
-- 初始化完成提示
-- ============================================================
SELECT '✅ 数据库初始化完成' AS status;
SELECT DATABASE() AS current_database;
SELECT @@character_set_database AS charset;
SELECT @@collation_database AS collation;
