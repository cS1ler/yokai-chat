// Component cleanup utilities to prevent memory leaks
import { onUnmounted, onBeforeUnmount, type Ref } from 'vue'

export interface CleanupItem {
  id: string
  cleanup: () => void
  type: 'listener' | 'timer' | 'observer' | 'subscription' | 'custom'
  description?: string
}

class ComponentCleanupManager {
  private cleanupItems: CleanupItem[] = []
  private isDestroyed = false

  // Add cleanup item
  addCleanup(
    id: string,
    cleanup: () => void,
    type: CleanupItem['type'] = 'custom',
    description?: string,
  ): void {
    if (this.isDestroyed) {
      console.warn(`Cannot add cleanup item "${id}" - component is already destroyed`)
      return
    }

    // Remove existing cleanup with same id
    this.removeCleanup(id)

    this.cleanupItems.push({
      id,
      cleanup,
      type,
      description,
    })
  }

  // Remove specific cleanup item
  removeCleanup(id: string): void {
    const index = this.cleanupItems.findIndex((item) => item.id === id)
    if (index !== -1) {
      this.cleanupItems.splice(index, 1)
    }
  }

  // Execute all cleanup
  cleanup(): void {
    if (this.isDestroyed) return

    this.isDestroyed = true

    // Execute cleanup in reverse order (LIFO)
    for (let i = this.cleanupItems.length - 1; i >= 0; i--) {
      const item = this.cleanupItems[i]
      try {
        item.cleanup()
        console.debug(`Cleaned up ${item.type}: ${item.id}`)
      } catch (error) {
        console.error(`Error cleaning up ${item.type} "${item.id}":`, error)
      }
    }

    this.cleanupItems = []
  }

  // Get cleanup statistics
  getStats() {
    const byType = this.cleanupItems.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: this.cleanupItems.length,
      byType,
      isDestroyed: this.isDestroyed,
    }
  }
}

// Vue composable for component cleanup
export function useComponentCleanup() {
  const manager = new ComponentCleanupManager()

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    manager.cleanup()
  })

  // Add event listener with auto-cleanup
  const addEventListener = (
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ) => {
    element.addEventListener(event, handler, options)

    manager.addCleanup(
      `listener-${event}-${Date.now()}`,
      () => element.removeEventListener(event, handler, options),
      'listener',
      `Event listener for ${event}`,
    )
  }

  // Add timer with auto-cleanup
  const addTimer = (
    callback: () => void,
    delay: number,
    type: 'timeout' | 'interval' = 'timeout',
  ): number => {
    const id =
      type === 'timeout' ? window.setTimeout(callback, delay) : window.setInterval(callback, delay)

    manager.addCleanup(
      `timer-${type}-${id}`,
      () => {
        if (type === 'timeout') {
          clearTimeout(id)
        } else {
          clearInterval(id)
        }
      },
      'timer',
      `${type} timer with ${delay}ms delay`,
    )

    return id
  }

  // Add observer with auto-cleanup
  const addObserver = (
    observer: IntersectionObserver | MutationObserver | ResizeObserver,
    target: Element,
    options?: any,
  ) => {
    observer.observe(target, options)

    manager.addCleanup(
      `observer-${observer.constructor.name}-${Date.now()}`,
      () => observer.disconnect(),
      'observer',
      `${observer.constructor.name} observer`,
    )
  }

  // Add subscription with auto-cleanup
  const addSubscription = (subscription: { unsubscribe: () => void }, description?: string) => {
    manager.addCleanup(
      `subscription-${Date.now()}`,
      () => subscription.unsubscribe(),
      'subscription',
      description || 'Subscription',
    )
  }

  // Add custom cleanup
  const addCustomCleanup = (id: string, cleanup: () => void, description?: string) => {
    manager.addCleanup(id, cleanup, 'custom', description)
  }

  // Remove specific cleanup
  const removeCleanup = (id: string) => {
    manager.removeCleanup(id)
  }

  // Manual cleanup (useful for testing)
  const cleanup = () => {
    manager.cleanup()
  }

  // Get cleanup statistics
  const getStats = () => {
    return manager.getStats()
  }

  return {
    addEventListener,
    addTimer,
    addObserver,
    addSubscription,
    addCustomCleanup,
    removeCleanup,
    cleanup,
    getStats,
  }
}

// AbortController cleanup utility
export function useAbortController() {
  const { addCustomCleanup } = useComponentCleanup()
  const abortController = new AbortController()

  addCustomCleanup('abort-controller', () => abortController.abort(), 'AbortController cleanup')

  return abortController
}

// Intersection Observer cleanup utility
export function useIntersectionObserver(
  target: Ref<Element | null>,
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
) {
  const { addObserver } = useComponentCleanup()
  const observer = new IntersectionObserver(callback, options)

  // Watch for target changes
  const stopWatcher = watch(
    target,
    (newTarget) => {
      if (newTarget) {
        addObserver(observer, newTarget)
      }
    },
    { immediate: true },
  )

  return {
    observer,
    stopWatcher,
  }
}

// Resize Observer cleanup utility
export function useResizeObserver(target: Ref<Element | null>, callback: ResizeObserverCallback) {
  const { addObserver } = useComponentCleanup()
  const observer = new ResizeObserver(callback)

  // Watch for target changes
  const stopWatcher = watch(
    target,
    (newTarget) => {
      if (newTarget) {
        addObserver(observer, newTarget)
      }
    },
    { immediate: true },
  )

  return {
    observer,
    stopWatcher,
  }
}

// Mutation Observer cleanup utility
export function useMutationObserver(
  target: Ref<Element | null>,
  callback: MutationCallback,
  options?: MutationObserverInit,
) {
  const { addObserver } = useComponentCleanup()
  const observer = new MutationObserver(callback)

  // Watch for target changes
  const stopWatcher = watch(
    target,
    (newTarget) => {
      if (newTarget) {
        addObserver(observer, newTarget, options)
      }
    },
    { immediate: true },
  )

  return {
    observer,
    stopWatcher,
  }
}

// WebSocket cleanup utility
export function useWebSocket(url: string, protocols?: string | string[]) {
  const { addCustomCleanup } = useComponentCleanup()
  const ws = new WebSocket(url, protocols)

  addCustomCleanup(
    'websocket',
    () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    },
    'WebSocket connection',
  )

  return ws
}

// Event Bus cleanup utility
export function useEventBus() {
  const { addCustomCleanup } = useComponentCleanup()
  const listeners = new Map<string, EventListener[]>()

  const on = (event: string, listener: EventListener) => {
    if (!listeners.has(event)) {
      listeners.set(event, [])
    }
    listeners.get(event)!.push(listener)
    document.addEventListener(event, listener)
  }

  const off = (event: string, listener: EventListener) => {
    const eventListeners = listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index !== -1) {
        eventListeners.splice(index, 1)
        document.removeEventListener(event, listener)
      }
    }
  }

  const emit = (event: string, detail?: any) => {
    document.dispatchEvent(new CustomEvent(event, { detail }))
  }

  // Cleanup all listeners
  addCustomCleanup(
    'event-bus',
    () => {
      listeners.forEach((eventListeners, event) => {
        eventListeners.forEach((listener) => {
          document.removeEventListener(event, listener)
        })
      })
      listeners.clear()
    },
    'Event bus listeners',
  )

  return {
    on,
    off,
    emit,
  }
}

// Memory leak detection utility
export function useMemoryLeakDetection() {
  const { addCustomCleanup } = useComponentCleanup()
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
  const checkInterval = 5000 // 5 seconds

  const checkMemory = () => {
    const currentMemory = (performance as any).memory?.usedJSHeapSize || 0
    const memoryIncrease = currentMemory - initialMemory

    if (memoryIncrease > 10 * 1024 * 1024) {
      // 10MB increase
      console.warn(
        `Potential memory leak detected: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`,
      )
    }
  }

  const intervalId = setInterval(checkMemory, checkInterval)

  addCustomCleanup(
    'memory-leak-detection',
    () => clearInterval(intervalId),
    'Memory leak detection',
  )

  return {
    checkMemory,
    initialMemory,
  }
}
