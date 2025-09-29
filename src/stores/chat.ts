import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, ChatState, ContextItem } from '@/types/chat'
import { DEFAULT_WELCOME_MESSAGE, APP_CONFIG } from '@/constants'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: DEFAULT_WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ])

  const isTyping = ref(false)
  const isStreaming = ref(false)
  const currentModel = ref<string>(APP_CONFIG.DEFAULT_MODEL)
  const error = ref<string | undefined>(undefined)
  const abortController = ref<AbortController | null>(null)
  const savedContexts = ref<ContextItem[]>([])
  const selectedContextIds = ref<string[]>([])
  const availableModels = ref<string[]>([])
  const isLoadingModels = ref(false)

  // Getters
  const chatState = computed<ChatState>(() => ({
    messages: messages.value,
    isTyping: isTyping.value,
    isStreaming: isStreaming.value,
    currentModel: currentModel.value,
    error: error.value,
  }))

  const lastMessage = computed(() => {
    return messages.value[messages.value.length - 1]
  })

  const messageCount = computed(() => messages.value.length)

  // Actions
  const addMessage = (message: Message) => {
    messages.value.push(message)

    // Limit messages to prevent memory issues
    if (messages.value.length > APP_CONFIG.MESSAGE_LIMITS.MAX_MESSAGES_PER_SESSION) {
      messages.value = messages.value.slice(-APP_CONFIG.MESSAGE_LIMITS.MAX_MESSAGES_PER_SESSION)
    }
  }

  const updateMessage = (id: number, updates: Partial<Message>) => {
    const messageIndex = messages.value.findIndex((m) => m.id === id)
    if (messageIndex !== -1) {
      // Create a new object to ensure reactivity
      const updatedMessage = { ...messages.value[messageIndex], ...updates }
      messages.value[messageIndex] = updatedMessage
    }
  }

  const removeMessage = (id: number) => {
    const index = messages.value.findIndex((m) => m.id === id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }

  const clearMessages = () => {
    messages.value = [
      {
        id: Date.now(),
        role: 'assistant',
        content: DEFAULT_WELCOME_MESSAGE,
        timestamp: new Date(),
      },
    ]
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  const setStreaming = (streaming: boolean) => {
    isStreaming.value = streaming
  }

  const setAbortController = (controller: AbortController | null) => {
    abortController.value = controller
  }

  const stopStreaming = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    setStreaming(false)
    setTyping(false)
  }

  // Context management
  const saveContext = (context: ContextItem) => {
    const existingIndex = savedContexts.value.findIndex((c) => c.id === context.id)
    if (existingIndex >= 0) {
      savedContexts.value[existingIndex] = context
    } else {
      savedContexts.value.push(context)
    }
    saveContextsToStorage()
  }

  const deleteContext = (id: string) => {
    const index = savedContexts.value.findIndex((c) => c.id === id)
    if (index >= -1) {
      savedContexts.value.splice(index, 1)
      // Remove from selected contexts if it was selected
      const selectedIndex = selectedContextIds.value.indexOf(id)
      if (selectedIndex >= 0) {
        selectedContextIds.value.splice(selectedIndex, 1)
      }
      saveContextsToStorage()
    }
  }

  const toggleContextSelection = (id: string) => {
    const index = selectedContextIds.value.indexOf(id)
    if (index >= 0) {
      selectedContextIds.value.splice(index, 1)
    } else {
      selectedContextIds.value.push(id)
    }
  }

  const getSelectedContexts = () => {
    return savedContexts.value.filter((c) => selectedContextIds.value.includes(c.id))
  }

  const clearSelectedContexts = () => {
    selectedContextIds.value = []
  }

  // Persistence
  const saveContextsToStorage = () => {
    try {
      localStorage.setItem('yokai-chat-contexts', JSON.stringify(savedContexts.value))
    } catch (error) {
      console.warn('Failed to save contexts to localStorage:', error)
    }
  }

  const loadContextsFromStorage = () => {
    try {
      const stored = localStorage.getItem('yokai-chat-contexts')
      if (stored) {
        savedContexts.value = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load contexts from localStorage:', error)
    }
  }

  const setError = (errorMessage: string | undefined) => {
    error.value = errorMessage
  }

  const setCurrentModel = (model: string) => {
    currentModel.value = model
    // Save to localStorage for persistence
    try {
      localStorage.setItem('yokai-chat-current-model', model)
    } catch (error) {
      console.warn('Failed to save current model to localStorage:', error)
    }
  }

  const loadCurrentModelFromStorage = () => {
    try {
      const stored = localStorage.getItem('yokai-chat-current-model')
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
      const { lmStudioService } = await import('@/services/lmstudio')
      const models = await lmStudioService.getAvailableModels()
      availableModels.value = models
    } catch (error) {
      console.error('Failed to load available models:', error)
      availableModels.value = []
    } finally {
      isLoadingModels.value = false
    }
  }

  const clearError = () => {
    error.value = undefined
  }

  // Helper methods
  const createUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    addMessage(message)
    return message
  }

  const createAssistantMessage = () => {
    const message: Message = {
      id: Date.now(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    addMessage(message)
    return message
  }

  return {
    // State
    messages,
    isTyping,
    isStreaming,
    currentModel,
    error,
    savedContexts,
    selectedContextIds,
    availableModels,
    isLoadingModels,

    // Getters
    chatState,
    lastMessage,
    messageCount,

    // Actions
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    setTyping,
    setStreaming,
    setAbortController,
    stopStreaming,
    setError,
    setCurrentModel,
    clearError,

    // Model management
    loadCurrentModelFromStorage,
    loadAvailableModels,

    // Context management
    saveContext,
    deleteContext,
    toggleContextSelection,
    getSelectedContexts,
    clearSelectedContexts,
    loadContextsFromStorage,

    // Helpers
    createUserMessage,
    createAssistantMessage,
  }
})
