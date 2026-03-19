#!/bin/bash
# ============================================================
# Planning App - 生成安全密钥脚本
# ============================================================
# 功能: 自动生成所有密钥并创建 .env 文件
# 使用: bash scripts/generate-secrets.sh
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 生成随机密钥函数
generate_password() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

log_info "开始生成安全密钥..."

# 检查是否已存在 .env 文件
if [ -f ".env" ]; then
    log_warn ".env 文件已存在！"
    read -p "是否覆盖? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "取消操作"
        exit 0
    fi
    # 备份旧文件
    cp .env .env.backup.$(date +%Y%m%d%H%M%S)
    log_info "已备份旧文件为 .env.backup.*"
fi

# 生成密钥
log_info "生成 MySQL root 密码..."
MYSQL_ROOT_PASSWORD=$(generate_password 32)

log_info "生成 MySQL 用户密码..."
MYSQL_PASSWORD=$(generate_password 32)

log_info "生成 Redis 密码..."
REDIS_PASSWORD=$(generate_password 32)

log_info "生成 JWT Secret..."
JWT_SECRET=$(generate_password 64)

# 创建 .env 文件
log_info "创建 .env 文件..."

cat > .env << EOF
# ============================================================
# Planning App - 生产环境变量配置
# ============================================================
# 自动生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# ⚠️ 警告: 请勿将此文件提交到Git仓库
# ============================================================

# ============================================================
# 域名配置
# ============================================================
DOMAIN=txjjzyzqbx.cn
DOMAIN_WWW=www.txjjzyzqbx.cn
DOMAIN_EMAIL=admin@txjjzyzqbx.cn

# ============================================================
# 应用配置
# ============================================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
API_BASE_URL=https://txjjzyzqbx.cn/api/v1

# ============================================================
# MySQL 配置
# ============================================================
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=planning_app_prod
MYSQL_USER=planning_user
MYSQL_PASSWORD=${MYSQL_PASSWORD}

# ============================================================
# Redis 配置
# ============================================================
REDIS_PASSWORD=${REDIS_PASSWORD}

# ============================================================
# JWT 配置
# ============================================================
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_COOKIE_SECURE=true
JWT_COOKIE_SAME_SITE=None

# ============================================================
# CORS 配置
# ============================================================
CORS_ORIGIN=https://txjjzyzqbx.cn,https://www.txjjzyzqbx.cn

# ============================================================
# 腾讯云 COS 配置（备份用）
# ============================================================
COS_SECRET_ID=请填写腾讯云SecretId
COS_SECRET_KEY=请填写腾讯云SecretKey
COS_BUCKET=planning-app-backup-1234567890
COS_REGION=ap-guangzhou

# ============================================================
# 日志配置
# ============================================================
LOG_LEVEL=info
LOG_MAX_FILES=30d
LOG_MAX_SIZE=100m
EOF

log_info "✅ .env 文件创建成功！"
echo
log_info "生成的密钥:"
echo "  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}"
echo "  MYSQL_PASSWORD: ${MYSQL_PASSWORD}"
echo "  REDIS_PASSWORD: ${REDIS_PASSWORD}"
echo "  JWT_SECRET: ${JWT_SECRET:0:20}... (已截断显示)"
echo
log_warn "请妥善保管这些密钥！建议保存到密码管理器中。"
log_warn "如果需要配置腾讯云COS备份，请编辑 .env 文件填写 COS_* 配置项。"
echo
log_info "下一步: bash scripts/deploy.sh"
