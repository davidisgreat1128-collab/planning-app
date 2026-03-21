#!/bin/bash
# ============================================================
# Planning App - 启用HTTPS配置脚本
# ============================================================
# 功能: SSL证书申请成功后，切换到HTTPS配置
# 前置条件: SSL证书已成功申请
# ============================================================

set -e

# ============================================================
# 颜色定义
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# 日志函数
# ============================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ============================================================
# 配置变量
# ============================================================
NGINX_CONF_DIR="nginx/conf.d"
HTTP_CONF="$NGINX_CONF_DIR/planning-app-http.conf"
HTTPS_CONF="$NGINX_CONF_DIR/planning-app-https.conf"
FINAL_CONF="$NGINX_CONF_DIR/planning-app.conf"

log_info "============================================================"
log_info "Planning App - 启用HTTPS配置"
log_info "============================================================"
echo ""

# ============================================================
# 步骤1：检查SSL证书
# ============================================================
log_info "[步骤1/5] 检查SSL证书"

if [ ! -f "/etc/letsencrypt/live/txjjzyzqbx.cn/fullchain.pem" ]; then
    log_error "SSL证书不存在，请先运行 setup-ssl-webroot.sh 申请证书"
    exit 1
fi

log_success "SSL证书已存在"
echo ""

# ============================================================
# 步骤2：检查当前Nginx配置
# ============================================================
log_info "[步骤2/5] 检查当前Nginx配置"

if [ -f "$FINAL_CONF" ]; then
    log_warning "检测到 planning-app.conf 已存在"
    read -p "是否要覆盖现有配置？(y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "取消操作"
        exit 0
    fi
    log_info "将备份现有配置..."
    mv "$FINAL_CONF" "$FINAL_CONF.backup.$(date +%Y%m%d%H%M%S)"
    log_success "已备份现有配置"
fi

echo ""

# ============================================================
# 步骤3：禁用HTTP配置
# ============================================================
log_info "[步骤3/5] 禁用HTTP临时配置"

if [ -f "$HTTP_CONF" ]; then
    log_info "备份 planning-app-http.conf..."
    mv "$HTTP_CONF" "$HTTP_CONF.bak"
    log_success "已禁用HTTP临时配置"
else
    log_warning "planning-app-http.conf 不存在，跳过"
fi

echo ""

# ============================================================
# 步骤4：启用HTTPS配置
# ============================================================
log_info "[步骤4/5] 启用HTTPS配置"

if [ ! -f "$HTTPS_CONF" ]; then
    log_error "HTTPS配置文件不存在: $HTTPS_CONF"
    exit 1
fi

log_info "复制 planning-app-https.conf 为 planning-app.conf..."
cp "$HTTPS_CONF" "$FINAL_CONF"

# 禁用原始的 planning-app-https.conf 避免重复加载
if [ -f "$HTTPS_CONF" ]; then
    log_info "禁用原始HTTPS配置文件（避免重复加载）..."
    mv "$HTTPS_CONF" "$HTTPS_CONF.bak"
    log_success "已禁用 planning-app-https.conf（保留备份）"
fi

log_success "已启用HTTPS配置"

echo ""

# ============================================================
# 步骤5：重启Nginx
# ============================================================
log_info "[步骤5/5] 重启Nginx容器"

# 检查Nginx配置语法
log_info "检查Nginx配置语法..."
if docker compose exec nginx nginx -t; then
    log_success "Nginx配置语法正确"
else
    log_error "Nginx配置语法错误，请检查配置文件"
    log_error "回滚配置..."
    rm -f "$FINAL_CONF"
    [ -f "$HTTP_CONF.bak" ] && mv "$HTTP_CONF.bak" "$HTTP_CONF"
    exit 1
fi

# 重载Nginx
log_info "重载Nginx配置..."
if docker compose exec nginx nginx -s reload; then
    log_success "Nginx配置已重载"
else
    log_error "Nginx重载失败，尝试重启容器..."
    docker compose restart nginx
fi

echo ""

# ============================================================
# 步骤6：验证HTTPS
# ============================================================
log_info "验证HTTPS访问..."

sleep 3  # 等待Nginx重启完成

HTTPS_STATUS=$(timeout 10 curl -sk -o /dev/null -w "%{http_code}" https://txjjzyzqbx.cn/health 2>/dev/null || echo "000")
if [ "$HTTPS_STATUS" == "200" ]; then
    log_success "HTTPS访问正常 ✓"
else
    log_error "HTTPS访问失败 (HTTP $HTTPS_STATUS)"
    log_error "请检查Nginx日志: docker compose logs nginx"
    exit 1
fi

# 验证HTTP跳转
HTTP_REDIRECT=$(timeout 10 curl -sI http://txjjzyzqbx.cn/health 2>/dev/null | grep -i "location" || echo "")
if echo "$HTTP_REDIRECT" | grep -q "https://"; then
    log_success "HTTP → HTTPS 跳转正常 ✓"
else
    log_warning "HTTP跳转未生效，可能需要清理浏览器缓存"
fi

echo ""

# ============================================================
# 完成
# ============================================================
log_success "============================================================"
log_success "✅ HTTPS配置已成功启用！"
log_success "============================================================"
log_info "访问地址: https://txjjzyzqbx.cn"
log_info "API端点: https://txjjzyzqbx.cn/api/v1/"
log_info "健康检查: https://txjjzyzqbx.cn/health"
log_success "============================================================"
log_info ""
log_info "下一步建议："
log_info "1. 运行生产验证: sudo bash scripts/verify-production-fixed.sh"
log_info "2. 检查SSL证书自动续期: crontab -l | grep certbot"
log_info "3. 监控Nginx日志: docker compose logs -f nginx"
log_success "============================================================"
