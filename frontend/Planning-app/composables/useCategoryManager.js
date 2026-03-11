/**
 * useCategoryManager - 分类管理业务逻辑层
 *
 * 职责：封装分类/规划的加载、创建、选择等业务逻辑
 *
 * ⚠️ 架构重构说明(2026-03-10):
 * 从 AddTaskPanel.vue Component层提取到 Composable层
 * 原因：Component不应直接操作localStorage,应由Composable/Repository管理
 *
 * 未来优化方向：
 * - 将localStorage操作移至CategoryRepository(四层架构)
 * - 与后端API集成，支持分类同步
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-10
 * @version 1.0.0
 */

import { ref, computed } from 'vue'
import CategoryRepository from '@/repositories/CategoryRepository'

// ============================================================
// 调试日志工具（2026-03-11新增）
// ============================================================

/**
 * 创建带颜色的控制台日志
 * @param {string} tag - 日志标签
 * @param {string} message - 日志消息
 * @param {any} data - 数据对象
 * @param {string} type - 日志类型 'info' | 'warn' | 'error' | 'success'
 */
function log(tag, message, data = null, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })
  const colors = {
    info: '#3B82F6',    // 蓝色
    warn: '#F59E0B',    // 橙色
    error: '#EF4444',   // 红色
    success: '#10B981'  // 绿色
  }
  const color = colors[type] || colors.info

  console.log(
    `%c[${timestamp}] [${tag}] ${message}`,
    `color: ${color}; font-weight: bold;`,
    data !== null ? data : ''
  )
}

/**
 * 日志分组开始
 */
function logGroup(title) {
  console.group(`%c${title}`, 'color: #8B5CF6; font-size: 14px; font-weight: bold;')
}

/**
 * 日志分组结束
 */
function logGroupEnd() {
  console.groupEnd()
}

/**
 * 分类管理 Composable
 * @returns {Object} 分类管理状态和方法
 */
export function useCategoryManager() {
  // ============================================================
  // 状态
  // ============================================================

  /** 用户分类列表(包含普通分类和规划) */
  const userCategories = ref([])

  /** 选中的分类ID */
  const selectedCategoryId = ref(null)

  // ============================================================
  // 计算属性
  // ============================================================

  /**
   * 获取当前选中分类的图标
   * @param {string} fallbackCategoryId - 备用分类ID(如props传入的categoryId)
   * @returns {string} 图标emoji或首字母
   */
  function getCurrentCategoryIcon(fallbackCategoryId = null) {
    logGroup('📍 getCurrentCategoryIcon 执行追踪')

    log('getCurrentCategoryIcon', '入参 fallbackCategoryId', fallbackCategoryId, 'info')
    log('getCurrentCategoryIcon', '当前 selectedCategoryId.value', selectedCategoryId.value, 'info')
    log('getCurrentCategoryIcon', '当前 userCategories 数量', userCategories.value.length, 'info')

    // 优先使用用户手动选择的分类
    if (selectedCategoryId.value) {
      log('getCurrentCategoryIcon', '✅ 优先路径：使用 selectedCategoryId', selectedCategoryId.value, 'success')
      const category = userCategories.value.find(c => c.id === selectedCategoryId.value)

      if (category) {
        const icon = category.iconEmoji || category.name.charAt(0)
        log('getCurrentCategoryIcon', '找到分类对象', { id: category.id, name: category.name, iconEmoji: category.iconEmoji, icon }, 'success')
        logGroupEnd()
        return icon
      } else {
        log('getCurrentCategoryIcon', '⚠️ selectedCategoryId 指向的分类不存在！返回"无"', { selectedCategoryId: selectedCategoryId.value, userCategories: userCategories.value.map(c => ({ id: c.id, name: c.name })) }, 'warn')
        logGroupEnd()
        return '无'
      }
    }

    // 其次使用备用分类ID(如props传入的categoryId)
    if (fallbackCategoryId) {
      log('getCurrentCategoryIcon', '🔄 备用路径：使用 fallbackCategoryId', fallbackCategoryId, 'info')
      const category = userCategories.value.find(c => c.id === fallbackCategoryId)

      if (category) {
        const icon = category.iconEmoji || category.name.charAt(0)
        log('getCurrentCategoryIcon', '找到备用分类对象', { id: category.id, name: category.name, iconEmoji: category.iconEmoji, icon }, 'success')
        logGroupEnd()
        return icon
      } else {
        log('getCurrentCategoryIcon', '⚠️ fallbackCategoryId 指向的分类不存在！返回"无"', { fallbackCategoryId, userCategories: userCategories.value.map(c => ({ id: c.id, name: c.name })) }, 'warn')
        logGroupEnd()
        return '无'
      }
    }

    // 都没有时显示"无"
    log('getCurrentCategoryIcon', '❌ 两个ID都为空，返回"无"', null, 'info')
    logGroupEnd()
    return '无'
  }

  // ============================================================
  // 业务方法
  // ============================================================

  /**
   * 从CategoryRepository加载用户分类列表
   * ✅ 2026-03-12修复：统一数据源，从CategoryRepository加载（而不是直接从localStorage）
   *
   * 修复原因：
   * - 旧逻辑：从 localStorage: user_categories 加载
   * - 问题：CategoryDrawer创建分类后保存到CategoryRepository，AddTaskPanel读取不到新分类
   * - 新逻辑：统一从CategoryRepository.getAll()加载，确保数据一致性
   */
  function loadCategories() {
    logGroup('📂 loadCategories 执行追踪')

    try {
      // ✅ 从 CategoryRepository 加载（统一数据源）
      const categories = CategoryRepository.getAll()
      userCategories.value = categories

      log('loadCategories', '✅ 从 CategoryRepository 加载分类数据', {
        count: categories.length,
        categories: categories.map(c => ({ id: c.id, name: c.name, iconEmoji: c.iconEmoji, type: c.type }))
      }, 'success')
    } catch (e) {
      console.error('[useCategoryManager] 加载分类失败:', e)
      userCategories.value = []
      log('loadCategories', '❌ 从 CategoryRepository 加载失败', e, 'error')
    }

    logGroupEnd()
  }

  /**
   * 从localStorage加载全局选中的分类ID
   * ⚠️ 未来优化：移至CategoryRepository
   *
   * 规则（2026-03-12修复）：
   * - "all" → 设置为 null（表示"规划和分类"容器，对应图标"无"）
   * - "none" → 设置为 null（表示"无分类"容器，对应图标"无"）
   * - 具体分类ID → 设置为该ID（对应该分类的图标）
   * - 空值 → 设置为 null（默认"无"）
   */
  function loadSelectedCategory() {
    logGroup('📌 loadSelectedCategory 执行追踪')

    const savedCategoryId = uni.getStorageSync('selected_category_id')
    log('loadSelectedCategory', 'localStorage 中的 selected_category_id', savedCategoryId, 'info')

    // 处理特殊值："all"（全部容器） 和 "none"（无分类容器） → 都对应图标"无"
    if (!savedCategoryId || savedCategoryId === 'all' || savedCategoryId === 'none') {
      selectedCategoryId.value = null
      log('loadSelectedCategory', '✅ 容器为"全部"或"无分类"，图标显示"无"', { savedCategoryId }, 'success')
      logGroupEnd()
      return
    }

    // 处理具体分类ID
    selectedCategoryId.value = savedCategoryId
    log('loadSelectedCategory', '✅ 加载选中分类ID', savedCategoryId, 'success')

    // 验证该ID是否存在于分类列表中
    const category = userCategories.value.find(c => c.id === savedCategoryId)
    if (category) {
      log('loadSelectedCategory', '✅ 找到对应分类/规划', {
        id: category.id,
        name: category.name,
        iconEmoji: category.iconEmoji,
        type: category.type
      }, 'success')
    } else {
      log('loadSelectedCategory', '⚠️ 警告：选中的分类ID在分类列表中不存在！将显示"无"图标', {
        savedCategoryId,
        availableCategories: userCategories.value.map(c => ({ id: c.id, name: c.name }))
      }, 'warn')
    }

    logGroupEnd()
  }

  /**
   * 创建新分类
   * @param {Object} data - 分类数据
   * @param {string} data.name - 分类名称
   * @param {string} data.icon - 分类图标
   * @param {string} data.iconEmoji - 分类emoji图标
   * @returns {Object} 创建的分类对象
   *
   * ⚠️ 包含业务规则:
   * - ID生成: Date.now().toString()
   * - 时间戳生成: new Date().toISOString()
   * - 持久化到localStorage
   */
  function createCategory(data) {
    console.log('[useCategoryManager] 创建分类:', data)

    // ⚠️ 业务规则：生成唯一ID (未来应由后端生成或使用UUID)
    const newCategory = {
      id: Date.now().toString(),
      name: data.name,
      icon: data.icon,
      iconEmoji: data.iconEmoji,
      createTime: new Date().toISOString()
    }

    // 添加到分类列表
    userCategories.value.push(newCategory)

    // ⚠️ 持久化到localStorage (未来应由Repository管理)
    try {
      uni.setStorageSync('user_categories', JSON.stringify(userCategories.value))
    } catch (e) {
      console.error('[useCategoryManager] 保存分类失败:', e)
      throw new Error('保存分类失败')
    }

    // 自动选中新创建的分类
    selectedCategoryId.value = newCategory.id

    return newCategory
  }

  /**
   * 选择分类
   * @param {string} categoryId - 分类ID (null表示"无分类")
   */
  function selectCategory(categoryId) {
    logGroup('🎯 selectCategory 执行追踪')

    log('selectCategory', '用户点击选择分类', categoryId, 'info')
    log('selectCategory', '选择前 selectedCategoryId.value', selectedCategoryId.value, 'info')

    selectedCategoryId.value = categoryId

    log('selectCategory', '选择后 selectedCategoryId.value', selectedCategoryId.value, 'success')

    if (categoryId === null) {
      log('selectCategory', '✅ 选择"无分类"', null, 'success')
    } else {
      const category = userCategories.value.find(c => c.id === categoryId)
      if (category) {
        log('selectCategory', '✅ 选择分类成功', {
          id: category.id,
          name: category.name,
          iconEmoji: category.iconEmoji,
          type: category.type
        }, 'success')
      } else {
        log('selectCategory', '⚠️ 警告：选择的分类ID在列表中不存在！', {
          categoryId,
          availableCategories: userCategories.value.map(c => ({ id: c.id, name: c.name }))
        }, 'warn')
      }
    }

    logGroupEnd()
  }

  /**
   * 根据ID获取分类对象
   * @param {string} categoryId - 分类ID
   * @returns {Object|null} 分类对象
   */
  function getCategoryById(categoryId) {
    if (!categoryId) return null
    return userCategories.value.find(c => c.id === categoryId) || null
  }

  /**
   * 重置选中状态
   */
  function resetSelection() {
    selectedCategoryId.value = null
  }

  // ============================================================
  // 返回公开接口
  // ============================================================
  return {
    // 状态
    userCategories,
    selectedCategoryId,

    // 方法
    loadCategories,
    loadSelectedCategory,
    createCategory,
    selectCategory,
    getCategoryById,
    getCurrentCategoryIcon,
    resetSelection
  }
}
