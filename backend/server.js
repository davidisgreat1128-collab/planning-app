'use strict';

// 最先加载环境变量
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

const app = require('./src/app');
const db = require('./src/models/index');
const { logger } = require('./src/middleware/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 1. 测试数据库连接
    await db.testConnection();

    // 2. 启动HTTP服务
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 服务器已启动`, {
        env: process.env.NODE_ENV,
        port: PORT,
        url: `http://localhost:${PORT}`
      });
      logger.info(`📋 健康检查: http://localhost:${PORT}/health`);
      logger.info(`🔗 API地址: http://localhost:${PORT}/api/v1`);
    });

    // 3. 优雅关机处理（关闭 HTTP + 数据库连接池）
    const shutdown = async (signal) => {
      logger.warn(`收到 ${signal} 信号，正在优雅关机...`);

      // 强制退出超时（30秒）
      const forceExit = setTimeout(() => {
        logger.error('优雅关机超时，强制退出');
        process.exit(1);
      }, 30000);
      forceExit.unref(); // 不阻塞事件循环

      server.close(async () => {
        try {
          await db.sequelize.close();
          logger.info('数据库连接池已关闭');
          logger.info('服务器已安全关闭');
          clearTimeout(forceExit);
          process.exit(0);
        } catch (err) {
          logger.error('关闭数据库时发生错误', { error: err.message });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 4. 未处理的 Promise rejection
    process.on('unhandledRejection', (reason) => {
      logger.error('未处理的Promise rejection:', {
        reason: reason instanceof Error ? reason.message : String(reason)
      });
    });

    // 5. 未捕获的同步异常（进程状态不可信，需关闭重启）
    process.on('uncaughtException', (err) => {
      logger.error('未捕获的异常（uncaughtException），即将关闭', {
        error: err.message,
        stack: err.stack
      });
      shutdown('uncaughtException');
    });

    return server;
  } catch (err) {
    logger.error('服务器启动失败:', { error: err.message });
    process.exit(1);
  }
}

startServer();
