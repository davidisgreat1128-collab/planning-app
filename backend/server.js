'use strict';

// 最先加载环境变量
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

const app = require('./src/app');
const { testConnection } = require('./src/models/index');
const { logger } = require('./src/middleware/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 1. 测试数据库连接
    await testConnection();

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

    // 3. 优雅关机处理
    const shutdown = (signal) => {
      logger.info(`收到 ${signal} 信号，正在优雅关机...`);
      server.close(() => {
        logger.info('HTTP服务已关闭');
        process.exit(0);
      });

      // 强制退出超时（30秒）
      setTimeout(() => {
        logger.error('优雅关机超时，强制退出');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 4. 未捕获的Promise rejection
    process.on('unhandledRejection', (reason) => {
      logger.error('未处理的Promise rejection:', { reason });
    });

    return server;
  } catch (err) {
    logger.error('服务器启动失败:', { error: err.message });
    process.exit(1);
  }
}

startServer();
