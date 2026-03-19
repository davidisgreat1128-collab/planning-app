#!/bin/bash
# ============================================================
# Planning App - SSL证书申请脚本（Let's Encrypt）
# ============================================================
# 功能: 自动申请SSL证书并配置Nginx HTTPS
# 使用: bash scripts/setup-ssl.sh
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

# 从 .env 读取域名配置
if [ ! -f ".env" ]; then
    log_error ".env 文件不存在！"
    exit 1
fi

# 加载环境变量
set -a
source .env
set +a

# 域名配置
DOMAIN=${DOMAIN:-txjjzyzqbx.cn}
DOMAIN_WWW=${DOMAIN_WWW:-www.txjjzyzqbx.cn}
EMAIL=${DOMAIN_EMAIL:-admin@txjjzyzqbx.cn}

log_info "域名配置:"
echo "  主域名: $DOMAIN"
echo "  www域名: $DOMAIN_WWW"
echo "  通知邮箱: $EMAIL"
echo

# ============================================================
# 步骤1: 检查DNS解析
# ============================================================
log_step "步骤1: 检查DNS解析"

log_info "检查域名DNS解析..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -1)

if [ -z "$RESOLVED_IP" ]; then
    log_error "DNS解析失败！请先在腾讯云配置DNS记录："
    echo "  记录类型: A"
    echo "  主机记录: @"
    echo "  记录值: $(hostname -I | awk '{print $1}')"
    exit 1
fi

log_info "$DOMAIN → $RESOLVED_IP"

# 验证IP是否指向本机
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    log_warn "警告: DNS解析的IP ($RESOLVED_IP) 与服务器IP ($SERVER_IP) 不匹配！"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log_info "DNS解析验证通过 ✓"
fi

# ============================================================
# 步骤2: 安装Certbot
# ============================================================
log_step "步骤2: 安装Certbot"

if ! command -v certbot &> /dev/null; then
    log_info "安装Certbot..."

    # 检测操作系统
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt update
        apt install -y certbot
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y certbot
    else
        log_error "不支持的操作系统！请手动安装 certbot"
        exit 1
    fi

    log_info "Certbot 安装完成 ✓"
else
    log_info "Certbot 已安装 ✓"
fi

# ============================================================
# 步骤3: 停止Nginx容器（避免80端口占用）
# ============================================================
log_step "步骤3: 停止Nginx容器"

log_info "停止Nginx容器..."
docker stop planning-app-nginx 2>/dev/null || true
log_info "Nginx已停止 ✓"

# ============================================================
# 步骤4: 申请SSL证书
# ============================================================
log_step "步骤4: 申请SSL证书"

log_info "使用 Let's Encrypt 申请SSL证书..."
log_warn "请确保80端口可以从公网访问（防火墙已开放）"

# 创建证书目录
mkdir -p /etc/letsencrypt

# 申请证书（standalone模式）
certbot certonly --standalone \
    -d $DOMAIN \
    -d $DOMAIN_WWW \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --preferred-challenges http

if [ $? -eq 0 ]; then
    log_info "✅ SSL证书申请成功！"
    log_info "证书路径: /etc/letsencrypt/live/$DOMAIN/"
else
    log_error "SSL证书申请失败！"
    log_info "请检查:"
    echo "  1. DNS是否正确解析到服务器IP"
    echo "  2. 防火墙是否开放80端口"
    echo "  3. 域名是否已备案（中国大陆服务器需要）"
    exit 1
fi

# ============================================================
# 步骤5: 切换Nginx配置到HTTPS模式
# ============================================================
log_step "步骤5: 切换Nginx配置到HTTPS模式"

log_info "备份HTTP配置..."
if [ -f "nginx/conf.d/planning-app-http.conf" ]; then
    mv nginx/conf.d/planning-app-http.conf nginx/conf.d/planning-app-http.conf.bak
    log_info "已备份HTTP配置 ✓"
fi

log_info "启用HTTPS配置..."
if [ -f "nginx/conf.d/planning-app-https.conf" ]; then
    cp nginx/conf.d/planning-app-https.conf nginx/conf.d/planning-app.conf
    log_info "HTTPS配置已启用 ✓"
else
    log_error "未找到 HTTPS 配置文件！"
    exit 1
fi

# ============================================================
# 步骤6: 重启Nginx
# ============================================================
log_step "步骤6: 重启Nginx"

log_info "启动Nginx容器..."
docker start planning-app-nginx

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
# 步骤7: 验证HTTPS访问
# ============================================================
log_step "步骤7: 验证HTTPS访问"

log_info "等待Nginx完全启动..."
sleep 3

log_info "测试HTTPS访问..."
if curl -k -s https://localhost/health | grep -q "healthy"; then
    log_info "✅ HTTPS访问测试通过！"
else
    log_warn "HTTPS访问测试失败，可能需要稍等片刻"
fi

# ============================================================
# 步骤8: 配置证书自动续期
# ============================================================
log_step "步骤8: 配置证书自动续期"

log_info "配置定时任务（每月1号凌晨3点自动续期）..."

# 检查crontab是否已存在续期任务
if crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    log_info "续期任务已存在 ✓"
else
    # 添加续期任务
    (crontab -l 2>/dev/null; echo "0 3 1 * * $(pwd)/scripts/renew-ssl.sh >> $(pwd)/logs/ssl-renew.log 2>&1") | crontab -
    log_info "续期任务已添加 ✓"
fi

# 创建日志目录
mkdir -p logs

# ============================================================
# 完成
# ============================================================
echo
echo "============================================================"
log_info "✅ SSL证书配置成功！"
echo "============================================================"
echo
log_info "证书信息:"
certbot certificates
echo
log_info "访问地址:"
echo "  - HTTPS: https://$DOMAIN/health"
echo "  - HTTP自动跳转: http://$DOMAIN → https://$DOMAIN"
echo
log_info "证书有效期: 90天"
log_info "自动续期: 每月1号凌晨3点"
echo
log_warn "重要提醒:"
echo "  1. 请在浏览器中访问 https://$DOMAIN 验证绿色锁标志"
echo "  2. 前端需要修改API地址为: https://$DOMAIN/api/v1"
echo "  3. 后端需要修改CORS配置为: https://$DOMAIN"
echo
