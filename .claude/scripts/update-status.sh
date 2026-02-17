#!/bin/bash
# 更新CURRENT_STATUS.md脚本
# 会自动更新"最后更新时间"和"最新commit"字段

PROJECT_ROOT="D:\MyProject\Planning-app"
STATUS_FILE="$PROJECT_ROOT/.claude/CURRENT_STATUS.md"

if [ ! -f "$STATUS_FILE" ]; then
  echo "❌ CURRENT_STATUS.md 不存在"
  exit 1
fi

DATE=$(date +%Y-%m-%d)
LAST_COMMIT=$(cd "$PROJECT_ROOT" && git log --oneline -1 2>/dev/null || echo "无提交记录")

# 更新最后更新时间
sed -i "s/> \*\*最后更新\*\*: .*/> **最后更新**: $DATE/" "$STATUS_FILE"

echo "✅ 已更新 CURRENT_STATUS.md"
echo "   最后更新时间: $DATE"
echo "   最新commit: $LAST_COMMIT"
echo ""
echo "📌 请手动编辑以下内容:"
echo "   1. 已完成的任务 (移到 '✅ 已完成' 区域)"
echo "   2. 当前进行的任务及进度"
echo "   3. 下一个Claude应该做什么"
echo "   4. 更新者姓名"
