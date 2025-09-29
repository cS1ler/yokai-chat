// Request caching utility for API calls
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  size: number
}

export interface CacheConfig {
  maxSize: number // Maximum cache size in bytes
  defaultTTL: number // Default TTL in milliseconds
  cleanupInterval: number // Cleanup interval in milliseconds
}

export class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig
  private cleanupTimer?: number

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      ...config,
    }

    this.startCleanupTimer()
  }

  private startCleanupTimer() {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  // Generate cache key from request parameters
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    const headers = options?.headers ? JSON.stringify(options.headers) : ''

    return `${method}:${url}:${body}:${headers}`
  }

  // Get data from cache
  get<T>(url: string, options?: RequestInit): T | null {
    const key = this.generateKey(url, options)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  // Set data in cache
  set<T>(url: string, data: T, options?: RequestInit, ttl?: number): void {
    const key = this.generateKey(url, options)
    const size = this.calculateSize(data)

    // Check if we need to make room
    if (this.getCurrentSize() + size > this.config.maxSize) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      size,
    }

    this.cache.set(key, entry)
  }

  // Check if data exists in cache and is not expired
  has(url: string, options?: RequestInit): boolean {
    const key = this.generateKey(url, options)
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Remove specific entry
  delete(url: string, options?: RequestInit): boolean {
    const key = this.generateKey(url, options)
    return this.cache.delete(key)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    const expiredCount = entries.filter((entry) => Date.now() - entry.timestamp > entry.ttl).length

    return {
      size: this.cache.size,
      totalSize,
      maxSize: this.config.maxSize,
      utilization: (totalSize / this.config.maxSize) * 100,
      expiredCount,
    }
  }

  // Calculate approximate size of data
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      // Fallback estimation
      return JSON.stringify(data).length * 2
    }
  }

  // Get current cache size
  private getCurrentSize(): number {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)
  }

  // Evict oldest entries to make room
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp,
    )

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      console.debug(`Cleaned up ${expiredKeys.length} expired cache entries`)
    }
  }

  // Destroy cache and cleanup
  destroy(): void {
    this.stopCleanupTimer()
    this.clear()
  }
}

// Singleton cache instance
export const requestCache = new RequestCache()

// Cache configuration for different types of requests
export const cacheConfigs = {
  models: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1024 * 1024, // 1MB
  },
  modelInfo: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 512 * 1024, // 512KB
  },
  chat: {
    ttl: 0, // No caching for chat requests
    maxSize: 0,
  },
  contexts: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 2 * 1024 * 1024, // 2MB
  },
}

// Cached fetch wrapper
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheConfig?: { ttl?: number; maxSize?: number },
): Promise<T> {
  // Check cache first
  const cached = requestCache.get<T>(url, options)
  if (cached !== null) {
    console.debug(`Cache hit for ${url}`)
    return cached
  }

  // Make request
  console.debug(`Cache miss for ${url}, making request`)
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  // Cache the response
  const ttl = cacheConfig?.ttl || cacheConfigs.models.ttl
  requestCache.set(url, data, options, ttl)

  return data
}

// Cache invalidation utilities
export function invalidateCache(pattern: string): void {
  const keys = Array.from(requestCache['cache'].keys())
  const matchingKeys = keys.filter((key) => key.includes(pattern))

  matchingKeys.forEach((key) => {
    requestCache['cache'].delete(key)
  })

  console.debug(`Invalidated ${matchingKeys.length} cache entries matching "${pattern}"`)
}

export function invalidateAllCache(): void {
  requestCache.clear()
  console.debug('All cache invalidated')
}

// Cache warming utilities
export async function warmCache(urls: string[], options?: RequestInit): Promise<void> {
  const promises = urls.map((url) =>
    cachedFetch(url, options).catch((error) => {
      console.warn(`Failed to warm cache for ${url}:`, error)
    }),
  )

  await Promise.all(promises)
  console.debug(`Cache warmed for ${urls.length} URLs`)
}

// Cache analytics
export function getCacheAnalytics() {
  const stats = requestCache.getStats()
  const entries = Array.from(requestCache['cache'].entries())

  const byTTL = entries.reduce(
    (acc, [, entry]) => {
      const ttlMinutes = Math.round(entry.ttl / (60 * 1000))
      acc[ttlMinutes] = (acc[ttlMinutes] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  const byAge = entries.reduce(
    (acc, [, entry]) => {
      const ageMinutes = Math.round((Date.now() - entry.timestamp) / (60 * 1000))
      acc[ageMinutes] = (acc[ageMinutes] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  return {
    ...stats,
    byTTL,
    byAge,
    hitRate: calculateHitRate(),
  }
}

// Simple hit rate calculation (would need more sophisticated tracking in production)
let cacheHits = 0
let cacheMisses = 0

function calculateHitRate(): number {
  const total = cacheHits + cacheMisses
  return total > 0 ? (cacheHits / total) * 100 : 0
}

// Override the cached fetch to track hits/misses
const originalCachedFetch = cachedFetch
export async function cachedFetchWithTracking<T>(
  url: string,
  options?: RequestInit,
  cacheConfig?: { ttl?: number; maxSize?: number },
): Promise<T> {
  const cached = requestCache.get<T>(url, options)
  if (cached !== null) {
    cacheHits++
    return cached
  }

  cacheMisses++
  return originalCachedFetch(url, options, cacheConfig)
}
