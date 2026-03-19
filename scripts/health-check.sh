#!/bin/bash
# ============================================================
# Planning App - 健康检查脚本
# ============================================================
# 功能: 检查所有服务健康状态，异常时发送告警
# 使用: bash scripts/health-check.sh
# 定时任务: */5 * * * * /opt/planning-app/scripts/health-check.sh
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

# 健康状态
HEALTH_STATUS="healthy"
FAILED_SERVICES=()

# ============================================================
# 步骤1: 检查Docker守护进程
# ============================================================
log_info "检查Docker守护进程..."

if ! docker ps &>/dev/null; then
    log_error "Docker守护进程未运行！"
    HEALTH_STATUS="unhealthy"
    exit 1
fi

log_info "Docker守护进程正常 ✓"

# ============================================================
# 步骤2: 检查MySQL
# ============================================================
log_info "检查MySQL..."

if docker-compose exec -T mysql mysqladmin ping -h localhost -uroot -p${MYSQL_ROOT_PASSWORD} --silent 2>/dev/null; then
    log_info "MySQL正常 ✓"
else
    log_error "MySQL异常！"
    HEALTH_STATUS="unhealthy"
    FAILED_SERVICES+=("MySQL")
fi

# ============================================================
# 步骤3: 检查Redis
# ============================================================
log_info "检查Redis..."

if docker-compose exec -T redis redis-cli -a ${REDIS_PASSWORD} ping 2>/dev/null | grep -q PONG; then
    log_info "Redis正常 ✓"
else
    log_error "Redis异常！"
    HEALTH_STATUS="unhealthy"
    FAILED_SERVICES+=("Redis")
fi

# ============================================================
# 步骤4: 检查Backend
# ============================================================
log_info "检查Backend..."

if docker-compose exec -T backend wget -q -O- http://localhost:3000/health 2>/dev/null | grep -q healthy; then
    log_info "Backend正常 ✓"
else
    log_error "Backend异常！"
    HEALTH_STATUS="unhealthy"
    FAILED_SERVICES+=("Backend")
fi

# ============================================================
# 步骤5: 检查Nginx
# ============================================================
log_info "检查Nginx..."

if docker-compose exec -T nginx wget -q -O- http://localhost/health 2>/dev/null | grep -q healthy; then
    log_info "Nginx正常 ✓"
else
    log_error "Nginx异常！"
    HEALTH_STATUS="unhealthy"
    FAILED_SERVICES+=("Nginx")
fi

# ============================================================
# 步骤6: 检查磁盘空间
# ============================================================
log_info "检查磁盘空间..."

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $DISK_USAGE -gt 90 ]; then
    log_error "磁盘空间不足！使用率: ${DISK_USAGE}%"
    HEALTH_STATUS="unhealthy"
    FAILED_SERVICES+=("Disk")
elif [ $DISK_USAGE -gt 80 ]; then
    log_warn "磁盘空间告警！使用率: ${DISK_USAGE}%"
else
    log_info "磁盘空间正常（使用率: ${DISK_USAGE}%）✓"
fi

# ============================================================
# 步骤7: 检查内存使用
# ============================================================
log_info "检查内存使用..."

MEMORY_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')

if [ $MEMORY_USAGE -gt 90 ]; then
    log_error "内存使用过高！使用率: ${MEMORY_USAGE}%"
    HEALTH_STATUS="unhealthy"
    FAILED_SERVICES+=("Memory")
elif [ $MEMORY_USAGE -gt 80 ]; then
    log_warn "内存使用告警！使用率: ${MEMORY_USAGE}%"
else
    log_info "内存使用正常（使用率: ${MEMORY_USAGE}%）✓"
fi

# ============================================================
# 步骤8: 检查容器状态
# ============================================================
log_info "检查容器状态..."

RUNNING_CONTAINERS=$(docker-compose ps -q 2>/dev/null | wc -l)
EXPECTED_CONTAINERS=4  # MySQL, Redis, Backend, Nginx

if [ $RUNNING_CONTAINERS -ne $EXPECTED_CONTAINERS ]; then
    log_error "容器数量异常！期望: $EXPECTED_CONTAINERS, 实际: $RUNNING_CONTAINERS"
    HEALTH_STATUS="unhealthy"
    FAILED_SERVICES+=("Containers")
else
    log_info "容器状态正常 ✓"
fi

# ============================================================
# 步骤9: 生成健康报告
# ============================================================
echo
echo "============================================================"
if [ "$HEALTH_STATUS" == "healthy" ]; then
    log_info "✅ 所有服务健康！"
else
    log_error "❌ 服务异常！"
    echo "异常服务: ${FAILED_SERVICES[@]}"
    echo

    # 发送告警（如果配置了告警脚本）
    if [ -f "scripts/send-alert.sh" ]; then
        ALERT_MESSAGE="Planning App 服务异常：\n${FAILED_SERVICES[@]}\n\n时间: $(date '+%Y-%m-%d %H:%M:%S')"
        bash scripts/send-alert.sh "$ALERT_MESSAGE"
    fi

    # 尝试自动修复
    log_info "尝试自动修复..."
    docker-compose restart

    # 等待服务启动
    sleep 10

    # 再次检查
    if docker-compose exec -T nginx wget -q -O- http://localhost/health 2>/dev/null | grep -q healthy; then
        log_info "✅ 自动修复成功！"
    else
        log_error "❌ 自动修复失败！需要人工介入。"
        exit 1
    fi
fi
echo "============================================================"

# 保存健康状态到文件（用于监控）
mkdir -p logs
echo "$(date '+%Y-%m-%d %H:%M:%S') $HEALTH_STATUS" >> logs/health.log
