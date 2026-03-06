/**
 * useDragDrop - 拖拽逻辑 Composable
 *
 * 职责:
 * - 统一管理拖拽状态机 (idle → dragging → dropping)
 * - 跨端拖拽适配 (H5鼠标 + App触摸)
 * - 长按检测 (500ms)
 * - 象限位置检测
 * - 删除区域检测
 *
 * 设计思想:
 * - 使用适配器模式处理平台差异
 * - 统一的状态机,不同的事件源
 * - 分离业务逻辑和UI操作
 *
 * 使用方式:
 * ```javascript
 * import { useDragDrop } from '@/composables/useDragDrop'
 *
 * const {
 *   dragState,
 *   startDrag,
 *   onTaskTouchMove,
 *   onTaskTouchEnd,
 *   handleTaskMouseDown // H5专用
 * } = useDragDrop({
 *   onDragEnd: async (task, fromQuadrant, toQuadrant) => {
 *     // 处理拖拽结束逻辑
 *   }
 * })
 * ```
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-05
 */

import { ref, reactive } from 'vue';

// ============================================================
// 常量配置
// ============================================================

/** 长按触发时间 (毫秒) */
const LONG_PRESS_DELAY = 500;

/** 拖拽移动阈值 (像素) */
const DRAG_THRESHOLD = 5;

// ============================================================
// Composable 主函数
// ============================================================

export function useDragDrop(options = {}) {
  console.log('[useDragDrop] ========== Composable 初始化 ==========');

  const {
    onDragEnd = () => {},
    onDragCancel = () => {}
  } = options;

  console.log('[useDragDrop] 回调函数已接收:', {
    hasOnDragEnd: typeof onDragEnd === 'function',
    hasOnDragCancel: typeof onDragCancel === 'function'
  });

  // ============ 状态 ============

  /** 拖拽状态 */
  const dragState = ref({
    dragging: false,      // 是否正在拖拽
    task: null,          // 被拖拽的任务对象
    fromQuadrant: '',    // 来源象限 q1/q2/q3/q4
    x: 0,               // 拖拽位置X
    y: 0,               // 拖拽位置Y
    overDelete: false,  // 是否悬停在删除区域上方
    startX: 0,          // 起始触摸X
    startY: 0           // 起始触摸Y
  });

  /** 长按任务ID (用于显示按下效果) */
  const pressedTaskId = ref(null);

  /** APP端象限位置缓存 */
  const quadrantRects = ref({
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    delete: null
  });

  // ============ H5鼠标拖拽变量 ============
  // #ifdef H5
  let mouseDownTask = null;
  let mouseDownQuadrant = '';
  let mouseDownTimer = null;
  let mouseDownX = 0;
  let mouseDownY = 0;
  let mouseMoved = false;
  // #endif

  // ============ 拖拽核心方法 ============

  /**
   * 开始拖拽 (通用函数)
   * @param {object} e - 事件对象
   * @param {object} task - 任务对象
   * @param {string} quadrant - 来源象限 q1/q2/q3/q4
   */
  function startDrag(e, task, quadrant) {
    console.log('[useDragDrop] startDrag 被调用, 任务:', task?.title, ', 象限:', quadrant);

    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    const x = touch.clientX || e.clientX || 0;
    const y = touch.clientY || e.clientY || 0;

    console.log('[useDragDrop] startDrag - 起始坐标:', { x, y });

    dragState.value = {
      dragging: true,
      task: task,
      fromQuadrant: quadrant,
      x: x,
      y: y,
      overDelete: false,
      startX: x,
      startY: y
    };

    console.log('[useDragDrop] startDrag - dragState 已更新:', dragState.value);

    // 震动反馈
    uni.vibrateShort?.({ type: 'medium' });

    // #ifndef H5
    // APP端:获取所有象限和删除区域的位置信息
    updateQuadrantRects();
    // #endif
  }

  /**
   * 长按任务开始拖拽 (触摸端)
   * @param {object} e - 触摸事件
   * @param {object} task - 任务对象
   * @param {string} quadrant - 来源象限
   */
  function onTaskLongPress(e, task, quadrant) {
    console.log('[useDragDrop] onTaskLongPress 被触发, 任务:', task?.title);

    // 防止触发点击事件
    e.preventDefault?.();
    e.stopPropagation?.();

    // 调用通用的开始拖拽函数
    startDrag(e, task, quadrant);
  }

  // #ifndef H5
  /**
   * APP端:更新象限位置信息
   */
  function updateQuadrantRects() {
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
  }
  // #endif

  /**
   * 拖拽移动
   * @param {object} e - 触摸/鼠标事件
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
    // #endif
  }

  /**
   * 拖拽结束
   * @param {object} e - 触摸/鼠标事件
   */
  function onTaskTouchEnd(e) {
    console.log('[useDragDrop] onTaskTouchEnd 被调用, dragging:', dragState.value.dragging);

    if (!dragState.value.dragging) return;

    e.preventDefault?.();
    e.stopPropagation?.();

    const { task, fromQuadrant, overDelete, x, y } = dragState.value;

    console.log('[useDragDrop] onTaskTouchEnd - 状态:', {
      task: task?.title,
      fromQuadrant,
      overDelete,
      position: { x, y }
    });

    // 重置拖拽状态
    dragState.value.dragging = false;

    // 如果在删除区域上方,返回标识让调用方显示删除对话框
    if (overDelete) {
      console.log('[useDragDrop] onTaskTouchEnd - 检测到在删除区域,触发删除');
      onDragEnd(task, fromQuadrant, null, { shouldDelete: true });
      return;
    }

    // 检测拖拽到哪个象限
    const target = detectQuadrantAtPosition(x, y);
    console.log('[useDragDrop] onTaskTouchEnd - 检测到目标象限:', target);

    if (target && target !== fromQuadrant) {
      // 通知调用方处理象限变更
      console.log('[useDragDrop] onTaskTouchEnd - 触发象限变更:', fromQuadrant, '→', target);
      onDragEnd(task, fromQuadrant, target, { shouldDelete: false });
    } else {
      // 未移动或回到原象限,取消拖拽
      console.log('[useDragDrop] onTaskTouchEnd - 无效移动,取消拖拽');
      onDragCancel();
    }
  }

  /**
   * 检测坐标位置对应的象限
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {string|null} 'q1' | 'q2' | 'q3' | 'q4' | null
   */
  function detectQuadrantAtPosition(x, y) {
    console.log('[useDragDrop] 🎯 detectQuadrantAtPosition - 检测坐标:', x, y);

    // #ifdef H5
    const quadrants = {
      q1: document.querySelector?.('.quadrant-q1'),
      q2: document.querySelector?.('.quadrant-q2'),
      q3: document.querySelector?.('.quadrant-q3'),
      q4: document.querySelector?.('.quadrant-q4')
    };

    console.log('[useDragDrop] 🎯 H5环境 - 查询象限元素:');
    for (const [key, el] of Object.entries(quadrants)) {
      console.log('[useDragDrop] 🎯   ', key, ':', el ? '✅ 找到' : '❌ 未找到');
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      console.log('[useDragDrop] 🎯   ', key, 'rect:', {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      });
      console.log('[useDragDrop] 🎯   ', key, '坐标检测:', {
        xInRange: x >= rect.left && x <= rect.right,
        yInRange: y >= rect.top && y <= rect.bottom
      });
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        console.log('[useDragDrop] 🎯 ✅ 检测到在', key, '象限内');
        return key;
      }
    }
    console.log('[useDragDrop] 🎯 ❌ 未检测到任何象限');
    // #endif

    // #ifndef H5
    // APP端:使用缓存的位置信息
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
   * 取消拖拽
   */
  function cancelDrag() {
    dragState.value.dragging = false;
    dragState.value.task = null;
    dragState.value.fromQuadrant = '';
    pressedTaskId.value = null;
  }

  // ============ H5鼠标模拟触摸 ============
  // #ifdef H5

  /**
   * H5端:鼠标按下任务项 (wrapper函数,确保模板可访问)
   * @param {MouseEvent} e - 鼠标事件
   * @param {object} task - 任务对象
   * @param {string} quadrant - 来源象限
   */
  function handleTaskMouseDown(e, task, quadrant) {
    onTaskMouseDown(e, task, quadrant);
  }

  /**
   * H5端:鼠标按下任务项 (内部实现)
   */
  function onTaskMouseDown(e, task, quadrant) {
    console.log('[useDragDrop] 🖱️ onTaskMouseDown 被调用');
    console.log('[useDragDrop] 🖱️ e.button:', e.button, '(0=左键, 1=中键, 2=右键)');
    console.log('[useDragDrop] 🖱️ 任务:', task?.title);
    console.log('[useDragDrop] 🖱️ 象限:', quadrant);
    console.log('[useDragDrop] 🖱️ 鼠标坐标:', e.clientX, e.clientY);

    // 只处理左键（注意：UniApp H5中e.button可能是undefined，这种情况也视为左键）
    if (e.button !== undefined && e.button !== 0) {
      console.log('[useDragDrop] ⚠️ 不是左键（button=' + e.button + '），忽略');
      return;
    }

    console.log('[useDragDrop] ✅ 左键检测通过（button=' + e.button + '）');

    e.preventDefault?.();
    e.stopPropagation?.();

    mouseDownTask = task;
    mouseDownQuadrant = quadrant;
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    mouseMoved = false;

    console.log('[useDragDrop] 🖱️ 已保存鼠标按下状态');
    console.log('[useDragDrop] 🖱️ mouseDownTask:', mouseDownTask?.title);
    console.log('[useDragDrop] 🖱️ mouseDownQuadrant:', mouseDownQuadrant);

    // 清除之前的定时器
    if (mouseDownTimer) {
      console.log('[useDragDrop] 🖱️ 清除之前的定时器');
      clearTimeout(mouseDownTimer);
    }

    // 500ms后触发长按
    console.log('[useDragDrop] ⏰ 启动长按检测定时器 (500ms)');
    mouseDownTimer = setTimeout(() => {
      console.log('[useDragDrop] ⏰ 长按定时器触发！');
      console.log('[useDragDrop] ⏰ mouseMoved:', mouseMoved);
      console.log('[useDragDrop] ⏰ mouseDownTask:', mouseDownTask?.title);

      if (!mouseMoved && mouseDownTask) {
        console.log('[useDragDrop] ✅ 长按成功！准备开始拖拽');
        // 使用保存的坐标创建模拟事件对象
        const fakeEvent = {
          clientX: mouseDownX,
          clientY: mouseDownY
        };
        console.log('[useDragDrop] 📍 调用 startDrag，坐标:', mouseDownX, mouseDownY);
        startDrag(fakeEvent, mouseDownTask, mouseDownQuadrant);
      } else {
        console.log('[useDragDrop] ❌ 长按失败：mouseMoved=', mouseMoved, ', mouseDownTask=', mouseDownTask?.title);
      }
    }, LONG_PRESS_DELAY);

    console.log('[useDragDrop] 🖱️ 开始监听 mousemove 和 mouseup 事件');
    // 监听鼠标移动和松开
    document.addEventListener('mousemove', onTaskMouseMove);
    document.addEventListener('mouseup', onTaskMouseUp);
  }

  /**
   * H5端:鼠标移动 (检测是否移动超过阈值)
   */
  function onTaskMouseMove(e) {
    if (!mouseDownTask) {
      console.log('[useDragDrop] 🖱️ onTaskMouseMove: mouseDownTask为空，忽略');
      return;
    }

    const dx = Math.abs(e.clientX - mouseDownX);
    const dy = Math.abs(e.clientY - mouseDownY);

    console.log('[useDragDrop] 🖱️ onTaskMouseMove: 移动距离 dx=', dx, ', dy=', dy, ', 阈值=', DRAG_THRESHOLD);

    // 移动超过阈值则取消长按
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      if (!mouseMoved) {
        console.log('[useDragDrop] 🖱️ 检测到移动超过阈值，取消长按定时器');
        mouseMoved = true;
      }
      if (mouseDownTimer) {
        clearTimeout(mouseDownTimer);
        mouseDownTimer = null;
      }
    }

    // 如果已经开始拖拽,更新拖拽位置
    if (dragState.value.dragging) {
      console.log('[useDragDrop] 🖱️ 已在拖拽中，更新位置:', e.clientX, e.clientY);
      onTaskTouchMove({
        touches: [{ clientX: e.clientX, clientY: e.clientY }],
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
      });
    }
  }

  /**
   * H5端:鼠标松开
   */
  function onTaskMouseUp(e) {
    console.log('[useDragDrop] 🖱️ onTaskMouseUp 被调用');
    console.log('[useDragDrop] 🖱️ dragState.dragging:', dragState.value.dragging);
    console.log('[useDragDrop] 🖱️ mouseMoved:', mouseMoved);
    console.log('[useDragDrop] 🖱️ mouseDownTimer:', mouseDownTimer ? '存在' : 'null');

    // 清除定时器
    if (mouseDownTimer) {
      console.log('[useDragDrop] 🖱️ 清除长按定时器（用户提前松开）');
      clearTimeout(mouseDownTimer);
      mouseDownTimer = null;
    }

    // 如果正在拖拽,结束拖拽
    if (dragState.value.dragging) {
      console.log('[useDragDrop] 🖱️ 正在拖拽中，调用 onTaskTouchEnd 结束拖拽');
      onTaskTouchEnd({
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
      });
    } else {
      console.log('[useDragDrop] 🖱️ 未进入拖拽状态，直接清理');
    }

    // 清除状态
    console.log('[useDragDrop] 🖱️ 清除鼠标按下状态');
    mouseDownTask = null;
    mouseDownQuadrant = '';
    mouseMoved = false;

    // 移除监听
    console.log('[useDragDrop] 🖱️ 移除 mousemove 和 mouseup 监听');
    document.removeEventListener('mousemove', onTaskMouseMove);
    document.removeEventListener('mouseup', onTaskMouseUp);
  }

  // #endif

  // ============ 返回 API ============
  return {
    // 状态
    dragState,
    pressedTaskId,
    quadrantRects,

    // 拖拽方法
    startDrag,
    onTaskLongPress,
    onTaskTouchMove,
    onTaskTouchEnd,
    cancelDrag,

    // H5专用方法
    // #ifdef H5
    handleTaskMouseDown
    // #endif
  };
}
