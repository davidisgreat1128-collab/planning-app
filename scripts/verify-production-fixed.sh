#!/bin/bash
# ============================================================
# Planning App - 生产环境验证脚本（修复版）
# ============================================================
# 功能: 验证生产环境部署是否正确
# 域名: txjjzyzqbx.cn, www.txjjzyzqbx.cn
# 服务器IP: 154.8.183.203
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
DOMAIN="txjjzyzqbx.cn"
WWW_DOMAIN="www.txjjzyzqbx.cn"
SERVER_IP="154.8.183.203"

log_info "============================================================"
log_info "Planning App - 生产环境验证（修复版）"
log_info "============================================================"
log_info "域名: $DOMAIN, $WWW_DOMAIN"
log_info "服务器IP: $SERVER_IP"
log_info "============================================================"
echo ""

# ============================================================
# 1. DNS 解析验证
# ============================================================
log_info "[1/7] DNS 解析验证"

# 主域名解析（使用多种方法，添加超时）
DOMAIN_IP=""
if command -v dig &> /dev/null; then
    DOMAIN_IP=$(timeout 5 dig +short $DOMAIN @8.8.8.8 2>/dev/null | tail -n1 || echo "")
fi

if [ -z "$DOMAIN_IP" ] && command -v nslookup &> /dev/null; then
    DOMAIN_IP=$(timeout 5 nslookup $DOMAIN 8.8.8.8 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1 || echo "")
fi

if [ -z "$DOMAIN_IP" ] && command -v host &> /dev/null; then
    DOMAIN_IP=$(timeout 5 host $DOMAIN 8.8.8.8 2>/dev/null | grep "has address" | awk '{print $4}' | head -1 || echo "")
fi

if [ -z "$DOMAIN_IP" ]; then
    log_warning "$DOMAIN 解析失败（DNS工具不可用或超时），跳过DNS检查"
else
    if [ "$DOMAIN_IP" == "$SERVER_IP" ]; then
        log_success "$DOMAIN → $DOMAIN_IP ✓"
    else
        log_error "$DOMAIN → $DOMAIN_IP (期望: $SERVER_IP)"
    fi
fi

# www 子域名解析
WWW_IP=""
if command -v dig &> /dev/null; then
    WWW_IP=$(timeout 5 dig +short $WWW_DOMAIN @8.8.8.8 2>/dev/null | tail -n1 || echo "")
fi

if [ -z "$WWW_IP" ] && command -v nslookup &> /dev/null; then
    WWW_IP=$(timeout 5 nslookup $WWW_DOMAIN 8.8.8.8 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1 || echo "")
fi

if [ -z "$WWW_IP" ]; then
    log_warning "$WWW_DOMAIN 解析失败，跳过"
else
    if [ "$WWW_IP" == "$SERVER_IP" ]; then
        log_success "$WWW_DOMAIN → $WWW_IP ✓"
    else
        log_error "$WWW_DOMAIN → $WWW_IP (期望: $SERVER_IP)"
    fi
fi

echo ""

# ============================================================
# 2. SSL 证书验证
# ============================================================
log_info "[2/7] SSL 证书验证"

# 检查证书是否存在
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_error "SSL 证书文件不存在: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
else
    log_success "SSL 证书文件存在"

    # 检查证书有效期
    CERT_EXPIRY=$(timeout 10 openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
    if [ -n "$CERT_EXPIRY" ]; then
        log_success "证书有效期: $CERT_EXPIRY"
    else
        log_warning "无法读取证书有效期"
    fi

    # 检查证书主体名称
    CERT_SUBJECT=$(timeout 10 openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -noout -subject 2>/dev/null | sed 's/.*CN = //' || echo "")
    if [ -n "$CERT_SUBJECT" ]; then
        log_success "证书主体: $CERT_SUBJECT"
    else
        log_warning "无法读取证书主体"
    fi
fi

echo ""

# ============================================================
# 3. HTTPS 访问验证
# ============================================================
log_info "[3/7] HTTPS 访问验证"

# 3.1 验证 HTTPS 端口可访问
HTTPS_STATUS=$(timeout 10 curl -sk -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null || echo "000")
if [ "$HTTPS_STATUS" == "200" ]; then
    log_success "HTTPS 访问正常 (HTTP $HTTPS_STATUS)"
else
    log_error "HTTPS 访问失败 (HTTP $HTTPS_STATUS)"
fi

# 3.2 验证 HTTP 跳转 HTTPS
HTTP_REDIRECT=$(timeout 10 curl -sI http://$DOMAIN/health 2>/dev/null | grep -i "location" || echo "")
if echo "$HTTP_REDIRECT" | grep -q "https://"; then
    log_success "HTTP → HTTPS 跳转正常"
else
    log_warning "HTTP 跳转配置可能缺失"
fi

# 3.3 验证 TLS 版本
TLS_VERSION=$(timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN </dev/null 2>/dev/null | grep "Protocol" | awk '{print $3}' || echo "")
if [ -n "$TLS_VERSION" ]; then
    log_success "TLS 版本: $TLS_VERSION"
else
    log_warning "无法检测 TLS 版本"
fi

echo ""

# ============================================================
# 4. CORS 配置验证
# ============================================================
log_info "[4/7] CORS 配置验证"

CORS_HEADER=$(timeout 10 curl -sI https://$DOMAIN/api/v1/health -H "Origin: https://$DOMAIN" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    log_success "CORS 配置正常: $CORS_HEADER"
else
    log_warning "未检测到 CORS 响应头（可能需要 OPTIONS 请求）"
fi

echo ""

# ============================================================
# 5. 安全响应头验证
# ============================================================
log_info "[5/7] 安全响应头验证"

HEADERS=$(timeout 10 curl -sI https://$DOMAIN/health 2>/dev/null || echo "")

# 检查 HSTS
if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    log_success "HSTS 已启用"
else
    log_warning "HSTS 未启用（建议启用）"
fi

# 检查 X-Content-Type-Options
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    log_success "X-Content-Type-Options 已设置"
else
    log_warning "X-Content-Type-Options 未设置"
fi

# 检查 X-Frame-Options
if echo "$HEADERS" | grep -qi "x-frame-options"; then
    log_success "X-Frame-Options 已设置"
else
    log_warning "X-Frame-Options 未设置"
fi

echo ""

# ============================================================
# 6. API 功能验证
# ============================================================
log_info "[6/7] API 功能验证"

# 检查健康检查接口
HEALTH_RESPONSE=$(timeout 10 curl -sk https://$DOMAIN/health 2>/dev/null || echo "")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    log_success "健康检查接口正常"
else
    log_error "健康检查接口异常: $HEALTH_RESPONSE"
fi

# 检查 API v1 路径
API_STATUS=$(timeout 10 curl -sk -o /dev/null -w "%{http_code}" https://$DOMAIN/api/v1/health 2>/dev/null || echo "000")
if [ "$API_STATUS" == "200" ]; then
    log_success "API v1 路径正常 (HTTP $API_STATUS)"
else
    log_warning "API v1 路径可能未配置 (HTTP $API_STATUS)"
fi

echo ""

# ============================================================
# 7. Docker 容器状态验证
# ============================================================
log_info "[7/7] Docker 容器状态验证"

cd /opt/planning-app/planning-app 2>/dev/null || {
    log_error "无法进入项目目录 /opt/planning-app/planning-app"
    exit 1
}

# 检查所有容器状态
CONTAINERS=$(docker compose ps --format "{{.Service}}\t{{.Status}}" 2>/dev/null || echo "")
if [ -z "$CONTAINERS" ]; then
    log_error "无法获取容器状态"
else
    echo "$CONTAINERS" | while IFS=$'\t' read -r service status; do
        if echo "$status" | grep -q "Up"; then
            log_success "$service: $status"
        else
            log_error "$service: $status"
        fi
    done
fi

echo ""

# ============================================================
# 总结
# ============================================================
log_info "============================================================"
log_success "✅ 生产环境验证完成！"
log_info "============================================================"
log_info "如有警告或错误，请根据提示进行调整"
log_info "详细日志可查看: /var/log/nginx/access.log 和 error.log"
log_info "Docker 日志: docker compose logs <service_name>"
log_success "============================================================"
