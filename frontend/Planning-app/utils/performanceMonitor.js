/**
 * 性能监控工具
 *
 * 职责：
 * - 监控渲染性能（帧率）
 * - 监控内存占用
 * - 提供性能报告
 *
 * 使用场景：
 * - 开发环境：自动启用
 * - 生产环境：默认关闭（可手动开启）
 *
 * @module utils/performanceMonitor
 * @author Claude Sonnet 4.5
 * @date 2026-03-28
 */

import { PERFORMANCE_CONFIG } from './calendarConstants'

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  /**
   * 创建性能监控器
   *
   * @param {boolean} [enabled] - 是否启用（默认：开发环境启用）
   */
  constructor(enabled = PERFORMANCE_CONFIG.ENABLED) {
    this.enabled = enabled

    // 性能指标
    this.metrics = {
      renderCount: 0,        // 渲染次数
      lastRenderTime: 0,     // 最后一次渲染耗时
      avgRenderTime: 0,      // 平均渲染耗时
      maxRenderTime: 0,      // 最大渲染耗时
      minRenderTime: Infinity, // 最小渲染耗时
      slowRenderCount: 0     // 慢渲染次数（>16ms）
    }

    // 内部状态
    this._renderStart = 0
    this._lastLogTime = Date.now()
  }

  /**
   * 开始监控渲染
   */
  startRender() {
    if (!this.enabled) return

    // #ifdef H5
    if (typeof performance !== 'undefined' && performance.now) {
      this._renderStart = performance.now()
    } else {
      this._renderStart = Date.now()
    }
    // #endif

    // #ifdef APP-PLUS
    this._renderStart = Date.now()
    // #endif
  }

  /**
   * 结束监控渲染
   */
  endRender() {
    if (!this.enabled) return

    // 计算渲染耗时
    let duration
    // #ifdef H5
    if (typeof performance !== 'undefined' && performance.now) {
      duration = performance.now() - this._renderStart
    } else {
      duration = Date.now() - this._renderStart
    }
    // #endif

    // #ifdef APP-PLUS
    duration = Date.now() - this._renderStart
    // #endif

    // 更新指标
    this.metrics.renderCount++
    this.metrics.lastRenderTime = duration

    // 更新平均值
    this.metrics.avgRenderTime =
      (this.metrics.avgRenderTime * (this.metrics.renderCount - 1) + duration) /
      this.metrics.renderCount

    // 更新最大/最小值
    this.metrics.maxRenderTime = Math.max(this.metrics.maxRenderTime, duration)
    this.metrics.minRenderTime = Math.min(this.metrics.minRenderTime, duration)

    // 检测慢渲染
    if (duration > PERFORMANCE_CONFIG.WARN_THRESHOLD) {
      this.metrics.slowRenderCount++
      console.warn(`[PerformanceMonitor] 渲染过慢: ${duration.toFixed(2)}ms（阈值: ${PERFORMANCE_CONFIG.WARN_THRESHOLD}ms）`)
    }

    // 定期输出日志
    this._maybeLog()
  }

  /**
   * 定期输出性能日志
   */
  _maybeLog() {
    const now = Date.now()
    if (now - this._lastLogTime >= PERFORMANCE_CONFIG.LOG_INTERVAL) {
      this._lastLogTime = now
      console.log('[PerformanceMonitor] 性能报告:', this.getReport())
    }
  }

  /**
   * 获取性能报告
   *
   * @returns {Object} 性能报告
   */
  getReport() {
    return {
      // 渲染指标
      renderCount: this.metrics.renderCount,
      avgRenderTime: this.metrics.avgRenderTime.toFixed(2) + 'ms',
      maxRenderTime: this.metrics.maxRenderTime.toFixed(2) + 'ms',
      minRenderTime: this.metrics.minRenderTime === Infinity
        ? 'N/A'
        : this.metrics.minRenderTime.toFixed(2) + 'ms',
      slowRenderCount: this.metrics.slowRenderCount,

      // 帧率估算
      estimatedFPS: this.metrics.avgRenderTime > 0
        ? Math.floor(1000 / this.metrics.avgRenderTime)
        : 0,

      // 性能评级
      performance: this._getPerformanceGrade()
    }
  }

  /**
   * 获取性能评级
   *
   * @returns {string} 评级（A/B/C/D）
   */
  _getPerformanceGrade() {
    const { avgRenderTime, slowRenderCount, renderCount } = this.metrics

    if (avgRenderTime <= 8 && slowRenderCount === 0) {
      return 'A（优秀）'
    } else if (avgRenderTime <= 16 && slowRenderCount / renderCount < 0.1) {
      return 'B（良好）'
    } else if (avgRenderTime <= 32) {
      return 'C（一般）'
    } else {
      return 'D（较差）'
    }
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics = {
      renderCount: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity,
      slowRenderCount: 0
    }
    this._lastLogTime = Date.now()
  }

  /**
   * 启用监控
   */
  enable() {
    this.enabled = true
    console.log('[PerformanceMonitor] 已启用')
  }

  /**
   * 禁用监控
   */
  disable() {
    this.enabled = false
    console.log('[PerformanceMonitor] 已禁用')
  }
}

/**
 * 默认实例（单例）
 */
export const performanceMonitor = new PerformanceMonitor()
