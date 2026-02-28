<template>
  <view class="calendar-page">
    <!-- 自定义状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 顶部：标题 + 操作栏 -->
    <view class="top-bar">
      <text class="top-title">做计划</text>
      <view class="top-actions">
        <text class="btn-today" @tap="goToday">今</text>
        <view class="view-switch">
          <text
            v-for="v in viewModes"
            :key="v.key"
            class="view-btn"
            :class="{ active: currentView === v.key }"
            @tap="currentView = v.key"
          >{{ v.label }}</text>
        </view>
      </view>
    </view>

    <!-- 日历条（周模式 or 月模式） -->
    <view
      ref="calBarRef"
      class="calendar-bar"
      :class="{ 'month-mode': calendarMode === 'month' }"
      @touchstart="onCalTouchStart"
      @touchmove="onCalTouchMove"
      @touchend="onCalTouchEnd"
    >
      <!-- 星期头 -->
      <view class="week-header">
        <text v-for="d in weekDays" :key="d" class="week-day-name">{{ d }}</text>
      </view>

      <!-- 周模式：只显示1行7天 -->
      <view v-if="calendarMode === 'week'" class="week-dates">
        <view
          v-for="item in currentWeekDates"
          :key="item.dateStr"
          class="date-cell"
          :class="{
            selected: item.dateStr === selectedDate,
            today: item.dateStr === todayStr,
            'has-task': item.hasTask
          }"
          @tap="selectDate(item.dateStr)"
        >
          <text class="lunar-label">{{ item.lunarLabel }}</text>
          <view class="date-circle">
            <text class="date-num">{{ item.day }}</text>
          </view>
          <!-- 多色任务点（最多显示2个象限色） -->
          <view v-if="item.hasTask" class="task-dots">
            <view
              v-for="(dot, di) in item.taskDots"
              :key="di"
              class="task-dot"
              :class="'dot-' + dot"
            ></view>
          </view>
        </view>
      </view>

      <!-- 月模式：6行×7列 = 42天 -->
      <view v-else class="month-grid">
        <view
          v-for="(row, ri) in monthRows"
          :key="ri"
          class="month-row"
        >
          <view
            v-for="item in row"
            :key="item.dateStr"
            class="date-cell month-cell"
            :class="{
              selected: item.dateStr === selectedDate,
              today: item.dateStr === todayStr,
              'has-task': item.hasTask,
              'other-month': item.otherMonth
            }"
            @tap="selectDate(item.dateStr)"
          >
            <text class="lunar-label">{{ item.lunarLabel }}</text>
            <view class="date-circle">
              <text class="date-num">{{ item.day }}</text>
            </view>
            <view v-if="item.hasTask" class="task-dots">
              <view
                v-for="(dot, di) in item.taskDots"
                :key="di"
                class="task-dot"
                :class="'dot-' + dot"
              ></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 月份/年份标签 -->
      <view class="cal-month-label">
        <text>{{ currentMonthLabel }}</text>
      </view>
    </view>

    <!-- 内容区（可滚动） -->
    <scroll-view
      ref="contentAreaRef"
      class="content-area"
      scroll-y
      :scroll-top="scrollTop"
      @scroll="onContentScroll"
      @touchstart="onContentTouchStart"
      @touchmove="onContentTouchMove"
      @touchend="onContentTouchEnd"
    >
      <!-- 空状态 -->
      <view v-if="!taskStore.loading && taskStore.tasks.length === 0 && logStore.logs.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">今天还没有任何安排</text>
        <text class="empty-hint">点击右下角 + 添加任务</text>
      </view>

      <!-- 时间轴视图 -->
      <view v-if="currentView === 'timeline'" class="timeline-view">

        <!-- 顶部栏：规划和分类 + 时间轴标签 -->
        <view class="tl-top-bar">
          <view class="tl-filter-tab" @tap="goToPlanningCategory">
            <text v-if="currentCategoryIcon" class="tl-filter-icon-emoji">{{ currentCategoryIcon }}</text>
            <text class="tl-filter-text">{{ currentCategoryName }}</text>
            <text class="tl-filter-icon">≡</text>
            <view class="tl-filter-tab-ear"></view>
          </view>
          <view class="tl-mode-btn">
            <text class="tl-mode-icon">⇌</text>
            <text class="tl-mode-text">时间轴</text>
          </view>
        </view>

        <!-- 全天任务区 -->
        <view class="tl-allday-section">
          <text class="tl-allday-label">全天</text>
          <view class="tl-allday-bars">
            <!-- 未完成任务：彩色实色bar -->
            <view
              v-for="task in allDayTasksPending"
              :key="task.id"
              class="tl-bar"
              :class="'tl-bar-' + getQuadrant(task)"
              @tap="openTask(task)"
            >
              <text class="tl-bar-text">{{ task.title }}</text>
            </view>
            <!-- 已完成任务：淡色+删除线 -->
            <view
              v-for="task in allDayTasksDone"
              :key="'done-' + task.id"
              class="tl-bar tl-bar-done"
              :class="'tl-bar-done-' + getQuadrant(task)"
              @tap="openTask(task)"
            >
              <text class="tl-bar-text tl-bar-text-done">{{ task.title }}</text>
            </view>
          </view>
        </view>

        <!-- 时间轴 -->
        <view class="timeline-slots">
          <!-- 当前时间红线（仅今天显示） -->
          <view
            v-if="selectedDate === todayStr"
            class="time-indicator"
            :style="{ top: currentTimeTop + 'rpx' }"
          >
            <view class="time-dot"></view>
            <view class="time-line"></view>
          </view>

          <view v-for="hour in hours" :key="hour" class="hour-slot">
            <text class="hour-label">{{ hour < 10 ? '0' + hour : hour }}:00</text>
            <view class="hour-content">
              <view
                v-for="task in getTasksAtHour(hour)"
                :key="task.id"
                class="tl-timed-bar"
                :class="['tl-bar-' + getQuadrant(task), { 'tl-bar-done': task.status === 'completed' }]"
                @tap="openTask(task)"
              >
                <text class="tl-bar-text" :class="{ 'tl-bar-text-done': task.status === 'completed' }">{{ task.title }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 日志列表 -->
        <view v-if="logStore.logs.length > 0" class="log-section">
          <text class="section-title">日志记录</text>
          <view
            v-for="log in logStore.logs"
            :key="log.id"
            class="log-item"
            @tap="openLog(log)"
          >
            <text class="log-time">{{ formatLogTime(log.logTime) }}</text>
            <text class="log-content">{{ log.content }}</text>
            <text class="log-convert" @tap.stop="convertLog(log.id)">→任务</text>
          </view>
        </view>
      </view>

      <!-- 四象限视图 -->
      <view v-if="currentView === 'quadrant'" class="quadrant-view">
        <!-- 顶部栏：规划和分类 + 四象限切换标签 -->
        <view class="quad-top-bar">
          <view class="quad-filter-btn" @tap="goToPlanningCategory">
            <text v-if="currentCategoryIcon" class="quad-filter-icon-emoji">{{ currentCategoryIcon }}</text>
            <text class="quad-filter-text">{{ currentCategoryName }}</text>
            <text class="quad-filter-icon">≡</text>
          </view>
          <view class="quad-mode-btn">
            <text class="quad-mode-icon">⇌</text>
            <text class="quad-mode-text">四象限</text>
          </view>
        </view>

        <!-- 四象限网格（上行：Q3左 + Q1右） -->
        <view class="quadrant-grid">
          <view class="quadrant-row-wrap">
          <!-- 左上：紧急不重要（Q3） -->
          <view class="nb-card nb-q3">
            <!-- 笔记本顶部夹子 -->
            <view class="nb-clips">
              <view class="nb-clip"></view>
              <view class="nb-clip"></view>
            </view>
            <!-- 笔记本标题栏 -->
            <view class="nb-title-bar nb-title-q3">
              <text class="nb-title-text">紧急不重要</text>
            </view>
            <!-- 任务内容 -->
            <view class="nb-body">
              <view v-if="filteredUrgentNotImportant.length === 0 && urgentNotImportantDone.length === 0" class="nb-empty">
                <view class="nb-empty-icon-wrap">
                  <text class="nb-empty-icon">🚫</text>
                </view>
                <text class="nb-empty-tip">无益象限 快速做</text>
              </view>
              <view
                v-for="task in filteredUrgentNotImportant"
                :key="task.id"
                class="nb-task-item"
                @tap="openTaskDetail(task)"
                @longpress="(e) => onTaskLongPress(e, task, 'q3')"
                @touchmove="(e) => onTaskTouchMove(e)"
                @touchend="(e) => onTaskTouchEnd(e)"
                @mousedown="(e) => handleTaskMouseDown(e, task, 'q3')"
              >
                <view
                  class="nb-check nb-check-q3"
                  @tap.stop="toggleTaskDone(task)"
                ></view>
                <view class="nb-task-right">
                  <view v-if="task.hasSubtask" class="nb-subtask-icon">
                    <text class="nb-subtask-icon-text">☰</text>
                  </view>
                  <text class="nb-task-title">{{ task.title }}</text>
                </view>
              </view>
              <!-- 已完成任务（灰色勾选+删除线） -->
              <view
                v-for="task in urgentNotImportantDone"
                :key="'done-' + task.id"
                class="nb-task-item nb-task-done"
                @tap="openTaskDetail(task)"
              >
                <view
                  class="nb-check nb-check-done"
                  @tap.stop="toggleTaskDone(task)"
                >
                  <text class="nb-check-mark">✓</text>
                </view>
                <text class="nb-task-title nb-task-title-done">{{ task.title }}</text>
              </view>
            </view>
          </view>

          <!-- 右上：重要且紧急（Q1） -->
          <view class="nb-card nb-q1">
            <view class="nb-clips">
              <view class="nb-clip"></view>
              <view class="nb-clip"></view>
            </view>
            <view class="nb-title-bar nb-title-q1">
              <text class="nb-title-text">重要且紧急</text>
            </view>
            <view class="nb-body">
              <view v-if="filteredUrgentImportant.length === 0 && urgentImportantDone.length === 0" class="nb-empty">
                <view class="nb-empty-icon-wrap">
                  <text class="nb-empty-icon">✨</text>
                </view>
                <text class="nb-empty-tip">重要优先做</text>
              </view>
              <view
                v-for="task in filteredUrgentImportant"
                :key="task.id"
                class="nb-task-item"
                @tap="openTaskDetail(task)"
                @longpress="(e) => onTaskLongPress(e, task, 'q1')"
                @touchmove="(e) => onTaskTouchMove(e)"
                @touchend="(e) => onTaskTouchEnd(e)"
                @mousedown="(e) => handleTaskMouseDown(e, task, 'q1')"
              >
                <view
                  class="nb-check nb-check-q1"
                  @tap.stop="toggleTaskDone(task)"
                ></view>
                <view class="nb-task-right">
                  <view v-if="task.hasSubtask" class="nb-subtask-icon">
                    <text class="nb-subtask-icon-text">☰</text>
                  </view>
                  <text class="nb-task-title">{{ task.title }}</text>
                </view>
              </view>
              <view
                v-for="task in urgentImportantDone"
                :key="'done-' + task.id"
                class="nb-task-item nb-task-done"
                @tap="openTaskDetail(task)"
              >
                <view
                  class="nb-check nb-check-done"
                  @tap.stop="toggleTaskDone(task)"
                >
                  <text class="nb-check-mark">✓</text>
                </view>
                <text class="nb-task-title nb-task-title-done">{{ task.title }}</text>
              </view>
            </view>
          </view>

          </view><!-- end quadrant-row-wrap (上行) -->

          <!-- 下行：Q4左 + Q2右 -->
          <view class="quadrant-row-wrap">
          <!-- 左下：不重要不紧急（Q4） -->
          <view class="nb-card nb-q4">
            <view class="nb-clips">
              <view class="nb-clip"></view>
              <view class="nb-clip"></view>
            </view>
            <view class="nb-title-bar nb-title-q4">
              <text class="nb-title-text">不重要不紧急</text>
            </view>
            <view class="nb-body">
              <view v-if="filteredNotUrgentNotImportant.length === 0 && notUrgentNotImportantDone.length === 0" class="nb-empty">
                <view class="nb-empty-icon-wrap">
                  <text class="nb-empty-icon">📋</text>
                </view>
                <text class="nb-empty-tip">琐事象限 减少做</text>
              </view>
              <view
                v-for="task in filteredNotUrgentNotImportant"
                :key="task.id"
                class="nb-task-item"
                @tap="openTaskDetail(task)"
                @longpress="(e) => onTaskLongPress(e, task, 'q4')"
                @touchmove="(e) => onTaskTouchMove(e)"
                @touchend="(e) => onTaskTouchEnd(e)"
                @mousedown="(e) => handleTaskMouseDown(e, task, 'q4')"
              >
                <view
                  class="nb-check nb-check-q4"
                  @tap.stop="toggleTaskDone(task)"
                ></view>
                <view class="nb-task-right">
                  <view v-if="task.hasSubtask" class="nb-subtask-icon">
                    <text class="nb-subtask-icon-text">☰</text>
                  </view>
                  <text class="nb-task-title">{{ task.title }}</text>
                </view>
              </view>
              <view
                v-for="task in notUrgentNotImportantDone"
                :key="'done-' + task.id"
                class="nb-task-item nb-task-done"
                @tap="openTaskDetail(task)"
              >
                <view
                  class="nb-check nb-check-done"
                  @tap.stop="toggleTaskDone(task)"
                >
                  <text class="nb-check-mark">✓</text>
                </view>
                <text class="nb-task-title nb-task-title-done">{{ task.title }}</text>
              </view>
            </view>
          </view>

          <!-- 右下：重要不紧急（Q2） -->
          <view class="nb-card nb-q2">
            <view class="nb-clips">
              <view class="nb-clip"></view>
              <view class="nb-clip"></view>
            </view>
            <view class="nb-title-bar nb-title-q2">
              <text class="nb-title-text">重要不紧急</text>
            </view>
            <view class="nb-body">
              <view v-if="filteredNotUrgentImportant.length === 0 && notUrgentImportantDone.length === 0" class="nb-empty">
                <view class="nb-empty-icon-wrap">
                  <text class="nb-empty-icon">🎯</text>
                </view>
                <text class="nb-empty-tip">计划时间做</text>
              </view>
              <view
                v-for="task in filteredNotUrgentImportant"
                :key="task.id"
                class="nb-task-item"
                @tap="openTaskDetail(task)"
                @longpress="(e) => onTaskLongPress(e, task, 'q2')"
                @touchmove="(e) => onTaskTouchMove(e)"
                @touchend="(e) => onTaskTouchEnd(e)"
                @mousedown="(e) => handleTaskMouseDown(e, task, 'q2')"
              >
                <view
                  class="nb-check nb-check-q2"
                  @tap.stop="toggleTaskDone(task)"
                ></view>
                <view class="nb-task-right">
                  <view v-if="task.hasSubtask" class="nb-subtask-icon">
                    <text class="nb-subtask-icon-text">☰</text>
                  </view>
                  <text class="nb-task-title">{{ task.title }}</text>
                </view>
              </view>
              <view
                v-for="task in notUrgentImportantDone"
                :key="'done-' + task.id"
                class="nb-task-item nb-task-done"
                @tap="openTaskDetail(task)"
              >
                <view
                  class="nb-check nb-check-done"
                  @tap.stop="toggleTaskDone(task)"
                >
                  <text class="nb-check-mark">✓</text>
                </view>
                <text class="nb-task-title nb-task-title-done">{{ task.title }}</text>
              </view>
            </view>
          </view>
          </view><!-- end quadrant-row-wrap (下行) -->
        </view><!-- end quadrant-grid -->
      </view><!-- end quadrant-view -->

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

      <!-- 列表视图 -->
      <view v-if="currentView === 'list'" class="list-view">
        <view class="task-list">
          <view
            v-for="task in taskStore.tasks"
            :key="task.id"
            class="task-item"
            :class="['quad-' + getQuadrant(task), { done: task.status === 'completed' }]"
            @tap="openTask(task)"
          >
            <view class="task-check" @tap.stop="taskStore.toggleDone(task.id, task.status)">
              <text class="check-icon">{{ task.status === 'completed' ? '✓' : '' }}</text>
            </view>
            <view class="task-info">
              <text class="task-title">{{ task.title }}</text>
              <text v-if="task.startTime" class="task-time-label">{{ task.startTime }}</text>
            </view>
            <view class="task-quad-tag" :class="'tag-' + getQuadrant(task)">
              <text>{{ quadrantLabel(task) }}</text>
            </view>
          </view>
          <view v-if="taskStore.tasks.length === 0" class="list-empty">
            <text class="empty-text">当天没有任务</text>
          </view>
        </view>
      </view>

      <view v-if="taskStore.loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view class="bottom-safe" :style="{ height: (tabBarHeight + 20) + 'px' }"></view>
    </scroll-view>

    <!-- 浮动 + 按钮 -->
    <view class="fab-area" :style="{ bottom: (tabBarHeight + 20) + 'px' }">
      <view v-if="fabOpen" class="fab-menu">
        <view class="fab-menu-item" @tap="openCreateLog">
          <view class="fab-menu-icon">📝</view>
          <text class="fab-menu-label">记日志</text>
        </view>
        <view class="fab-menu-item" @tap="openCreateTask">
          <view class="fab-menu-icon">✅</view>
          <text class="fab-menu-label">加任务</text>
        </view>
      </view>
      <view class="fab-btn" :class="{ open: fabOpen }" @tap="fabOpen = !fabOpen">
        <text class="fab-icon">{{ fabOpen ? '×' : '+' }}</text>
      </view>
    </view>

    <!-- 快速新建任务底部面板 -->
    <AddTaskPanel
      :visible="showAddPanel"
      :presetDate="selectedDate"
      :categoryId="selectedCategoryId === 'all' || selectedCategoryId === 'none' ? null : selectedCategoryId"
      @close="showAddPanel = false"
      @submitted="onTaskSubmitted"
    />

    <!-- 子任务展开弹窗（38.jpg效果，放在根容器保证fixed定位正确） -->
    <view v-if="subtaskPopup.visible" class="subtask-overlay" @tap="closeSubtaskPopup">
      <view class="subtask-popup" @tap.stop>
        <!-- 父任务 -->
        <view class="subtask-popup-parent">
          <view
            class="nb-check"
            :class="subtaskPopup.task && subtaskPopup.task.status === 'completed' ? 'nb-check-done' : ('nb-check-' + getQuadrantClass(subtaskPopup.task))"
            @tap.stop="subtaskPopup.task && toggleTaskDone(subtaskPopup.task)"
          >
            <text v-if="subtaskPopup.task && subtaskPopup.task.status === 'completed'" class="nb-check-mark">✓</text>
          </view>
          <text class="subtask-popup-title">{{ subtaskPopup.task ? subtaskPopup.task.title : '' }}</text>
        </view>
        <!-- 左边红线分隔 -->
        <view class="subtask-list">
          <view class="subtask-left-line"></view>
          <view class="subtask-items">
            <view
              v-for="(sub, idx) in subtaskPopup.subtasks"
              :key="idx"
              class="subtask-item"
              @tap.stop="toggleSubtask(sub)"
            >
              <view class="subtask-check" :class="{ 'subtask-check-done': sub.done }">
                <text v-if="sub.done" class="nb-check-mark">✓</text>
              </view>
              <text class="subtask-item-text" :class="{ 'subtask-item-done': sub.done }">{{ sub.title }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 规划和分类抽屉 -->
    <!-- 更改象限确认对话框 -->
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

    <CategoryDrawer
      v-model:visible="showCategoryDrawer"
      @container-changed="onContainerChanged"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTaskStore } from '@/store/task.js';
import { useLogStore } from '@/store/log.js';
import { useUserStore } from '@/store/user.js';
import { usePlanStore } from '@/store/plan.js';
import { getHolidaysByRange, getLunarInfoRange } from '@/api/holiday.js';
import AddTaskPanel from '@/components/task/AddTaskPanel.vue';
import CategoryDrawer from '@/components/category-drawer.vue';

// ============================================================
// Store
// ============================================================
const taskStore = useTaskStore();
const logStore = useLogStore();
const userStore = useUserStore();
const planStore = usePlanStore();

// ============================================================
// 状态变量
// ============================================================
const statusBarHeight = ref(20);
const tabBarHeight = ref(50);
const currentView = ref('quadrant');
const fabOpen = ref(false);
const selectedDate = ref('');
const selectedCategoryId = ref('all'); // 当前选中的分类ID：'all', 'none', 或具体分类ID
const selectedPlanId = ref(''); // 当前选中的规划ID
const userCategories = ref([]); // 用户创建的分类列表
const isFirstShow = ref(true); // 标记是否首次显示（防止onShow与onMounted重复加载）

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

/** APP端象限位置缓存 */
const quadrantRects = ref({
  q1: null,
  q2: null,
  q3: null,
  q4: null,
  delete: null,
});

/** 更改象限确认对话框 */
const showChangeQuadrantDialog = ref(false);
const changeQuadrantOption = ref(1); // 1=完整更改, 2=更改当天及未来
const targetQuadrant = ref(''); // 目标象限

/** 删除任务确认对话框 */
const showDeleteTaskDialog = ref(false);
const deleteTaskOption = ref(1); // 1=仅删除当天, 2=完整清空, 3=删除当天及未来


// 快速新建任务底部面板
const showAddPanel = ref(false);

// 规划和分类抽屉
const showCategoryDrawer = ref(false);

// 子任务弹窗状态
const subtaskPopup = ref({
  visible: false,
  task: null,
  subtasks: []
});

// 日历模式：'week' | 'month'
const calendarMode = ref('week');

// 周模式：当前周的周一
const currentWeekStart = ref(null);

// 月模式：当前月的1号（Date对象）
const currentMonthFirst = ref(null);

// 节日农历缓存 key=YYYY-MM-DD
const holidayMap = ref({});

// 当前时间分钟数（红线）
const currentMinutes = ref(0);
let timeTimer = null;

// scroll-view 当前滚动位置
const contentScrollTop = ref(0);
// 用于重置 scroll-view scrollTop（先设大值再设0达到重置效果时避免触发）
const scrollTop = ref(0);

// H5 鼠标模拟触摸用 DOM ref
const calBarRef = ref(null);
const contentAreaRef = ref(null);

// 触摸追踪
let calTouchStartX = 0;
let calTouchStartY = 0;
let calTouchMoved = false; // 是否已触发方向判断
let calTouchDir = ''; // 'h' | 'v' | ''

let contentTouchStartY = 0;
let contentTouchMoved = false;

// ============================================================
// 常量
// ============================================================
// 周一到周日
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const hours = Array.from({ length: 24 }, (_, i) => i);
const viewModes = [
  { key: 'timeline', label: '时间轴' },
  { key: 'quadrant', label: '四象限' },
  { key: 'list', label: '列表' }
];

// ============================================================
// 工具函数
// ============================================================

/** 格式化日期为 YYYY-MM-DD */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const todayStr = formatDate(new Date());

/**
 * 获取给定日期所在周的周一
 * JS: getDay() 0=周日 1=周一 ... 6=周六
 */
function getWeekMonday(date) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=周日
  // 距周一的偏移：周日=-6，周一=0，周二=-1...
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 获取某月1号 */
function getMonthFirst(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================
// 计算属性
// ============================================================

/**
 * 获取当前选中容器（规划或分类）的图标
 * 规划和分类是平级的容器概念，互斥选中
 */
const currentCategoryIcon = computed(() => {
  // 如果选中了规划容器
  if (selectedPlanId.value) {
    const plan = planStore.plans.find(p => p.id === selectedPlanId.value);
    return plan ? (plan.iconEmoji || '🔔') : '';
  }

  // 如果选中了分类容器
  if (selectedCategoryId.value === 'all' || selectedCategoryId.value === 'none') {
    return '';
  }

  if (selectedCategoryId.value) {
    const category = userCategories.value.find(c => c.id === selectedCategoryId.value);
    return category?.iconEmoji || '';
  }

  // 默认情况
  return '';
});

/**
 * 获取当前选中容器（规划或分类）的显示名称
 * 规划和分类是平级的容器概念，互斥选中
 */
const currentCategoryName = computed(() => {
  // 如果选中了规划容器
  if (selectedPlanId.value) {
    const plan = planStore.plans.find(p => p.id === selectedPlanId.value);
    return plan ? plan.title : '规划和分类';
  }

  // 如果选中了分类容器
  if (selectedCategoryId.value === 'all') {
    return '规划和分类';
  }
  if (selectedCategoryId.value === 'none') {
    return '无分类';
  }

  if (selectedCategoryId.value) {
    const category = userCategories.value.find(c => c.id === selectedCategoryId.value);
    return category ? category.name : '规划和分类';
  }

  // 默认情况
  return '规划和分类';
});

/**
 * 合并后的任务列表（后端任务 + 规划生成的任务）
 */
const mergedTasks = computed(() => {
  // 获取选中日期的规划任务
  const planTasks = planStore.getTasksByDate(selectedDate.value);

  // 合并后端任务和规划任务
  return [...taskStore.tasks, ...planTasks];
});

/**
 * 合并后的四象限任务（用于替代 taskStore 的计算属性）
 */
const mergedUrgentImportant = computed(() =>
  mergedTasks.value.filter(t => t.isUrgent && t.isImportant && t.status !== 'completed')
);

const mergedNotUrgentImportant = computed(() =>
  mergedTasks.value.filter(t => !t.isUrgent && t.isImportant && t.status !== 'completed')
);

const mergedUrgentNotImportant = computed(() =>
  mergedTasks.value.filter(t => t.isUrgent && !t.isImportant && t.status !== 'completed')
);

const mergedNotUrgentNotImportant = computed(() =>
  mergedTasks.value.filter(t => !t.isUrgent && !t.isImportant && t.status !== 'completed')
);

const mergedDoneTasks = computed(() =>
  mergedTasks.value.filter(t => t.status === 'completed')
);

const mergedTimelineTasks = computed(() => {
  return [...mergedTasks.value]
    .filter(t => !t.isAllDay && t.startTime && t.status !== 'completed')
    .sort((a, b) => {
      if (a.startTime < b.startTime) return -1;
      if (a.startTime > b.startTime) return 1;
      return 0;
    });
});

/**
 * 根据选中的容器（规划或分类）过滤任务
 */
function filterTasksByCategory(tasks) {
  // 优先检查是否选中了规划
  if (selectedPlanId.value) {
    // 只显示该规划下的任务
    return tasks.filter(t => t.fromPlan && t.planId === selectedPlanId.value);
  }

  // 检查分类过滤
  if (selectedCategoryId.value === 'all') {
    // 显示所有任务
    return tasks;
  } else if (selectedCategoryId.value === 'none') {
    // 只显示无分类的任务（不包括规划任务）
    return tasks.filter(t => !t.categoryId && !t.fromPlan);
  } else {
    // 显示指定分类的任务（不包括规划任务）
    return tasks.filter(t => t.categoryId === selectedCategoryId.value && !t.fromPlan);
  }
}

/**
 * 过滤后的四象限任务
 */
const filteredUrgentImportant = computed(() =>
  filterTasksByCategory(mergedUrgentImportant.value)
);

const filteredNotUrgentImportant = computed(() =>
  filterTasksByCategory(mergedNotUrgentImportant.value)
);

const filteredUrgentNotImportant = computed(() =>
  filterTasksByCategory(mergedUrgentNotImportant.value)
);

const filteredNotUrgentNotImportant = computed(() =>
  filterTasksByCategory(mergedNotUrgentNotImportant.value)
);

const filteredDoneTasks = computed(() =>
  filterTasksByCategory(mergedDoneTasks.value)
);

const filteredTimelineTasks = computed(() =>
  filterTasksByCategory(mergedTimelineTasks.value)
);

/**
 * 获取某日期的任务象限色点（最多2个，不重复）
 * 颜色：q1=红 q2=蓝 q3=黄 q4=绿
 */
function getTaskDots(dateStr) {
  // 获取该日期的所有任务（包括规划任务）
  const planTasks = planStore.getTasksByDate(dateStr);
  const allTasks = [...taskStore.tasks, ...planTasks];

  const dotsSet = new Set();
  allTasks.forEach(t => {
    // 注意：规划任务的date字段已经是YYYY-MM-DD格式
    const taskDate = t.date || t.taskDate || '';
    if (!taskDate.startsWith(dateStr)) return;

    if (t.isUrgent && t.isImportant) dotsSet.add('q1');
    else if (!t.isUrgent && t.isImportant) dotsSet.add('q2');
    else if (t.isUrgent && !t.isImportant) dotsSet.add('q3');
    else dotsSet.add('q4');
  });
  // 最多返回2种颜色
  return [...dotsSet].slice(0, 2);
}

/** 当前周7天（周一~周日） */
const currentWeekDates = computed(() => {
  if (!currentWeekStart.value) return [];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);

    // 合并后端任务和规划任务
    const planTasks = planStore.getTasksByDate(dateStr);
    const dateTasks = [...taskStore.tasks, ...planTasks].filter(t => {
      const taskDate = t.date || t.taskDate || '';
      return taskDate.startsWith(dateStr);
    });

    const hasTask = dateTasks.length > 0;
    return {
      dateStr,
      day: d.getDate(),
      lunarLabel: holidayMap.value[dateStr] || '',
      hasTask,
      taskDots: hasTask ? getTaskDots(dateStr) : []
    };
  });
});

/**
 * 月模式：42格（6行×7列），以当月1号所在周的周一为起点
 * 返回二维数组 monthRows[6][7]
 */
const monthRows = computed(() => {
  if (!currentMonthFirst.value) return [];

  // 找到本月1号所在周的周一
  const gridStart = getWeekMonday(currentMonthFirst.value);
  const curMonth = currentMonthFirst.value.getMonth();

  const rows = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + r * 7 + c);
      const dateStr = formatDate(d);

      // 合并后端任务和规划任务
      const planTasks = planStore.getTasksByDate(dateStr);
      const hasTask = [...taskStore.tasks, ...planTasks].some(t => {
        const taskDate = t.date || t.taskDate || '';
        return taskDate.startsWith(dateStr);
      });

      row.push({
        dateStr,
        day: d.getDate(),
        lunarLabel: holidayMap.value[dateStr] || '',
        hasTask,
        taskDots: hasTask ? getTaskDots(dateStr) : [],
        otherMonth: d.getMonth() !== curMonth
      });
    }
    rows.push(row);
  }
  return rows;
});

/** 月份标签（如 2026年2月） */
const currentMonthLabel = computed(() => {
  if (calendarMode.value === 'month' && currentMonthFirst.value) {
    const d = currentMonthFirst.value;
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }
  if (!currentWeekStart.value) return '';
  // 取周中间日（周四）所在月
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 3);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
});

/** 当前时间红线位置（rpx，每小时120rpx） */
const currentTimeTop = computed(() => {
  return Math.round((currentMinutes.value / 60) * 120);
});

/** 全天任务 - 未完成（时间轴彩色bar） */
const allDayTasksPending = computed(() =>
  mergedTasks.value.filter(t => t.isAllDay && t.status !== 'completed')
);

/** 全天任务 - 已完成（时间轴淡色+删除线） */
const allDayTasksDone = computed(() =>
  mergedDoneTasks.value.filter(t => t.isAllDay)
);

// ============================================================
// 四象限：各象限已完成任务（用于同象限内显示删除线效果）
// ============================================================
const urgentImportantDone = computed(() =>
  filteredDoneTasks.value.filter(t => t.isUrgent && t.isImportant)
);
const notUrgentImportantDone = computed(() =>
  filteredDoneTasks.value.filter(t => !t.isUrgent && t.isImportant)
);
const urgentNotImportantDone = computed(() =>
  filteredDoneTasks.value.filter(t => t.isUrgent && !t.isImportant)
);
const notUrgentNotImportantDone = computed(() =>
  filteredDoneTasks.value.filter(t => !t.isUrgent && !t.isImportant)
);

// ============================================================
// 日历条触摸处理
// ============================================================

function onCalTouchStart(e) {
  calTouchStartX = e.touches[0].clientX;
  calTouchStartY = e.touches[0].clientY;
  calTouchMoved = false;
  calTouchDir = '';
}

function onCalTouchMove(e) {
  if (calTouchMoved) return; // 方向已锁定，不重复判断
  const dx = e.touches[0].clientX - calTouchStartX;
  const dy = e.touches[0].clientY - calTouchStartY;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  // 阈值 12px，且水平/垂直比例差距足够大才锁定方向，避免斜向误判
  if (adx < 12 && ady < 12) return;
  calTouchMoved = true;
  calTouchDir = adx > ady * 1.2 ? 'h' : (ady > adx * 1.2 ? 'v' : '');
}

function onCalTouchEnd(e) {
  if (!calTouchMoved || calTouchDir === '') return; // 未达到方向判断阈值，视为点击，不触发滑动
  const dx = e.changedTouches[0].clientX - calTouchStartX;
  const dy = e.changedTouches[0].clientY - calTouchStartY;

  if (calTouchDir === 'h' && Math.abs(dx) > 40) {
    // 水平滑动：切周/月
    if (calendarMode.value === 'week') {
      dx < 0 ? nextWeek() : prevWeek();
    } else {
      dx < 0 ? nextMonth() : prevMonth();
    }
  } else if (calTouchDir === 'v') {
    if (calendarMode.value === 'week' && dy > 50) {
      // 周模式下向下拉 → 展开月视图
      expandToMonth();
    } else if (calendarMode.value === 'month' && dy < -50) {
      // 月模式下向上滑 → 折叠回周视图
      collapseToWeek();
    }
  }
}

// ============================================================
// 内容区触摸处理（月模式下在顶部上滑 → 折叠）
// ============================================================

function onContentTouchStart(e) {
  contentTouchStartY = e.touches[0].clientY;
  contentTouchMoved = false;
}

function onContentTouchMove() {
  contentTouchMoved = true;
}

function onContentTouchEnd(e) {
  if (!contentTouchMoved) return;
  const dy = e.changedTouches[0].clientY - contentTouchStartY;
  // 月模式下，内容区在顶部往上滑 → 折叠（阈值 50px，与日历条保持一致）
  if (calendarMode.value === 'month' && dy < -50 && contentScrollTop.value <= 0) {
    collapseToWeek();
  }
}

function onContentScroll(e) {
  contentScrollTop.value = e.detail.scrollTop;
}

// ============================================================
// 展开 / 折叠
// ============================================================

function expandToMonth() {
  // 以当前选中日期所在月展开
  currentMonthFirst.value = getMonthFirst(selectedDate.value || new Date());
  calendarMode.value = 'month';
  // 加载月视图范围的农历
  loadHolidaysForMonth();
}

function collapseToWeek() {
  calendarMode.value = 'week';
  // 周起始对齐当前选中日期
  currentWeekStart.value = getWeekMonday(selectedDate.value || new Date());
  loadHolidays();
}

// ============================================================
// 切周 / 切月
// ============================================================

function prevWeek() {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() - 7);
  currentWeekStart.value = d;
  loadHolidays();
}

function nextWeek() {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 7);
  currentWeekStart.value = d;
  loadHolidays();
}

function prevMonth() {
  const d = new Date(currentMonthFirst.value);
  d.setMonth(d.getMonth() - 1);
  currentMonthFirst.value = getMonthFirst(d);
  loadHolidaysForMonth();
}

function nextMonth() {
  const d = new Date(currentMonthFirst.value);
  d.setMonth(d.getMonth() + 1);
  currentMonthFirst.value = getMonthFirst(d);
  loadHolidaysForMonth();
}

// ============================================================
// 业务方法
// ============================================================

/** 选中某天 */
async function selectDate(dateStr) {
  selectedDate.value = dateStr;
  taskStore.selectedDate = dateStr;
  // 月模式下点击日期后折叠回周，并对齐到该日期所在周
  if (calendarMode.value === 'month') {
    currentWeekStart.value = getWeekMonday(dateStr);
    calendarMode.value = 'week';
    loadHolidays();
  }
  await Promise.all([
    taskStore.fetchTasksByDate(dateStr),
    logStore.fetchLogsByDate(dateStr)
  ]);

  // 从localStorage加载任务并合并（只加载选中日期的任务）
  try {
    const savedTasks = uni.getStorageSync('tasks');
    if (savedTasks) {
      const allLocalTasks = JSON.parse(savedTasks);

      // 筛选出选中日期的任务
      const selectedDateTasks = allLocalTasks.filter(t => {
        const taskDate = t.date || t.occurDate;
        if (!taskDate) return false;

        // 将 yyyy/MM/dd 转换为 yyyy-MM-dd 进行比较
        const normalizedDate = taskDate.replace(/\//g, '-');
        return normalizedDate === dateStr;
      });

      console.log(`[Calendar] selectDate(${dateStr}) - 筛选出该日期的任务:`, selectedDateTasks.length, '个');

      // 合并localStorage的任务到taskStore（避免重复）
      const existingIds = new Set(taskStore.tasks.map(t => t.id));
      const newTasks = selectedDateTasks.filter(t => !existingIds.has(t.id));

      if (newTasks.length > 0) {
        taskStore.tasks = [...taskStore.tasks, ...newTasks];
      }
    }
  } catch (e) {
    console.error('[Calendar] selectDate - 加载localStorage任务失败:', e);
  }
}

/** 回到今天 */
function goToday() {
  calendarMode.value = 'week';
  currentWeekStart.value = getWeekMonday(new Date());
  selectDate(todayStr);
}

/** 获取任务所属象限 */
function getQuadrant(task) {
  if (task.isUrgent && task.isImportant) return 'q1';
  if (!task.isUrgent && task.isImportant) return 'q2';
  if (task.isUrgent && !task.isImportant) return 'q3';
  return 'q4';
}

function quadrantLabel(task) {
  if (task.isUrgent && task.isImportant) return '紧急';
  if (!task.isUrgent && task.isImportant) return '重要';
  if (task.isUrgent && !task.isImportant) return '琐事';
  return '待排';
}

function getTasksAtHour(hour) {
  return filteredTimelineTasks.value.filter(t => {
    if (!t.startTime) return false;
    return parseInt(t.startTime.split(':')[0]) === hour;
  });
}

function formatLogTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function openTask(task) {
  fabOpen.value = false;
  uni.navigateTo({ url: `/pages/calendar/task-edit?id=${task.id}&date=${selectedDate.value}` });
}

/**
 * 四象限视图：点击任务
 * - 有子任务时展开子任务弹窗（38.jpg效果）
 * - 无子任务时跳转编辑页
 */
function openTaskDetail(task) {
  fabOpen.value = false;
  if (task.subtasks && task.subtasks.length > 0) {
    // 有子任务数据：展开弹窗
    subtaskPopup.value = {
      visible: true,
      task,
      subtasks: task.subtasks.map(s => ({ ...s }))
    };
  } else {
    // 无子任务：跳转编辑
    uni.navigateTo({ url: `/pages/calendar/task-edit?id=${task.id}&date=${selectedDate.value}` });
  }
}

/**
 * 四象限视图：直接切换完成状态（不跳转）
 */
async function toggleTaskDone(task) {
async function toggleTaskDone(task) {
  // 访客模式：禁止修改演示数据
  if (userStore.token === 'guest') {
    uni.showToast({ title: '访客模式下无法修改任务，请登录后使用', icon: 'none', duration: 2000 });
    return;
  }

  try {
    await taskStore.toggleDone(task.id, task.status);
    // 若弹窗中父任务被切换，同步弹窗状态
    if (subtaskPopup.value.task && subtaskPopup.value.task.id === task.id) {
      subtaskPopup.value.task = {
        ...subtaskPopup.value.task,
        status: task.status === 'completed' ? 'pending' : 'completed'
      };
    }
  } catch (err) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' });
  }
}

// ============================================================
// 拖拽相关函数
// ============================================================

// H5端鼠标拖拽变量
let mouseDownTask = null;
let mouseDownQuadrant = '';
let mouseDownTimer = null;
let mouseDownX = 0;
let mouseDownY = 0;
let mouseMoved = false;

/**
 * 测试函数是否可用
 */
function testDragFunctions() {
  console.log('[Debug] 测试拖拽函数可用性:', {
    handleTaskMouseDown: typeof handleTaskMouseDown,
    onTaskLongPress: typeof onTaskLongPress,
    onTaskTouchMove: typeof onTaskTouchMove,
    onTaskTouchEnd: typeof onTaskTouchEnd,
  });
}

/**
 * H5端：鼠标按下任务项 (wrapper函数,确保模板可访问)
 */
function handleTaskMouseDown(e, task, quadrant) {
  console.log('[Debug] handleTaskMouseDown被调用:', task.title, quadrant);
  onTaskMouseDown(e, task, quadrant);
}

/**
 * H5端：鼠标按下任务项 (内部实现)
 */
function onTaskMouseDown(e, task, quadrant) {
  // 只处理左键
  if (e.button !== 0) return;

  e.preventDefault();
  e.stopPropagation();

  mouseDownTask = task;
  mouseDownQuadrant = quadrant;
  mouseDownX = e.clientX;
  mouseDownY = e.clientY;
  mouseMoved = false;

  console.log('[Drag] 鼠标按下任务:', task.title, '坐标:', mouseDownX, mouseDownY);

  // 清除之前的定时器
  if (mouseDownTimer) {
    clearTimeout(mouseDownTimer);
  }

  // 500ms后触发长按
  mouseDownTimer = setTimeout(() => {
    if (!mouseMoved && mouseDownTask) {
      console.log('[Drag] 鼠标长按触发:', mouseDownTask.title);
      // 使用保存的坐标创建模拟事件对象
      const fakeEvent = {
        clientX: mouseDownX,
        clientY: mouseDownY,
      };
      startDrag(fakeEvent, mouseDownTask, mouseDownQuadrant);
    }
  }, 500);

  // 监听鼠标移动和松开
  document.addEventListener('mousemove', onTaskMouseMove);
  document.addEventListener('mouseup', onTaskMouseUp);
}

/**
 * H5端：鼠标移动（检测是否移动超过阈值）
 */
function onTaskMouseMove(e) {
  if (!mouseDownTask) return;

  const dx = Math.abs(e.clientX - mouseDownX);
  const dy = Math.abs(e.clientY - mouseDownY);

  // 移动超过5px则取消长按
  if (dx > 5 || dy > 5) {
    if (!mouseMoved) {
      console.log('[Drag] 鼠标移动超过阈值,取消长按. dx:', dx, 'dy:', dy);
    }
    mouseMoved = true;
    if (mouseDownTimer) {
      clearTimeout(mouseDownTimer);
      mouseDownTimer = null;
    }
  }

  // 如果已经开始拖拽，更新拖拽位置
  if (dragState.value.dragging) {
    onTaskTouchMove({
      touches: [{ clientX: e.clientX, clientY: e.clientY }],
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    });
  }
}

/**
 * H5端：鼠标松开
 */
function onTaskMouseUp(e) {
  console.log('[Drag] 鼠标松开. dragging:', dragState.value.dragging);

  // 清除定时器
  if (mouseDownTimer) {
    clearTimeout(mouseDownTimer);
    mouseDownTimer = null;
  }

  // 如果正在拖拽，结束拖拽
  if (dragState.value.dragging) {
    onTaskTouchEnd({
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    });
  }

  // 清除状态
  mouseDownTask = null;
  mouseDownQuadrant = '';
  mouseMoved = false;

  // 移除监听
  document.removeEventListener('mousemove', onTaskMouseMove);
  document.removeEventListener('mouseup', onTaskMouseUp);
}

/**
 * 开始拖拽（通用函数）
 */
function startDrag(e, task, quadrant) {
  const touch = e.touches?.[0] || e.changedTouches?.[0] || e;

  const x = touch.clientX || e.clientX || 0;
  const y = touch.clientY || e.clientY || 0;

  console.log('[Drag] 开始拖拽:', task.title, '象限:', quadrant, '位置:', x, y);

  dragState.value = {
    dragging: true,
    task: task,
    fromQuadrant: quadrant,
    x: x,
    y: y,
    overDelete: false,
    startX: x,
    startY: y,
  };

  console.log('[Drag] dragState已更新:', dragState.value);

  // 震动反馈
  uni.vibrateShort?.({ type: 'medium' });

  // #ifndef H5
  // APP端：获取所有象限和删除区域的位置信息
  updateQuadrantRects();
  // #endif
}

/**
 * 长按任务开始拖拽（触摸端）
 */
function onTaskLongPress(e, task, quadrant) {
  console.log('[Drag] 触摸长按任务:', task.title, 'quadrant:', quadrant);

  // 防止触发点击事件
  e.preventDefault?.();
  e.stopPropagation?.();

  // 调用通用的开始拖拽函数
  startDrag(e, task, quadrant);
}

// #ifndef H5
/**
 * APP端：更新象限位置信息
 */
function updateQuadrantRects() {
  const query = uni.createSelectorQuery();

  query.select('.nb-q1').boundingClientRect();
  query.select('.nb-q2').boundingClientRect();
  query.select('.nb-q3').boundingClientRect();
  query.select('.nb-q4').boundingClientRect();
  query.select('.delete-zone').boundingClientRect();

  query.exec((res) => {
    if (res && res.length === 5) {
      quadrantRects.value = {
        q1: res[0],
        q2: res[1],
        q3: res[2],
        q4: res[3],
        delete: res[4],
      };
      console.log('[Drag] APP端象限位置已更新:', quadrantRects.value);
    }
  });
}
// #endif

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

  // #ifndef H5
  // APP端：使用缓存的位置信息检测
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

  // #ifndef H5
  // APP端：使用缓存的位置信息
  for (const [key, rect] of Object.entries(quadrantRects.value)) {
    if (key === 'delete' || !rect) continue;
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
}

/** 关闭子任务弹窗 */
function closeSubtaskPopup() {
  subtaskPopup.value.visible = false;
  subtaskPopup.value.task = null;
  subtaskPopup.value.subtasks = [];
}

/** 切换弹窗中单个子任务完成状态（本地模拟，实际联调时需调用API） */
function toggleSubtask(sub) {
  // 访客模式：禁止修改演示数据
  if (userStore.token === 'guest') {
    uni.showToast({ title: '访客模式下无法修改任务，请登录后使用', icon: 'none', duration: 2000 });
    return;
  }
  sub.done = !sub.done;
}

/**
 * 根据任务获取象限CSS类名（用于弹窗复选框颜色）
 */
function getQuadrantClass(task) {
  if (!task) return 'q1';
  if (task.isUrgent && task.isImportant) return 'q1';
  if (!task.isUrgent && task.isImportant) return 'q2';
  if (task.isUrgent && !task.isImportant) return 'q3';
  return 'q4';
}

function openCreateTask() {
  fabOpen.value = false;
  // 展开快速新建任务底部面板（替代跳转页面）
  showAddPanel.value = true;
}

/** 任务提交成功后刷新当前日期的任务列表 */
async function onTaskSubmitted() {
  await taskStore.fetchTasksByDate(selectedDate.value);
}

function openCreateLog() {
  fabOpen.value = false;
  uni.navigateTo({ url: `/pages/calendar/log-edit?date=${selectedDate.value}` });
}

function openLog(log) {
  uni.navigateTo({ url: `/pages/calendar/log-edit?id=${log.id}&date=${selectedDate.value}` });
}

async function convertLog(logId) {
  try {
    await logStore.toTask(logId);
    uni.showToast({ title: '已转为任务', icon: 'success' });
    await taskStore.fetchTasksByDate(selectedDate.value);
  } catch (err) {
    uni.showToast({ title: err.message || '转换失败', icon: 'none' });
  }
}

// ============================================================
// 节日农历加载
// ============================================================

/** 加载当前周的节日 + 农历 */
async function loadHolidays() {
  try {
    if (!currentWeekStart.value) return;
    const weekEnd = new Date(currentWeekStart.value);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const start = formatDate(currentWeekStart.value);
    const end = formatDate(weekEnd);
    await _loadHolidayRange(start, end);
  } catch (err) {
    console.warn('[Calendar] 节日农历加载失败:', err);
  }
}

/** 加载当前月（+上下各补位行）的节日 + 农历 */
async function loadHolidaysForMonth() {
  try {
    if (!currentMonthFirst.value) return;
    // 42格的起止范围
    const gridStart = getWeekMonday(currentMonthFirst.value);
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 41);
    await _loadHolidayRange(formatDate(gridStart), formatDate(gridEnd));
  } catch (err) {
    console.warn('[Calendar] 月历农历加载失败:', err);
  }
}

async function _loadHolidayRange(start, end) {
  const [holidayRes, lunarRes] = await Promise.all([
    getHolidaysByRange(start, end),
    getLunarInfoRange(start, end)
  ]);

  // 节日：优先展示法定节假日/节气
  const hMap = holidayRes?.holidayMap || {};
  Object.entries(hMap).forEach(([date, list]) => {
    if (Array.isArray(list) && list.length > 0) {
      const sorted = [...list].sort((a, b) => {
        const order = { public_holiday: 0, solar_term: 1 };
        return (order[a.type] ?? 2) - (order[b.type] ?? 2);
      });
      holidayMap.value[date] = sorted[0].shortName || sorted[0].name;
    }
  });

  // 农历（仅无节日标注时）
  const lMap = lunarRes?.lunarMap || {};
  Object.entries(lMap).forEach(([date, info]) => {
    if (!holidayMap.value[date] && info) {
      holidayMap.value[date] = info.lunarDayName || '';
    }
  });
}

function updateCurrentTime() {
  const now = new Date();
  currentMinutes.value = now.getHours() * 60 + now.getMinutes();
}

// ============================================================
// H5 鼠标模拟触摸（条件编译，仅 H5 端构建时包含）
// ============================================================
// #ifdef H5
/**
 * 把鼠标事件转换为与 touch 事件相同的结构，
 * 复用 onCalTouchStart/Move/End 和 onContentTouchStart/Move/End。
 *
 * 策略：
 * - mousedown 在 calBarEl / contentAreaEl 上时，记录目标并触发对应 TouchStart
 * - mousemove / mouseup 绑定在 document 上，保证鼠标移出元素后仍能触发 End
 * - mouseleave document 视同 mouseup
 */

let _h5MouseTarget = null; // 'cal' | 'content' | null
let _h5Dragging = false;
let _h5RafPending = false;     // rAF 节流标志
let _h5LastMoveX = 0;
let _h5LastMoveY = 0;

function _fakeTouch(clientX, clientY) {
  return { touches: [{ clientX, clientY }], changedTouches: [{ clientX, clientY }] };
}

function _onMouseDown(e) {
  if (e.button !== 0) return; // 只处理左键
  const calEl = calBarRef.value?.$el ?? calBarRef.value;
  const contentEl = contentAreaRef.value?.$el ?? contentAreaRef.value;
  if (calEl && calEl.contains(e.target)) {
    e.preventDefault(); // 阻止文字选中、浏览器默认拖拽
    _h5MouseTarget = 'cal';
    _h5Dragging = true;
    _h5RafPending = false;
    onCalTouchStart(_fakeTouch(e.clientX, e.clientY));
  } else if (contentEl && contentEl.contains(e.target)) {
    _h5MouseTarget = 'content';
    _h5Dragging = true;
    _h5RafPending = false;
    onContentTouchStart(_fakeTouch(e.clientX, e.clientY));
  }
}

function _onMouseMove(e) {
  if (!_h5Dragging) return;
  // 记录最新坐标，用 rAF 节流，避免高频 mousemove 阻塞主线程
  _h5LastMoveX = e.clientX;
  _h5LastMoveY = e.clientY;
  if (_h5RafPending) return;
  _h5RafPending = true;
  requestAnimationFrame(() => {
    _h5RafPending = false;
    if (!_h5Dragging) return;
    if (_h5MouseTarget === 'cal') {
      onCalTouchMove(_fakeTouch(_h5LastMoveX, _h5LastMoveY));
    } else if (_h5MouseTarget === 'content') {
      onContentTouchMove();
    }
  });
}

function _onMouseUp(e) {
  if (!_h5Dragging) return;
  _h5Dragging = false;
  _h5RafPending = false;
  if (_h5MouseTarget === 'cal') {
    onCalTouchEnd(_fakeTouch(e.clientX, e.clientY));
  } else if (_h5MouseTarget === 'content') {
    onContentTouchEnd(_fakeTouch(e.clientX, e.clientY));
  }
  _h5MouseTarget = null;
}

function h5BindMouseEvents() {
  // passive: false 允许 preventDefault 在 mousedown 中生效
  document.addEventListener('mousedown', _onMouseDown, { passive: false });
  document.addEventListener('mousemove', _onMouseMove);
  document.addEventListener('mouseup', _onMouseUp);
  document.addEventListener('mouseleave', _onMouseUp);
}

function h5UnbindMouseEvents() {
  document.removeEventListener('mousedown', _onMouseDown);
  document.removeEventListener('mousemove', _onMouseMove);
  document.removeEventListener('mouseup', _onMouseUp);
  document.removeEventListener('mouseleave', _onMouseUp);
}
// #endif

// ============================================================
// 生命周期
// ============================================================
onMounted(async () => {
  try {
    const info = uni.getSystemInfoSync();
    statusBarHeight.value = info.statusBarHeight || 20;
    tabBarHeight.value = 50;
  } catch (e) {}

  currentWeekStart.value = getWeekMonday(new Date());
  currentMonthFirst.value = getMonthFirst(new Date());
  selectedDate.value = todayStr;
  taskStore.selectedDate = todayStr;

  // 加载规划数据
  planStore.loadPlans();

  // 加载选中的分类
  loadCategorySelection();

  updateCurrentTime();

  // 访客模式：跳过网络请求，使用演示数据
  if (userStore.token === 'guest') {
    // console.log('[Calendar] 访客模式：加载演示数据');
    // 加载演示任务数据（覆盖四象限 + 时间轴）
    taskStore.tasks = [
      {
        id: 1,
        title: '重要紧急示例任务',
        description: '这是一个演示任务，展示重要且紧急象限',
        isUrgent: true,
        isImportant: true,
        status: 'pending',
        isAllDay: true,
        taskDate: todayStr
      },
      {
        id: 2,
        title: '重要不紧急示例',
        description: '规划区任务示例',
        isUrgent: false,
        isImportant: true,
        status: 'pending',
        isAllDay: true,
        taskDate: todayStr
      },
      {
        id: 3,
        title: '紧急不重要（已完成）',
        description: '琐事象限，已完成',
        isUrgent: true,
        isImportant: false,
        status: 'completed',
        isAllDay: true,
        taskDate: todayStr
      },
      {
        id: 4,
        title: '定时任务示例 10:00',
        description: '时间轴视图展示',
        isUrgent: false,
        isImportant: true,
        status: 'pending',
        isAllDay: false,
        startTime: '10:00',
        endTime: '11:00',
        taskDate: todayStr
      },
      {
        id: 5,
        title: '不急不重要示例',
        description: '消遣区任务',
        isUrgent: false,
        isImportant: false,
        status: 'pending',
        isAllDay: true,
        taskDate: todayStr
      }
    ];
    logStore.logs = [];
    holidayMap.value = {};
  } else {
    // 正常登录模式：请求后端
    await Promise.all([
      taskStore.fetchTasksByDate(todayStr),
      logStore.fetchLogsByDate(todayStr),
      loadHolidays()
    ]);
  }

  // 从localStorage加载任务（规划创建的任务），并合并到taskStore
  // 注意：只加载今天的任务，不是所有任务
  try {
    const savedTasks = uni.getStorageSync('tasks');
    if (savedTasks) {
      const allLocalTasks = JSON.parse(savedTasks);
      console.log('[Calendar] 从localStorage加载了', allLocalTasks.length, '个任务');

      // 筛选出今天的任务（日期格式：yyyy/MM/dd）
      const todayLocalTasks = allLocalTasks.filter(t => {
        const taskDate = t.date || t.occurDate;
        if (!taskDate) return false;

        // 将 yyyy/MM/dd 转换为 yyyy-MM-dd 进行比较
        const normalizedDate = taskDate.replace(/\//g, '-');
        return normalizedDate === todayStr;
      });

      console.log('[Calendar] 筛选出今天的任务:', todayLocalTasks.length, '个');

      // 合并localStorage的任务到taskStore（避免重复）
      const existingIds = new Set(taskStore.tasks.map(t => t.id));
      const newTasks = todayLocalTasks.filter(t => !existingIds.has(t.id));

      if (newTasks.length > 0) {
        taskStore.tasks = [...taskStore.tasks, ...newTasks];
        console.log('[Calendar] 合并了', newTasks.length, '个新任务到taskStore');
      }
    }
  } catch (e) {
    console.error('[Calendar] 加载localStorage任务失败:', e);
  }

  timeTimer = setInterval(updateCurrentTime, 60000);

  // #ifdef H5
  h5BindMouseEvents();
  // #endif
});

// ============================================================
// 页面跳转
// ============================================================

/**
 * 打开规划和分类抽屉
 */
function goToPlanningCategory() {
  showCategoryDrawer.value = true;
}

/**
 * 容器变更事件处理
 */
function onContainerChanged(data) {
  // 重新加载容器选中状态
  loadCategorySelection();
}

// ============================================================
// 页面显示生命周期
// ============================================================

/**
 * 加载分类和规划的选中状态
 */
function loadCategorySelection() {
  // 加载用户创建的分类列表
  const savedCategories = uni.getStorageSync('user_categories');
  if (savedCategories) {
    try {
      userCategories.value = JSON.parse(savedCategories);
    } catch (e) {
      console.error('[Calendar] 加载分类列表失败:', e);
      userCategories.value = [];
    }
  } else {
    userCategories.value = [];
  }

  // 加载选中的规划ID
  const savedPlanId = uni.getStorageSync('selected_plan_id');
  if (savedPlanId) {
    selectedPlanId.value = savedPlanId;
    selectedCategoryId.value = ''; // 清除分类选中
    return;
  }

  // 如果没有选中规划，则加载选中的分类ID
  const savedCategoryId = uni.getStorageSync('selected_category_id');
  if (savedCategoryId) {
    selectedCategoryId.value = savedCategoryId;
    selectedPlanId.value = ''; // 清除规划选中
  } else {
    selectedCategoryId.value = 'all'; // 默认为"全部"
    selectedPlanId.value = ''; // 清除规划选中
  }
}

/**
 * 页面显示时触发（从其他页面返回时会触发）
 * 例如：从规划详情页、任务详情页返回
 */
onShow(() => {
  // 首次显示跳过（onMounted 已经加载过数据）
  if (isFirstShow.value) {
    isFirstShow.value = false;
    console.log('[Calendar] onShow - 首次显示，跳过加载');
    return;
  }

  console.log('[Calendar] onShow - 从其他页面返回，重新加载数据');

  // 重新加载分类选择
  loadCategorySelection();

  // 重新加载当前日期的任务（包括 localStorage 任务）
  // 如果 selectedDate 还没初始化，使用今天
  const currentDate = selectedDate.value || formatDate(new Date());
  console.log('[Calendar] onShow - 重新加载日期:', currentDate);
  selectDate(currentDate);
});

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
  // #ifdef H5
  h5UnbindMouseEvents();
  // #endif
});
</script>

<style scoped>
/* ============================================================
   页面容器
   ============================================================ */
.calendar-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F6FA;
  position: relative;
}

.status-bar {
  background-color: #FFFFFF;
  flex-shrink: 0;
}

/* ============================================================
   顶部操作栏
   ============================================================ */
.top-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #FFFFFF;
  padding: 0 32rpx 16rpx;
  flex-shrink: 0;
}

.top-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1A1A2E;
}

.top-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
}

.btn-today {
  font-size: 26rpx;
  color: #5B8CFF;
  border: 2rpx solid #5B8CFF;
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
}

.view-switch {
  display: flex;
  flex-direction: row;
  background-color: #F0F2F5;
  border-radius: 20rpx;
  padding: 4rpx;
}

.view-btn {
  font-size: 24rpx;
  color: #888;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.view-btn.active {
  background-color: #FFFFFF;
  color: #5B8CFF;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

/* ============================================================
   日历条（周/月通用外壳）
   ============================================================ */
.calendar-bar {
  background-color: #FFFFFF;
  padding: 0 16rpx 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  /* 默认周模式高度不限制，由内容撑开 */
  overflow: hidden;
  transition: height 0.3s ease;
  /* 禁止浏览器接管触摸/鼠标滚动，保证手势完整传递给自定义处理器 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

/* ============================================================
   星期头（周一到周日）
   ============================================================ */
.week-header {
  display: flex;
  flex-direction: row;
  padding: 8rpx 0 4rpx;
}

.week-day-name {
  flex: 1;
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

/* ============================================================
   周模式：单行7格
   ============================================================ */
.week-dates {
  display: flex;
  flex-direction: row;
}

/* ============================================================
   月模式：6行×7列
   ============================================================ */
.month-grid {
  display: flex;
  flex-direction: column;
}

.month-row {
  display: flex;
  flex-direction: row;
}

/* ============================================================
   日期格（周/月复用）
   ============================================================ */
.date-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rpx 0;
  position: relative;
  min-width: 0;
}

/* 月模式格子稍矮 */
.month-cell {
  padding: 2rpx 0;
}

.lunar-label {
  font-size: 18rpx;
  color: #aaa;
  height: 24rpx;
  line-height: 24rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding: 0 2rpx;
}

.date-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2rpx 0;
}

/* 月模式稍小 */
.month-cell .date-circle {
  width: 52rpx;
  height: 52rpx;
}

.date-num {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.month-cell .date-num {
  font-size: 28rpx;
}

/* 选中 */
.date-cell.selected .date-circle {
  background-color: #5B8CFF;
}
.date-cell.selected .date-num {
  color: #FFFFFF;
  font-weight: bold;
}

/* 今天（未选中） */
.date-cell.today:not(.selected) .date-circle {
  border: 2rpx dashed #5B8CFF;
}
.date-cell.today:not(.selected) .date-num {
  color: #5B8CFF;
}

/* 非本月（月模式补位日期） */
.date-cell.other-month .date-num {
  color: #CCC;
}
.date-cell.other-month .lunar-label {
  color: #DDD;
}

/* 有任务圆点容器（横排多色点） */
.task-dots {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 4rpx;
  margin-top: 2rpx;
  min-height: 10rpx;
}

.task-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: #5B8CFF;
}

/* 各象限颜色点 */
.dot-q1 { background-color: #FF4444; }
.dot-q2 { background-color: #4F7FFF; }
.dot-q3 { background-color: #FFB300; }
.dot-q4 { background-color: #44AA66; }

/* 月份标签 */
.cal-month-label {
  text-align: center;
  padding: 6rpx 0 2rpx;
}
.cal-month-label text {
  font-size: 22rpx;
  color: #bbb;
}

/* ============================================================
   内容滚动区
   ============================================================ */
.content-area {
  flex: 1;
  overflow: hidden;
}

/* ============================================================
   空状态
   ============================================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.empty-icon { font-size: 100rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 32rpx; color: #999; margin-bottom: 12rpx; }
.empty-hint { font-size: 26rpx; color: #bbb; }

/* ============================================================
   任务项基础样式
   ============================================================ */
.task-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 0 24rpx 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border-left: 8rpx solid #5B8CFF;
}
.task-item.quad-q1 { border-left-color: #FF4444; }
.task-item.quad-q2 { border-left-color: #5B8CFF; }
.task-item.quad-q3 { border-left-color: #FFB300; }
.task-item.quad-q4 { border-left-color: #4CAF50; }
.task-item.done    { border-left-color: #CCC; opacity: 0.7; }

.task-check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid #DDD;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.check-icon { font-size: 24rpx; color: #4CAF50; }

.task-title {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  line-height: 1.4;
}
.task-item.done .task-title { text-decoration: line-through; color: #BBB; }

.task-quad-tag {
  border-radius: 12rpx;
  padding: 4rpx 12rpx;
  margin-left: 16rpx;
}
.task-quad-tag text { font-size: 22rpx; }
.tag-q1 { background-color: #FFE5E5; } .tag-q1 text { color: #FF4444; }
.tag-q2 { background-color: #E8F0FF; } .tag-q2 text { color: #5B8CFF; }
.tag-q3 { background-color: #FFF8E1; } .tag-q3 text { color: #FFB300; }
.tag-q4 { background-color: #E8F5E9; } .tag-q4 text { color: #4CAF50; }

.task-info { flex: 1; display: flex; flex-direction: column; }
.task-time-label { font-size: 24rpx; color: #999; margin-top: 4rpx; }

/* ============================================================
   时间轴视图
   ============================================================ */
.timeline-view { padding-top: 0; }

/* 顶部筛选栏（目标和分类 + 时间轴） */
.tl-top-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx 0;
  background-color: #F5F6FA;
}

/* 目标和分类：丝带/便签 tab 样式 */
.tl-filter-tab {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 8rpx 8rpx 0 0;
  padding: 14rpx 24rpx 14rpx 20rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.08);
  border: 1rpx solid #E8E8E8;
  border-bottom: none;
  min-width: 200rpx;
}
.tl-filter-icon-emoji {
  font-size: 32rpx;
  margin-right: 8rpx;
}
.tl-filter-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  margin-right: 10rpx;
}
.tl-filter-icon {
  font-size: 30rpx;
  color: #555;
}
/* tab右侧衔接条（视觉补丁，让tab和下方内容区无缝衔接） */
.tl-filter-tab-ear {
  display: none;
}

/* 时间轴切换标签 */
.tl-mode-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tl-mode-icon { font-size: 28rpx; color: #555; margin-right: 6rpx; }
.tl-mode-text { font-size: 26rpx; color: #555; }

/* 全天区域 */
.tl-allday-section {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #EFEFEF;
  padding: 8rpx 0;
  min-height: 60rpx;
}

.tl-allday-label {
  width: 80rpx;
  font-size: 24rpx;
  color: #999;
  text-align: center;
  padding-top: 12rpx;
  flex-shrink: 0;
  line-height: 1.4;
}

.tl-allday-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4rpx 16rpx 4rpx 0;
  gap: 6rpx;
}

/* 彩色任务条 */
.tl-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 6rpx;
  padding: 10rpx 16rpx;
  min-height: 52rpx;
}

/* 各象限颜色（未完成：实色填充） */
.tl-bar-q1 { background-color: #FFBCBC; }
.tl-bar-q2 { background-color: #B8C8FF; }
.tl-bar-q3 { background-color: #FFE08A; }
.tl-bar-q4 { background-color: #A8D8B0; }

/* 已完成任务条（淡色） */
.tl-bar-done { opacity: 0.55; }
.tl-bar-done-q1 { background-color: #FFD8D8; }
.tl-bar-done-q2 { background-color: #D4DCFF; }
.tl-bar-done-q3 { background-color: #FFF0C0; }
.tl-bar-done-q4 { background-color: #CCEBD4; }

.tl-bar-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  line-height: 1.4;
}
.tl-bar-text-done {
  text-decoration: line-through;
  color: #999;
}

/* 时间轴区域 */
.timeline-slots { position: relative; background-color: #FFFFFF; }

.time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}
.time-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #FF4444;
  margin-left: 80rpx;
  flex-shrink: 0;
}
.time-line { flex: 1; height: 2rpx; background-color: #FF4444; }

.hour-slot {
  display: flex;
  flex-direction: row;
  min-height: 120rpx;
  border-top: 1rpx solid #F0F0F0;
}
.hour-label {
  width: 80rpx;
  font-size: 22rpx;
  color: #CCC;
  padding-top: 8rpx;
  text-align: center;
  flex-shrink: 0;
}
.hour-content { flex: 1; padding: 6rpx 16rpx 6rpx 0; display: flex; flex-direction: column; gap: 6rpx; }

/* 定时任务条（时间格内） */
.tl-timed-bar {
  border-radius: 6rpx;
  padding: 10rpx 16rpx;
  min-height: 52rpx;
  display: flex;
  align-items: center;
}

.section-title {
  font-size: 26rpx;
  color: #999;
  padding: 8rpx 24rpx 12rpx;
  display: block;
}

/* ============================================================
   日志区域
   ============================================================ */
.log-section { padding: 0 0 24rpx; }
.log-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background-color: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin: 0 24rpx 12rpx;
  border-left: 6rpx solid #9E9E9E;
}
.log-time { font-size: 24rpx; color: #5B8CFF; width: 80rpx; flex-shrink: 0; margin-top: 4rpx; }
.log-content { flex: 1; font-size: 28rpx; color: #555; line-height: 1.5; }
.log-convert {
  font-size: 22rpx;
  color: #5B8CFF;
  padding: 4rpx 8rpx;
  border: 1rpx solid #5B8CFF;
  border-radius: 8rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

/* ============================================================
   四象限视图 - 笔记本风格
   ============================================================ */
.quadrant-view {
  padding: 0 0 120rpx;
}

/* 顶部筛选栏 */
.quad-top-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx 12rpx;
  background-color: #F5F6FA;
}
.quad-filter-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 10rpx 20rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.06);
}
.quad-filter-icon-emoji { font-size: 30rpx; margin-right: 6rpx; }
.quad-filter-text { font-size: 26rpx; color: #333; font-weight: 500; margin-right: 8rpx; }
.quad-filter-icon { font-size: 28rpx; color: #555; }

.quad-mode-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.quad-mode-icon { font-size: 28rpx; color: #555; margin-right: 6rpx; }
.quad-mode-text { font-size: 26rpx; color: #555; }

/* 四象限外层容器 */
.quadrant-grid {
  display: flex;
  flex-direction: column;
  padding: 8rpx 16rpx 16rpx;
}

/* 每行两个卡片 */
.quadrant-row-wrap {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.quadrant-row-wrap .nb-card {
  flex: 1;
  min-width: 0;
}


/* 笔记本卡片 */
.nb-card {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  border: 2rpx solid #E8E8E8;
  overflow: visible;
  position: relative;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  padding-top: 16rpx;
  min-height: 320rpx;
}

/* 笔记本顶部回形针区域 */
.nb-clips {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 0 20rpx;
  margin-bottom: 4rpx;
  position: relative;
  z-index: 2;
}
.nb-clip {
  width: 18rpx;
  height: 28rpx;
  background-color: #C8C8C8;
  border-radius: 6rpx 6rpx 3rpx 3rpx;
  border: 2rpx solid #B0B0B0;
  border-bottom: none;
}

/* 笔记本标题栏（带底部分隔线） */
.nb-title-bar {
  padding: 12rpx 20rpx 10rpx;
  border-bottom: 2rpx solid #E0E0E0;
  text-align: center;
}
.nb-title-text {
  font-size: 24rpx;
  font-weight: bold;
  color: #444;
}

/* 各象限标题栏颜色主题 */
.nb-title-q1 { border-bottom-color: #FFAAAA; }
.nb-title-q1 .nb-title-text { color: #D64444; }

.nb-title-q2 { border-bottom-color: #A8C0FF; }
.nb-title-q2 .nb-title-text { color: #3A6ACB; }

.nb-title-q3 { border-bottom-color: #FFD080; }
.nb-title-q3 .nb-title-text { color: #B87800; }

.nb-title-q4 { border-bottom-color: #90D4A0; }
.nb-title-q4 .nb-title-text { color: #2E8B57; }

/* 象限卡片边框颜色 */
.nb-q1 { border-color: #FFCCCC; }
.nb-q2 { border-color: #C8D8FF; }
.nb-q3 { border-color: #FFE0A0; }
.nb-q4 { border-color: #AADCB4; }

/* 任务内容区 */
.nb-body {
  padding: 12rpx 16rpx 16rpx;
  min-height: 200rpx;
}

/* 空状态 */
.nb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  min-height: 160rpx;
}
.nb-empty-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 4rpx solid #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}
.nb-empty-icon { font-size: 36rpx; opacity: 0.35; }
.nb-empty-tip { font-size: 22rpx; color: #C0C0C0; }

/* 任务行 */
.nb-task-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #F4F4F4;
}
.nb-task-item:last-child { border-bottom: none; }

/* 复选框（各象限颜色） */
.nb-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid #CCC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 10rpx;
  margin-top: 4rpx;
  box-sizing: border-box;
}
.nb-check-q1 { border-color: #FF5555; }
.nb-check-q2 { border-color: #4F7FFF; }
.nb-check-q3 { border-color: #FFB300; }
.nb-check-q4 { border-color: #44AA66; }

/* 已完成：实心填充+勾号 */
.nb-check-done {
  border-color: #CCC;
  background-color: #CCC;
}
.nb-check-mark {
  font-size: 22rpx;
  color: #FFFFFF;
  font-weight: bold;
  line-height: 1;
}

/* 右侧任务内容（带子任务图标） */
.nb-task-right {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.nb-subtask-icon {
  width: 32rpx;
  height: 32rpx;
  background-color: #FFF0F0;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8rpx;
  margin-top: 2rpx;
}
.nb-subtask-icon-text { font-size: 18rpx; color: #FF5555; }

.nb-task-title {
  flex: 1;
  font-size: 26rpx;
  color: #333;
  line-height: 1.45;
}

/* 已完成任务行：灰色+删除线 */
.nb-task-done { opacity: 0.7; }
.nb-task-title-done {
  text-decoration: line-through;
  color: #BBBBBB;
}

/* ============================================================
   子任务弹窗（38.jpg效果）
   ============================================================ */
.subtask-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subtask-popup {
  width: 560rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.2);
}

/* 父任务行 */
.subtask-popup-parent {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 24rpx;
}
.subtask-popup-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #222;
  line-height: 1.4;
  margin-left: 12rpx;
}

/* 子任务列表（左边红线） */
.subtask-list {
  display: flex;
  flex-direction: row;
}
.subtask-left-line {
  width: 4rpx;
  background-color: #FF5555;
  border-radius: 4rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
  min-height: 60rpx;
}
.subtask-items { flex: 1; display: flex; flex-direction: column; }

.subtask-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}
.subtask-item:last-child { border-bottom: none; }

.subtask-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 16rpx;
  box-sizing: border-box;
}
.subtask-check-done {
  background-color: #CCCCCC;
  border-color: #CCCCCC;
}

.subtask-item-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}
.subtask-item-done {
  text-decoration: line-through;
  color: #BBBBBB;
}

/* ============================================================
   已废弃的旧四象限类（保留以防其他视图引用）
   ============================================================ */
.done-section { margin-top: 8rpx; }
.done-title { padding: 8rpx 0 12rpx; }
.done-text { text-decoration: line-through; color: #CCC !important; }

/* ============================================================
   列表视图
   ============================================================ */
.list-view { padding: 16rpx 0; }
.list-empty { text-align: center; padding: 80rpx 0; }

/* ============================================================
   加载状态
   ============================================================ */
.loading-state { display: flex; justify-content: center; padding: 80rpx 0; }
.loading-text { font-size: 28rpx; color: #BBB; }

/* ============================================================
   浮动按钮
   ============================================================ */
.fab-area {
  position: fixed;
  right: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 100;
}
.fab-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.fab-menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 40rpx;
  padding: 16rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.15);
}
.fab-menu-icon { font-size: 36rpx; margin-right: 12rpx; }
.fab-menu-label { font-size: 28rpx; color: #333; }
.fab-btn {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8CFF, #7B5EA7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(91, 140, 255, 0.4);
}
.fab-btn.open {
  background: linear-gradient(135deg, #FF6B6B, #FF4444);
}
.fab-icon { font-size: 60rpx; color: #FFFFFF; line-height: 1; font-weight: 300; }

/* ============================================================
   底部安全区
   ============================================================ */
.bottom-safe { flex-shrink: 0; }
</style>

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

