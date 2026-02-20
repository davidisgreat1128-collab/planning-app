const { sequelize } = require('../src/models');
const { logger } = require('../src/middleware/logger');

module.exports = async () => {
  console.log('[Global Teardown] 正在关闭资源...');

  // 关闭数据库连接
  await sequelize.close();

  // 关闭Winston logger（关闭所有transports）
  logger.close();

  console.log('[Global Teardown] 所有资源已关闭');
};
