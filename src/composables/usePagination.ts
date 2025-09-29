import { ref, computed, watch } from 'vue'
import type { Message } from '@/types/chat'

export interface PaginationConfig {
  pageSize: number
  maxPages: number
  preloadPages: number
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  isLoading: boolean
  isPreloading: boolean
}

export function usePagination<T>(
  items: T[],
  config: PaginationConfig = {
    pageSize: 50,
    maxPages: 20,
    preloadPages: 2,
  },
) {
  const currentPage = ref(1)
  const isLoading = ref(false)
  const isPreloading = ref(false)
  const loadedPages = ref(new Set<number>())

  // Computed properties
  const totalPages = computed(() => Math.ceil(items.length / config.pageSize))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)

  // Get items for current page
  const currentPageItems = computed(() => {
    const start = (currentPage.value - 1) * config.pageSize
    const end = start + config.pageSize
    return items.slice(start, end)
  })

  // Get all loaded items
  const loadedItems = computed(() => {
    const allLoadedItems: T[] = []
    for (let page = 1; page <= totalPages.value; page++) {
      if (loadedPages.value.has(page)) {
        const start = (page - 1) * config.pageSize
        const end = start + config.pageSize
        allLoadedItems.push(...items.slice(start, end))
      }
    }
    return allLoadedItems
  })

  // Navigation methods
  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages.value || page === currentPage.value) {
      return
    }

    isLoading.value = true
    try {
      currentPage.value = page
      await loadPage(page)
    } finally {
      isLoading.value = false
    }
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      goToPage(currentPage.value + 1)
    }
  }

  const previousPage = () => {
    if (hasPreviousPage.value) {
      goToPage(currentPage.value - 1)
    }
  }

  const firstPage = () => {
    goToPage(1)
  }

  const lastPage = () => {
    goToPage(totalPages.value)
  }

  // Loading methods
  const loadPage = async (page: number) => {
    if (loadedPages.value.has(page)) {
      return
    }

    // Simulate loading delay for demonstration
    await new Promise((resolve) => setTimeout(resolve, 100))

    loadedPages.value.add(page)
  }

  const preloadAdjacentPages = async () => {
    if (isPreloading.value) return

    isPreloading.value = true
    try {
      const pagesToPreload: number[] = []

      // Preload next pages
      for (let i = 1; i <= config.preloadPages; i++) {
        const nextPage = currentPage.value + i
        if (nextPage <= totalPages.value && !loadedPages.value.has(nextPage)) {
          pagesToPreload.push(nextPage)
        }
      }

      // Preload previous pages
      for (let i = 1; i <= config.preloadPages; i++) {
        const prevPage = currentPage.value - i
        if (prevPage >= 1 && !loadedPages.value.has(prevPage)) {
          pagesToPreload.push(prevPage)
        }
      }

      // Load pages in parallel
      await Promise.all(pagesToPreload.map(loadPage))
    } finally {
      isPreloading.value = false
    }
  }

  // Load more functionality
  const loadMore = async () => {
    if (!hasNextPage.value) return

    isLoading.value = true
    try {
      const nextPage = currentPage.value + 1
      await loadPage(nextPage)
      currentPage.value = nextPage
    } finally {
      isLoading.value = false
    }
  }

  // Reset pagination
  const reset = () => {
    currentPage.value = 1
    loadedPages.value.clear()
    isLoading.value = false
    isPreloading.value = false
  }

  // Auto-preload when page changes
  watch(currentPage, () => {
    preloadAdjacentPages()
  })

  // Pagination state
  const paginationState = computed<PaginationState>(() => ({
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    hasNextPage: hasNextPage.value,
    hasPreviousPage: hasPreviousPage.value,
    isLoading: isLoading.value,
    isPreloading: isPreloading.value,
  }))

  return {
    // State
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isPreloading,
    loadedPages,

    // Computed
    currentPageItems,
    loadedItems,
    paginationState,

    // Methods
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    loadMore,
    loadPage,
    preloadAdjacentPages,
    reset,
  }
}

// Specialized composable for messages
export function useMessagePagination(messages: Message[], config: Partial<PaginationConfig> = {}) {
  const defaultConfig: PaginationConfig = {
    pageSize: 50,
    maxPages: 20,
    preloadPages: 2,
    ...config,
  }

  const pagination = usePagination(messages, defaultConfig)

  // Message-specific methods
  const goToMessage = (messageId: number) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    const targetPage = Math.ceil((messageIndex + 1) / defaultConfig.pageSize)
    pagination.goToPage(targetPage)
  }

  const goToLatestMessage = () => {
    pagination.goToPage(pagination.totalPages.value)
  }

  const goToOldestMessage = () => {
    pagination.goToPage(1)
  }

  // Load messages around a specific message
  const loadMessagesAround = async (messageId: number, radius: number = 5) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    const startPage = Math.max(1, Math.ceil((messageIndex - radius + 1) / defaultConfig.pageSize))
    const endPage = Math.min(
      pagination.totalPages.value,
      Math.ceil((messageIndex + radius) / defaultConfig.pageSize),
    )

    const pagesToLoad: number[] = []
    for (let page = startPage; page <= endPage; page++) {
      if (!pagination.loadedPages.value.has(page)) {
        pagesToLoad.push(page)
      }
    }

    await Promise.all(pagesToLoad.map(pagination.loadPage))
  }

  return {
    ...pagination,
    goToMessage,
    goToLatestMessage,
    goToOldestMessage,
    loadMessagesAround,
  }
}
