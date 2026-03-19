#!/bin/bash
# ============================================================
# Planning App - MySQL 恢复脚本
# ============================================================
# 功能: 从备份文件恢复MySQL数据库
# 使用: bash scripts/restore-mysql.sh <备份文件路径>
# 示例: bash scripts/restore-mysql.sh backups/mysql/planning_app_20240320_020000.sql.gz
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ -z "$1" ]; then
    log_error "缺少备份文件路径！"
    echo "使用方法: bash scripts/restore-mysql.sh <备份文件路径>"
    echo
    echo "可用备份文件:"
    ls -lh backups/mysql/*.sql.gz 2>/dev/null || echo "  (无备份文件)"
    exit 1
fi

BACKUP_FILE="$1"

# 检查文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "备份文件不存在: $BACKUP_FILE"
    exit 1
fi

log_info "备份文件: $BACKUP_FILE"
log_info "文件大小: $(du -h $BACKUP_FILE | cut -f1)"

# 从 .env 读取配置
if [ ! -f ".env" ]; then
    log_error ".env 文件不存在！"
    exit 1
fi

set -a
source .env
set +a

# ============================================================
# 步骤1: 确认操作
# ============================================================
log_warn "⚠️ 警告: 此操作将覆盖当前数据库！"
echo
read -p "是否继续? (输入 'YES' 确认): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    log_info "操作已取消"
    exit 0
fi

# ============================================================
# 步骤2: 验证备份文件完整性
# ============================================================
log_info "验证备份文件完整性..."

if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_info "✅ 备份文件完整性验证通过！"
else
    log_error "❌ 备份文件已损坏！"
    exit 1
fi

# ============================================================
# 步骤3: 备份当前数据库（双重保险）
# ============================================================
log_info "备份当前数据库（双重保险）..."

SAFETY_BACKUP="backups/mysql/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p backups/mysql

docker-compose exec -T mysql mysqldump \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    --single-transaction \
    --databases ${MYSQL_DATABASE} \
    | gzip > "$SAFETY_BACKUP"

log_info "安全备份已保存: $SAFETY_BACKUP"

# ============================================================
# 步骤4: 删除现有数据库
# ============================================================
log_info "删除现有数据库..."

docker-compose exec -T mysql mysql \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    -e "DROP DATABASE IF EXISTS ${MYSQL_DATABASE};"

log_info "数据库已删除 ✓"

# ============================================================
# 步骤5: 重新创建数据库
# ============================================================
log_info "重新创建数据库..."

docker-compose exec -T mysql mysql \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    -e "CREATE DATABASE ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

log_info "数据库已创建 ✓"

# ============================================================
# 步骤6: 导入备份数据
# ============================================================
log_info "导入备份数据..."

gunzip -c "$BACKUP_FILE" | docker-compose exec -T mysql mysql \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD}

if [ $? -eq 0 ]; then
    log_info "✅ 数据导入成功！"
else
    log_error "❌ 数据导入失败！"
    log_warn "正在恢复安全备份..."

    # 恢复安全备份
    gunzip -c "$SAFETY_BACKUP" | docker-compose exec -T mysql mysql \
        -uroot \
        -p${MYSQL_ROOT_PASSWORD}

    log_info "已恢复到操作前状态"
    exit 1
fi

# ============================================================
# 步骤7: 验证恢复结果
# ============================================================
log_info "验证恢复结果..."

# 检查数据库是否存在
docker-compose exec -T mysql mysql \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    -e "USE ${MYSQL_DATABASE}; SHOW TABLES;"

# 检查表数量
TABLE_COUNT=$(docker-compose exec -T mysql mysql \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    -e "USE ${MYSQL_DATABASE}; SHOW TABLES;" | wc -l)

log_info "恢复的表数量: $((TABLE_COUNT - 1))"

# ============================================================
# 完成
# ============================================================
echo
log_info "✅ 数据库恢复完成！"
echo
log_info "安全备份已保存在: $SAFETY_BACKUP"
log_info "如需回滚，运行: bash scripts/restore-mysql.sh $SAFETY_BACKUP"
echo
