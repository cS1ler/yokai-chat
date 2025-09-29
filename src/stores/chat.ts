import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { ChatState } from '@/types/chat'
import { useMessagesStore } from './messages'
import { useContextsStore } from './contexts'
import { useModelsStore } from './models'

export const useChatStore = defineStore('chat', () => {
  // Import individual stores
  const messagesStore = useMessagesStore()
  const contextsStore = useContextsStore()
  const modelsStore = useModelsStore()

  // Computed state that combines all stores
  const chatState = computed<ChatState>(() => ({
    messages: messagesStore.messages,
    isTyping: messagesStore.isTyping,
    isStreaming: messagesStore.isStreaming,
    currentModel: modelsStore.currentModel,
    error: messagesStore.error,
  }))

  // Re-export all store methods for convenience
  return {
    // Messages
    messages: messagesStore.messages,
    isTyping: messagesStore.isTyping,
    isStreaming: messagesStore.isStreaming,
    error: messagesStore.error,
    abortController: messagesStore.abortController,
    lastMessage: messagesStore.lastMessage,
    messageCount: messagesStore.messageCount,
    getLastMessages: messagesStore.getLastMessages,
    addMessage: messagesStore.addMessage,
    updateMessage: messagesStore.updateMessage,
    removeMessage: messagesStore.removeMessage,
    clearMessages: messagesStore.clearMessages,
    setTyping: messagesStore.setTyping,
    setStreaming: messagesStore.setStreaming,
    setAbortController: messagesStore.setAbortController,
    stopStreaming: messagesStore.stopStreaming,
    setError: messagesStore.setError,
    clearError: messagesStore.clearError,
    createUserMessage: messagesStore.createUserMessage,
    createAssistantMessage: messagesStore.createAssistantMessage,

    // Contexts
    savedContexts: contextsStore.savedContexts,
    selectedContextIds: contextsStore.selectedContextIds,
    activeContextIds: contextsStore.activeContextIds,
    saveContext: contextsStore.saveContext,
    deleteContext: contextsStore.deleteContext,
    toggleContextSelection: contextsStore.toggleContextSelection,
    getSelectedContexts: contextsStore.getSelectedContexts,
    getActiveContexts: contextsStore.getActiveContexts,
    clearSelectedContexts: contextsStore.clearSelectedContexts,
    setActiveContexts: contextsStore.setActiveContexts,
    toggleActiveContext: contextsStore.toggleActiveContext,
    clearActiveContexts: contextsStore.clearActiveContexts,
    loadActiveContextsFromStorage: contextsStore.loadActiveContextsFromStorage,
    loadContextsFromStorage: contextsStore.loadContextsFromStorage,

    // Models
    currentModel: modelsStore.currentModel,
    availableModels: modelsStore.availableModels,
    isLoadingModels: modelsStore.isLoadingModels,
    lmStudioBaseUrl: modelsStore.lmStudioBaseUrl,
    setCurrentModel: modelsStore.setCurrentModel,
    loadCurrentModelFromStorage: modelsStore.loadCurrentModelFromStorage,
    loadAvailableModels: modelsStore.loadAvailableModels,
    setLMStudioBaseUrl: modelsStore.setLMStudioBaseUrl,
    loadLMStudioBaseUrlFromStorage: modelsStore.loadLMStudioBaseUrlFromStorage,

    // Combined state
    chatState,
  }
})
