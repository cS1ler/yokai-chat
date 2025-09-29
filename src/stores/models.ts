import { defineStore } from 'pinia'
import { ref } from 'vue'
import { APP_CONFIG } from '@/constants'
import { StatePersistence } from '@/utils/persistence'

export const useModelsStore = defineStore('models', () => {
  // State
  const currentModel = ref<string>(APP_CONFIG.DEFAULT_MODEL)
  const availableModels = ref<string[]>([])
  const isLoadingModels = ref(false)
  const lmStudioBaseUrl = ref<string>('') // Start with empty string, will be set by user

  // Actions
  const setCurrentModel = (model: string) => {
    currentModel.value = model
    StatePersistence.saveCurrentModel(model)
  }

  const loadCurrentModelFromStorage = () => {
    try {
      const stored = StatePersistence.loadCurrentModel()
      if (stored) {
        currentModel.value = stored
      }
    } catch (error) {
      console.warn('Failed to load current model from localStorage:', error)
    }
  }

  const loadAvailableModels = async () => {
    if (isLoadingModels.value) return

    isLoadingModels.value = true
    try {
      const { createLMStudioService } = await import('@/services/lmstudio')
      const service = createLMStudioService(lmStudioBaseUrl.value)
      const models = await service.getAvailableModels()
      availableModels.value = models
    } catch (error) {
      console.error('Failed to load available models:', error)
      availableModels.value = []
    } finally {
      isLoadingModels.value = false
    }
  }

  const setLMStudioBaseUrl = (url: string) => {
    lmStudioBaseUrl.value = url
    StatePersistence.saveLMStudioBaseUrl(url)
  }

  const loadLMStudioBaseUrlFromStorage = () => {
    try {
      const stored = StatePersistence.loadLMStudioBaseUrl()
      if (stored) lmStudioBaseUrl.value = stored
    } catch (err) {
      console.warn('Failed to load LM Studio base URL from storage:', err)
    }
  }

  // Validate if the base URL is properly set
  const isBaseUrlValid = () => {
    if (!lmStudioBaseUrl.value || lmStudioBaseUrl.value === '') {
      return false
    }

    try {
      new URL(lmStudioBaseUrl.value)
      return true
    } catch {
      return false
    }
  }

  // Clear the base URL (useful for logout or reset)
  const clearBaseUrl = () => {
    lmStudioBaseUrl.value = ''
    StatePersistence.saveLMStudioBaseUrl('')
  }

  return {
    // State
    currentModel,
    availableModels,
    isLoadingModels,
    lmStudioBaseUrl,

    // Actions
    setCurrentModel,
    loadCurrentModelFromStorage,
    loadAvailableModels,
    setLMStudioBaseUrl,
    loadLMStudioBaseUrlFromStorage,
    isBaseUrlValid,
    clearBaseUrl,
  }
})
