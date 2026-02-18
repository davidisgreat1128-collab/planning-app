#!/bin/bash
# Claude工作日志快速创建脚本
# 用法:
#   ./create-log.sh daily "任务描述"        创建每日工作日志
#   ./create-log.sh adr "决策主题"           创建ADR
#   ./create-log.sh bug "问题描述"           创建Bug分析日志
#   ./create-log.sh review "模块名"          创建代码审查日志
#   ./create-log.sh perf "优化主题"          创建性能优化日志
#   ./create-log.sh req "需求主题"           创建需求分析日志

PROJECT_ROOT="D:\MyProject\Planning-app"
LOGS_DIR="$PROJECT_ROOT/docs/06-AI协作日志"
TEMPLATE_DIR="$PROJECT_ROOT/.claude/templates"

DATE=$(date +%Y-%m-%d)
YEAR=$(date +%Y)
MONTH_NUM=$(date +%m)
MONTH_NAME=$(date +%B)

create_daily() {
  TITLE="$1"
  DIR="$LOGS_DIR/01-每日工作日志/$YEAR/$MONTH_NUM-$MONTH_NAME"
  mkdir -p "$DIR"
  FILE="$DIR/$DATE-$TITLE.md"

  if [ -f "$FILE" ]; then
    echo "⚠️  文件已存在: $FILE"
    exit 1
  fi

  cp "$TEMPLATE_DIR/daily-log-template.md" "$FILE"
  # 替换日期占位符
  sed -i "s/YYYY-MM-DD/$DATE/g" "$FILE"
  echo "✅ 已创建每日工作日志: $FILE"
}

create_adr() {
  TITLE="$1"
  DIR="$LOGS_DIR/02-架构决策记录(ADR)"
  mkdir -p "$DIR"

  # 自动计算编号
  NUM=$(ls "$DIR"/*.md 2>/dev/null | wc -l)
  NUM=$((NUM + 1))
  NUM_STR=$(printf "%03d" $NUM)

  FILE="$DIR/ADR-$NUM_STR-$TITLE.md"
  cp "$TEMPLATE_DIR/adr-template.md" "$FILE"
  sed -i "s/ADR-NNN/ADR-$NUM_STR/g" "$FILE"
  sed -i "s/YYYY-MM-DD/$DATE/g" "$FILE"
  echo "✅ 已创建ADR: $FILE"
}

create_bug() {
  TITLE="$1"
  DIR="$LOGS_DIR/04-Bug分析日志"
  mkdir -p "$DIR"

  NUM=$(ls "$DIR"/*.md 2>/dev/null | wc -l)
  NUM=$((NUM + 1))
  NUM_STR=$(printf "%03d" $NUM)

  FILE="$DIR/BUG-$NUM_STR-$TITLE.md"
  cp "$TEMPLATE_DIR/bug-analysis-template.md" "$FILE"
  sed -i "s/BUG-NNN/BUG-$NUM_STR/g" "$FILE"
  echo "✅ 已创建Bug分析日志: $FILE"
}

# 主逻辑
case "$1" in
  daily)
    [ -z "$2" ] && { echo "用法: $0 daily '任务描述'"; exit 1; }
    create_daily "$2"
    ;;
  adr)
    [ -z "$2" ] && { echo "用法: $0 adr '决策主题'"; exit 1; }
    create_adr "$2"
    ;;
  bug)
    [ -z "$2" ] && { echo "用法: $0 bug '问题描述'"; exit 1; }
    create_bug "$2"
    ;;
  *)
    echo "用法: $0 {daily|adr|bug} '标题'"
    echo ""
    echo "示例:"
    echo "  $0 daily '实现用户登录功能'"
    echo "  $0 adr 'JWT认证方案选型'"
    echo "  $0 bug '登录接口500错误'"
    exit 1
    ;;
esac
