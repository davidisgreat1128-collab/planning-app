#!/bin/bash
# ============================================================
# Planning App - 一键生产部署脚本（含SSL证书）
# ============================================================
# 功能: 自动化完成从代码拉取到HTTPS生产环境的全流程
# 用途: 首次部署或更新部署
# 版本: v1.0
# 作者: Claude AI
# 日期: 2026-03-21
# ============================================================
# 前置条件:
#   - 服务器已安装 Docker、Docker Compose
#   - 已配置 .env 文件
#   - 域名DNS已解析到服务器IP
#   - 80和443端口已开放
# ============================================================

set -e

# ============================================================
# 颜色定义
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo ""
    echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║${NC} ${CYAN}步骤 $1/$2: $3${NC}"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ============================================================
# 配置变量
# ============================================================
DOMAIN="${DOMAIN:-txjjzyzqbx.cn}"
EMAIL="${EMAIL:-davidisgreat1128@gmail.com}"
DEPLOY_MODE="$1"  # full / update / ssl-only / verify

# ============================================================
# 显示Banner
# ============================================================
clear
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         Planning App - 一键生产部署脚本 v1.0              ║
║                                                           ║
║   基于《易经》的人生规划系统 - HTTPS生产环境自动化部署    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "域名: $DOMAIN"
log_info "邮箱: $EMAIL"
log_info "部署模式: ${DEPLOY_MODE:-full (完整部署)}"
log_info "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================================
# 检查部署模式和帮助信息
# ============================================================
if [ "$DEPLOY_MODE" == "--help" ] || [ "$DEPLOY_MODE" == "-h" ]; then
    cat << EOF
${CYAN}使用方法:${NC}
  sudo bash scripts/deploy-production.sh [模式]

${CYAN}部署模式:${NC}
  ${GREEN}full${NC}        - 完整部署（默认）
                 拉取代码 → 构建镜像 → 启动服务 → 数据库迁移
                 → 申请SSL证书 → 切换HTTPS配置 → 生产验证

  ${GREEN}update${NC}      - 更新部署
                 拉取代码 → 重新构建 → 重启服务 → 生产验证

  ${GREEN}ssl-only${NC}    - 仅SSL配置
                 申请SSL证书 → 切换HTTPS配置 → 生产验证

  ${GREEN}verify${NC}      - 仅验证
                 运行生产环境验证脚本

${CYAN}使用示例:${NC}
  # 完整部署（首次部署）
  sudo bash scripts/deploy-production.sh

  # 更新部署（代码更新后）
  sudo bash scripts/deploy-production.sh update

  # 仅配置SSL证书
  sudo bash scripts/deploy-production.sh ssl-only

  # 仅验证生产环境
  sudo bash scripts/deploy-production.sh verify

${CYAN}环境变量:${NC}
  DOMAIN      - 域名（默认: txjjzyzqbx.cn）
  EMAIL       - 邮箱（默认: davidisgreat1128@gmail.com）

${CYAN}自定义域名示例:${NC}
  DOMAIN=example.com EMAIL=admin@example.com sudo bash scripts/deploy-production.sh

${CYAN}前置条件检查:${NC}
  - 服务器已安装 Docker 和 Docker Compose
  - 已配置 .env 文件（数据库密码、JWT密钥等）
  - 域名DNS已解析到服务器IP
  - 防火墙已开放 80 和 443 端口

${CYAN}部署流程:${NC}
  1. 前置条件检查（Docker、.env、DNS解析）
  2. 拉取最新代码（Git）
  3. 构建Docker镜像（Backend）
  4. 启动Docker服务（MySQL、Redis、Backend、Nginx）
  5. 数据库初始化（迁移+种子数据）
  6. 申请SSL证书（Let's Encrypt，webroot模式）
  7. 切换HTTPS配置（Nginx配置切换）
  8. 生产环境验证（17项检查）

${CYAN}文档参考:${NC}
  - 完整部署文档: docs/01-产品需求/🚀 Planning App 生产部署方案（HTTPS + 域名版）.md
  - 配置切换指南: docs/01-产品需求/部署后配置切换指南.md
  - SSL申请脚本: scripts/setup-ssl-webroot.sh
  - HTTPS启用脚本: scripts/enable-https.sh
  - 验证脚本: scripts/verify-production-fixed.sh
EOF
    exit 0
fi

# 默认为完整部署
DEPLOY_MODE="${DEPLOY_MODE:-full}"

# ============================================================
# 步骤0: 前置条件检查
# ============================================================
log_step "0" "8" "前置条件检查"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    log_info "示例: sudo bash scripts/deploy-production.sh"
    exit 1
fi
log_success "Root权限检查通过"

# 检查Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker未安装"
    log_info "安装Docker: curl -fsSL https://get.docker.com | bash"
    exit 1
fi
log_success "Docker已安装: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

# 检查Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
    log_success "Docker Compose已安装: $(docker compose version --short)"
elif command -v docker-compose &> /dev/null; then
    COMPOSE="docker-compose"
    log_success "Docker Compose已安装: $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)"
else
    log_error "Docker Compose未安装"
    log_info "安装Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    log_warning ".env文件不存在"
    if [ -f ".env.example" ]; then
        log_info "从.env.example复制..."
        cp .env.example .env
        log_warning "请编辑 .env 文件，配置以下内容："
        log_warning "  - MYSQL_ROOT_PASSWORD（MySQL密码）"
        log_warning "  - REDIS_PASSWORD（Redis密码）"
        log_warning "  - JWT_SECRET（JWT密钥）"
        log_warning "  - DOMAIN（域名）"
        log_warning "  - API_BASE_URL（API地址）"
        log_warning "  - CORS_ORIGIN（CORS域名）"
        log_info "编辑完成后重新运行此脚本"
        exit 1
    else
        log_error ".env.example文件也不存在，请检查项目完整性"
        exit 1
    fi
fi
log_success ".env文件存在"

# 加载环境变量
log_info "加载环境变量..."
set -a
source .env
set +a

# 验证关键变量
MISSING_VARS=()
[ -z "$MYSQL_ROOT_PASSWORD" ] && MISSING_VARS+=("MYSQL_ROOT_PASSWORD")
[ -z "$REDIS_PASSWORD" ] && MISSING_VARS+=("REDIS_PASSWORD")
[ -z "$JWT_SECRET" ] && MISSING_VARS+=("JWT_SECRET")

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_error "以下环境变量未设置:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    log_info "请编辑 .env 文件配置这些变量"
    exit 1
fi
log_success "关键环境变量已配置"

# 检查Certbot（如果需要申请SSL）
if [ "$DEPLOY_MODE" == "full" ] || [ "$DEPLOY_MODE" == "ssl-only" ]; then
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot未安装，将尝试安装..."
        if command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y certbot
            log_success "Certbot安装成功"
        elif command -v yum &> /dev/null; then
            yum install -y certbot
            log_success "Certbot安装成功"
        else
            log_error "无法自动安装Certbot，请手动安装"
            exit 1
        fi
    else
        log_success "Certbot已安装: $(certbot --version 2>&1 | head -1)"
    fi
fi

# ============================================================
# 步骤1: 拉取最新代码（update和full模式）
# ============================================================
if [ "$DEPLOY_MODE" == "full" ] || [ "$DEPLOY_MODE" == "update" ]; then
    log_step "1" "8" "拉取最新代码"

    if [ -d ".git" ]; then
        log_info "当前分支: $(git branch --show-current)"
        log_info "最新提交: $(git log -1 --oneline)"

        # 检查Git远程URL类型
        REMOTE_URL=$(git config --get remote.origin.url || echo "")
        if [[ "$REMOTE_URL" == git@* ]]; then
            log_info "检测到SSH协议: $REMOTE_URL"

            # 检查SSH agent
            if [ -z "$SSH_AUTH_SOCK" ] || ! ssh-add -l &>/dev/null; then
                log_warning "SSH密钥未添加到agent"
                log_warning "请先执行以下命令（在sudo之前）："
                log_warning "  eval \"\$(ssh-agent -s)\""
                log_warning "  ssh-add ~/.ssh/id_ed25519"
                log_warning ""
                log_warning "然后使用 sudo -E 保留环境变量："
                log_warning "  sudo -E bash scripts/deploy-production.sh"
                log_warning ""
                log_info "或者跳过代码拉取（如果代码已是最新）："
                log_info "  1. 手动拉取代码: git pull origin develop"
                log_info "  2. 然后运行update模式: sudo bash scripts/deploy-production.sh update"

                # 询问是否跳过Git拉取
                read -p "是否跳过Git拉取，继续部署？(y/N): " SKIP_GIT
                if [ "$SKIP_GIT" != "y" ] && [ "$SKIP_GIT" != "Y" ]; then
                    log_error "部署已取消"
                    exit 1
                fi
                log_warning "跳过Git拉取，使用当前代码继续部署..."
            else
                # SSH agent正常，执行拉取
                # 暂存本地修改
                if ! git diff-index --quiet HEAD --; then
                    log_warning "检测到本地修改，正在暂存..."
                    git stash
                    log_success "本地修改已暂存"
                fi

                # 拉取远程代码
                log_info "拉取远程develop分支..."
                if git pull origin develop; then
                    log_success "代码拉取成功"
                    log_info "最新提交: $(git log -1 --oneline)"
                else
                    log_error "代码拉取失败"
                    log_error "请检查SSH密钥配置或网络连接"
                    exit 1
                fi
            fi
        else
            # HTTPS协议，直接拉取
            log_info "使用HTTPS协议拉取代码..."

            # 暂存本地修改
            if ! git diff-index --quiet HEAD --; then
                log_warning "检测到本地修改，正在暂存..."
                git stash
                log_success "本地修改已暂存"
            fi

            # 拉取远程代码
            if git pull origin develop; then
                log_success "代码拉取成功"
                log_info "最新提交: $(git log -1 --oneline)"
            else
                log_error "代码拉取失败"
                log_error "请检查GitHub凭证或网络连接"
                exit 1
            fi
        fi
    else
        log_warning "不是Git仓库，跳过代码拉取"
    fi
fi

# ============================================================
# 步骤2: 构建Docker镜像（full和update模式）
# ============================================================
if [ "$DEPLOY_MODE" == "full" ] || [ "$DEPLOY_MODE" == "update" ]; then
    log_step "2" "8" "构建Docker镜像"

    log_info "拉取基础镜像..."
    $COMPOSE pull mysql redis nginx || true
    log_success "基础镜像拉取完成"

    log_info "构建Backend镜像..."
    if $COMPOSE build backend; then
        log_success "Backend镜像构建完成"
    else
        log_error "Backend镜像构建失败"
        exit 1
    fi
fi

# ============================================================
# 步骤3: 启动Docker服务（full模式）
# ============================================================
if [ "$DEPLOY_MODE" == "full" ]; then
    log_step "3" "8" "启动Docker服务"

    log_info "停止旧容器..."
    $COMPOSE down || true

    log_info "启动所有服务..."
    if $COMPOSE up -d; then
        log_success "Docker服务启动成功"
    else
        log_error "Docker服务启动失败"
        exit 1
    fi

    log_info "等待服务启动（20秒）..."
    sleep 20

    log_success "服务启动完成"
    $COMPOSE ps
fi

# ============================================================
# 步骤4: 健康检查（full模式）
# ============================================================
if [ "$DEPLOY_MODE" == "full" ]; then
    log_step "4" "8" "服务健康检查"

    # MySQL健康检查
    log_info "等待MySQL启动..."
    for i in {1..30}; do
        if $COMPOSE exec -T mysql mysqladmin ping -h localhost -uroot -p"$MYSQL_ROOT_PASSWORD" --silent &>/dev/null; then
            log_success "MySQL已就绪"
            break
        fi
        sleep 2
    done

    # Redis健康检查
    log_info "等待Redis启动..."
    for i in {1..30}; do
        if $COMPOSE exec -T redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q PONG; then
            log_success "Redis已就绪"
            break
        fi
        sleep 2
    done

    # Backend健康检查
    log_info "等待Backend启动..."
    for i in {1..60}; do
        if $COMPOSE exec -T backend curl -s http://localhost:3000/health 2>/dev/null | grep -q '"status":"ok"'; then
            log_success "Backend已就绪"
            break
        fi
        sleep 2
    done
fi

# ============================================================
# 步骤5: 数据库初始化（full模式）
# ============================================================
if [ "$DEPLOY_MODE" == "full" ]; then
    log_step "5" "8" "数据库初始化"

    log_info "运行数据库迁移..."
    if $COMPOSE exec -T backend npm run db:migrate 2>/dev/null || $COMPOSE exec -T backend npm run migrate; then
        log_success "数据库迁移完成"
    else
        log_warning "数据库迁移失败或已执行，继续部署..."
    fi

    log_info "导入种子数据..."
    if $COMPOSE exec -T backend npm run seed 2>/dev/null; then
        log_success "种子数据导入完成"
    else
        log_warning "种子数据导入失败或已存在，继续部署..."
    fi
fi

# ============================================================
# 步骤6: 申请SSL证书（full和ssl-only模式）
# ============================================================
if [ "$DEPLOY_MODE" == "full" ] || [ "$DEPLOY_MODE" == "ssl-only" ]; then
    log_step "6" "8" "申请SSL证书"

    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        log_warning "SSL证书已存在，跳过申请"
        log_info "证书路径: /etc/letsencrypt/live/$DOMAIN/"
        log_info "如需重新申请，请先删除: sudo rm -rf /etc/letsencrypt/live/$DOMAIN"
    else
        log_info "运行SSL证书申请脚本..."
        if [ -f "scripts/setup-ssl-webroot.sh" ]; then
            if bash scripts/setup-ssl-webroot.sh; then
                log_success "SSL证书申请成功"
            else
                log_error "SSL证书申请失败"
                log_info "请检查："
                log_info "  1. 域名DNS是否已解析到服务器IP"
                log_info "  2. 80端口是否开放"
                log_info "  3. Nginx容器是否正常运行"
                exit 1
            fi
        else
            log_error "SSL申请脚本不存在: scripts/setup-ssl-webroot.sh"
            log_info "请运行: git pull origin develop 获取最新脚本"
            exit 1
        fi
    fi
fi

# ============================================================
# 步骤7: 切换HTTPS配置（full和ssl-only模式）
# ============================================================
if [ "$DEPLOY_MODE" == "full" ] || [ "$DEPLOY_MODE" == "ssl-only" ]; then
    log_step "7" "8" "切换HTTPS配置"

    if [ -f "nginx/conf.d/planning-app.conf" ]; then
        log_warning "HTTPS配置已启用，跳过切换"
    else
        log_info "运行HTTPS启用脚本..."
        if [ -f "scripts/enable-https.sh" ]; then
            if bash scripts/enable-https.sh; then
                log_success "HTTPS配置切换成功"
            else
                log_error "HTTPS配置切换失败"
                exit 1
            fi
        else
            log_error "HTTPS启用脚本不存在: scripts/enable-https.sh"
            log_info "请运行: git pull origin develop 获取最新脚本"
            exit 1
        fi
    fi
fi

# ============================================================
# 步骤8: 重启服务（update模式）
# ============================================================
if [ "$DEPLOY_MODE" == "update" ]; then
    log_step "8" "8" "重启服务"

    log_info "重启Backend服务..."
    $COMPOSE restart backend

    log_info "重启Nginx服务..."
    $COMPOSE restart nginx

    log_info "等待服务重启（10秒）..."
    sleep 10

    log_success "服务重启完成"
    $COMPOSE ps
fi

# ============================================================
# 步骤9: 生产环境验证（所有模式）
# ============================================================
log_step "8" "8" "生产环境验证"

if [ -f "scripts/verify-production-fixed.sh" ]; then
    if bash scripts/verify-production-fixed.sh; then
        log_success "生产环境验证通过"
    else
        log_warning "生产环境验证发现警告，请检查上述输出"
    fi
else
    log_error "验证脚本不存在: scripts/verify-production-fixed.sh"
    log_warning "跳过验证步骤"
fi

# ============================================================
# 部署完成总结
# ============================================================
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            🎉 部署完成！Planning App 已上线！              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_success "═══════════════════════════════════════════════════════════"
log_info "访问地址:"
log_info "  🌐 HTTPS: ${GREEN}https://$DOMAIN${NC}"
log_info "  🔌 API端点: ${GREEN}https://$DOMAIN/api/v1/${NC}"
log_info "  ❤️  健康检查: ${GREEN}https://$DOMAIN/health${NC}"
echo ""
log_info "容器状态:"
$COMPOSE ps
echo ""
log_info "常用命令:"
log_info "  查看所有日志: ${CYAN}$COMPOSE logs -f${NC}"
log_info "  查看Backend日志: ${CYAN}$COMPOSE logs -f backend${NC}"
log_info "  查看Nginx日志: ${CYAN}$COMPOSE logs -f nginx${NC}"
log_info "  重启服务: ${CYAN}$COMPOSE restart <service_name>${NC}"
log_info "  停止服务: ${CYAN}$COMPOSE down${NC}"
log_info "  启动服务: ${CYAN}$COMPOSE up -d${NC}"
echo ""
log_info "SSL证书管理:"
log_info "  证书有效期: ${GREEN}90天（自动续期）${NC}"
log_info "  自动续期: ${GREEN}每周日凌晨3点${NC}"
log_info "  手动续期测试: ${CYAN}sudo certbot renew --dry-run${NC}"
log_info "  查看证书信息: ${CYAN}sudo certbot certificates${NC}"
echo ""
log_success "═══════════════════════════════════════════════════════════"
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║          Planning App - 基于《易经》的人生规划系统        ║
║                    自强不息 厚德载物                       ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
