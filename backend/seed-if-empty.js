#!/usr/bin/env node
/**
 * 种子数据导入入口脚本
 *
 * 职责（单一职责）：
 * - 作为 Docker 容器启动时的入口脚本
 * - 调用 Service 层完成数据检查和导入
 * - 输出启动日志和错误信息
 *
 * 架构层级：启动脚本（不属于四层架构，但必须遵循分层调用）
 * 调用关系：启动脚本 → Service 层 → Repository/Model → Database
 *
 * ⭐ 架构改进（2026-03-25）：
 * - 从直接操作数据库 → 改为调用 Service 层
 * - 符合四层架构规范
 * - 符合单一职责原则（SRP）
 *
 * 创建时间：2026-03-25
 * 最后更新：2026-03-25（重构为符合四层架构）
 * 作者：Claude Sonnet 4.5
 */

require('dotenv').config();

/**
 * 主函数
 */
async function main() {
  console.log('=========================================');
  console.log('🌱 节假日数据初始化');
  console.log('=========================================');

  try {
    // ⭐ 调用 Service 层（符合四层架构）
    const holidayDataManager = require('./src/services/holidayDataManager');
    const result = await holidayDataManager.initialize();

    // 输出结果摘要
    console.log('\n=========================================');
    if (result.success && result.errors.length === 0) {
      console.log('✅ 节假日数据检查完成，所有数据正常');
    } else {
      console.log('⚠️ 节假日数据检查完成，但有警告：');
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
    console.log('=========================================');

    // 容错处理：即使有警告，也不阻塞应用启动
    process.exit(0);

  } catch (error) {
    console.error('❌ 节假日数据初始化失败:', error.message);
    console.error(error.stack);

    // 容错处理：失败也不阻塞应用启动（应用可降级运行）
    console.warn('⚠️ 应用将继续启动（降级模式）');
    process.exit(0);
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  // 容错：失败也不阻塞应用启动
  process.exit(0);
});
