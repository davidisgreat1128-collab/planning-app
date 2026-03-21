#!/bin/bash
# ============================================================
# Planning App - SSL 证书申请脚本（Webroot 模式 - Docker Nginx）
# ============================================================
# 功能: 使用 Let's Encrypt 申请免费 SSL 证书（不自动修改配置）
# 模式: webroot（适用于 Docker Nginx）
# 依赖: certbot 5.4.0+
# 域名: txjjzyzqbx.cn, www.txjjzyzqbx.cn
# ============================================================

set -e  # 遇到错误立即退出

# ============================================================
# 颜色定义
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# 日志函数
# ============================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================
# 检查是否以 root 运行
# ============================================================
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本: sudo bash scripts/setup-ssl-webroot.sh"
    exit 1
fi

# ============================================================
# 配置变量
# ============================================================
DOMAIN="txjjzyzqbx.cn"
WWW_DOMAIN="www.txjjzyzqbx.cn"
EMAIL="davidisgreat1128@gmail.com"  # ⚠️ 请修改为你的真实邮箱

PROJECT_DIR="/opt/planning-app/planning-app"
WEBROOT_DIR="$PROJECT_DIR/nginx/certbot"

log_info "============================================================"
log_info "Planning App - SSL 证书申请（Webroot 模式）"
log_info "============================================================"
log_info "域名: $DOMAIN, $WWW_DOMAIN"
log_info "邮箱: $EMAIL"
log_info "项目目录: $PROJECT_DIR"
log_info "Webroot: $WEBROOT_DIR"
log_info "============================================================"

# ============================================================
# 步骤 1: 检查 Certbot 安装
# ============================================================
log_info "[1/7] 检查 Certbot 安装..."
if ! command -v certbot &> /dev/null; then
    log_error "Certbot 未安装，请先安装: sudo apt install certbot"
    exit 1
fi
CERTBOT_VERSION=$(certbot --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1)
log_success "Certbot 已安装: v$CERTBOT_VERSION"

# ============================================================
# 步骤 2: 检查域名解析
# ============================================================
log_info "[2/7] 检查域名解析..."
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipinfo.io/ip)
DOMAIN_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -n1)
WWW_IP=$(dig +short $WWW_DOMAIN @8.8.8.8 | tail -n1)

log_info "服务器 IP: $SERVER_IP"
log_info "$DOMAIN 解析到: $DOMAIN_IP"
log_info "$WWW_DOMAIN 解析到: $WWW_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ] || [ "$WWW_IP" != "$SERVER_IP" ]; then
    log_error "域名解析错误！"
    log_error "请确保以下 DNS 记录指向服务器 IP: $SERVER_IP"
    log_error "  $DOMAIN -> $SERVER_IP"
    log_error "  $WWW_DOMAIN -> $SERVER_IP"
    log_error "当前解析："
    log_error "  $DOMAIN -> $DOMAIN_IP"
    log_error "  $WWW_DOMAIN -> $WWW_IP"
    read -p "是否继续尝试？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log_success "域名解析正确"
fi

# ============================================================
# 步骤 3: 创建 Webroot 目录
# ============================================================
log_info "[3/7] 创建 Webroot 目录..."
mkdir -p "$WEBROOT_DIR/.well-known/acme-challenge"
chmod -R 755 "$WEBROOT_DIR"
log_success "Webroot 目录已创建: $WEBROOT_DIR"

# ============================================================
# 步骤 4: 检查 Nginx 配置
# ============================================================
log_info "[4/7] 检查 Docker Nginx 配置..."
cd "$PROJECT_DIR"

# 确保 HTTP 配置存在且包含 .well-known 路径
if ! grep -q ".well-known/acme-challenge" nginx/conf.d/planning-app-http.conf; then
    log_warning "HTTP 配置中缺少 .well-known 路径配置"
    log_info "正在添加..."

    # 备份原配置
    cp nginx/conf.d/planning-app-http.conf nginx/conf.d/planning-app-http.conf.backup

    # 在 server 块中添加 .well-known 配置（在 location / 之前）
    sed -i '/location \/ {/i \    # Let'\''s Encrypt 验证路径\n    location ^~ /.well-known/acme-challenge/ {\n        default_type "text/plain";\n        root /var/www/certbot;\n    }\n' nginx/conf.d/planning-app-http.conf

    log_success "已添加 .well-known 路径配置"
fi

# 临时禁用 HTTPS 配置（如果存在）
if [ -f "nginx/conf.d/planning-app-https.conf" ]; then
    log_info "临时禁用 HTTPS 配置..."
    mv nginx/conf.d/planning-app-https.conf nginx/conf.d/planning-app-https.conf.disabled
    log_success "HTTPS 配置已禁用"
fi

# 重启 Nginx 容器以加载新配置
log_info "重启 Nginx 容器..."
docker compose restart nginx
sleep 5

# 检查 Nginx 是否正常
if docker compose ps nginx | grep -q "Up"; then
    log_success "Nginx 容器运行正常"
else
    log_error "Nginx 容器启动失败，请检查日志: docker compose logs nginx"
    exit 1
fi

# 测试 .well-known 路径是否可访问
log_info "测试 .well-known 路径..."
TEST_FILE="$WEBROOT_DIR/.well-known/acme-challenge/test-$(date +%s).txt"
echo "test" > "$TEST_FILE"

if curl -s "http://localhost/.well-known/acme-challenge/$(basename $TEST_FILE)" | grep -q "test"; then
    log_success ".well-known 路径配置正确"
    rm -f "$TEST_FILE"
else
    log_error ".well-known 路径无法访问"
    log_error "请检查 Nginx 配置和 Docker volume 映射"
    rm -f "$TEST_FILE"
    exit 1
fi

# ============================================================
# 步骤 5: 申请 SSL 证书
# ============================================================
log_info "[5/7] 申请 SSL 证书..."
log_warning "即将向 Let's Encrypt 发起证书申请"
log_warning "域名: $DOMAIN, $WWW_DOMAIN"
log_warning "邮箱: $EMAIL"
read -p "确认无误？按 Enter 继续，或 Ctrl+C 取消..."

certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT_DIR" \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --verbose

if [ $? -eq 0 ]; then
    log_success "✅ SSL 证书申请成功！"
    log_success "证书路径: /etc/letsencrypt/live/$DOMAIN/"
    log_info "证书文件："
    log_info "  fullchain.pem - 完整证书链"
    log_info "  privkey.pem   - 私钥"
    log_info "  chain.pem     - 中间证书"
    log_info "  cert.pem      - 域名证书"
else
    log_error "❌ SSL 证书申请失败"
    log_error "可能原因："
    log_error "  1. 域名解析不正确（DNS 未指向此服务器）"
    log_error "  2. 80 端口无法从外网访问（防火墙/安全组）"
    log_error "  3. Nginx 配置错误（.well-known 路径无法访问）"
    log_error "  4. Certbot 速率限制（同一域名短时间内申请次数过多）"
    log_error ""
    log_error "调试步骤："
    log_error "  1. 检查域名解析: dig $DOMAIN @8.8.8.8"
    log_error "  2. 检查 80 端口: curl http://$DOMAIN/.well-known/acme-challenge/test"
    log_error "  3. 检查 Nginx 日志: docker compose logs nginx"
    log_error "  4. 检查 Certbot 日志: sudo cat /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

# ============================================================
# 步骤 6: 配置 Docker Nginx 启用 HTTPS
# ============================================================
log_info "[6/7] 配置 Docker Nginx 启用 HTTPS..."

# 恢复 HTTPS 配置
if [ -f "nginx/conf.d/planning-app-https.conf.disabled" ]; then
    mv nginx/conf.d/planning-app-https.conf.disabled nginx/conf.d/planning-app-https.conf
    log_success "HTTPS 配置已启用"
else
    log_warning "HTTPS 配置文件不存在，请检查: nginx/conf.d/planning-app-https.conf"
fi

# 检查证书文件是否可被 Docker 容器访问
log_info "验证证书文件权限..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ]; then
    log_success "证书文件存在"

    # 显示证书信息
    log_info "证书信息："
    openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -dates -subject
else
    log_error "证书文件不存在"
    exit 1
fi

# 重启 Nginx 容器以加载 SSL 证书
log_info "重启 Nginx 容器..."
docker compose restart nginx
sleep 10

# ============================================================
# 步骤 7: 验证 HTTPS
# ============================================================
log_info "[7/7] 验证 HTTPS..."

# 检查 Nginx 容器状态
if ! docker compose ps nginx | grep -q "Up"; then
    log_error "Nginx 容器启动失败！"
    log_error "可能是证书路径配置错误，请检查："
    log_error "  docker compose logs nginx"
    exit 1
fi

# 等待 Nginx 完全启动
sleep 5

# 测试 HTTPS
log_info "测试 HTTPS 连接..."
if curl -skI https://localhost | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    log_success "✅ HTTPS 配置成功！"
else
    log_warning "HTTPS 可能未完全生效"
    log_warning "请检查 Nginx 日志: docker compose logs nginx"
fi

# 测试健康检查
log_info "测试健康检查..."
HTTPS_HEALTH=$(curl -sk https://localhost/health)
if echo "$HTTPS_HEALTH" | grep -q '"status":"ok"'; then
    log_success "健康检查正常: $HTTPS_HEALTH"
else
    log_warning "健康检查可能失败: $HTTPS_HEALTH"
fi

# ============================================================
# 完成
# ============================================================
log_success "============================================================"
log_success "🎉 SSL 证书设置完成！"
log_success "============================================================"
log_success "证书路径: /etc/letsencrypt/live/$DOMAIN/"
log_success "证书有效期: 90 天"
log_success "下次续期时间: $(date -d '+60 days' '+%Y-%m-%d')"
log_success "============================================================"
log_info "测试命令："
log_info "  HTTP:  curl http://$DOMAIN/health"
log_info "  HTTPS: curl https://$DOMAIN/health"
log_info "  证书:  curl -vI https://$DOMAIN 2>&1 | grep 'SSL certificate'"
log_success "============================================================"

# ============================================================
# 设置自动续期
# ============================================================
echo ""
log_info "是否设置证书自动续期? (y/n)"
read -p "选择: " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "设置自动续期..."

    # 创建续期脚本
    cat > /usr/local/bin/certbot-renew-planning-app.sh << 'RENEW_SCRIPT'
#!/bin/bash
# Planning App - SSL 证书自动续期脚本

LOG_FILE="/var/log/certbot-renew-planning-app.log"
PROJECT_DIR="/opt/planning-app/planning-app"

echo "[$(date)] 开始检查证书续期..." >> "$LOG_FILE"

# 尝试续期证书
certbot renew --quiet --webroot --webroot-path "$PROJECT_DIR/nginx/certbot"

if [ $? -eq 0 ]; then
    echo "[$(date)] 证书续期检查完成" >> "$LOG_FILE"

    # 重启 Nginx 容器以加载新证书
    cd "$PROJECT_DIR"
    docker compose restart nginx

    if [ $? -eq 0 ]; then
        echo "[$(date)] Nginx 容器重启成功" >> "$LOG_FILE"
    else
        echo "[$(date)] Nginx 容器重启失败！" >> "$LOG_FILE"
    fi
else
    echo "[$(date)] 证书续期失败！" >> "$LOG_FILE"
fi
RENEW_SCRIPT

    chmod +x /usr/local/bin/certbot-renew-planning-app.sh
    log_success "续期脚本已创建: /usr/local/bin/certbot-renew-planning-app.sh"

    # 添加到 crontab（每周检查一次，周日凌晨 3:00）
    CRON_JOB="0 3 * * 0 /usr/local/bin/certbot-renew-planning-app.sh"

    # 检查 cron 任务是否已存在
    if ! crontab -l 2>/dev/null | grep -q "certbot-renew-planning-app"; then
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log_success "Cron 任务已添加: 每周日凌晨 3:00 自动检查证书续期"
    else
        log_info "Cron 任务已存在，跳过添加"
    fi

    log_success "自动续期设置完成！"
    log_info "日志文件: /var/log/certbot-renew-planning-app.log"
    log_info "手动测试续期: sudo certbot renew --dry-run"
fi

log_success ""
log_success "✅ 全部完成！"
log_success ""
