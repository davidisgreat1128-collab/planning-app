#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复index.vue的任务详情页跳转BUG
"""

import os
import sys

# 设置标准输出编码为UTF-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

def fix_index_vue():
    file_path = 'frontend/Planning-app/pages/calendar/index.vue'

    # 读取文件
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 修改openTask函数
    old_code = '''function openTask(task) {
  // 如果有子任务，打开弹窗
  if (task.subtasks && task.subtasks.length > 0) {
    currentSubtaskParent.value = task;
    showSubtaskPopup.value = true;
  } else {
    // 否则跳转到编辑页
    uni.navigateTo({
      url: '/pages/calendar/task-edit?id=' + task.id
    });
  }
}'''

    new_code = '''function openTask(task) {
  console.log('🎯 [index.vue] openTask 被调用', {
    taskId: task.id,
    taskTitle: task.title
  });

  // #ifndef H5
  // APP端：检查拖拽状态，避免拖拽结束时误触发跳转
  if (dragDropComposable.dragState.value.dragging) {
    console.log('⚠️ [index.vue] openTask: 拖拽状态中，忽略点击');
    return;
  }
  // #endif

  // 如果有子任务，打开弹窗
  if (task.subtasks && task.subtasks.length > 0) {
    console.log('📋 [index.vue] openTask: 任务有子任务，打开弹窗');
    currentSubtaskParent.value = task;
    showSubtaskPopup.value = true;
  } else {
    // 否则跳转到编辑页
    console.log('✅ [index.vue] openTask: 准备跳转到任务详情页');
    uni.navigateTo({
      url: '/pages/calendar/task-edit?id=' + task.id,
      success: () => {
        console.log('✅ [index.vue] openTask: 跳转任务详情页成功');
      },
      fail: (err) => {
        console.error('❌ [index.vue] openTask: 跳转任务详情页失败', err);
      }
    });
  }
}'''

    if old_code in content:
        content = content.replace(old_code, new_code)
        print('[OK] Fixed openTask function: Added drag state check and navigation callbacks')
    else:
        print('[SKIP] Pattern not found or already applied')

    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print('\n[DONE] index.vue has been fixed!')

if __name__ == '__main__':
    fix_index_vue()
