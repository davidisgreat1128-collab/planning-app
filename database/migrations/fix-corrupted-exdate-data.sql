-- ========================================
-- 数据库修复脚本：清理损坏的EXDATE数据
-- ========================================
-- 问题：部分任务的EXDATE字段包含损坏数据（如'["[]"]'）
-- 原因：历史数据迁移时产生的三重JSON编码
-- 影响：导致RRuleSet解析失败，删除单日实例功能不生效
-- 修复时间：2026-03-17
-- ========================================

USE planning_app_dev;

-- 步骤1：查看当前损坏的EXDATE数据
SELECT
  id,
  title,
  exdate,
  LENGTH(exdate) AS exdate_length,
  CASE
    WHEN exdate IS NULL THEN '正常：NULL'
    WHEN exdate = '[]' THEN '损坏：空数组字符串'
    WHEN exdate LIKE '%["[]"]%' THEN '损坏：三重编码'
    WHEN exdate LIKE '%"[]"%' THEN '损坏：包含空数组字符串'
    ELSE '待验证'
  END AS data_status
FROM tasks
WHERE exdate IS NOT NULL
ORDER BY id;

-- 步骤2：修复损坏的EXDATE数据
-- 将所有包含'[]'字符串的EXDATE设置为NULL

-- 2.1 修复空数组字符串 '[]'
UPDATE tasks
SET exdate = NULL
WHERE exdate = '[]';

-- 2.2 修复三重编码 '["[]"]'
UPDATE tasks
SET exdate = NULL
WHERE exdate LIKE '%["[]"]%';

-- 2.3 修复包含空数组字符串的JSON数组
UPDATE tasks
SET exdate = NULL
WHERE exdate LIKE '%"[]"%';

-- 2.4 修复空字符串
UPDATE tasks
SET exdate = NULL
WHERE exdate = '';

-- 步骤3：验证修复结果
SELECT
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN exdate IS NULL THEN 1 ELSE 0 END) AS null_count,
  SUM(CASE WHEN exdate IS NOT NULL AND exdate NOT LIKE '%[]%' THEN 1 ELSE 0 END) AS valid_count,
  SUM(CASE WHEN exdate LIKE '%[]%' THEN 1 ELSE 0 END) AS still_corrupted
FROM tasks;

-- 步骤4：查看剩余的有效EXDATE数据
SELECT
  id,
  title,
  exdate,
  '有效日期数组' AS status
FROM tasks
WHERE exdate IS NOT NULL
  AND exdate NOT LIKE '%[]%'
ORDER BY id;

-- ========================================
-- 预期结果：
-- 1. 所有损坏的EXDATE数据被设置为NULL
-- 2. still_corrupted = 0
-- 3. 只保留格式正确的EXDATE（如'["2026-03-20"]'）
-- ========================================
