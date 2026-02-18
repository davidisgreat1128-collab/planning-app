-- ============================================================
-- Planning App 数据库初始化脚本
-- 执行方式: mysql -u root -p < database/scripts/init.sql
-- ============================================================

-- 创建开发数据库
CREATE DATABASE IF NOT EXISTS `planning_app_dev`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 创建生产数据库
CREATE DATABASE IF NOT EXISTS `planning_app_prod`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 授权（根据实际情况修改用户名）
-- GRANT ALL PRIVILEGES ON planning_app_dev.* TO 'planning_user'@'localhost';
-- GRANT ALL PRIVILEGES ON planning_app_prod.* TO 'planning_user'@'localhost';
-- FLUSH PRIVILEGES;

SELECT 'databases created successfully' AS result;
