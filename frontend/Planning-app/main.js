import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import debugUtils from '@/utils/debug.js'

export function createApp() {
  const app = createSSRApp(App)

  // 注册 Pinia 状态管理
  const pinia = createPinia()
  app.use(pinia)

  // ⭐ 全局注册调试工具（仅开发环境）
  // #ifdef H5
  if (process.env.NODE_ENV === 'development' || true) {  // 暂时始终启用
    window.$debug = debugUtils
    console.log('[Debug] 调试工具已注册到 window.$debug')
    console.log('  可用命令:')
    console.log('    window.$debug.diagnoseOrphanTasks()       - 诊断孤儿任务')
    console.log('    window.$debug.printAllTasks()             - 打印所有任务')
    console.log('    window.$debug.printAllCategories()        - 打印所有分类')
    console.log('    window.$debug.cleanOrphanTasks()          - 清理孤儿任务')
    console.log('    window.$debug.printLocalStorage()         - 打印 localStorage')
    console.log('    window.$debug.cleanLocalStorageGarbage()  - ⭐ 清理 localStorage 垃圾数据')
    console.log('    window.$debug.clearLegacyData()           - 🗑️  清理旧系统数据（tasks/categories/plans）')
    console.log('    window.$debug.clearAllLocalStorage()      - ⚠️  完全清空 localStorage')
  }
  // #endif

  return {
    app
  }
}
// #endif
