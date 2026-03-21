#!/bin/bash
# ============================================================
# Planning App - 一键完整备份脚本
# ============================================================
# 功能: 备份所有关键数据（数据库、配置、上传文件）
# 使用场景: 重大升级前、服务器迁移前
# 使用方法: sudo bash scripts/backup-all.sh
# ============================================================

set -e

BACKUP_ROOT="/opt/planning-app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FULL_BACKUP_DIR="${BACKUP_ROOT}/full_backup_${TIMESTAMP}"

mkdir -p "$FULL_BACKUP_DIR"

echo "=========================================="
echo "Planning App - 完整备份"
echo "时间: $(date)"
echo "=========================================="

# 1. 备份 MySQL 数据库
echo "[1/6] 备份 MySQL 数据库..."
bash /opt/planning-app/planning-app/scripts/backup-mysql.sh
cp "${BACKUP_ROOT}/mysql/daily/"*.sql.gz "$FULL_BACKUP_DIR/" 2>/dev/null || echo "MySQL备份文件不存在，跳过"

# 2. 备份 Redis 数据
echo "[2/6] 备份 Redis 数据..."
if [ -f "/opt/planning-app/planning-app/.env" ]; then
    export $(grep -v '^#' /opt/planning-app/planning-app/.env | xargs)
fi
docker exec planning-app-redis redis-cli -a "${REDIS_PASSWORD}" SAVE 2>/dev/null || echo "Redis备份失败"
docker cp planning-app-redis:/data/dump.rdb "${FULL_BACKUP_DIR}/redis_dump.rdb" 2>/dev/null || echo "Redis dump文件不存在"

# 3. 备份配置文件
echo "[3/6] 备份配置文件..."
mkdir -p "${FULL_BACKUP_DIR}/config"
if [ -f "/opt/planning-app/planning-app/.env" ]; then
    cp "/opt/planning-app/planning-app/.env" "${FULL_BACKUP_DIR}/config/.env"
fi
if [ -f "/opt/planning-app/planning-app/docker-compose.yml" ]; then
    cp "/opt/planning-app/planning-app/docker-compose.yml" "${FULL_BACKUP_DIR}/config/"
fi
if [ -d "/etc/letsencrypt/live/txjjzyzqbx.cn" ]; then
    tar -czf "${FULL_BACKUP_DIR}/config/ssl_certificates.tar.gz" \
        /etc/letsencrypt/live/txjjzyzqbx.cn \
        /etc/letsencrypt/renewal/txjjzyzqbx.cn.conf 2>/dev/null || echo "SSL证书备份失败"
fi

# 4. 备份用户上传文件
echo "[4/6] 备份用户上传文件..."
if [ -d "/opt/planning-app/planning-app/backend/uploads" ]; then
    tar -czf "${FULL_BACKUP_DIR}/uploads.tar.gz" \
        /opt/planning-app/planning-app/backend/uploads 2>/dev/null || echo "上传文件备份失败"
fi

# 5. 备份应用日志
echo "[5/6] 备份应用日志..."
if [ -d "/opt/planning-app/planning-app/backend/logs" ]; then
    tar -czf "${FULL_BACKUP_DIR}/logs.tar.gz" \
        /opt/planning-app/planning-app/backend/logs 2>/dev/null || echo "日志备份失败"
fi

# 6. 创建备份清单
echo "[6/6] 生成备份清单..."
cat > "${FULL_BACKUP_DIR}/BACKUP_INFO.txt" <<BACKUP_EOF
Planning App 完整备份
=====================
备份时间: $(date)
备份目录: ${FULL_BACKUP_DIR}

包含内容:
- MySQL 数据库备份
- Redis 数据备份
- .env 配置文件
- SSL 证书
- Docker Compose 配置
- 用户上传文件
- 应用日志

恢复说明:
请参考 docs/02-技术设计/灾难恢复和备份方案.md

版本信息:
$(cd /opt/planning-app/planning-app && git log -1 --oneline 2>/dev/null || echo "Git信息不可用")
BACKUP_EOF

# 计算备份大小
BACKUP_SIZE=$(du -sh "$FULL_BACKUP_DIR" 2>/dev/null | cut -f1 || echo "未知")

echo "=========================================="
echo "✅ 备份完成！"
echo "备份位置: ${FULL_BACKUP_DIR}"
echo "备份大小: ${BACKUP_SIZE}"
echo "=========================================="

# 可选: 打包为单个压缩文件
echo "是否打包为单个文件？(y/N)"
read -r PACK_CHOICE
if [ "$PACK_CHOICE" = "y" ] || [ "$PACK_CHOICE" = "Y" ]; then
    cd "$BACKUP_ROOT"
    tar -czf "full_backup_${TIMESTAMP}.tar.gz" "full_backup_${TIMESTAMP}"
    echo "✅ 已打包: ${BACKUP_ROOT}/full_backup_${TIMESTAMP}.tar.gz"
    echo "打包大小: $(du -sh full_backup_${TIMESTAMP}.tar.gz | cut -f1)"
fi
