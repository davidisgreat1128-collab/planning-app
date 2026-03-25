#!/bin/sh
# wait-for-mysql.sh - 等待 MySQL 完全准备好（支持接受连接）

set -e

host="$1"
shift
cmd="$@"

echo "⏳ 等待 MySQL ($host:3306) 完全准备好..."

# 最多等待60秒
max_attempts=30
attempt=0

until nc -z "$host" 3306 || [ $attempt -eq $max_attempts ]; do
  attempt=$((attempt + 1))
  echo "  尝试 $attempt/$max_attempts: MySQL 尚未准备好，2秒后重试..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ 等待 MySQL 超时（60秒）"
  exit 1
fi

echo "✅ MySQL 已准备好！"

# ⭐ 自动运行数据库迁移（关键修复 - 2026-03-25）
# 目的：每次容器启动时自动更新数据库schema，避免"Unknown column"错误
echo "========================================="
echo "🗄️ 运行数据库迁移..."
echo "========================================="

if npm run db:migrate; then
  echo "✅ Migration 执行成功"
else
  echo "⚠️ Migration 执行失败（可能是首次启动或无新迁移）"
  echo "   应用将继续启动..."
fi

# ⭐ 智能种子数据导入（关键修复 - 2026-03-25）
# 目的：自动检查并导入缺失的种子数据（如节假日、工作日）
# 机制：仅在表为空时才导入，避免重复
echo "========================================="
echo "🌱 检查并导入种子数据..."
echo "========================================="

if node /app/seed-if-empty.js; then
  echo "✅ 种子数据检查完成"
else
  echo "⚠️ 种子数据检查失败"
  echo "   应用将继续启动..."
fi

echo "========================================="
echo "🚀 启动应用..."
echo "========================================="
exec $cmd
