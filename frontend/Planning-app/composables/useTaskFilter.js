/**
 * useTaskFilter - 任务过滤 Composable
 *
 * 职责：
 * - 根据选中的容器（分类/规划）过滤任务列表
 * - 提供容器名称和图标的计算逻辑
 * - 管理容器选择状态（selectedContainer）
 *
 * 使用场景：
 * - 主页面（index.vue）根据选中的分类/规划过滤任务
 * - 支持"全部"、"无分类"、具体分类、具体规划的过滤
 *
 * 创建时间：2026-03-11
 * 参考来源：index.vue.backup-20260307 (1015-1052行)
 */

import { ref, computed } from 'vue';
import { useCategoryStore } from '@/store/category';
// ⭐ 架构统一：规划现在存储在 CategoryRepository（type='plan'），不再需要 usePlanStore
// import { usePlanStore } from '@/store/plan';

/**
 * 任务过滤 Composable
 * @returns {object} 过滤相关的状态和方法
 */
export function useTaskFilter() {
  // ============================================================
  // Store
  // ============================================================
  const categoryStore = useCategoryStore();
  // ⭐ 架构统一：规划现在存储在 CategoryRepository（type='plan'）
  // const planStore = usePlanStore();

  // ============================================================
  // 状态变量
  // ============================================================

  /**
   * 当前选中的容器
   * @type {Ref<{type: string, id: string}>}
   * type: 'category' | 'plan'
   * id: 'all' | 'none' | categoryId | planId
   */
  const selectedContainer = ref({
    type: 'category',
    id: 'all'
  });

  // ============================================================
  // 计算属性
  // ============================================================

  /**
   * 获取当前选中容器的显示名称
   *
   * 规则：
   * - id === 'all' → '规划和分类'
   * - id === 'none' → '无分类'
   * - 其他 → 从 categoryStore.categories 查找（包括规划type='plan'和普通分类）
   */
  const containerName = computed(() => {
    const { type, id } = selectedContainer.value;

    if (id === 'all') {
      return '规划和分类';
    }

    if (id === 'none') {
      return '无分类';
    }

    // ⭐ 架构统一：规划和分类都存储在 categoryStore.categories
    // 规划是 type='plan'，普通分类是 type='category'
    const item = categoryStore.categories.find(cat => cat.id === id);
    if (item) {
      return item.title || item.name;
    }

    // 找不到，返回默认值
    return '规划和分类';
  });

  /**
   * 获取当前选中容器的图标 emoji
   *
   * 规则：
   * - 'all' 和 'none' → 空字符串（不显示图标）
   * - 其他 → 从 categoryStore.categories 查找 iconEmoji（包括规划type='plan'和普通分类）
   */
  const containerIcon = computed(() => {
    const { type, id } = selectedContainer.value;

    // "全部"和"无分类"不显示图标
    if (id === 'all' || id === 'none') {
      return '';
    }

    // ⭐ 架构统一：规划和分类都存储在 categoryStore.categories
    const item = categoryStore.categories.find(cat => cat.id === id);
    if (item) {
      return item.iconEmoji || item.icon || '';
    }

    return '';
  });

  // ============================================================
  // 核心方法
  // ============================================================

  /**
   * 根据选中的容器（规划或分类）过滤任务
   *
   * 过滤规则：
   * 1. 如果选中了规划 → 只显示该规划下的任务 (fromPlan=true && planId=选中ID)
   * 2. 如果选中"全部" → 显示所有任务
   * 3. 如果选中"无分类" → 只显示无分类且无规划的任务
   * 4. 如果选中某个分类 → 只显示该分类下的任务（不包括规划任务）
   *
   * @param {Array} tasks - 待过滤的任务列表
   * @returns {Array} 过滤后的任务列表
   */
  function filterTasks(tasks) {
    const { type, id } = selectedContainer.value;

    // 规则1：如果选中了规划，只显示该规划下的任务
    if (type === 'plan' && id !== 'all' && id !== 'none') {
      // ⚠️ 注意：规划任务有 fromPlan=true 标记
      return tasks.filter(t => t.fromPlan && t.planId === id);
    }

    // 规则2：如果选中"全部"，显示所有任务
    if (id === 'all') {
      return tasks;
    }

    // 规则3：如果选中"无分类"，只显示无分类且无规划的任务
    if (id === 'none') {
      return tasks.filter(t => !t.categoryId && !t.fromPlan);
    }

    // 规则4：如果选中某个分类，只显示该分类下的任务（不包括规划任务）
    if (type === 'category' && id) {
      return tasks.filter(t => t.categoryId === id && !t.fromPlan);
    }

    // 默认：显示所有任务
    return tasks;
  }

  /**
   * 设置选中的容器
   *
   * @param {object} container - 容器信息 { type, id }
   */
  function setSelectedContainer(container) {
    if (container && container.id) {
      selectedContainer.value = {
        type: container.type || 'category',
        id: container.id
      };

      // 保存到 localStorage
      try {
        uni.setStorageSync('selected_container', JSON.stringify(selectedContainer.value));
        console.log('[useTaskFilter] 容器已保存:', selectedContainer.value);
      } catch (e) {
        console.error('[useTaskFilter] 保存容器失败:', e);
      }
    } else {
      // 重置为"全部"
      selectedContainer.value = {
        type: 'category',
        id: 'all'
      };
      uni.removeStorageSync('selected_container');
    }
  }

  /**
   * 从 localStorage 恢复选中的容器
   */
  function restoreSelectedContainer() {
    try {
      const saved = uni.getStorageSync('selected_container');
      if (saved) {
        const parsed = JSON.parse(saved);
        selectedContainer.value = {
          type: parsed.type || 'category',
          id: parsed.id || 'all'
        };
        console.log('[useTaskFilter] 容器已恢复:', selectedContainer.value);
      } else {
        console.log('[useTaskFilter] 无保存的容器，使用默认值');
      }
    } catch (e) {
      console.error('[useTaskFilter] 恢复容器失败:', e);
      selectedContainer.value = {
        type: 'category',
        id: 'all'
      };
    }
  }

  /**
   * 重置为"全部"
   */
  function resetContainer() {
    setSelectedContainer({ type: 'category', id: 'all' });
  }

  // ============================================================
  // 返回公开接口
  // ============================================================
  return {
    // 状态
    selectedContainer,

    // 计算属性
    containerName,
    containerIcon,

    // 方法
    filterTasks,
    setSelectedContainer,
    restoreSelectedContainer,
    resetContainer
  };
}
