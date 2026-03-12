/**
 * 模板状态管理（Template Store）
 *
 * 职责：
 * - 管理全局模板状态（templates 数组、currentTemplate）
 * - 调用 TemplateRepository 进行数据操作
 * - 提供计算属性和 actions
 *
 * 架构层级：
 * Component → Composable → Store（本层）→ Repository → API
 *
 * 数据流：
 * - 读取：Store.hydrate() → Repository.hydrate() → localStorage → memoryCache
 * - 写入：Store.createTemplate() → Repository.create() → memoryCache → localStorage
 *
 * 创建时间：2026-03-12
 * 创建原因：SRP 重构 Stage 3 - 状态管理层，符合四层架构
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { templateRepository } from '@/repositories/TemplateRepository'

export const useTemplateStore = defineStore('template', () => {
  // ============================================================
  // 1. 状态（State）
  // ============================================================

  /**
   * 所有模板列表
   * @type {Ref<Array<object>>}
   */
  const templates = ref([])

  /**
   * 当前选中的模板（用于详情页）
   * @type {Ref<object|null>}
   */
  const currentTemplate = ref(null)

  /**
   * 是否已初始化（hydrate 是否已调用）
   * @type {Ref<boolean>}
   */
  const isHydrated = ref(false)

  /**
   * 加载状态
   * @type {Ref<boolean>}
   */
  const isLoading = ref(false)

  // ============================================================
  // 2. 计算属性（Getters）
  // ============================================================

  /**
   * 未删除的模板列表（过滤软删除）
   */
  const activeTemplates = computed(() => {
    return templates.value.filter((template) => !template.deletedAt)
  })

  /**
   * 模板总数
   */
  const totalCount = computed(() => {
    return activeTemplates.value.length
  })

  /**
   * 按 ID 查找模板
   * @param {string} id - 模板 ID
   * @returns {object|undefined} 模板对象
   */
  const getTemplateById = computed(() => {
    return (id) => {
      return templates.value.find((template) => template.id === id)
    }
  })

  // ============================================================
  // 3. Actions（业务方法）
  // ============================================================

  /**
   * 启动时加载数据（从 Repository）
   * 必须在 App.vue onLaunch 时调用
   *
   * @returns {Promise<void>}
   */
  async function hydrate() {
    if (isHydrated.value) {
      console.log('[TemplateStore] 已初始化，跳过重复 hydrate')
      return
    }

    console.log('[TemplateStore] 开始 hydrate：从 Repository 加载数据')
    isLoading.value = true

    try {
      // 调用 Repository 加载数据
      await templateRepository.hydrate()

      // 从 Repository 获取所有模板
      templates.value = templateRepository.getAll()

      isHydrated.value = true
      console.log(`[TemplateStore] hydrate 完成：加载了 ${templates.value.length} 个模板`)
    } catch (error) {
      console.error('[TemplateStore] hydrate 失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 按 ID 加载单个模板（设置为 currentTemplate）
   *
   * @param {string} id - 模板 ID
   * @returns {Promise<object|null>} 模板对象
   */
  async function loadTemplateById(id) {
    console.log(`[TemplateStore] 🔍 开始加载模板: ${id}`)
    console.log('[TemplateStore] Store isHydrated 状态:', isHydrated.value)
    console.log('[TemplateStore] 当前 templates 数量:', templates.value.length)

    if (!isHydrated.value) {
      console.warn('[TemplateStore] ⚠️ Store 未初始化，先执行 hydrate')
      await hydrate()
    }

    console.log(`[TemplateStore] 调用 templateRepository.getById(${id})`)
    const template = templateRepository.getById(id)

    if (template) {
      currentTemplate.value = template
      console.log(`[TemplateStore] ✅ 成功加载模板 ${id} - ${template.title}`)
      console.log('[TemplateStore] currentTemplate.value 已更新:', currentTemplate.value.id)
      return template
    } else {
      console.error(`[TemplateStore] ❌ 模板 ${id} 不存在`)
      console.error('[TemplateStore] ❌ Repository 返回 null')
      currentTemplate.value = null
      return null
    }
  }

  /**
   * 创建新模板
   *
   * @param {object} templateData - 模板数据
   * @returns {Promise<object>} 创建后的模板对象
   */
  async function createTemplate(templateData) {
    console.log('[TemplateStore] 创建新模板:', templateData)

    const newTemplate = await templateRepository.create(templateData)

    // 更新本地状态
    templates.value.push(newTemplate)

    console.log(`[TemplateStore] 创建成功，模板 ID: ${newTemplate.id}`)
    return newTemplate
  }

  /**
   * 更新模板
   *
   * @param {string} id - 模板 ID
   * @param {object} updates - 更新的字段
   * @returns {Promise<object|null>} 更新后的模板对象
   */
  async function updateTemplate(id, updates) {
    console.log(`[TemplateStore] 更新模板 ${id}:`, updates)

    const updatedTemplate = await templateRepository.update(id, updates)

    if (updatedTemplate) {
      // 更新本地状态
      const index = templates.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        templates.value[index] = updatedTemplate
      }

      // 如果是当前模板，也更新 currentTemplate
      if (currentTemplate.value?.id === id) {
        currentTemplate.value = updatedTemplate
      }

      console.log(`[TemplateStore] 更新成功，模板 ID: ${id}`)
      return updatedTemplate
    } else {
      console.error(`[TemplateStore] 更新失败，模板 ${id} 不存在`)
      return null
    }
  }

  /**
   * 删除模板（软删除）
   *
   * @param {string} id - 模板 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async function deleteTemplate(id) {
    console.log(`[TemplateStore] 删除模板 ${id}`)

    const success = await templateRepository.delete(id)

    if (success) {
      // 更新本地状态（标记 deletedAt）
      const index = templates.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        templates.value[index].deletedAt = Date.now()
      }

      console.log(`[TemplateStore] 删除成功，模板 ID: ${id}`)
      return true
    } else {
      console.error(`[TemplateStore] 删除失败，模板 ${id} 不存在`)
      return false
    }
  }

  /**
   * 刷新所有模板（从 Repository 重新加载）
   *
   * @returns {Promise<void>}
   */
  async function refreshTemplates() {
    console.log('[TemplateStore] 刷新模板列表')

    templates.value = templateRepository.getAll()
    console.log(`[TemplateStore] 刷新完成：${templates.value.length} 个模板`)
  }

  /**
   * 清空当前模板
   */
  function clearCurrentTemplate() {
    currentTemplate.value = null
    console.log('[TemplateStore] 清空当前模板')
  }

  // ============================================================
  // 4. 返回公开接口
  // ============================================================

  return {
    // 状态
    templates,
    currentTemplate,
    isHydrated,
    isLoading,

    // 计算属性
    activeTemplates,
    totalCount,
    getTemplateById,

    // Actions
    hydrate,
    loadTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates,
    clearCurrentTemplate
  }
})
