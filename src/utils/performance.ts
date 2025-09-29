// Performance monitoring utilities
export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  componentCount: number
  timestamp: number
}

export interface PerformanceAlert {
  type: 'slow_render' | 'high_memory' | 'too_many_components'
  message: string
  value: number
  threshold: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private isMonitoring = false

  // Configuration
  private config = {
    slowRenderThreshold: 16, // 16ms (60fps)
    highMemoryThreshold: 100 * 1024 * 1024, // 100MB
    maxComponentsThreshold: 1000,
    maxMetricsHistory: 100,
    alertCooldown: 5000, // 5 seconds
  }

  start() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.setupPerformanceObservers()
    this.startMemoryMonitoring()

    console.log('Performance monitoring started')
  }

  stop() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()

    console.log('Performance monitoring stopped')
  }

  private setupPerformanceObservers() {
    // Monitor render performance
    if ('PerformanceObserver' in window) {
      try {
        const renderObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'measure' && entry.name.includes('render')) {
              this.recordRenderTime(entry.duration)
            }
          })
        })

        renderObserver.observe({ entryTypes: ['measure'] })
        this.observers.set('render', renderObserver)
      } catch (error) {
        console.warn('Performance observer not supported:', error)
      }
    }
  }

  private startMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory) {
          this.recordMemoryUsage(memory.usedJSHeapSize)
        }
      }, 1000)
    }
  }

  recordRenderTime(duration: number) {
    const metric: PerformanceMetrics = {
      renderTime: duration,
      memoryUsage: this.getCurrentMemoryUsage(),
      componentCount: this.getComponentCount(),
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics.shift()
    }

    // Check for slow render
    if (duration > this.config.slowRenderThreshold) {
      this.addAlert({
        type: 'slow_render',
        message: `Slow render detected: ${duration.toFixed(2)}ms`,
        value: duration,
        threshold: this.config.slowRenderThreshold,
        timestamp: Date.now(),
      })
    }
  }

  recordMemoryUsage(usage: number) {
    const metric: PerformanceMetrics = {
      renderTime: 0,
      memoryUsage: usage,
      componentCount: this.getComponentCount(),
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics.shift()
    }

    // Check for high memory usage
    if (usage > this.config.highMemoryThreshold) {
      this.addAlert({
        type: 'high_memory',
        message: `High memory usage: ${(usage / 1024 / 1024).toFixed(2)}MB`,
        value: usage,
        threshold: this.config.highMemoryThreshold,
        timestamp: Date.now(),
      })
    }
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private getComponentCount(): number {
    // This is a rough estimate - in a real app you'd track this more precisely
    return document.querySelectorAll('[data-v-]').length
  }

  private addAlert(alert: PerformanceAlert) {
    // Check cooldown to avoid spam
    const recentAlert = this.alerts.find(
      (a) => a.type === alert.type && Date.now() - a.timestamp < this.config.alertCooldown,
    )

    if (recentAlert) return

    this.alerts.push(alert)

    // Keep only recent alerts
    if (this.alerts.length > 50) {
      this.alerts.shift()
    }

    // Log alert in development
    if (import.meta.env.DEV) {
      console.warn(`Performance Alert: ${alert.message}`)
    }
  }

  // Public API
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 0

    const renderTimes = this.metrics.filter((m) => m.renderTime > 0).map((m) => m.renderTime)

    if (renderTimes.length === 0) return 0

    return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
  }

  getPeakMemoryUsage(): number {
    if (this.metrics.length === 0) return 0

    return Math.max(...this.metrics.map((m) => m.memoryUsage))
  }

  clearMetrics() {
    this.metrics = []
    this.alerts = []
  }

  // Performance markers
  markRenderStart(componentName: string) {
    performance.mark(`${componentName}-render-start`)
  }

  markRenderEnd(componentName: string) {
    performance.mark(`${componentName}-render-end`)
    performance.measure(
      `${componentName}-render`,
      `${componentName}-render-start`,
      `${componentName}-render-end`,
    )
  }

  // Bundle analysis
  analyzeBundleSize() {
    if (import.meta.env.DEV) {
      const scripts = document.querySelectorAll('script[src]')
      let totalSize = 0

      scripts.forEach((script) => {
        const src = (script as HTMLScriptElement).src
        if (src.includes('assets/')) {
          // This is a rough estimate - in production you'd use webpack-bundle-analyzer
          console.log(`Script: ${src}`)
        }
      })

      console.log(`Total estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`)
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Vue composable for performance monitoring
export function usePerformanceMonitoring() {
  const startMonitoring = () => {
    performanceMonitor.start()
  }

  const stopMonitoring = () => {
    performanceMonitor.stop()
  }

  const getMetrics = () => {
    return performanceMonitor.getMetrics()
  }

  const getAlerts = () => {
    return performanceMonitor.getAlerts()
  }

  const clearMetrics = () => {
    performanceMonitor.clearMetrics()
  }

  return {
    startMonitoring,
    stopMonitoring,
    getMetrics,
    getAlerts,
    clearMetrics,
    averageRenderTime: performanceMonitor.getAverageRenderTime(),
    peakMemoryUsage: performanceMonitor.getPeakMemoryUsage(),
  }
}

// Performance budget configuration
export const performanceBudgets = {
  bundleSize: {
    max: 500 * 1024, // 500KB
    warning: 400 * 1024, // 400KB
  },
  renderTime: {
    max: 16, // 16ms (60fps)
    warning: 12, // 12ms
  },
  memoryUsage: {
    max: 100 * 1024 * 1024, // 100MB
    warning: 80 * 1024 * 1024, // 80MB
  },
  componentCount: {
    max: 1000,
    warning: 800,
  },
}

// Performance budget checker
export function checkPerformanceBudgets(): {
  passed: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  const metrics = performanceMonitor.getMetrics()
  if (metrics.length === 0) {
    return { passed: true, warnings: [], errors: [] }
  }

  const latest = metrics[metrics.length - 1]
  const averageRenderTime = performanceMonitor.getAverageRenderTime()
  const peakMemory = performanceMonitor.getPeakMemoryUsage()

  // Check render time
  if (averageRenderTime > performanceBudgets.renderTime.max) {
    errors.push(
      `Average render time ${averageRenderTime.toFixed(2)}ms exceeds budget of ${performanceBudgets.renderTime.max}ms`,
    )
  } else if (averageRenderTime > performanceBudgets.renderTime.warning) {
    warnings.push(
      `Average render time ${averageRenderTime.toFixed(2)}ms is approaching budget limit`,
    )
  }

  // Check memory usage
  if (peakMemory > performanceBudgets.memoryUsage.max) {
    errors.push(
      `Peak memory usage ${(peakMemory / 1024 / 1024).toFixed(2)}MB exceeds budget of ${(performanceBudgets.memoryUsage.max / 1024 / 1024).toFixed(2)}MB`,
    )
  } else if (peakMemory > performanceBudgets.memoryUsage.warning) {
    warnings.push(
      `Peak memory usage ${(peakMemory / 1024 / 1024).toFixed(2)}MB is approaching budget limit`,
    )
  }

  // Check component count
  if (latest.componentCount > performanceBudgets.componentCount.max) {
    errors.push(
      `Component count ${latest.componentCount} exceeds budget of ${performanceBudgets.componentCount.max}`,
    )
  } else if (latest.componentCount > performanceBudgets.componentCount.warning) {
    warnings.push(`Component count ${latest.componentCount} is approaching budget limit`)
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
  }
}
