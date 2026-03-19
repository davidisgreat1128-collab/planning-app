# 🚀 Planning App 生产部署方案（HTTPS + 域名版）

**服务器IP**: 154.8.183.203 **域名**: txjjzyzqbx.cn（已在腾讯云购买） **部署策略**: MySQL + Redis + Backend + Nginx（HTTPS）

------

## 📦 文件清单（共17个文件）

### 核心配置（4个）

1. **docker-compose.yml** - 服务编排（MySQL + Redis + Backend + Nginx，挂载SSL证书目录）
2. **.env** - 唯一环境变量源（增加域名配置）
3. **backend/Dockerfile** - 多阶段构建（builder + runtime）
4. **backend/.dockerignore** - 排除文件

### Nginx配置（3个）⭐ 域名版

1. **nginx/nginx.conf** - 主配置
2. **nginx/conf.d/planning-app-http.conf** - HTTP配置（仅用于申请SSL证书）
3. **nginx/conf.d/planning-app-https.conf** - HTTPS配置（HTTP→HTTPS跳转）

### 部署脚本（7个）⭐ 增加SSL脚本

1. **scripts/deploy.sh** - 一键部署（幂等+回滚）
2. **scripts/setup-ssl.sh** - **SSL证书申请脚本**（Let's Encrypt + Certbot自动续期）
3. **scripts/renew-ssl.sh** - **SSL证书续期脚本**（定时任务）
4. **scripts/backup-mysql.sh** - 备份+COS上传
5. **scripts/restore-mysql.sh** - 数据恢复
6. **scripts/health-check.sh** - 健康监控（DB+Redis）
7. **scripts/generate-secrets.sh** - 自动生成安全密钥

### 数据库（1个）

1. **database/init.sql** - MySQL初始化

### 文档（2个）

1. **docs/部署文档/生产部署完整指南-域名版.md** - 超详细手册（含DNS解析步骤）
2. **docs/部署文档/运维手册.md** - 命令速查

------

## 🎯 核心改进点（针对域名部署）

### 1️⃣ HTTPS自动化配置 ⭐⭐⭐⭐⭐

**方案**：Let's Encrypt + Certbot 自动申请和续期

 

**流程**：

```bash
# 第一次申请证书
bash scripts/setup-ssl.sh

# 自动执行：
# 1. 停止Nginx（避免80端口占用）
# 2. 使用certbot申请证书
# 3. 证书保存到 /etc/letsencrypt/live/txjjzyzqbx.cn/
# 4. 切换Nginx配置从HTTP到HTTPS
# 5. 重启Nginx
# 6. 配置自动续期（crontab）
```

**证书自动续期**（每月1号凌晨3点）：

```bash
# crontab -e
0 3 1 * * /opt/planning-app/scripts/renew-ssl.sh >> /opt/planning-app/logs/ssl-renew.log 2>&1
```

------

### 2️⃣ Nginx配置（HTTP → HTTPS跳转）

**nginx/conf.d/planning-app-https.conf**：

```nginx
# ============================================================
# HTTP服务（仅跳转到HTTPS）
# ============================================================
server {
    listen 80;
    server_name txjjzyzqbx.cn www.txjjzyzqbx.cn;

    # 健康检查不跳转（用于Docker健康检查）
    location /health {
        proxy_pass http://backend:3000/health;
        access_log off;
    }

    # 其他请求强制跳转到HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# ============================================================
# HTTPS服务（主服务）
# ============================================================
server {
    listen 443 ssl http2;
    server_name txjjzyzqbx.cn www.txjjzyzqbx.cn;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/txjjzyzqbx.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/txjjzyzqbx.cn/privkey.pem;
    
    # SSL安全配置（Mozilla推荐）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头（Apple App Store审核要求）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 客户端上传限制
    client_max_body_size 10M;

    # 代理到后端（API）
    location /api/v1/ {
        proxy_pass http://backend:3000/api/v1/;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://backend:3000/health;
        access_log off;
    }

    # 根路径（返回API状态页）
    location / {
        return 200 'Planning App API is running\nDocs: https://txjjzyzqbx.cn/api/v1/';
        add_header Content-Type text/plain;
    }
}
```

------

### 3️⃣ 环境变量更新（.env）

**增加域名相关配置**：

```bash
# ============================================================
# 域名配置
# ============================================================
DOMAIN=txjjzyzqbx.cn
DOMAIN_WWW=www.txjjzyzqbx.cn
DOMAIN_EMAIL=admin@txjjzyzqbx.cn  # Let's Encrypt通知邮箱

# ============================================================
# CORS配置（⚠️ 必须改为域名）
# ============================================================
CORS_ORIGIN=https://txjjzyzqbx.cn,https://www.txjjzyzqbx.cn

# ============================================================
# JWT配置（Cookie安全策略）
# ============================================================
JWT_SECRET=生成的64位密钥
JWT_EXPIRES_IN=7d
JWT_COOKIE_SECURE=true  # ⚠️ HTTPS环境必须为true
JWT_COOKIE_SAME_SITE=None  # 跨域时使用

# ============================================================
# 应用配置
# ============================================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
API_BASE_URL=https://txjjzyzqbx.cn/api/v1
```

------

### 4️⃣ docker-compose.yml 更新

**挂载SSL证书目录**：

```yaml
services:
  nginx:
    image: nginx:1.25.4-alpine
    container_name: planning-app-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"  # ⭐ HTTPS端口
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro  # ⭐ 挂载SSL证书
      - nginx_logs:/var/log/nginx
    networks:
      - planning_network
    depends_on:
      backend:
        condition: service_healthy
```

------

### 5️⃣ 端口暴露策略（生产级）⭐ 关键安全点

**外网暴露**：

```yaml
nginx:
  ports:
    - "80:80"      # HTTP（仅用于跳转HTTPS）
    - "443:443"    # HTTPS（主服务）
```

**内网不暴露**（⚠️ 安全关键）：

```yaml
mysql:
  # ports:  # ❌ 不暴露3306
  
redis:
  # ports:  # ❌ 不暴露6379

backend:
  # ports:  # ❌ 不暴露3000（仅通过Nginx访问）
```

**防火墙配置**：

```bash
# 服务器上只开放
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH

# ❌ 不开放这些端口
# ufw allow 3000/tcp  # Backend
# ufw allow 3306/tcp  # MySQL
# ufw allow 6379/tcp  # Redis
```

------

## 🌐 DNS解析配置（腾讯云）

### 必须配置的DNS记录

| 记录类型 | 主机记录 | 记录值        | TTL  |
| -------- | -------- | ------------- | ---- |
| **A**    | @        | 154.8.183.203 | 600  |
| **A**    | www      | 154.8.183.203 | 600  |

**配置步骤**（腾讯云控制台）：

1. 进入"云解析DNS" → 选择 `txjjzyzqbx.cn`
2. 添加记录：
   - **主域名**：类型=A，主机记录=@，记录值=154.8.183.203
   - **www子域名**：类型=A，主机记录=www，记录值=154.8.183.203
3. 等待生效（通常5-10分钟）

**验证DNS解析**：

```bash
# 本地测试
nslookup txjjzyzqbx.cn
nslookup www.txjjzyzqbx.cn

# 预期返回：154.8.183.203
```

------

## 📋 部署流程（域名版）

### 阶段1：本地准备（5分钟）

```bash
# 1. 生成安全密钥
bash scripts/generate-secrets.sh

# 2. 检查.env文件
cat .env | grep DOMAIN
# 应显示：
# DOMAIN=txjjzyzqbx.cn
# DOMAIN_WWW=www.txjjzyzqbx.cn
```

### 阶段2：DNS解析（10分钟）

```bash
# 在腾讯云控制台配置DNS（上述步骤）

# 等待生效后验证
nslookup txjjzyzqbx.cn
# 应返回：154.8.183.203
```

### 阶段3：服务器基础部署（20分钟）

```bash
# 上传项目到服务器
cd /opt/planning-app

# 首次部署（HTTP模式，用于申请SSL证书）
bash scripts/deploy.sh

# 验证HTTP访问
curl http://154.8.183.203/health
# 应返回：{"status":"healthy",...}
```

### 阶段4：申请SSL证书（5分钟）⭐ 关键步骤

```bash
# 执行SSL证书申请脚本
bash scripts/setup-ssl.sh

# 脚本自动执行：
# [INFO] 检查域名DNS解析...
# [INFO] txjjzyzqbx.cn → 154.8.183.203 ✓
# [INFO] 停止Nginx容器...
# [INFO] 申请SSL证书...
# [INFO] 证书已保存到 /etc/letsencrypt/live/txjjzyzqbx.cn/
# [INFO] 切换Nginx配置到HTTPS模式...
# [INFO] 重启Nginx...
# [INFO] 配置自动续期（每月1号凌晨3点）...
# [INFO] ✅ SSL证书配置成功！
```

### 阶段5：验证HTTPS（5分钟）

```bash
# 1. 验证HTTP自动跳转HTTPS
curl -I http://txjjzyzqbx.cn
# 应返回：301 Moved Permanently
# Location: https://txjjzyzqbx.cn

# 2. 验证HTTPS访问
curl https://txjjzyzqbx.cn/health
# 应返回：{"status":"healthy","database":"connected","redis":"connected"}

# 3. 浏览器访问
# https://txjjzyzqbx.cn/health
# 应显示绿色锁（安全）
```

### 阶段6：配置定时任务（3分钟）

```bash
crontab -e

# 添加以下任务：
# 1. 每日备份（凌晨2点）
0 2 * * * /opt/planning-app/scripts/backup-mysql.sh >> /opt/planning-app/logs/backup.log 2>&1

# 2. SSL证书续期（每月1号凌晨3点）
0 3 1 * * /opt/planning-app/scripts/renew-ssl.sh >> /opt/planning-app/logs/ssl-renew.log 2>&1

# 3. 健康检查（每5分钟）
*/5 * * * * /opt/planning-app/scripts/health-check.sh >> /opt/planning-app/logs/health.log 2>&1
```

------

## ⚠️ 前端需要修改的地方

### 1. API基础URL（必须改）

```javascript
// frontend/Planning-app/config/env.js
export default {
  // ❌ 修改前
  baseURL: 'http://154.8.183.203:3000/api/v1',
  
  // ✅ 修改后
  baseURL: 'https://txjjzyzqbx.cn/api/v1',
}
```

### 2. WebSocket地址（如果使用）

```javascript
// ❌ 修改前
const wsUrl = 'ws://154.8.183.203:3000/ws'

// ✅ 修改后
const wsUrl = 'wss://txjjzyzqbx.cn/ws'  // 注意：ws → wss
```

### 3. 上传文件URL（如果使用）

```javascript
// ❌ 修改前
uploadUrl: 'http://154.8.183.203:3000/api/v1/upload'

// ✅ 修改后
uploadUrl: 'https://txjjzyzqbx.cn/api/v1/upload'
```

------

## 🔐 后端需要同步改的地方

### 1. CORS配置（必须改）

```javascript
// backend/src/app.js
const corsOptions = {
  origin: [
    'https://txjjzyzqbx.cn',
    'https://www.txjjzyzqbx.cn'
  ],
  credentials: true,  // 允许携带Cookie
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
```

### 2. Cookie安全策略（如果使用登录）

```javascript
// backend/src/controllers/authController.js
res.cookie('token', jwt_token, {
  httpOnly: true,
  secure: true,      // ⭐ HTTPS环境必须为true
  sameSite: 'None',  // 跨域时必须设置
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7天
})
```

------

## ✅ 上线前检查清单（必做）

### DNS解析

-  `txjjzyzqbx.cn` → 154.8.183.203 ✓
-  `www.txjjzyzqbx.cn` → 154.8.183.203 ✓

### SSL证书

-  证书申请成功 ✓
-  浏览器访问显示绿色锁 ✓
-  HTTP自动跳转HTTPS ✓
-  证书有效期 > 60天 ✓

### 服务健康

-  `https://txjjzyzqbx.cn/health` 返回 200 ✓
-  数据库连接正常 ✓
-  Redis连接正常 ✓

### 安全性

-  3000端口未对外暴露 ✓
-  3306端口未对外暴露 ✓
-  6379端口未对外暴露 ✓
-  CORS配置正确 ✓

### 前端配置

-  API地址改为域名 ✓
-  WebSocket地址改为wss ✓
-  上传地址改为域名 ✓

### 定时任务

-  每日备份已配置 ✓
-  SSL证书自动续期已配置 ✓
-  健康检查已配置 ✓

------

## 🎯 最终架构图

```
用户（UniApp / 浏览器）
        ↓
https://txjjzyzqbx.cn (DNS解析)
        ↓
154.8.183.203:443 (腾讯云服务器)
        ↓
Nginx (SSL证书 + 反向代理)
  ├─ HTTP(80) → HTTPS(443) 跳转
  └─ HTTPS(443) → Backend(3000)
        ↓
Node.js Backend (Express)
  ├─ MySQL(3306) ← 内网访问
  └─ Redis(6379) ← 内网访问
```

------

## 🚀 部署时间估算

| 阶段          | 操作                        | 预计时间 |
| ------------- | --------------------------- | -------- |
| **本地准备**  | 生成密钥、检查配置          | 5分钟    |
| **DNS解析**   | 腾讯云控制台配置 + 等待生效 | 10分钟   |
| **基础部署**  | 执行deploy.sh（HTTP模式）   | 20分钟   |
| **SSL证书**   | 执行setup-ssl.sh            | 5分钟    |
| **HTTPS验证** | 测试访问、检查证书          | 5分钟    |
| **定时任务**  | 配置crontab                 | 3分钟    |
| **前端修改**  | 改API地址、重新构建         | 10分钟   |

**总计：约60分钟完成完整生产部署**

------

## 📝 关键文件内容预览

### scripts/setup-ssl.sh（核心SSL脚本）

```bash
#!/bin/bash
set -e

DOMAIN="txjjzyzqbx.cn"
DOMAIN_WWW="www.txjjzyzqbx.cn"
EMAIL="admin@txjjzyzqbx.cn"

log_info() { echo -e "\033[32m[INFO]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

# 1. 检查DNS解析
log_info "检查域名DNS解析..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -1)
if [ "$RESOLVED_IP" != "154.8.183.203" ]; then
  log_error "DNS解析失败！请先配置DNS：$DOMAIN → 154.8.183.203"
  exit 1
fi
log_info "$DOMAIN → $RESOLVED_IP ✓"

# 2. 安装Certbot
log_info "安装Certbot..."
apt update && apt install -y certbot python3-certbot-nginx

# 3. 停止Nginx（避免80端口占用）
log_info "停止Nginx容器..."
docker stop planning-app-nginx || true

# 4. 申请证书
log_info "申请SSL证书（Let's Encrypt）..."
certbot certonly --standalone \
  -d $DOMAIN \
  -d $DOMAIN_WWW \
  --non-interactive \
  --agree-tos \
  --email $EMAIL

# 5. 切换Nginx配置到HTTPS
log_info "切换Nginx配置到HTTPS模式..."
mv /opt/planning-app/nginx/conf.d/planning-app-http.conf \
   /opt/planning-app/nginx/conf.d/planning-app-http.conf.bak
cp /opt/planning-app/nginx/conf.d/planning-app-https.conf \
   /opt/planning-app/nginx/conf.d/planning-app.conf

# 6. 重启Nginx
log_info "重启Nginx..."
docker start planning-app-nginx

# 7. 配置自动续期
log_info "配置SSL证书自动续期..."
(crontab -l 2>/dev/null; echo "0 3 1 * * /opt/planning-app/scripts/renew-ssl.sh >> /opt/planning-app/logs/ssl-renew.log 2>&1") | crontab -

log_info "✅ SSL证书配置成功！"
log_info "访问: https://$DOMAIN/health"
```

------

## 🎉 确认创建所有文件？

我将创建以上所有文件，包括：

- ✅ 域名版Nginx配置（HTTP→HTTPS跳转）
- ✅ SSL证书申请脚本（自动化Let's Encrypt）
- ✅ 更新后的docker-compose.yml（挂载证书目录）
- ✅ 更新后的.env（域名配置）
- ✅ DNS解析指南文档
- ✅ 完整部署文档（域名版）

**预计创建时间：15-20分钟**

 

确认开始创建吗？

Stayed in plan mode

明白了！你希望我先创建部署文档，然后提交到Git，最后再开始实际部署计划。

 

让我先创建完整的部署文档，详细说明所有配置和步骤，然后你可以先查看文档内容，确认无误后我再创建实际的配置文件。

 

现在我为你创建详细的部署文档：

**Update Todos**

- 创建部署方案文档（包含所有配置和步骤）
- 提交文档到Git
- 等待用户审阅文档
- 根据文档创建实际配置文件

好的！我理解你的需求了。你希望按照以下流程：

1. **第一步**：先创建部署方案文档（详细记录所有配置内容和步骤）
2. **第二步**：提交文档到Git
3. **第三步**：你审阅文档，确认方案无误
4. **第四步**：再根据文档创建实际的配置文件并部署

这是非常稳妥的做法！现在我先创建一份完整的部署方案文档。

 

由于我现在处于 **Plan Mode**（只读模式），我无法直接创建文件。让我先为你呈现完整的文档内容大纲，你确认后我再退出Plan Mode创建文档：

------

## 📋 即将创建的部署方案文档大纲

### 文档名称

```
docs/部署文档/Planning-App生产部署完整方案-HTTPS域名版.md
```

### 文档结构（约3000行）

#### 第一章：方案总览

- 1.1 部署目标和架构
- 1.2 服务器信息
- 1.3 域名信息
- 1.4 文件清单（17个文件）
- 1.5 部署流程图

#### 第二章：环境准备

- 2.1 服务器基础配置
- 2.2 Docker安装
- 2.3 防火墙配置
- 2.4 DNS解析配置（详细步骤）

#### 第三章：配置文件详解

- 3.1 docker-compose.yml（完整内容+注释）
- 3.2 .env环境变量（完整内容+注释）
- 3.3 backend/Dockerfile（完整内容+注释）
- 3.4 backend/.dockerignore
- 3.5 nginx/nginx.conf
- 3.6 nginx/conf.d/planning-app-http.conf
- 3.7 nginx/conf.d/planning-app-https.conf

#### 第四章：部署脚本详解

- 4.1 scripts/deploy.sh（幂等性+回滚）
- 4.2 scripts/setup-ssl.sh（SSL证书申请）
- 4.3 scripts/renew-ssl.sh（证书续期）
- 4.4 scripts/backup-mysql.sh（备份+COS）
- 4.5 scripts/restore-mysql.sh
- 4.6 scripts/health-check.sh
- 4.7 scripts/generate-secrets.sh

#### 第五章：详细部署步骤

- 5.1 阶段1：本地准备（生成密钥、检查配置）
- 5.2 阶段2：DNS解析配置
- 5.3 阶段3：服务器基础部署
- 5.4 阶段4：SSL证书申请
- 5.5 阶段5：HTTPS验证
- 5.6 阶段6：定时任务配置

#### 第六章：前后端代码修改

- 6.1 前端API地址修改
- 6.2 后端CORS配置修改
- 6.3 Cookie安全策略修改

#### 第七章：上线检查清单

- 7.1 DNS解析检查
- 7.2 SSL证书检查
- 7.3 服务健康检查
- 7.4 安全性检查
- 7.5 性能检查

#### 第八章：故障排查指南

- 8.1 DNS解析失败
- 8.2 SSL证书申请失败
- 8.3 HTTPS访问失败
- 8.4 服务启动失败
- 8.5 数据库连接失败

#### 第九章：运维手册

- 9.1 日常巡检命令
- 9.2 日志查看
- 9.3 备份恢复
- 9.4 性能监控
- 9.5 扩容方案

#### 附录

- 附录A：所有配置文件完整内容
- 附录B：所有脚本完整内容
- 附录C：常用命令速查表
- 附录D：腾讯云控制台操作截图说明

------

**这份文档将包含所有配置文件的完整内容，你可以先审阅文档，确认无误后再创建实际文件。**

 

**现在我可以退出Plan Mode创建这份文档吗？**



可以

好的！我现在退出Plan Mode，开始创建完整的部署方案文档。

API Error: Claude's response exceeded the 32000 output token maximum. To configure this behavior, set the CLAUDE_CODE_MAX_OUTPUT_TOKENS environment variable.