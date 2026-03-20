#!/bin/bash
# ============================================================
# Planning App - 生产部署脚本（稳定版 + Compose兼容 + 防坑版）
# ============================================================

set -e

# =========================
# 颜色输出
# =========================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# =========================
# Docker Compose 兼容
# =========================
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE="docker-compose"
else
    log_error "未安装 Docker Compose"
    exit 1
fi

log_info "使用 Docker Compose: $COMPOSE"

# =========================
# 时间戳
# =========================
DEPLOY_TIME=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="backups/deploy_${DEPLOY_TIME}"

# =========================
# 回滚
# =========================
if [ "$1" == "--rollback" ]; then
    log_warn "回滚模式启动"

    LATEST_BACKUP=$(ls -t backups/deploy_* 2>/dev/null | head -1)

    if [ -z "$LATEST_BACKUP" ]; then
        log_error "没有可用备份"
        exit 1
    fi

    log_info "恢复备份: $LATEST_BACKUP"

    $COMPOSE down || true
    cp $LATEST_BACKUP/.env .env

    $COMPOSE up -d

    log_info "✅ 回滚完成"
    exit 0
fi

# =========================
# 步骤1: 环境检查
# =========================
log_step "步骤1: 环境检查"

if ! command -v docker &> /dev/null; then
    log_error "未安装 Docker"
    exit 1
fi

log_info "Docker版本: $(docker --version)"
$COMPOSE version

if [ ! -f ".env" ]; then
    log_error ".env 不存在"
    exit 1
fi

# =========================
# 步骤2: 备份
# =========================
log_step "步骤2: 备份配置"

mkdir -p "$BACKUP_DIR"

cp .env "$BACKUP_DIR/.env"
cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml"

log_info "备份完成 → $BACKUP_DIR"

# =========================
# 步骤3: 停止容器
# =========================
log_step "步骤3: 停止容器"

if $COMPOSE ps -q | grep -q .; then
    $COMPOSE down
    log_info "容器已停止"
else
    log_info "无运行容器"
fi

# =========================
# 步骤4: 拉取基础镜像（关键优化）
# =========================
log_step "步骤4: 拉取基础镜像"

# 只拉公共镜像（避免 backend 报错）
$COMPOSE pull mysql redis nginx || true

log_info "基础镜像拉取完成"

# =========================
# 步骤5: 构建 backend
# =========================
log_step "步骤5: 构建后端"

$COMPOSE build backend

log_info "后端构建完成"

# =========================
# 步骤6: 启动服务
# =========================
log_step "步骤6: 启动服务"

$COMPOSE up -d

log_info "服务启动完成"

# =========================
# 步骤7: 健康检查
# =========================
log_step "步骤7: 健康检查"

wait_for_service() {
    NAME=$1
    CMD=$2
    MAX_RETRY=$3

    for i in $(seq 1 $MAX_RETRY); do
        if eval "$CMD"; then
            log_info "$NAME 启动成功"
            return 0
        fi
        sleep 2
    done

    log_error "$NAME 启动超时"
    return 1
}

wait_for_service "MySQL" \
"$COMPOSE exec -T mysql mysqladmin ping -h localhost -uroot -p${MYSQL_ROOT_PASSWORD} --silent" 30

wait_for_service "Redis" \
"$COMPOSE exec -T redis redis-cli -a ${REDIS_PASSWORD} ping | grep -q PONG" 30

wait_for_service "Backend" \
"$COMPOSE exec -T backend wget -q -O- http://localhost:3000/health | grep -q healthy" 60

wait_for_service "Nginx" \
"$COMPOSE exec -T nginx wget -q -O- http://localhost/health | grep -q healthy" 30

# =========================
# 步骤8: 数据库迁移
# =========================
log_step "步骤8: 数据库迁移"

$COMPOSE exec -T backend npm run migrate

log_info "数据库迁移完成"

# =========================
# 步骤9: 验证
# =========================
log_step "步骤9: 验证部署"

$COMPOSE ps

HEALTH=$($COMPOSE exec -T nginx wget -q -O- http://localhost/health)

echo "$HEALTH"

if echo "$HEALTH" | grep -q healthy; then
    log_info "✅ API 正常"
else
    log_error "❌ API 异常"
    exit 1
fi

# =========================
# 完成
# =========================
SERVER_IP=$(hostname -I | awk '{print $1}')

echo
echo "=============================================="
log_info "🎉 部署成功"
echo "=============================================="

echo "访问地址:"
echo "http://${SERVER_IP}"
echo "http://${SERVER_IP}/health"

echo
log_info "日志查看: $COMPOSE logs -f"
log_info "回滚: bash scripts/deploy.sh --rollback"