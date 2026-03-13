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

  const keys = ['planning_app_tasks', 'planning_app_categories', 'planning_app_task_queue', 'planning_app_category_queue']

  keys.forEach(key => {
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

  console.log('\n========================================')
}

// 导出所有调试函数
export default {
  diagnoseOrphanTasks,
  printAllTasks,
  printAllCategories,
  cleanOrphanTasks,
  printLocalStorage
}
