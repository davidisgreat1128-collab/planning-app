#!/bin/bash
# ============================================================
# Planning App - MySQL 备份脚本（支持腾讯云COS上传）
# ============================================================
# 功能: 自动备份MySQL数据库并上传到腾讯云COS
# 使用: bash scripts/backup-mysql.sh
# 定时任务: 0 2 * * * /opt/planning-app/scripts/backup-mysql.sh
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# 从 .env 读取配置
if [ ! -f ".env" ]; then
    log_error ".env 文件不存在！"
    exit 1
fi

set -a
source .env
set +a

# 备份目录
BACKUP_DIR="backups/mysql"
mkdir -p "$BACKUP_DIR"

# 备份文件名
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/planning_app_${BACKUP_DATE}.sql.gz"

log_info "开始MySQL备份..."
log_info "备份文件: $BACKUP_FILE"

# ============================================================
# 步骤1: 导出数据库
# ============================================================
log_info "导出数据库..."

docker-compose exec -T mysql mysqldump \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --databases ${MYSQL_DATABASE} \
    | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "✅ 数据库导出成功！文件大小: $BACKUP_SIZE"
else
    log_error "❌ 数据库导出失败！"
    exit 1
fi

# ============================================================
# 步骤2: 上传到腾讯云COS（如果配置了）
# ============================================================
if [ -n "$COS_SECRET_ID" ] && [ "$COS_SECRET_ID" != "请填写腾讯云SecretId" ]; then
    log_info "上传备份到腾讯云COS..."

    # 检查coscli是否已安装
    if ! command -v coscli &> /dev/null; then
        log_warn "未安装coscli，跳过COS上传"
        log_info "安装方法: https://cloud.tencent.com/document/product/436/63144"
    else
        # 配置coscli
        coscli config set -s "${COS_SECRET_ID}" -k "${COS_SECRET_KEY}" -b "${COS_BUCKET}" -r "${COS_REGION}"

        # 上传文件
        COS_PATH="planning-app/mysql/$(basename $BACKUP_FILE)"
        if coscli cp "$BACKUP_FILE" "cos://${COS_BUCKET}/${COS_PATH}"; then
            log_info "✅ COS上传成功: cos://${COS_BUCKET}/${COS_PATH}"
        else
            log_error "❌ COS上传失败！"
        fi
    fi
else
    log_info "未配置腾讯云COS，跳过上传"
fi

# ============================================================
# 步骤3: 清理旧备份（保留最近7天）
# ============================================================
log_info "清理旧备份文件（保留7天）..."

find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete

REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
log_info "当前保留备份: $REMAINING_BACKUPS 个"

# ============================================================
# 步骤4: 验证备份文件
# ============================================================
log_info "验证备份文件完整性..."

if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_info "✅ 备份文件完整性验证通过！"
else
    log_error "❌ 备份文件已损坏！"
    exit 1
fi

# ============================================================
# 完成
# ============================================================
log_info "✅ MySQL备份完成！"
log_info "备份列表:"
ls -lh "$BACKUP_DIR"/*.sql.gz | tail -5
