#!/bin/bash
# ============================================================
# Planning App - SSL证书续期脚本
# ============================================================
# 功能: 自动续期Let's Encrypt证书
# 使用: bash scripts/renew-ssl.sh
# 定时任务: 0 3 1 * * /opt/planning-app/scripts/renew-ssl.sh
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

log_info "开始SSL证书续期流程..."

# ============================================================
# 步骤1: 检查证书有效期
# ============================================================
log_info "检查当前证书有效期..."

# 检查证书是否即将过期（30天内）
if certbot certificates 2>/dev/null | grep -q "VALID"; then
    EXPIRY_DATE=$(certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3}')
    log_info "当前证书有效期至: $EXPIRY_DATE"

    # 计算剩余天数
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    log_info "证书剩余有效期: $DAYS_LEFT 天"

    if [ $DAYS_LEFT -gt 30 ]; then
        log_info "证书有效期充足（>30天），无需续期"
        exit 0
    fi
else
    log_warn "无法检查证书有效期，强制续期"
fi

# ============================================================
# 步骤2: 停止Nginx容器
# ============================================================
log_info "停止Nginx容器（释放80端口）..."

docker stop planning-app-nginx 2>/dev/null || {
    log_error "停止Nginx失败！"
    exit 1
}

log_info "Nginx已停止 ✓"

# ============================================================
# 步骤3: 续期证书
# ============================================================
log_info "执行证书续期..."

# 尝试续期
if certbot renew --standalone --quiet; then
    log_info "✅ 证书续期成功！"
else
    log_error "❌ 证书续期失败！"

    # 恢复Nginx
    log_info "恢复Nginx容器..."
    docker start planning-app-nginx

    # 发送告警（如果配置了告警脚本）
    if [ -f "scripts/send-alert.sh" ]; then
        bash scripts/send-alert.sh "SSL证书续期失败"
    fi

    exit 1
fi

# ============================================================
# 步骤4: 重启Nginx（重新加载证书）
# ============================================================
log_info "重启Nginx容器..."

docker start planning-app-nginx || {
    log_error "启动Nginx失败！"
    exit 1
}

# 等待Nginx启动
sleep 5

# 检查Nginx状态
if docker ps | grep -q planning-app-nginx; then
    log_info "Nginx启动成功 ✓"
else
    log_error "Nginx启动失败！查看日志:"
    docker logs planning-app-nginx
    exit 1
fi

# ============================================================
# 步骤5: 验证新证书
# ============================================================
log_info "验证新证书..."

# 检查HTTPS访问
if curl -k -s https://localhost/health | grep -q "healthy"; then
    log_info "✅ HTTPS访问正常！"
else
    log_warn "HTTPS访问异常，请手动检查"
fi

# 显示新证书信息
log_info "新证书信息:"
certbot certificates | grep -A 5 "Certificate Name"

# ============================================================
# 完成
# ============================================================
log_info "✅ SSL证书续期完成！"

# 清理旧的备份证书
log_info "清理过期备份证书..."
find /etc/letsencrypt/archive -type f -name "*.pem" -mtime +90 -delete 2>/dev/null || true

log_info "下次续期时间: $(date -d '+30 days' '+%Y-%m-%d')"
