#!/bin/bash
# ============================================================
# Planning App - 生产部署脚本（幂等性 + 回滚支持）
# ============================================================
# 功能: 一键部署整个应用栈
# 使用: bash scripts/deploy.sh [--rollback]
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 部署时间戳
DEPLOY_TIME=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="backups/deploy_${DEPLOY_TIME}"

# 回滚功能
if [ "$1" == "--rollback" ]; then
    log_warn "回滚模式：恢复到上一个部署版本"
    LATEST_BACKUP=$(ls -t backups/deploy_* 2>/dev/null | head -1)
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "未找到备份文件！"
        exit 1
    fi
    log_info "从备份恢复: $LATEST_BACKUP"
    docker-compose down
    cp -r $LATEST_BACKUP/.env .env
    docker-compose up -d
    log_info "✅ 回滚完成！"
    exit 0
fi

# ============================================================
# 步骤1: 环境检查
# ============================================================
log_step "步骤1: 环境检查"

# 检查Docker
if ! command -v docker &> /dev/null; then
    log_error "未安装Docker！请先安装Docker。"
    exit 1
fi
log_info "Docker版本: $(docker --version)"

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "未安装Docker Compose！请先安装。"
    exit 1
fi
log_info "Docker Compose版本: $(docker-compose --version)"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    log_error ".env 文件不存在！请先运行: bash scripts/generate-secrets.sh"
    exit 1
fi
log_info ".env 文件检查通过 ✓"

# ============================================================
# 步骤2: 备份当前配置
# ============================================================
log_step "步骤2: 备份当前配置"

mkdir -p "$BACKUP_DIR"
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/.env"
    log_info "已备份 .env → $BACKUP_DIR/.env"
fi
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml"
    log_info "已备份 docker-compose.yml → $BACKUP_DIR/docker-compose.yml"
fi

# ============================================================
# 步骤3: 停止现有容器（如果存在）
# ============================================================
log_step "步骤3: 停止现有容器"

if docker-compose ps -q 2>/dev/null | grep -q .; then
    log_info "发现运行中的容器，正在停止..."
    docker-compose down
    log_info "容器已停止 ✓"
else
    log_info "未发现运行中的容器"
fi

# ============================================================
# 步骤4: 拉取最新镜像
# ============================================================
log_step "步骤4: 拉取最新镜像"

docker-compose pull
log_info "镜像拉取完成 ✓"

# ============================================================
# 步骤5: 构建后端镜像
# ============================================================
log_step "步骤5: 构建后端镜像"

log_info "构建后端Docker镜像..."
docker-compose build backend
log_info "后端镜像构建完成 ✓"

# ============================================================
# 步骤6: 启动服务
# ============================================================
log_step "步骤6: 启动服务"

log_info "启动所有服务..."
docker-compose up -d
log_info "服务启动完成 ✓"

# ============================================================
# 步骤7: 等待服务健康检查
# ============================================================
log_step "步骤7: 等待服务健康检查"

log_info "等待MySQL启动..."
for i in {1..30}; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost -uroot -p${MYSQL_ROOT_PASSWORD:-root} --silent 2>/dev/null; then
        log_info "MySQL 健康检查通过 ✓"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "MySQL 启动超时！"
        exit 1
    fi
    sleep 2
done

log_info "等待Redis启动..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli -a ${REDIS_PASSWORD:-redis} ping 2>/dev/null | grep -q PONG; then
        log_info "Redis 健康检查通过 ✓"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Redis 启动超时！"
        exit 1
    fi
    sleep 2
done

log_info "等待Backend启动..."
for i in {1..60}; do
    if docker-compose exec -T backend wget -q -O- http://localhost:3000/health 2>/dev/null | grep -q healthy; then
        log_info "Backend 健康检查通过 ✓"
        break
    fi
    if [ $i -eq 60 ]; then
        log_error "Backend 启动超时！"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

log_info "等待Nginx启动..."
for i in {1..30}; do
    if docker-compose exec -T nginx wget -q -O- http://localhost/health 2>/dev/null | grep -q healthy; then
        log_info "Nginx 健康检查通过 ✓"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Nginx 启动超时！"
        docker-compose logs nginx
        exit 1
    fi
    sleep 2
done

# ============================================================
# 步骤8: 数据库迁移
# ============================================================
log_step "步骤8: 数据库迁移"

log_info "运行数据库迁移..."
docker-compose exec -T backend npm run migrate
log_info "数据库迁移完成 ✓"

# ============================================================
# 步骤9: 验证部署
# ============================================================
log_step "步骤9: 验证部署"

# 检查容器状态
log_info "检查容器状态..."
docker-compose ps

# 检查健康状态
log_info "检查API健康状态..."
HEALTH_RESPONSE=$(docker-compose exec -T nginx wget -q -O- http://localhost/health)
echo "$HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    log_info "✅ API健康检查通过！"
else
    log_error "❌ API健康检查失败！"
    exit 1
fi

# ============================================================
# 部署完成
# ============================================================
echo
echo "============================================================"
log_info "✅ 部署成功！"
echo "============================================================"
echo
log_info "服务访问地址:"
echo "  - API端点: http://$(hostname -I | awk '{print $1}')/api/v1/"
echo "  - 健康检查: http://$(hostname -I | awk '{print $1}')/health"
echo
log_info "下一步操作:"
echo "  1. 配置DNS解析（域名指向服务器IP）"
echo "  2. 申请SSL证书: bash scripts/setup-ssl.sh"
echo "  3. 配置定时任务: crontab -e"
echo
log_info "查看日志: docker-compose logs -f"
log_info "回滚部署: bash scripts/deploy.sh --rollback"
echo
