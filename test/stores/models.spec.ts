import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useModelsStore } from '@/stores/models'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Models Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useModelsStore()

    expect(store.currentModel).toBe('')
    expect(store.availableModels).toEqual([])
    expect(store.isLoadingModels).toBe(false)
    expect(store.lmStudioBaseUrl).toBe('')
  })

  it('sets current model correctly', () => {
    const store = useModelsStore()

    store.setCurrentModel('test-model')
    expect(store.currentModel).toBe('test-model')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('currentModel', 'test-model')
  })

  it('does not set empty model', () => {
    const store = useModelsStore()

    store.setCurrentModel('')
    expect(store.currentModel).toBe('')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('currentModel', '')
  })

  it('loads current model from storage', () => {
    const store = useModelsStore()
    localStorageMock.getItem.mockReturnValue('stored-model')

    store.loadCurrentModelFromStorage()
    expect(store.currentModel).toBe('stored-model')
  })

  it('handles empty storage gracefully', () => {
    const store = useModelsStore()
    localStorageMock.getItem.mockReturnValue(null)

    store.loadCurrentModelFromStorage()
    expect(store.currentModel).toBe('')
  })

  it('sets LM Studio base URL correctly', () => {
    const store = useModelsStore()

    store.setLMStudioBaseUrl('http://localhost:1234/v1')
    expect(store.lmStudioBaseUrl).toBe('http://localhost:1234/v1')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'lmStudioBaseUrl',
      'http://localhost:1234/v1',
    )
  })

  it('loads LM Studio base URL from storage', () => {
    const store = useModelsStore()
    localStorageMock.getItem.mockReturnValue('http://localhost:1234/v1')

    store.loadLMStudioBaseUrlFromStorage()
    expect(store.lmStudioBaseUrl).toBe('http://localhost:1234/v1')
  })

  it('validates base URL correctly', () => {
    const store = useModelsStore()

    // Valid URLs
    store.setLMStudioBaseUrl('http://localhost:1234/v1')
    expect(store.isBaseUrlValid()).toBe(true)

    store.setLMStudioBaseUrl('https://example.com:8080/v1')
    expect(store.isBaseUrlValid()).toBe(true)

    // Invalid URLs
    store.setLMStudioBaseUrl('')
    expect(store.isBaseUrlValid()).toBe(false)

    store.setLMStudioBaseUrl('invalid-url')
    expect(store.isBaseUrlValid()).toBe(false)
  })

  it('clears base URL correctly', () => {
    const store = useModelsStore()
    store.setLMStudioBaseUrl('http://localhost:1234/v1')

    store.clearBaseUrl()
    expect(store.lmStudioBaseUrl).toBe('')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lmStudioBaseUrl', '')
  })

  it('loads available models', async () => {
    const store = useModelsStore()

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'model1' }, { id: 'model2' }] }),
    })

    await store.loadAvailableModels()

    expect(store.availableModels).toEqual(['model1', 'model2'])
    expect(store.isLoadingModels).toBe(false)
  })

  it('handles model loading errors', async () => {
    const store = useModelsStore()

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await store.loadAvailableModels()

    expect(store.availableModels).toEqual([])
    expect(store.isLoadingModels).toBe(false)
  })

  it('refreshes current model from storage', () => {
    const store = useModelsStore()
    localStorageMock.getItem.mockReturnValue('refreshed-model')

    store.refreshCurrentModel()
    expect(store.currentModel).toBe('refreshed-model')
  })
})
