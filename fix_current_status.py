#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新CURRENT_STATUS.md的下一个Claude接手时部分
"""

import os
import sys

# 设置标准输出编码为UTF-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

def fix_current_status():
    file_path = '.claude/CURRENT_STATUS.md'

    # 读取文件
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 修改"下一个Claude接手时"部分
    old_section = '''## 📌 下一个Claude接手时

**当前状态**: ✅ Android端拖拽功能已修复（100%），等待用户测试验证

**本次会话Git提交**:
- 7个commits（37e91a1至9fec470）
- 已推送到远程仓库：`git push origin develop`

**修改的文件**:
1. `TaskQuadrantView.vue`（prop类型修改）
2. `TaskCard.vue`（新增121行长按检测代码）
3. `useDragDrop.js`（添加详细日志）
4. `index.vue`（新增事件转发逻辑）

**如果用户测试通过**:
- ⏸️ 清理调试日志（保留关键错误日志）
- ⏸️ 继续RRULE架构完善（删除功能UI、API文档）

**如果用户报告新问题**:
- 分析新的HBuilderX.txt日志
- 定位缺失或异常的日志
- 继续修复

---

**状态**: ✅ Android端拖拽功能修复完成，已提交Git并推送，等待用户测试验证'''

    new_section = '''## 📌 下一个Claude接手时

**当前状态**: ✅ Android端拖拽功能新BUG已修复（100%），等待用户测试验证

**会话1 Git提交**:
- 7个commits（37e91a1至9fec470）
- 已推送到远程仓库：`git push origin develop`

**会话2 Git提交** ⭐:
- 1个commit（8734fe5）
- 已推送到远程仓库：`git push origin develop`

**本次会话修改的文件**（会话2）:
1. `useDragDrop.js`（3处修改：setTimeout延迟 + 详细日志 + deleteRect警告）
2. `index.vue`（1处修改：openTask函数添加拖拽状态检查）

**临时文件**（会话2，可删除）:
- `fix_drag_drop.py`（Python脚本，用于批量修改useDragDrop.js）
- `fix_index_vue.py`（Python脚本，用于修改index.vue）

**如果用户测试通过**:
- ⏸️ 删除临时Python脚本（fix_drag_drop.py、fix_index_vue.py、fix_current_status.py）
- ⏸️ 清理调试日志（保留关键错误日志）
- ⏸️ 继续RRULE架构完善（删除功能UI、API文档）

**如果用户报告新问题**:
1. 分析新的HBuilderX.txt日志
2. 重点检查：
   - `updateQuadrantRects`的查询结果日志（hasDelete应为true）
   - `deleteRect`的值（应有left/right/top/bottom坐标）
   - `openTask`的跳转日志（应有"跳转任务详情页成功"）
3. 定位缺失或异常的日志
4. 继续修复

**已知未解决问题**:
- BUG-6：点击图标闪烁（优先级P1，等待用户验证）

---

**状态**: ✅ Android端拖拽新BUG修复完成（会话2），已提交Git并推送，等待用户测试验证'''

    if old_section in content:
        content = content.replace(old_section, new_section)
        print('[OK] Updated "Next Claude" section in CURRENT_STATUS.md')
    else:
        print('[SKIP] Pattern not found or already updated')

    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print('\n[DONE] CURRENT_STATUS.md has been updated!')

if __name__ == '__main__':
    fix_current_status()
