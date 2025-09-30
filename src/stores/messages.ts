import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/types/chat'
import { DEFAULT_WELCOME_MESSAGE, APP_CONFIG } from '@/constants'
import { StatePersistence } from '@/utils/persistence'

export const useMessagesStore = defineStore('messages', () => {
  // State - Use regular ref for better reactivity
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

    // Persist to storage
    saveMessagesToStorage()
  }

  const updateMessage = (id: number, updates: Partial<Message>) => {
    console.log('updateMessage called with id:', id, 'updates:', updates)
    console.log(
      'Current messages:',
      messages.value.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content.substring(0, 50) + '...',
      })),
    )

    const messageIndex = messages.value.findIndex((m) => m.id === id)
    console.log('Message index found:', messageIndex)

    if (messageIndex !== -1) {
      // Create a new array with updated message
      const newMessages = [...messages.value]
      const oldMessage = newMessages[messageIndex]
      newMessages[messageIndex] = { ...newMessages[messageIndex], ...updates }

      console.log('Old message content:', oldMessage.content)
      console.log('New message content:', newMessages[messageIndex].content)

      messages.value = newMessages
      saveMessagesToStorage()

      console.log('Message updated successfully')
    } else {
      console.log('Message not found with id:', id)
    }
  }

  const removeMessage = (id: number) => {
    const index = messages.value.findIndex((m) => m.id === id)
    if (index > -1) {
      const newMessages = messages.value.filter((_, i) => i !== index)
      messages.value = newMessages
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
    console.log('createAssistantMessage - created message with id:', message.id)
    addMessage(message)
    console.log('createAssistantMessage - message added to store')
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
