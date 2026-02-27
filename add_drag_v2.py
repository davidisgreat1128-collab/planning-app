#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为四象限视图添加任务拖拽功能 - 版本2
"""

import re

vue_file = r'D:\MyProject\Planning-app\frontend\Planning-app\pages\calendar\index.vue'

with open(vue_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 用于插入的代码块
new_lines = []
i = 0

while i < len(lines):
    line = lines[i]
    new_lines.append(line)

    # 1. 在四个象限的任务项添加拖拽事件
    # Q3 - 紧急不重要
    if 'v-for="task in filteredUrgentNotImportant"' in line and 'nb-task-item' in line:
        # 检查下一行是否已经有@longpress
        if i+1 < len(lines) and '@longpress' not in lines[i+1]:
            indent = '                '
            new_lines.append(f'{indent}@longpress="onTaskLongPress($event, task, \'q3\')"\n')
            new_lines.append(f'{indent}@touchmove="onTaskTouchMove"\n')
            new_lines.append(f'{indent}@touchend="onTaskTouchEnd"\n')

    # Q1 - 重要且紧急
    elif 'v-for="task in filteredUrgentImportant"' in line and 'nb-task-item' in line:
        if i+1 < len(lines) and '@longpress' not in lines[i+1]:
            indent = '                '
            new_lines.append(f'{indent}@longpress="onTaskLongPress($event, task, \'q1\')"\n')
            new_lines.append(f'{indent}@touchmove="onTaskTouchMove"\n')
            new_lines.append(f'{indent}@touchend="onTaskTouchEnd"\n')

    # Q4 - 不重要不紧急
    elif 'v-for="task in filteredNotUrgentNotImportant"' in line and 'nb-task-item' in line:
        if i+1 < len(lines) and '@longpress' not in lines[i+1]:
            indent = '                '
            new_lines.append(f'{indent}@longpress="onTaskLongPress($event, task, \'q4\')"\n')
            new_lines.append(f'{indent}@touchmove="onTaskTouchMove"\n')
            new_lines.append(f'{indent}@touchend="onTaskTouchEnd"\n')

    # Q2 - 重要不紧急
    elif 'v-for="task in filteredNotUrgentImportant"' in line and 'nb-task-item' in line:
        if i+1 < len(lines) and '@longpress' not in lines[i+1]:
            indent = '                '
            new_lines.append(f'{indent}@longpress="onTaskLongPress($event, task, \'q2\')"\n')
            new_lines.append(f'{indent}@touchmove="onTaskTouchMove"\n')
            new_lines.append(f'{indent}@touchend="onTaskTouchEnd"\n')

    # 2. 在</view><!-- end quadrant-view -->后添加拖拽蒙层
    elif line.strip() == '</view><!-- end quadrant-view -->':
        new_lines.append('''
      <!-- 拖拽蒙层和删除区域 -->
      <view v-if="dragState.dragging" class="drag-overlay">
        <!-- 半透明拖拽的任务副本 -->
        <view
          class="dragging-task"
          :style="{ left: dragState.x + 'px', top: dragState.y + 'px' }"
        >
          <text class="dragging-task-text">{{ dragState.task ? dragState.task.title : '' }}</text>
        </view>

        <!-- 删除区域 -->
        <view
          class="delete-zone"
          :class="{ 'delete-zone-active': dragState.overDelete }"
        >
          <view class="delete-zone-icon">🗑️</view>
          <text class="delete-zone-text">删除</text>
        </view>
      </view>
''')

    # 3. 在CategoryDrawer前添加对话框
    elif '<!-- 规划和分类抽屉 -->' in line:
        new_lines.append('''    <!-- 更改象限确认对话框 -->
    <view v-if="showChangeQuadrantDialog" class="dialog-mask" @tap="closeChangeQuadrantDialog">
      <view class="change-dialog" @tap.stop>
        <!-- 选项1: 完整更改此条重复计划（默认选中） -->
        <view
          class="change-option"
          :class="{ 'change-option-selected': changeQuadrantOption === 1 }"
          @tap="changeQuadrantOption = 1"
        >
          <text class="change-option-title">完整更改此条重复计划</text>
          <view v-if="changeQuadrantOption === 1" class="change-option-check">
            <text class="change-option-check-icon">✓</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="change-divider"></view>

        <!-- 选项2: 更改此条计划的当天及未来计划 -->
        <view
          class="change-option"
          :class="{ 'change-option-selected': changeQuadrantOption === 2 }"
          @tap="changeQuadrantOption = 2"
        >
          <view class="change-option-content">
            <text class="change-option-title">更改此条计划的当天及未来计划</text>
            <text class="change-option-desc">不影响过去记录</text>
          </view>
          <view v-if="changeQuadrantOption === 2" class="change-option-check">
            <text class="change-option-check-icon">✓</text>
          </view>
        </view>

        <!-- 底部确定按钮 -->
        <view class="change-confirm-btn" @tap="confirmChangeQuadrant">
          <text class="change-confirm-text">确定</text>
        </view>
      </view>
    </view>

    <!-- 删除任务确认对话框 -->
    <view v-if="showDeleteTaskDialog" class="dialog-mask" @tap="closeDeleteTaskDialog">
      <view class="delete-dialog" @tap.stop>
        <!-- 选项1：仅删除当天计划（默认选中） -->
        <view
          class="delete-option"
          :class="{ 'delete-option-selected': deleteTaskOption === 1 }"
          @tap="deleteTaskOption = 1"
        >
          <view class="delete-option-content">
            <text class="delete-option-title">仅删除当天计划</text>
            <text class="delete-option-desc">不影响该计划的过去及未来计划</text>
          </view>
          <view v-if="deleteTaskOption === 1" class="delete-option-check">
            <text class="delete-option-check-icon">✓</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="delete-divider"></view>

        <!-- 选项2：完整清空此条重复计划 -->
        <view
          class="delete-option"
          :class="{ 'delete-option-selected': deleteTaskOption === 2 }"
          @tap="deleteTaskOption = 2"
        >
          <text class="delete-option-title">完整清空此条重复计划</text>
          <view v-if="deleteTaskOption === 2" class="delete-option-check">
            <text class="delete-option-check-icon">✓</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="delete-divider"></view>

        <!-- 选项3：删除当天及未来计划 -->
        <view
          class="delete-option"
          :class="{ 'delete-option-selected': deleteTaskOption === 3 }"
          @tap="deleteTaskOption = 3"
        >
          <view class="delete-option-content">
            <text class="delete-option-title">删除当天及未来计划</text>
            <text class="delete-option-desc">不影响该计划的过去记录</text>
          </view>
          <view v-if="deleteTaskOption === 3" class="delete-option-check">
            <text class="delete-option-check-icon">✓</text>
          </view>
        </view>

        <!-- 底部确定按钮 -->
        <view class="delete-confirm-btn" @tap="confirmDeleteTask">
          <text class="delete-confirm-text">确定</text>
        </view>
      </view>
    </view>

''')

    # 4. 在const isFirstShow后添加拖拽状态变量
    elif line.strip().startswith('const isFirstShow = ref(true);'):
        new_lines.append('''
// ============================================================
// 拖拽相关状态
// ============================================================
/** 拖拽状态 */
const dragState = ref({
  dragging: false,      // 是否正在拖拽
  task: null,          // 被拖拽的任务对象
  fromQuadrant: '',    // 来源象限 q1/q2/q3/q4
  x: 0,               // 拖拽位置X
  y: 0,               // 拖拽位置Y
  overDelete: false,  // 是否悬停在删除区域上方
  startX: 0,          // 起始触摸X
  startY: 0,          // 起始触摸Y
});

/** 更改象限确认对话框 */
const showChangeQuadrantDialog = ref(false);
const changeQuadrantOption = ref(1); // 1=完整更改, 2=更改当天及未来
const targetQuadrant = ref(''); // 目标象限

/** 删除任务确认对话框 */
const showDeleteTaskDialog = ref(false);
const deleteTaskOption = ref(1); // 1=仅删除当天, 2=完整清空, 3=删除当天及未来

''')

    # 5. 在async function toggleTaskDone后添加拖拽函数
    elif line.strip().startswith('async function toggleTaskDone(task) {'):
        # 找到函数结束的}
        func_start = i
        bracket_count = 0
        found_start = False
        while i < len(lines):
            if '{' in lines[i]:
                bracket_count += lines[i].count('{')
                found_start = True
            if '}' in lines[i]:
                bracket_count -= lines[i].count('}')
            new_lines.append(lines[i])
            if found_start and bracket_count == 0:
                # 函数结束,添加拖拽函数
                new_lines.append('''
// ============================================================
// 拖拽相关函数
// ============================================================

/**
 * 长按任务开始拖拽
 */
function onTaskLongPress(e, task, quadrant) {
  console.log('[Drag] 长按任务:', task.title, 'quadrant:', quadrant);

  // 防止触发点击事件
  e.preventDefault?.();
  e.stopPropagation?.();

  const touch = e.touches?.[0] || e.changedTouches?.[0] || e;

  dragState.value = {
    dragging: true,
    task: task,
    fromQuadrant: quadrant,
    x: touch.clientX || touch.pageX || 0,
    y: touch.clientY || touch.pageY || 0,
    overDelete: false,
    startX: touch.clientX || touch.pageX || 0,
    startY: touch.clientY || touch.pageY || 0,
  };

  // 震动反馈
  uni.vibrateShort?.({ type: 'medium' });
}

/**
 * 拖拽移动
 */
function onTaskTouchMove(e) {
  if (!dragState.value.dragging) return;

  e.preventDefault?.();
  e.stopPropagation?.();

  const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
  const clientX = touch.clientX || touch.pageX || 0;
  const clientY = touch.clientY || touch.pageY || 0;

  dragState.value.x = clientX;
  dragState.value.y = clientY;

  // 检测是否在删除区域
  // #ifdef H5
  const deleteZone = document.querySelector?.('.delete-zone');
  if (deleteZone) {
    const rect = deleteZone.getBoundingClientRect();
    const over = clientX >= rect.left && clientX <= rect.right &&
                 clientY >= rect.top && clientY <= rect.bottom;
    if (over !== dragState.value.overDelete) {
      dragState.value.overDelete = over;
      if (over) {
        uni.vibrateShort?.({ type: 'light' });
      }
    }
  }
  // #endif
}

/**
 * 拖拽结束
 */
function onTaskTouchEnd(e) {
  if (!dragState.value.dragging) return;

  e.preventDefault?.();
  e.stopPropagation?.();

  const { task, fromQuadrant, overDelete, x, y } = dragState.value;

  // 重置拖拽状态
  dragState.value.dragging = false;

  // 如果在删除区域上方,显示删除对话框
  if (overDelete) {
    console.log('[Drag] 拖拽到删除区域');
    dragState.value.task = task;
    dragState.value.fromQuadrant = fromQuadrant;
    showDeleteTaskDialog.value = true;
    return;
  }

  // 检测拖拽到哪个象限
  const target = detectQuadrantAtPosition(x, y);

  if (target && target !== fromQuadrant) {
    console.log('[Drag] 拖拽到象限:', target);
    targetQuadrant.value = target;
    dragState.value.task = task;
    dragState.value.fromQuadrant = fromQuadrant;
    showChangeQuadrantDialog.value = true;
  }
}

/**
 * 检测坐标位置对应的象限
 */
function detectQuadrantAtPosition(x, y) {
  // #ifdef H5
  const quadrants = {
    q1: document.querySelector?.('.nb-q1'),
    q2: document.querySelector?.('.nb-q2'),
    q3: document.querySelector?.('.nb-q3'),
    q4: document.querySelector?.('.nb-q4'),
  };

  for (const [key, el] of Object.entries(quadrants)) {
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return key;
    }
  }
  // #endif

  return null;
}

/**
 * 关闭更改象限对话框
 */
function closeChangeQuadrantDialog() {
  showChangeQuadrantDialog.value = false;
  changeQuadrantOption.value = 1;
}

/**
 * 确认更改象限
 */
async function confirmChangeQuadrant() {
  const task = dragState.value.task;
  const newQuadrant = targetQuadrant.value;
  const option = changeQuadrantOption.value;

  if (!task || !newQuadrant) return;

  console.log('[Drag] 确认更改象限:', task.title, '->', newQuadrant, 'option:', option);

  // 根据目标象限设置isUrgent和isImportant
  let isUrgent, isImportant;
  if (newQuadrant === 'q1') { isUrgent = true; isImportant = true; }
  else if (newQuadrant === 'q2') { isUrgent = false; isImportant = true; }
  else if (newQuadrant === 'q3') { isUrgent = true; isImportant = false; }
  else if (newQuadrant === 'q4') { isUrgent = false; isImportant = false; }

  try {
    // 根据选项更新任务
    if (option === 1) {
      // 完整更改此条重复计划
      await updateTaskRecurrence(task.id, { isUrgent, isImportant }, 'all');
    } else if (option === 2) {
      // 更改当天及未来计划
      await updateTaskRecurrence(task.id, { isUrgent, isImportant }, 'future');
    }

    // 刷新任务列表
    await taskStore.fetchTasksByDate(selectedDate.value);

    uni.showToast({ title: '已更改', icon: 'success' });
  } catch (err) {
    console.error('[Drag] 更改象限失败:', err);
    uni.showToast({ title: '更改失败', icon: 'none' });
  }

  closeChangeQuadrantDialog();
}

/**
 * 关闭删除任务对话框
 */
function closeDeleteTaskDialog() {
  showDeleteTaskDialog.value = false;
  deleteTaskOption.value = 1;
}

/**
 * 确认删除任务
 */
async function confirmDeleteTask() {
  const task = dragState.value.task;
  const option = deleteTaskOption.value;

  if (!task) return;

  console.log('[Drag] 确认删除任务:', task.title, 'option:', option);

  try {
    // 根据选项删除任务
    if (option === 1) {
      // 仅删除当天计划
      await deleteTaskOccurrence(task.id, selectedDate.value);
    } else if (option === 2) {
      // 完整清空此条重复计划
      await deleteTaskRecurrence(task.id, 'all');
    } else if (option === 3) {
      // 删除当天及未来计划
      await deleteTaskRecurrence(task.id, 'future');
    }

    // 刷新任务列表
    await taskStore.fetchTasksByDate(selectedDate.value);

    uni.showToast({ title: '已删除', icon: 'success' });
  } catch (err) {
    console.error('[Drag] 删除任务失败:', err);
    uni.showToast({ title: '删除失败', icon: 'none' });
  }

  closeDeleteTaskDialog();
}

/**
 * 更新重复任务
 * @param {string} taskId - 任务ID
 * @param {object} updates - 更新内容
 * @param {string} scope - 'all' | 'future'
 */
async function updateTaskRecurrence(taskId, updates, scope) {
  // TODO: 调用后端API更新重复任务
  // 临时方案: 直接更新localStorage中的任务
  const savedTasks = uni.getStorageSync('tasks');
  if (savedTasks) {
    const allTasks = JSON.parse(savedTasks);
    const taskIndex = allTasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
      Object.assign(allTasks[taskIndex], updates);
      uni.setStorageSync('tasks', JSON.stringify(allTasks));

      // 同时更新taskStore
      const storeTaskIndex = taskStore.tasks.findIndex(t => t.id === taskId);
      if (storeTaskIndex !== -1) {
        Object.assign(taskStore.tasks[storeTaskIndex], updates);
      }
    }
  }
}

/**
 * 删除任务的某次出现
 * @param {string} taskId - 任务ID
 * @param {string} date - 日期
 */
async function deleteTaskOccurrence(taskId, date) {
  // TODO: 调用后端API删除指定日期的任务出现
  await taskStore.removeTask(taskId);
}

/**
 * 删除重复任务
 * @param {string} taskId - 任务ID
 * @param {string} scope - 'all' | 'future'
 */
async function deleteTaskRecurrence(taskId, scope) {
  // TODO: 调用后端API删除重复任务
  await taskStore.removeTask(taskId);
}
''')
                break
            i += 1
        continue

    # 6. 在</style>前添加CSS
    elif line.strip() == '</style>':
        new_lines.append('''
/* ============================================================
   拖拽相关样式
   ============================================================ */

/* 拖拽蒙层 */
.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  pointer-events: none;
}

/* 拖拽中的任务副本 */
.dragging-task {
  position: fixed;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%) scale(1.1);
  z-index: 9999;
  pointer-events: none;
}

.dragging-task-text {
  font-size: 28rpx;
  color: #333;
}

/* 删除区域 */
.delete-zone {
  position: fixed;
  bottom: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background-color: rgba(255, 59, 48, 0.1);
  border: 4rpx dashed #FF3B30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.delete-zone-active {
  background-color: rgba(255, 59, 48, 0.3);
  border-color: #FF3B30;
  border-style: solid;
  transform: translateX(-50%) scale(1.2);
}

.delete-zone-icon {
  font-size: 72rpx;
  margin-bottom: 12rpx;
}

.delete-zone-text {
  font-size: 28rpx;
  color: #FF3B30;
  font-weight: bold;
}

/* 更改象限对话框蒙层 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

/* 更改象限对话框 */
.change-dialog {
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx 32rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.change-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  cursor: pointer;
}

.change-option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.change-option-title {
  font-size: 32rpx;
  color: #1A1A2E;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.change-option-desc {
  font-size: 24rpx;
  color: #999;
}

.change-option-check {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #1A1A2E;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 24rpx;
}

.change-option-check-icon {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: bold;
}

.change-divider {
  height: 1rpx;
  background-color: #EEEEEE;
  margin: 8rpx 0;
}

.change-confirm-btn {
  margin-top: 32rpx;
  background-color: #1A1A2E;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.change-confirm-text {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: bold;
}

/* 删除任务对话框 */
.delete-dialog {
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx 32rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.delete-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  cursor: pointer;
}

.delete-option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.delete-option-title {
  font-size: 32rpx;
  color: #1A1A2E;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.delete-option-desc {
  font-size: 24rpx;
  color: #999;
}

.delete-option-check {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #FF3B30;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 24rpx;
}

.delete-option-check-icon {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: bold;
}

.delete-divider {
  height: 1rpx;
  background-color: #EEEEEE;
  margin: 8rpx 0;
}

.delete-confirm-btn {
  margin-top: 32rpx;
  background-color: #FF3B30;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.delete-confirm-text {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: bold;
}

''')

    i += 1

# 写回文件
with open(vue_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("[OK] Drag feature added successfully!")
print("Modified file:", vue_file)
