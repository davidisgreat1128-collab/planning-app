-- ========================================
-- 数据迁移脚本：exdate → task_overrides.is_deleted
-- ========================================
-- 目的：将tasks.exdate中的日期迁移到task_overrides表，并标记is_deleted=true
-- 原理：删除 = 阻止实例生成（非修改数据）
-- 执行时间：2026-03-17
-- 关联ADR：ADR-006-RRULE删除机制改用task_overrides.md
-- ========================================

USE planning_app_dev;

-- 步骤1：备份当前exdate数据（用于回滚）
CREATE TABLE IF NOT EXISTS tasks_exdate_backup_20260317 AS
SELECT id, title, user_id, exdate, created_at
FROM tasks
WHERE exdate IS NOT NULL;

SELECT '✅ 步骤1完成：已备份exdate数据到tasks_exdate_backup_20260317' AS status;

-- 步骤2：查看待迁移数据
SELECT
  id AS task_id,
  title,
  user_id,
  exdate,
  JSON_LENGTH(exdate) AS exdate_count
FROM tasks
WHERE exdate IS NOT NULL
ORDER BY id;

-- 步骤3：迁移数据到task_overrides（逐条处理）
-- 注意：由于MySQL不支持直接解析JSON数组元素，需要使用存储过程或手动执行

DELIMITER //

CREATE PROCEDURE migrate_exdate_to_overrides()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_task_id INT;
  DECLARE v_user_id INT;
  DECLARE v_exdate JSON;
  DECLARE v_exdate_count INT;
  DECLARE i INT DEFAULT 0;
  DECLARE v_date VARCHAR(10);

  DECLARE cur CURSOR FOR
    SELECT id, user_id, exdate
    FROM tasks
    WHERE exdate IS NOT NULL;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO v_task_id, v_user_id, v_exdate;
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- 获取EXDATE数组长度
    SET v_exdate_count = JSON_LENGTH(v_exdate);
    SET i = 0;

    -- 遍历EXDATE数组
    WHILE i < v_exdate_count DO
      -- 提取日期（移除引号）
      SET v_date = JSON_UNQUOTE(JSON_EXTRACT(v_exdate, CONCAT('$[', i, ']')));

      -- 插入到task_overrides（如果已存在则更新）
      INSERT INTO task_overrides (
        task_id,
        user_id,
        override_date,
        is_deleted,
        created_at,
        updated_at
      ) VALUES (
        v_task_id,
        v_user_id,
        v_date,
        TRUE,
        NOW(),
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        is_deleted = TRUE,
        updated_at = NOW();

      SET i = i + 1;
    END WHILE;

  END LOOP;

  CLOSE cur;
END//

DELIMITER ;

-- 执行存储过程
CALL migrate_exdate_to_overrides();

SELECT '✅ 步骤3完成：已将exdate数据迁移到task_overrides' AS status;

-- 步骤4：验证迁移结果
SELECT
  '验证：迁移的task_overrides记录数' AS check_type,
  COUNT(*) AS count
FROM task_overrides
WHERE is_deleted = TRUE;

SELECT
  '验证：原exdate记录数' AS check_type,
  COUNT(*) AS count
FROM tasks_exdate_backup_20260317;

-- 步骤5：详细验证（对比备份和task_overrides）
SELECT
  t.id AS task_id,
  t.title,
  t.exdate AS original_exdate,
  GROUP_CONCAT(o.override_date ORDER BY o.override_date) AS migrated_dates,
  JSON_LENGTH(t.exdate) AS original_count,
  COUNT(o.id) AS migrated_count
FROM tasks_exdate_backup_20260317 t
LEFT JOIN task_overrides o ON o.task_id = t.id AND o.is_deleted = TRUE
GROUP BY t.id;

-- 步骤6：将tasks.exdate设为NULL（保留字段，以防回滚）
-- ⚠️ 注意：执行此步骤前，请确认上述验证结果正确！
-- UPDATE tasks SET exdate = NULL WHERE exdate IS NOT NULL;

SELECT '⚠️  步骤6：请手动执行UPDATE tasks SET exdate = NULL（确认验证结果后）' AS status;

-- 步骤7：清理存储过程
DROP PROCEDURE IF EXISTS migrate_exdate_to_overrides;

SELECT '✅ 数据迁移完成！请验证结果后手动将exdate设为NULL' AS final_status;

-- ========================================
-- 回滚步骤（如需要）：
-- ========================================
-- 1. 从备份表恢复exdate数据：
--    UPDATE tasks t
--    INNER JOIN tasks_exdate_backup_20260317 b ON t.id = b.id
--    SET t.exdate = b.exdate;
--
-- 2. 删除迁移的task_overrides记录：
--    DELETE FROM task_overrides WHERE is_deleted = TRUE;
--
-- 3. 删除备份表：
--    DROP TABLE tasks_exdate_backup_20260317;
-- ========================================
