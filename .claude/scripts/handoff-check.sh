#!/bin/bash
# Claude交接检查脚本
# 用途: 新Claude接手项目时运行，快速确认项目状态

echo "=========================================="
echo "  🤖 Claude 项目交接检查"
echo "=========================================="
echo ""

PROJECT_ROOT="D:\MyProject\Planning-app"
cd "$PROJECT_ROOT" 2>/dev/null || { echo "❌ 无法进入项目目录"; exit 1; }

# 检查必要文件
echo "📁 检查必要文件..."
files=(
  ".claude/CLAUDE.md"
  ".claude/CURRENT_STATUS.md"
  ".claude/config.json"
  "docs/06-AI协作日志/索引目录.md"
  "backend/.env.development"
  "backend/package.json"
)

all_ok=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - 缺失!"
    all_ok=false
  fi
done

echo ""

# Git状态
echo "📊 Git状态..."
echo "  当前分支: $(git branch --show-current)"
echo "  远程仓库: $(git remote get-url origin 2>/dev/null || echo '未配置')"
echo ""
echo "  最近5次提交:"
git log --oneline -5 | while read line; do echo "    $line"; done
echo ""

# 工作区状态
status=$(git status --short)
if [ -z "$status" ]; then
  echo "  ✅ 工作区干净，无未提交更改"
else
  echo "  ⚠️  有未提交的更改:"
  git status --short | while read line; do echo "    $line"; done
fi

echo ""

# 显示CURRENT_STATUS摘要
echo "📋 当前项目状态摘要:"
echo "  (查看完整状态: cat .claude/CURRENT_STATUS.md)"
echo ""

if $all_ok; then
  echo "✅ 检查完成！所有必要文件都存在，可以开始工作。"
  echo ""
  echo "📌 下一步: 阅读 .claude/CURRENT_STATUS.md 了解当前任务"
else
  echo "⚠️  检查发现问题，请先处理缺失文件后再开始工作。"
fi

echo "=========================================="
