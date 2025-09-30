import { defineStore } from 'pinia'
import { ref } from 'vue'
import { StatePersistence } from '@/utils/persistence'

export const useModelsStore = defineStore('models', () => {
  // State
  const currentModel = ref<string>('') // Start empty, will be set by user selection
  const availableModels = ref<string[]>([])
  const isLoadingModels = ref(false)
  const lmStudioBaseUrl = ref<string>('') // Start with empty string, will be set by user

  // Actions
  const setCurrentModel = (model: string) => {
    console.log('setCurrentModel called with:', model)
    // Only set if model is not empty
    if (model && model.trim() !== '') {
      currentModel.value = model
      StatePersistence.saveCurrentModel(model)
      console.log('Model set and saved:', model)
    } else {
      currentModel.value = ''
      StatePersistence.saveCurrentModel('')
      console.log('Model cleared')
    }
  }

  const loadCurrentModelFromStorage = () => {
    try {
      const stored = StatePersistence.loadCurrentModel()
      console.log('loadCurrentModelFromStorage - stored value:', stored)
      if (stored && stored.trim() !== '') {
        // Force reactivity update by using a new reference
        const trimmedModel = stored.trim()
        currentModel.value = trimmedModel
        console.log('Model loaded from storage:', stored)
        console.log('Current model value after load:', currentModel.value)
        console.log('Store currentModel ref value:', currentModel.value)
      } else {
        currentModel.value = '' // Ensure empty string if no valid model stored
        console.log('No valid model in storage, set to empty')
      }
    } catch (error) {
      console.warn('Failed to load current model from localStorage:', error)
      currentModel.value = '' // Ensure empty string on error
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
    console.log('setLMStudioBaseUrl called with:', url)
    lmStudioBaseUrl.value = url
    StatePersistence.saveLMStudioBaseUrl(url)
    console.log('Base URL set and saved:', url)
  }

  const loadLMStudioBaseUrlFromStorage = () => {
    try {
      const stored = StatePersistence.loadLMStudioBaseUrl()
      console.log('loadLMStudioBaseUrlFromStorage - stored value:', stored)
      if (stored) {
        lmStudioBaseUrl.value = stored
        console.log('Base URL loaded from storage:', stored)
      } else {
        console.log('No base URL in storage')
      }
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

  // Force refresh of current model from storage
  const refreshCurrentModel = () => {
    console.log('refreshCurrentModel called')
    loadCurrentModelFromStorage()
    return currentModel.value
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
    refreshCurrentModel,
  }
})
