#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复useDragDrop.js的三个BUG
"""

import os
import sys

# 设置标准输出编码为UTF-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

def fix_useDragDrop():
    file_path = 'frontend/Planning-app/composables/useDragDrop.js'

    # 读取文件
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 修改1: 添加setTimeout延迟 (行140-144)
    old_code_1 = '''    // #ifndef H5
    // APP端:获取所有象限和删除区域的位置信息
    updateQuadrantRects();
    console.log('🔍 [useDragDrop] APP端: 开始获取象限位置');
    // #endif'''

    new_code_1 = '''    // #ifndef H5
    // APP端:延迟获取位置信息（等待拖拽蒙层DOM渲染完成）
    setTimeout(() => {
      updateQuadrantRects();
      console.log('🔍 [useDragDrop] APP端: 延迟100ms后获取象限和删除区域位置');
    }, 100);
    // #endif'''

    if old_code_1 in content:
        content = content.replace(old_code_1, new_code_1)
        print('[OK] Fix 1: Added setTimeout delay')
    else:
        print('[SKIP] Fix 1: Pattern not found or already applied')

    # 修改2: 添加详细日志 (行166-186)
    old_code_2 = '''  function updateQuadrantRects() {
    const query = uni.createSelectorQuery();

    query.select('.quadrant-q1').boundingClientRect();
    query.select('.quadrant-q2').boundingClientRect();
    query.select('.quadrant-q3').boundingClientRect();
    query.select('.quadrant-q4').boundingClientRect();
    query.select('.delete-zone').boundingClientRect();

    query.exec((res) => {
      if (res && res.length === 5) {
        quadrantRects.value = {
          q1: res[0],
          q2: res[1],
          q3: res[2],
          q4: res[3],
          delete: res[4]
        };
      }
    });
  }'''

    new_code_2 = '''  function updateQuadrantRects() {
    console.log('🔍 [useDragDrop] updateQuadrantRects: 开始查询DOM元素位置');
    const query = uni.createSelectorQuery();

    query.select('.quadrant-q1').boundingClientRect();
    query.select('.quadrant-q2').boundingClientRect();
    query.select('.quadrant-q3').boundingClientRect();
    query.select('.quadrant-q4').boundingClientRect();
    query.select('.delete-zone').boundingClientRect();

    query.exec((res) => {
      console.log('🔍 [useDragDrop] updateQuadrantRects: 查询结果', {
        resultLength: res?.length,
        hasQ1: !!res?.[0],
        hasQ2: !!res?.[1],
        hasQ3: !!res?.[2],
        hasQ4: !!res?.[3],
        hasDelete: !!res?.[4]
      });

      if (res && res.length === 5) {
        quadrantRects.value = {
          q1: res[0],
          q2: res[1],
          q3: res[2],
          q4: res[3],
          delete: res[4]
        };
        console.log('✅ [useDragDrop] updateQuadrantRects: 位置信息已更新', {
          deleteRect: res[4]
        });
      } else {
        console.warn('⚠️ [useDragDrop] updateQuadrantRects: 查询结果不完整', {
          expected: 5,
          actual: res?.length
        });
      }
    });
  }'''

    if old_code_2 in content:
        content = content.replace(old_code_2, new_code_2)
        print('[OK] Fix 2: Added detailed logging to updateQuadrantRects')
    else:
        print('[SKIP] Fix 2: Pattern not found or already applied')

    # 修改3: 添加deleteRect为null时的警告 (行234后)
    old_code_3 = '''    // #ifndef H5
    // APP端:使用缓存的位置信息检测
    const deleteRect = quadrantRects.value.delete;
    if (deleteRect) {
      const over = clientX >= deleteRect.left && clientX <= deleteRect.right &&
                   clientY >= deleteRect.top && clientY <= deleteRect.bottom;
      if (over !== dragState.value.overDelete) {
        dragState.value.overDelete = over;
        if (over) {
          uni.vibrateShort?.({ type: 'light' });
        }
      }
    }
    // #endif'''

    new_code_3 = '''    // #ifndef H5
    // APP端:使用缓存的位置信息检测
    const deleteRect = quadrantRects.value.delete;
    if (deleteRect) {
      const over = clientX >= deleteRect.left && clientX <= deleteRect.right &&
                   clientY >= deleteRect.top && clientY <= deleteRect.bottom;
      if (over !== dragState.value.overDelete) {
        dragState.value.overDelete = over;
        if (over) {
          uni.vibrateShort?.({ type: 'light' });
        }
      }
    } else {
      console.log('⚠️ [useDragDrop] deleteRect为null，无法检测删除区域');
    }
    // #endif'''

    if old_code_3 in content:
        content = content.replace(old_code_3, new_code_3)
        print('[OK] Fix 3: Added warning when deleteRect is null')
    else:
        print('[SKIP] Fix 3: Pattern not found or already applied')

    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print('\n[DONE] useDragDrop.js has been fixed!')

if __name__ == '__main__':
    fix_useDragDrop()
