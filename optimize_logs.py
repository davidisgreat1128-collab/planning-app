#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
优化日志：清理详细调试日志，保留关键错误日志
"""

import os
import sys

# 设置标准输出编码为UTF-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

def optimize_useDragDrop_logs():
    """优化useDragDrop.js的日志"""
    file_path = 'frontend/Planning-app/composables/useDragDrop.js'

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 移除频繁的移动日志（第219-222行和231行）
    # 保留警告日志
    old_1 = '''    console.log('🔵 [useDragDrop] onTaskTouchMove: 拖拽移动中', {
      eventType: e.type,
      dragging: dragState.value.dragging
    });

    e.preventDefault?.();
    e.stopPropagation?.();

    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    const clientX = touch.clientX || touch.pageX || 0;
    const clientY = touch.clientY || touch.pageY || 0;

    console.log('📍 [useDragDrop] 移动坐标', { x: clientX, y: clientY });'''

    new_1 = '''    // 移动日志已优化：仅在状态变化时输出（删除区域进入/退出）
    e.preventDefault?.();
    e.stopPropagation?.();

    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    const clientX = touch.clientX || touch.pageX || 0;
    const clientY = touch.clientY || touch.pageY || 0;'''

    if old_1 in content:
        content = content.replace(old_1, new_1)
        print('[OK] Removed frequent move logs in onTaskTouchMove')
    else:
        print('[SKIP] Move logs pattern not found')

    # 优化象限检测日志（减少详细输出）
    old_2 = '''  function detectQuadrantAtPosition(x, y) {
    console.log('🔍 [useDragDrop] detectQuadrantAtPosition', { x, y });'''

    new_2 = '''  function detectQuadrantAtPosition(x, y) {
    // 日志已优化：仅在找到目标象限或失败时输出'''

    if old_2 in content:
        content = content.replace(old_2, new_2)
        print('[OK] Optimized detectQuadrantAtPosition logs')
    else:
        print('[SKIP] detectQuadrantAtPosition pattern not found')

    # 移除H5端的详细日志
    old_3 = '''    console.log('🌐 [useDragDrop] H5端: 检测DOM元素');
    for (const [key, el] of Object.entries(quadrants)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      console.log(`  ${key}: left=${rect.left}, right=${rect.right}, top=${rect.top}, bottom=${rect.bottom}`);'''

    new_3 = '''    // H5端象限检测（日志已优化）
    for (const [key, el] of Object.entries(quadrants)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();'''

    if old_3 in content:
        content = content.replace(old_3, new_3)
        print('[OK] Removed H5 quadrant detection logs')
    else:
        print('[SKIP] H5 quadrant logs pattern not found')

    # 移除APP端的详细日志
    old_4 = '''    // APP端:使用缓存的位置信息
    console.log('📱 [useDragDrop] APP端: 使用缓存位置', quadrantRects.value);
    for (const [key, rect] of Object.entries(quadrantRects.value)) {
      if (key === 'delete' || !rect) continue;
      console.log(`  ${key}: left=${rect.left}, right=${rect.right}, top=${rect.top}, bottom=${rect.bottom}`);'''

    new_4 = '''    // APP端:使用缓存的位置信息（日志已优化）
    for (const [key, rect] of Object.entries(quadrantRects.value)) {
      if (key === 'delete' || !rect) continue;'''

    if old_4 in content:
        content = content.replace(old_4, new_4)
        print('[OK] Removed APP quadrant detection logs')
    else:
        print('[SKIP] APP quadrant logs pattern not found')

    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print('\n[DONE] useDragDrop.js logs optimized!')

def optimize_index_vue_logs():
    """优化index.vue的日志"""
    file_path = 'frontend/Planning-app/pages/calendar/index.vue'

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 移除频繁的onContentTouchMove日志
    old_1 = '''  console.log('📍 [index.vue] onContentTouchMove: 检测到拖拽中，调用 useDragDrop');
  dragDropComposable.onTaskTouchMove(e);'''

    new_1 = '''  // 日志已优化：移除频繁的移动检测日志
  dragDropComposable.onTaskTouchMove(e);'''

    if old_1 in content:
        content = content.replace(old_1, new_1)
        print('[OK] Removed frequent onContentTouchMove logs in index.vue')
    else:
        print('[SKIP] onContentTouchMove logs pattern not found')

    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print('\n[DONE] index.vue logs optimized!')

if __name__ == '__main__':
    print('========================================')
    print('日志优化脚本')
    print('========================================\n')

    optimize_useDragDrop_logs()
    optimize_index_vue_logs()

    print('\n========================================')
    print('优化完成！')
    print('========================================')
