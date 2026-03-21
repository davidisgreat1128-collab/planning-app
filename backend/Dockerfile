# ============================================================
# Planning App Backend - 生产环境 Dockerfile
# ============================================================
# 多阶段构建: builder (构建) + runtime (运行)
# Node.js版本: 22.20.0 (LTS)
# ============================================================

# ============================================================
# 阶段1: 构建阶段 (Builder)
# ============================================================
FROM node:22.20.0-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括devDependencies，用于构建）
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# ============================================================
# 阶段2: 运行阶段 (Runtime)
# ============================================================
FROM node:22.20.0-alpine

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 安装运行时依赖（新增 netcat-openbsd 用于等待 MySQL）
RUN apk add --no-cache \
    tzdata \
    curl \
    netcat-openbsd \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 从builder阶段复制node_modules和应用代码
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --chown=nodejs:nodejs ./src ./src
COPY --chown=nodejs:nodejs ./server.js ./
COPY --chown=nodejs:nodejs ./.sequelizerc ./
COPY --chown=nodejs:nodejs ./wait-for-mysql.sh ./

# 创建日志和上传目录，并赋予等待脚本执行权限
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs logs uploads && \
    chmod +x /app/wait-for-mysql.sh

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# 启动应用（先等待 MySQL，再启动 Node.js）
CMD ["/app/wait-for-mysql.sh", "mysql", "node", "server.js"]
