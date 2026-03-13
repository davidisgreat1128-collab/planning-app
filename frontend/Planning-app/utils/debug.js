/**
 * 调试工具集
 *
 * 使用方式（浏览器控制台）：
 * ```javascript
 * // 1. 导入调试工具（在 main.js 中已全局注册）
 * window.$debug.diagnoseOrphanTasks()
 * window.$debug.printAllTasks()
 * window.$debug.printAllCategories()
 * window.$debug.cleanOrphanTasks()
 * ```
 */

import { useTaskStore } from '@/store/task.js'
import { useCategoryStore } from '@/store/category.js'
import TaskRepository from '@/repositories/TaskRepository.js'
import CategoryRepository from '@/repositories/CategoryRepository.js'

/**
 * 诊断孤儿任务
 */
export function diagnoseOrphanTasks() {
  console.log('========================================')
  console.log('🔍 诊断孤儿任务')
  console.log('========================================')

  const allTasks = TaskRepository.getAll()
  const allCategories = CategoryRepository.getAll()

  console.log(`总任务数: ${allTasks.length}`)
  console.log(`总分类数: ${allCategories.length}`)

  // 提取所有有效的 categoryId 和 planId
  const validCategoryIds = new Set(allCategories.map(c => c.id))

  // 检查每个任务
  const orphanTasks = []
  allTasks.forEach(task => {
    let isOrphan = false
    let reason = ''

    if (task.categoryId && !validCategoryIds.has(task.categoryId)) {
      isOrphan = true
      reason = `categoryId=${task.categoryId} 指向的分类不存在`
    }

    if (task.planId && !validCategoryIds.has(task.planId)) {
      isOrphan = true
      reason += (reason ? '; ' : '') + `planId=${task.planId} 指向的规划不存在`
    }

    if (isOrphan) {
      orphanTasks.push({
        id: task.id,
        title: task.title,
        categoryId: task.categoryId,
        planId: task.planId,
        isUrgent: task.isUrgent,
        isImportant: task.isImportant,
        reason
      })
      console.log(`⚠️ 孤儿任务:`)
      console.log(`   ID: ${task.id}`)
      console.log(`   标题: ${task.title}`)
      console.log(`   categoryId: ${task.categoryId}`)
      console.log(`   planId: ${task.planId}`)
      console.log(`   象限: ${task.isUrgent ? '紧急' : '不紧急'} + ${task.isImportant ? '重要' : '不重要'}`)
      console.log(`   原因: ${reason}`)
      console.log('----------------------------------------')
    }
  })

  console.log(`✅ 诊断完成: 发现 ${orphanTasks.length} 个孤儿任务`)
  console.log('========================================')

  return {
    totalTasks: allTasks.length,
    totalCategories: allCategories.length,
    orphanTasks,
    orphanCount: orphanTasks.length
  }
}

/**
 * 打印所有任务详情
 */
export function printAllTasks() {
  console.log('========================================')
  console.log('📋 所有任务详情')
  console.log('========================================')

  const allTasks = TaskRepository.getAll()
  console.log(`总任务数: ${allTasks.length}`)

  allTasks.forEach((task, index) => {
    console.log(`\n[任务 ${index + 1}]`)
    console.log(`  ID: ${task.id}`)
    console.log(`  标题: ${task.title}`)
    console.log(`  categoryId: ${task.categoryId || '无'}`)
    console.log(`  planId: ${task.planId || '无'}`)
    console.log(`  象限: ${task.isUrgent ? '紧急' : '不紧急'} + ${task.isImportant ? '重要' : '不重要'}`)
    console.log(`  日期: ${task.date}`)
    console.log(`  状态: ${task.status}`)
  })

  console.log('\n========================================')
}

/**
 * 打印所有分类详情
 */
export function printAllCategories() {
  console.log('========================================')
  console.log('📁 所有分类详情')
  console.log('========================================')

  const allCategories = CategoryRepository.getAll()
  console.log(`总分类数: ${allCategories.length}`)

  allCategories.forEach((cat, index) => {
    console.log(`\n[分类 ${index + 1}]`)
    console.log(`  ID: ${cat.id}`)
    console.log(`  名称: ${cat.name}`)
    console.log(`  类型: ${cat.type || 'category'}`)
    console.log(`  图标: ${cat.iconEmoji || cat.icon}`)
  })

  console.log('\n========================================')
}

/**
 * 清理孤儿任务（将 categoryId 和 planId 改为 null）
 */
export async function cleanOrphanTasks() {
  console.log('========================================')
  console.log('🧹 清理孤儿任务')
  console.log('========================================')

  const report = diagnoseOrphanTasks()

  if (report.orphanCount === 0) {
    console.log('✅ 没有孤儿任务需要清理')
    return
  }

  console.log(`\n开始清理 ${report.orphanCount} 个孤儿任务...`)

  const taskStore = useTaskStore()

  for (const orphan of report.orphanTasks) {
    try {
      await TaskRepository.update(orphan.id, {
        categoryId: null,
        planId: null
      })
      console.log(`✅ 已清理: ${orphan.title} (id=${orphan.id})`)
    } catch (e) {
      console.error(`❌ 清理失败: ${orphan.title} (id=${orphan.id})`, e)
    }
  }

  console.log('\n✅ 清理完成！请刷新页面查看效果。')
  console.log('========================================')
}

/**
 * 打印 localStorage 数据
 */
export function printLocalStorage() {
  console.log('========================================')
  console.log('💾 LocalStorage 数据')
  console.log('========================================')

  // ⭐ 新系统（Repository）数据
  console.log('\n📦 新系统（Repository）:')
  const newKeys = ['planning_app_tasks', 'planning_app_categories', 'planning_app_task_queue', 'planning_app_category_queue']

  newKeys.forEach(key => {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        console.log(`\n[${key}]`)
        console.log(`  数据量: ${Array.isArray(parsed) ? parsed.length : '非数组'}`)
        console.log(`  数据:`, parsed)
      } catch (e) {
        console.log(`\n[${key}]`)
        console.log(`  解析失败:`, e)
      }
    } else {
      console.log(`\n[${key}]`)
      console.log(`  无数据`)
    }
  })

  // ⭐ 旧系统数据（uni.getStorageSync）
  console.log('\n\n🗂️ 旧系统（直接localStorage）:')
  const oldKeys = ['tasks', 'categories', 'plans']

  oldKeys.forEach(key => {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        console.log(`\n[${key}] ⚠️ 发现旧系统数据！`)
        console.log(`  数据量: ${Array.isArray(parsed) ? parsed.length : '非数组'}`)
        console.log(`  数据:`, parsed)

        // 如果是任务数据，检查ID格式
        if (key === 'tasks' && Array.isArray(parsed)) {
          const legacyTasks = parsed.filter(t => String(t.id).startsWith('task_'))
          if (legacyTasks.length > 0) {
            console.log(`  ⚠️ 包含 ${legacyTasks.length} 个旧格式任务（ID以task_开头）`)
            console.log(`  示例ID:`, legacyTasks.slice(0, 3).map(t => t.id))
          }
        }
      } catch (e) {
        console.log(`\n[${key}]`)
        console.log(`  解析失败:`, e)
      }
    } else {
      console.log(`\n[${key}]`)
      console.log(`  无数据`)
    }
  })

  console.log('\n========================================')
}

/**
 * ⭐ 清理 localStorage 中的垃圾数据（已标记删除的数据）
 *
 * 问题：
 * - localStorage 中保存了大量 deletedAt 不为 null 的垃圾数据
 * - 每次 hydrate() 都会重新加载这些垃圾数据
 * - 导致页面显示 39 个任务但实际可见 0 个
 *
 * 解决：
 * - 清理 tasks 和 categories 中 deletedAt 不为 null 的数据
 * - 保留未删除的数据
 */
export function cleanLocalStorageGarbage() {
  console.log('========================================')
  console.log('🧹 清理 localStorage 垃圾数据')
  console.log('========================================')

  // 清理任务数据
  const tasksKey = 'planning_app_tasks'
  const tasksData = localStorage.getItem(tasksKey)
  if (tasksData) {
    try {
      const tasks = JSON.parse(tasksData)
      const beforeCount = tasks.length
      const cleaned = tasks.filter(t => !t.deletedAt)
      const afterCount = cleaned.length

      console.log(`\n[任务数据]`)
      console.log(`  清理前: ${beforeCount} 个任务`)
      console.log(`  清理后: ${afterCount} 个任务`)
      console.log(`  已删除: ${beforeCount - afterCount} 个垃圾任务`)

      localStorage.setItem(tasksKey, JSON.stringify(cleaned))
    } catch (e) {
      console.error(`  解析任务数据失败:`, e)
    }
  } else {
    console.log(`\n[任务数据] 无数据`)
  }

  // 清理分类数据
  const categoriesKey = 'planning_app_categories'
  const categoriesData = localStorage.getItem(categoriesKey)
  if (categoriesData) {
    try {
      const categories = JSON.parse(categoriesData)
      const beforeCount = categories.length
      const cleaned = categories.filter(c => !c.deletedAt)
      const afterCount = cleaned.length

      console.log(`\n[分类数据]`)
      console.log(`  清理前: ${beforeCount} 个分类`)
      console.log(`  清理后: ${afterCount} 个分类`)
      console.log(`  已删除: ${beforeCount - afterCount} 个垃圾分类`)

      localStorage.setItem(categoriesKey, JSON.stringify(cleaned))
    } catch (e) {
      console.error(`  解析分类数据失败:`, e)
    }
  } else {
    console.log(`\n[分类数据] 无数据`)
  }

  console.log('\n✅ 清理完成！请刷新页面查看效果。')
  console.log('========================================')
}

/**
 * ⭐ 清理旧系统数据（删除 localStorage('tasks')、localStorage('categories')、localStorage('plans')）
 */
export function clearLegacyData() {
  console.log('========================================')
  console.log('🗑️  清理旧系统数据')
  console.log('========================================')

  const legacyKeys = ['tasks', 'categories', 'plans']
  let totalCleared = 0

  legacyKeys.forEach(key => {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        const count = Array.isArray(parsed) ? parsed.length : 1
        totalCleared += count
        localStorage.removeItem(key)
        console.log(`✅ 已删除 [${key}]: ${count} 条数据`)
      } catch (e) {
        localStorage.removeItem(key)
        console.log(`✅ 已删除 [${key}]: 数据损坏，已清理`)
      }
    } else {
      console.log(`ℹ️  [${key}]: 无数据`)
    }
  })

  console.log(`\n✅ 清理完成！共清理 ${totalCleared} 条旧数据`)
  console.log('⚠️  请刷新页面查看效果')
  console.log('========================================')
}

/**
 * ⭐ 完全清空 localStorage（慎用！会删除所有数据）
 */
export function clearAllLocalStorage() {
  console.log('========================================')
  console.log('⚠️  完全清空 localStorage')
  console.log('========================================')

  const keys = ['planning_app_tasks', 'planning_app_categories', 'planning_app_task_queue', 'planning_app_category_queue']

  keys.forEach(key => {
    localStorage.removeItem(key)
    console.log(`✅ 已删除: ${key}`)
  })

  console.log('\n✅ 清空完成！请刷新页面。')
  console.log('========================================')
}

// 导出所有调试函数
export default {
  diagnoseOrphanTasks,
  printAllTasks,
  printAllCategories,
  cleanOrphanTasks,
  printLocalStorage,
  cleanLocalStorageGarbage,
  clearLegacyData,
  clearAllLocalStorage
}
