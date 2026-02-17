'use strict';

const winston = require('winston');
const path = require('path');

// ============================================================
// Winston Logger 配置
// ============================================================

const logDir = path.join(__dirname, '../../logs');

/**
 * 自定义日志格式: [时间戳] [级别] 消息 {元数据}
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  })
);

/**
 * Winston Logger实例
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  format: logFormat,
  transports: [
    // 控制台输出（带颜色）
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    }),
    // 综合日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    })
  ],
  // 未捕获的异常也写入日志
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ]
});

// ============================================================
// HTTP请求日志中间件
// ============================================================

/**
 * HTTP请求日志中间件
 * 记录: 方法 路径 状态码 响应时间 用户ID
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function httpLogger(req, res, next) {
  const startTime = Date.now();

  // 响应完成后记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user ? req.user.id : 'anonymous';
    const logData = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId,
      ip: req.ip || req.connection.remoteAddress
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP请求错误', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP客户端错误', logData);
    } else {
      logger.info('HTTP请求', logData);
    }
  });

  next();
}

module.exports = {
  logger,
  httpLogger
};
