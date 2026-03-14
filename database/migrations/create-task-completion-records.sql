-- 创建任务完成记录表
CREATE TABLE IF NOT EXISTS task_completion_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '完成记录ID',
  task_id INT UNSIGNED NOT NULL COMMENT '任务ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  completion_date DATE NOT NULL COMMENT '完成日期',

  status ENUM('pending', 'completed', 'skipped') NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  completed_at DATETIME DEFAULT NULL COMMENT '实际完成时间',

  subtask_completion JSON DEFAULT NULL COMMENT '子任务完成状态',

  note TEXT DEFAULT NULL COMMENT '用户备注',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  UNIQUE KEY uk_task_date (task_id, completion_date),
  INDEX idx_user_date (user_id, completion_date),
  INDEX idx_task_id (task_id),
  INDEX idx_completion_date (completion_date),

  CONSTRAINT fk_tcr_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_tcr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务完成记录表';
