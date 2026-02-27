#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为H5端任务项添加鼠标长按事件支持
"""

import re

vue_file = r'D:\MyProject\Planning-app\frontend\Planning-app\pages\calendar\index.vue'

with open(vue_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 为Q3任务添加H5鼠标事件
content = re.sub(
    r'(v-for="task in filteredUrgentNotImportant"[^>]*\n[^>]*class="nb-task-item"[^>]*\n[^>]*@tap="openTaskDetail\(task\)"[^>]*\n[^>]*@longpress="onTaskLongPress\(\$event, task, \'q3\'\)")',
    r'\1\n                <!-- #ifdef H5 -->\n                @mousedown="onTaskMouseDown($event, task, \'q3\')"\n                <!-- #endif -->',
    content,
    flags=re.DOTALL
)

# 为Q1任务添加H5鼠标事件
content = re.sub(
    r'(v-for="task in filteredUrgentImportant"[^>]*\n[^>]*class="nb-task-item"[^>]*\n[^>]*@tap="openTaskDetail\(task\)"[^>]*\n[^>]*@longpress="onTaskLongPress\(\$event, task, \'q1\'\)")',
    r'\1\n                <!-- #ifdef H5 -->\n                @mousedown="onTaskMouseDown($event, task, \'q1\')"\n                <!-- #endif -->',
    content,
    flags=re.DOTALL
)

# 为Q4任务添加H5鼠标事件
content = re.sub(
    r'(v-for="task in filteredNotUrgentNotImportant"[^>]*\n[^>]*class="nb-task-item"[^>]*\n[^>]*@tap="openTaskDetail\(task\)"[^>]*\n[^>]*@longpress="onTaskLongPress\(\$event, task, \'q4\'\)")',
    r'\1\n                <!-- #ifdef H5 -->\n                @mousedown="onTaskMouseDown($event, task, \'q4\')"\n                <!-- #endif -->',
    content,
    flags=re.DOTALL
)

# 为Q2任务添加H5鼠标事件
content = re.sub(
    r'(v-for="task in filteredNotUrgentImportant"[^>]*\n[^>]*class="nb-task-item"[^>]*\n[^>]*@tap="openTaskDetail\(task\)"[^>]*\n[^>]*@longpress="onTaskLongPress\(\$event, task, \'q2\'\)")',
    r'\1\n                <!-- #ifdef H5 -->\n                @mousedown="onTaskMouseDown($event, task, \'q2\')"\n                <!-- #endif -->',
    content,
    flags=re.DOTALL
)

with open(vue_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("[OK] Mouse events added for H5!")
