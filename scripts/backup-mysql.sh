#!/bin/bash
# ============================================================
# Planning App - MySQL 数据库自动备份脚本
# ============================================================
# 功能: 每天4次备份（00:00, 06:00, 12:00, 18:00）
# 保留策略: 7天内保留所有备份，7-30天仅保留每日首次备份
# 使用方法: bash scripts/backup-mysql.sh
# ============================================================

set -e

# ============================================================
# 配置变量
# ============================================================
BACKUP_DIR="/opt/planning-app/backups/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_ONLY=$(date +"%Y%m%d")
BACKUP_FILE="planning_app_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/daily/${BACKUP_FILE}"

# Docker容器名称
MYSQL_CONTAINER="planning-app-mysql"

# 加载环境变量
if [ -f "/opt/planning-app/planning-app/.env" ]; then
    export $(grep -v '^#' /opt/planning-app/planning-app/.env | xargs)
fi

# ============================================================
# 创建备份目录
# ============================================================
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

# ============================================================
# 执行备份
# ============================================================
echo "[$(date)] 开始备份 MySQL 数据库..."

docker exec "$MYSQL_CONTAINER" mysqldump \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --databases "${MYSQL_DATABASE}" \
    > "$BACKUP_PATH"

# 压缩备份文件
gzip "$BACKUP_PATH"
BACKUP_PATH="${BACKUP_PATH}.gz"

echo "[$(date)] 备份完成: ${BACKUP_PATH}"

# 获取备份文件大小
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "[$(date)] 备份大小: ${BACKUP_SIZE}"

# ============================================================
# 每周备份（周日执行）
# ============================================================
if [ "$(date +%u)" -eq 7 ]; then
    WEEKLY_FILE="planning_app_weekly_${DATE_ONLY}.sql.gz"
    cp "$BACKUP_PATH" "${BACKUP_DIR}/weekly/${WEEKLY_FILE}"
    echo "[$(date)] 已创建周备份: ${WEEKLY_FILE}"
fi

# ============================================================
# 每月备份（每月1日执行）
# ============================================================
if [ "$(date +%d)" -eq 1 ]; then
    MONTHLY_FILE="planning_app_monthly_$(date +%Y%m).sql.gz"
    cp "$BACKUP_PATH" "${BACKUP_DIR}/monthly/${MONTHLY_FILE}"
    echo "[$(date)] 已创建月备份: ${MONTHLY_FILE}"
fi

# ============================================================
# 清理过期备份
# ============================================================
echo "[$(date)] 清理过期备份..."

# 删除7天前的每日备份
find "${BACKUP_DIR}/daily" -name "*.sql.gz" -mtime +7 -delete

# 删除30天前的每周备份
find "${BACKUP_DIR}/weekly" -name "*.sql.gz" -mtime +30 -delete

# 删除365天前的每月备份
find "${BACKUP_DIR}/monthly" -name "*.sql.gz" -mtime +365 -delete

echo "[$(date)] 备份任务完成"

# ============================================================
# 上传到远程存储（可选）
# ============================================================
# 如果配置了腾讯云COS
if command -v coscmd &> /dev/null; then
    coscmd upload "$BACKUP_PATH" "/mysql/$(basename $BACKUP_PATH)"
    echo "[$(date)] 已上传到腾讯云COS"
fi
