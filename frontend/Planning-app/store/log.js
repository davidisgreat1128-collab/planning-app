/**
 * 日志 Pinia Store (Composition API)
 *
 * 三层架构：Component → Store → Repository
 * - Store 层不直接调用 API
 * - 所有数据持久化由 LogRepository 管理
 * - Store 层提供响应式状态和业务方法
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-04 (重构为三层架构)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import LogRepository from '@/repositories/LogRepository'

export const useLogStore = defineStore('log', () => {
  // ==================== 响应式状态 ====================

  /** 加载状态 */
  const loading = ref(false)

  /** 当前选中日期 YYYY-MM-DD */
  const selectedDate = ref('')

  // ==================== 计算属性 ====================

  /**
   * 当前日期的日志列表（从 Repository 自动获取）
   */
  const logs = computed(() => {
    if (!selectedDate.value) return []
    return LogRepository.getByDate(selectedDate.value)
  })

  /**
   * 当前日志总数
   */
  const logsCount = computed(() => logs.value.length)

  // ==================== Actions ====================

  /**
   * hydrate - 数据水合（应用启动时调用）
   */
  async function hydrate() {
    await LogRepository.hydrate()
    console.log('[LogStore] 数据水合完成')
  }

  /**
   * 加载指定日期的日志
   * @param {string} date - YYYY-MM-DD
   */
  async function fetchLogsByDate(date) {
    loading.value = true
    selectedDate.value = date
    try {
      // Repository 已在 hydrate() 时同步过数据
      // 这里只需设置 selectedDate，computed 会自动更新
      console.log('[LogStore] 切换到日期:', date)
    } catch (err) {
      console.error('[LogStore] 加载日志失败:', err)
      uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建新日志
   * @param {object} data - 日志数据
   * @returns {Promise<object>} 新日志
   */
  async function addLog(data) {
    const newLog = await LogRepository.create(data)
    // Repository 更新后，computed 会自动触发更新
    return newLog
  }

  /**
   * 更新日志
   * @param {number} id - 日志ID
   * @param {object} data - 更新字段
   */
  async function editLog(id, data) {
    const updated = await LogRepository.update(id, data)
    return updated
  }

  /**
   * 将日志转化为任务
   * @param {number} id - 日志ID
   * @param {object} taskData - 可选的任务数据
   * @returns {Promise<object>} 新创建的任务
   */
  async function toTask(id, taskData = {}) {
    const task = await LogRepository.convertToTask(id, taskData)
    // Repository 已标记 convertedToTaskId，computed 会自动更新
    return task
  }

  /**
   * 删除日志
   * @param {number} id - 日志ID
   */
  async function removeLog(id) {
    await LogRepository.delete(id)
    // Repository 软删除后，computed 会自动过滤
  }

  /**
   * 同步服务器数据
   */
  async function sync() {
    await LogRepository.sync()
  }

  /**
   * 重置 store
   */
  function reset() {
    loading.value = false
    selectedDate.value = ''
  }

  // ==================== 返回 ====================

  return {
    // State
    loading,
    selectedDate,

    // Getters
    logs,
    logsCount,

    // Actions
    hydrate,
    fetchLogsByDate,
    addLog,
    editLog,
    toTask,
    removeLog,
    sync,
    reset
  }
})
