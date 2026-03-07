/**
 * useCalendar - 日历逻辑 Composable
 *
 * 职责:
 * - 日历日期计算 (周视图/月视图)
 * - 日期选择和导航
 * - 周/月视图切换
 * - 农历节日数据管理
 *
 * 使用方式:
 * ```javascript
 * import { useCalendar } from '@/composables/useCalendar'
 *
 * const {
 *   selectedDate,
 *   calendarMode,
 *   currentWeekDates,
 *   monthRows,
 *   selectDate,
 *   goToday,
 *   toggleCalendarMode
 * } = useCalendar()
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-05
 */

import { ref, computed } from 'vue';
import { useTaskStore } from '@/store/task';
import { usePlanStore } from '@/store/plan';
import { usePlanningStore } from '@/store/planning';
import { useLogStore } from '@/store/log';
import { getHolidaysByRange, getLunarInfoRange, getWorkDaysByRange } from '@/api/holiday';

// ============================================================
// 工具函数
// ============================================================

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} YYYY-MM-DD 格式
 */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 获取给定日期所在周的周一
 * JS: getDay() 0=周日 1=周一 ... 6=周六
 * @param {Date|string} date - 日期
 * @returns {Date} 周一的日期对象
 */
function getWeekMonday(date) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=周日
  // 距周一的偏移:周日=-6,周一=0,周二=-1...
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取某月1号
 * @param {Date|string} date - 日期
 * @returns {Date} 该月1号的日期对象
 */
function getMonthFirst(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取任务所属象限
 * @param {object} task - 任务对象
 * @returns {string} 'q1' | 'q2' | 'q3' | 'q4'
 */
function getQuadrant(task) {
  if (task.isUrgent && task.isImportant) return 'q1';
  if (!task.isUrgent && task.isImportant) return 'q2';
  if (task.isUrgent && !task.isImportant) return 'q3';
  return 'q4';
}

// ============================================================
// Composable 主函数
// ============================================================

export function useCalendar() {
  console.log('[useCalendar] ========== Composable 初始化 ==========');

  // ============ Stores ============
  const taskStore = useTaskStore();
  const planStore = usePlanStore();
  const planningStore = usePlanningStore();
  const logStore = useLogStore();

  console.log('[useCalendar] Stores 已获取:', {
    taskStore: !!taskStore,
    planStore: !!planStore,
    planningStore: !!planningStore,
    logStore: !!logStore
  });

  // ============ 状态 ============
  /** 当前选中日期 YYYY-MM-DD */
  const selectedDate = ref('');

  /** 日历模式: 'week' | 'month' */
  const calendarMode = ref('week');

  /** 周模式:当前周的周一 */
  const currentWeekStart = ref(null);

  /** 月模式:当前月的1号(Date对象) */
  const currentMonthFirst = ref(null);

  /** 节日农历缓存 key=YYYY-MM-DD */
  const holidayMap = ref({});
  /** 工作日调整缓存 key=YYYY-MM-DD, value={ type: 'holiday'|'workday', holidayName, remark } */
  const workDayMap = ref({});

  // ============ 常量 ============
  /** 周一到周日 */
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  /** 今天的日期字符串 YYYY-MM-DD */
  const todayStr = formatDate(new Date());

  // ============ 计算属性 ============

  /**
   * 获取某日期的任务标记点(最多2种颜色)
   * 颜色:q1=红 q2=蓝 q3=黄 q4=绿
   */
  function getTaskDots(dateStr) {
    // 获取该日期的所有任务(包括规划任务)
    const planTasks = planStore.getTasksByDate(dateStr);
    const allTasks = [...taskStore.tasks, ...planTasks];

    const dotsSet = new Set();
    allTasks.forEach(t => {
      // 注意:规划任务的date字段已经是YYYY-MM-DD格式
      const taskDate = t.date || t.taskDate || '';
      if (!taskDate.startsWith(dateStr)) return;

      const quadrant = getQuadrant(t);
      dotsSet.add(quadrant);
    });
    // 最多返回2种颜色
    return [...dotsSet].slice(0, 2);
  }

  /**
   * 当前周7天(周一~周日)
   */
  const currentWeekDates = computed(() => {
    console.log('[useCalendar] currentWeekDates 计算属性被调用, currentWeekStart:', currentWeekStart.value);

    if (!currentWeekStart.value) {
      console.log('[useCalendar] currentWeekStart 为空,返回空数组');
      return [];
    }

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart.value);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);

      // 获取该日期的任务（日历显示所有任务，不区分所属容器）
      const dateTasks = taskStore.tasks.filter(t => {
        const taskDate = t.date || t.taskDate || '';
        return taskDate.startsWith(dateStr);
      });

      const hasTask = dateTasks.length > 0;
      return {
        workDay: workDayMap.value[dateStr] || null, // 工作日信息
        dateStr,
        day: d.getDate(),
        lunarLabel: holidayMap.value[dateStr] || '',
        hasTask,
        taskDots: hasTask ? getTaskDots(dateStr) : []
      };
    });
  });

  /**
   * 月模式:42格(6行×7列),以当月1号所在周的周一为起点
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

        // 获取该日期的任务（日历显示所有任务，不区分所属容器）
        const hasTask = taskStore.tasks.some(t => {
          const taskDate = t.date || t.taskDate || '';
          return taskDate.startsWith(dateStr);
        });

        row.push({
          workDay: workDayMap.value[dateStr] || null, // 工作日信息
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

  /**
   * 月份标签(如 2026年2月)
   */
  const currentMonthLabel = computed(() => {
    if (calendarMode.value === 'month' && currentMonthFirst.value) {
      const d = currentMonthFirst.value;
      return `${d.getFullYear()}年${d.getMonth() + 1}月`;
    }
    if (!currentWeekStart.value) return '';
    // 取周中间日(周四)所在月
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() + 3);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  });

  // ============ 节日农历加载 ============

  /**
   * 加载指定日期范围的节日和农历
   * @param {string} start - 开始日期 YYYY-MM-DD
   * @param {string} end - 结束日期 YYYY-MM-DD
   */
  async function _loadHolidayRange(start, end) {
    console.log(`[useCalendar] _loadHolidayRange 开始加载, 范围: ${start} ~ ${end}`);

    try {
      const [holidayRes, lunarRes, workDayRes] = await Promise.all([
        getHolidaysByRange(start, end),
        getLunarInfoRange(start, end),
        getWorkDaysByRange(start, end)
      ]);



      // 节日:按优先级排序（中国节日 > 西方节日 > 节气 > 国际节日）
      const hMap = holidayRes?.holidayMap || {};

      let holidayCount = 0;
      Object.entries(hMap).forEach(([date, list]) => {
        if (Array.isArray(list) && list.length > 0) {
          const sorted = [...list].sort((a, b) => {
            const priority = { cn_solar: 1, cn_lunar: 1, western: 2, solar_term: 3, intl: 4 };
            return (priority[a.type] || 999) - (priority[b.type] || 999);
          });
          holidayMap.value[date] = sorted[0].name;
          holidayCount++;
        } else {
        }
      });


      // 农历:如果该日期无节日,则显示农历
      const lMap = lunarRes?.lunarMap || {};

      let lunarCount = 0;
      Object.entries(lMap).forEach(([date, info]) => {
        if (!holidayMap.value[date]) {
          // 优先显示农历节日,其次显示月日
          holidayMap.value[date] = info.lunarFestival || info.lunarDayName || '';
          lunarCount++;
        }
      });

      // 工作日调整:存储到workDayMap
      const wMap = workDayRes?.workDayMap || {};
      let workDayCount = 0;
      Object.entries(wMap).forEach(([date, info]) => {
        workDayMap.value[date] = info; // { type, holidayName, remark }
        workDayCount++;
      });


    } catch (err) {
      console.error('[useCalendar] _loadHolidayRange 错误:', err);
      throw err;
    }
  }

  /**
   * 加载当前周的节日+农历
   */
  async function loadHolidays() {
    console.log('[useCalendar] loadHolidays 被调用');

    try {
      if (!currentWeekStart.value) {
        console.warn('[useCalendar] loadHolidays 失败: currentWeekStart 为空');
        return;
      }

      const weekEnd = new Date(currentWeekStart.value);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const start = formatDate(currentWeekStart.value);
      const end = formatDate(weekEnd);

      console.log('[useCalendar] loadHolidays 即将加载节日范围:', start, '~', end);
      await _loadHolidayRange(start, end);
      console.log('[useCalendar] loadHolidays 完成');
    } catch (err) {
      console.error('[useCalendar] 节日农历加载失败:', err);
    }
  }

  /**
   * 加载当前月(+上下各补位行)的节日+农历
   */
  async function loadHolidaysForMonth() {
    try {
      if (!currentMonthFirst.value) return;
      // 42格的起止范围
      const gridStart = getWeekMonday(currentMonthFirst.value);
      const gridEnd = new Date(gridStart);
      gridEnd.setDate(gridStart.getDate() + 41);
      await _loadHolidayRange(formatDate(gridStart), formatDate(gridEnd));
    } catch (err) {
      console.warn('[useCalendar] 月历农历加载失败:', err);
    }
  }

  // ============ 导航方法 ============

  /**
   * 上一周
   */
  function prevWeek() {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() - 7);
    currentWeekStart.value = d;
    loadHolidays();
  }

  /**
   * 下一周
   */
  function nextWeek() {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() + 7);
    currentWeekStart.value = d;
    loadHolidays();
  }

  /**
   * 上一月
   */
  function prevMonth() {
    const d = new Date(currentMonthFirst.value);
    d.setMonth(d.getMonth() - 1);
    currentMonthFirst.value = getMonthFirst(d);
    loadHolidaysForMonth();
  }

  /**
   * 下一月
   */
  function nextMonth() {
    const d = new Date(currentMonthFirst.value);
    d.setMonth(d.getMonth() + 1);
    currentMonthFirst.value = getMonthFirst(d);
    loadHolidaysForMonth();
  }

  /**
   * 展开为月视图
   */
  function expandToMonth() {
    // 以当前选中日期所在月展开
    currentMonthFirst.value = getMonthFirst(selectedDate.value || new Date());
    calendarMode.value = 'month';
    // 加载月视图范围的农历
    loadHolidaysForMonth();
  }

  /**
   * 折叠回周视图
   */
  function collapseToWeek() {
    calendarMode.value = 'week';
    // 周起始对齐当前选中日期
    currentWeekStart.value = getWeekMonday(selectedDate.value || new Date());
    loadHolidays();
  }

  /**
   * 切换日历模式
   */
  function toggleCalendarMode() {
    if (calendarMode.value === 'week') {
      expandToMonth();
    } else {
      collapseToWeek();
    }
  }

  // ============ 日期选择 ============

  /**
   * 选中某天
   * @param {string} dateStr - YYYY-MM-DD 格式
   */
  async function selectDate(dateStr) {
    console.log(`[useCalendar] selectDate 被调用, 日期: ${dateStr}`);

    selectedDate.value = dateStr;
    taskStore.selectedDate = dateStr;

    console.log('[useCalendar] selectDate - 已更新 selectedDate 和 taskStore.selectedDate');

    // 月模式下点击日期后折叠回周,并对齐到该日期所在周
    if (calendarMode.value === 'month') {
      currentWeekStart.value = getWeekMonday(dateStr);
      calendarMode.value = 'week';
      loadHolidays();
    }

    await Promise.all([
      taskStore.fetchTasksByDate(dateStr),
      logStore.fetchLogsByDate(dateStr)
    ]);

    // 从localStorage加载任务并合并(只加载选中日期的任务)
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

        console.log(`[useCalendar] selectDate(${dateStr}) - 筛选出该日期的任务:`, selectedDateTasks.length, '个');

        // 合并localStorage的任务到taskStore(避免重复)
        const existingIds = new Set(taskStore.tasks.map(t => t.id));
        const newTasks = selectedDateTasks.filter(t => !existingIds.has(t.id));

        if (newTasks.length > 0) {
          taskStore.tasks = [...taskStore.tasks, ...newTasks];
        }
      }
    } catch (e) {
      console.error('[useCalendar] selectDate - 加载localStorage任务失败:', e);
    }
  }

  /**
   * 回到今天
   */
  function goToday() {
    calendarMode.value = 'week';
    currentWeekStart.value = getWeekMonday(new Date());
    selectDate(todayStr);
  }

  /**
   * 初始化日历(应在组件挂载时调用)
   */
  function init() {
    console.log('[useCalendar] ========== init 初始化开始 ==========');

    // 初始化为当前周
    currentWeekStart.value = getWeekMonday(new Date());
    currentMonthFirst.value = getMonthFirst(new Date());

    console.log('[useCalendar] init - 已初始化周/月起始:', {
      currentWeekStart: currentWeekStart.value,
      currentMonthFirst: currentMonthFirst.value,
      todayStr
    });

    // 选中今天
    selectDate(todayStr);

    // 加载节日数据
    loadHolidays();

    console.log('[useCalendar] ========== init 初始化完成 ==========');
  }

  // ============ 返回 API ============
  return {
    // 状态
    selectedDate,
    calendarMode,
    currentWeekStart,
    currentMonthFirst,
    holidayMap,

    // 常量
    weekDays,
    todayStr,

    // 计算属性
    currentWeekDates,
    monthRows,
    currentMonthLabel,

    // 导航方法
    prevWeek,
    nextWeek,
    prevMonth,
    nextMonth,
    expandToMonth,
    collapseToWeek,
    toggleCalendarMode,

    // 日期选择
    selectDate,
    goToday,

    // 初始化
    init,

    // 节日加载（修复：index.vue onMounted 中需要调用此方法）
    loadHolidays,
    loadHolidaysForMonth
  };
}
