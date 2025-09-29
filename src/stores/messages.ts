import { defineStore } from 'pinia'
import { ref, computed, shallowRef, triggerRef } from 'vue'
import type { Message } from '@/types/chat'
import { DEFAULT_WELCOME_MESSAGE, APP_CONFIG } from '@/constants'
import { StatePersistence } from '@/utils/persistence'

export const useMessagesStore = defineStore('messages', () => {
  // State - Use shallowRef for better performance with large arrays
  const messages = shallowRef<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: DEFAULT_WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ])

  const isTyping = ref(false)
  const isStreaming = ref(false)
  const error = ref<string | undefined>(undefined)
  const abortController = ref<AbortController | null>(null)

  // Getters
  const lastMessage = computed(() => {
    return messages.value[messages.value.length - 1]
  })

  const messageCount = computed(() => messages.value.length)

  // Get last N messages for AI memory
  const getLastMessages = (count: number = 10) => {
    return messages.value.slice(-count)
  }

  // Actions
  const addMessage = (message: Message) => {
    const newMessages = [...messages.value, message]

    // Limit messages to prevent memory issues
    if (newMessages.length > APP_CONFIG.MESSAGE_LIMITS.MAX_MESSAGES_PER_SESSION) {
      messages.value = newMessages.slice(-APP_CONFIG.MESSAGE_LIMITS.MAX_MESSAGES_PER_SESSION)
    } else {
      messages.value = newMessages
    }

    // Trigger reactivity manually for shallowRef
    triggerRef(messages)

    // Persist to storage
    saveMessagesToStorage()
  }

  const updateMessage = (id: number, updates: Partial<Message>) => {
    const messageIndex = messages.value.findIndex((m) => m.id === id)
    if (messageIndex !== -1) {
      // Create a new array with updated message
      const newMessages = [...messages.value]
      newMessages[messageIndex] = { ...newMessages[messageIndex], ...updates }
      messages.value = newMessages

      // Trigger reactivity manually for shallowRef
      triggerRef(messages)
      saveMessagesToStorage()
    }
  }

  const removeMessage = (id: number) => {
    const index = messages.value.findIndex((m) => m.id === id)
    if (index > -1) {
      const newMessages = messages.value.filter((_, i) => i !== index)
      messages.value = newMessages

      // Trigger reactivity manually for shallowRef
      triggerRef(messages)
      saveMessagesToStorage()
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

    // Trigger reactivity manually for shallowRef
    triggerRef(messages)
    saveMessagesToStorage()
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

  const setError = (errorMessage: string | undefined) => {
    error.value = errorMessage
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

  // Persistence methods
  const saveMessagesToStorage = () => {
    try {
      StatePersistence.saveMessages(messages.value)
    } catch (error) {
      console.warn('Failed to save messages to storage:', error)
    }
  }

  const loadMessagesFromStorage = () => {
    try {
      const storedMessages = StatePersistence.loadMessages()
      if (storedMessages.length > 0) {
        messages.value = storedMessages
      }
    } catch (error) {
      console.warn('Failed to load messages from storage:', error)
    }
  }

  return {
    // State
    messages,
    isTyping,
    isStreaming,
    error,
    abortController,

    // Getters
    lastMessage,
    messageCount,
    getLastMessages,

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
    clearError,

    // Helpers
    createUserMessage,
    createAssistantMessage,

    // Persistence
    saveMessagesToStorage,
    loadMessagesFromStorage,
  }
})
