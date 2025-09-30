import type { Message, ContextItem } from '@/types/chat'
import {
  validateMessagesArray,
  validateContextsArray,
  validateStorageData,
  safeParseMessages,
  safeParseContexts,
  ValidationError,
} from './validation'

// Storage Keys
export const STORAGE_KEYS = {
  MESSAGES: 'yokai-chat-messages',
  CONTEXTS: 'yokai-chat-contexts',
  ACTIVE_CONTEXTS: 'yokai-chat-active-contexts',
  CURRENT_MODEL: 'yokai-chat-current-model',
  LMSTUDIO_BASE_URL: 'yokai-chat-lmstudio-base-url',
} as const

// Serialization/Deserialization
export class StatePersistence {
  // Messages
  static saveMessages(messages: Message[]): void {
    try {
      const serialized = JSON.stringify(messages)
      localStorage.setItem(STORAGE_KEYS.MESSAGES, serialized)
    } catch (error) {
      console.warn('Failed to save messages to localStorage:', error)
      throw new ValidationError('Failed to save messages', 'messages')
    }
  }

  static loadMessages(): Message[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES)
      if (!stored) return []

      const parsed = safeParseMessages(stored)
      if (!parsed) {
        console.warn('Invalid messages data in localStorage, clearing...')
        localStorage.removeItem(STORAGE_KEYS.MESSAGES)
        return []
      }

      return parsed
    } catch (error) {
      console.warn('Failed to load messages from localStorage:', error)
      return []
    }
  }

  // Contexts
  static saveContexts(contexts: ContextItem[]): void {
    try {
      console.log('StatePersistence.saveContexts called with:', contexts.length, 'contexts')
      const serialized = JSON.stringify(contexts)
      localStorage.setItem(STORAGE_KEYS.CONTEXTS, serialized)
      console.log('Contexts serialized and saved to localStorage with key:', STORAGE_KEYS.CONTEXTS)
    } catch (error) {
      console.warn('Failed to save contexts to localStorage:', error)
      throw new ValidationError('Failed to save contexts', 'contexts')
    }
  }

  static loadContexts(): ContextItem[] {
    try {
      console.log('StatePersistence.loadContexts called, checking localStorage for key:', STORAGE_KEYS.CONTEXTS)
      const stored = localStorage.getItem(STORAGE_KEYS.CONTEXTS)
      console.log('Raw stored data:', stored)
      if (!stored) {
        console.log('No stored contexts found')
        return []
      }

      const parsed = safeParseContexts(stored)
      if (!parsed) {
        console.warn('Invalid contexts data in localStorage, clearing...')
        localStorage.removeItem(STORAGE_KEYS.CONTEXTS)
        return []
      }

      console.log('Successfully loaded', parsed.length, 'contexts from localStorage')
      return parsed
    } catch (error) {
      console.warn('Failed to load contexts from localStorage:', error)
      return []
    }
  }

  // Active Contexts
  static saveActiveContexts(contextIds: string[]): void {
    try {
      const serialized = JSON.stringify(contextIds)
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONTEXTS, serialized)
    } catch (error) {
      console.warn('Failed to save active contexts to localStorage:', error)
    }
  }

  static loadActiveContexts(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONTEXTS)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
        console.warn('Invalid active contexts data in localStorage, clearing...')
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONTEXTS)
        return []
      }

      return parsed
    } catch (error) {
      console.warn('Failed to load active contexts from localStorage:', error)
      return []
    }
  }

  // Current Model
  static saveCurrentModel(model: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_MODEL, model)
    } catch (error) {
      console.warn('Failed to save current model to localStorage:', error)
    }
  }

  static loadCurrentModel(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_MODEL)
      return stored || null
    } catch (error) {
      console.warn('Failed to load current model from localStorage:', error)
      return null
    }
  }

  // LM Studio Base URL
  static saveLMStudioBaseUrl(url: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LMSTUDIO_BASE_URL, url)
    } catch (error) {
      console.warn('Failed to save LM Studio base URL to localStorage:', error)
    }
  }

  static loadLMStudioBaseUrl(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LMSTUDIO_BASE_URL)
      return stored || null
    } catch (error) {
      console.warn('Failed to load LM Studio base URL from localStorage:', error)
      return null
    }
  }

  // Clear all data
  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  // Export/Import functionality
  static exportState(): string {
    try {
      const state = {
        messages: this.loadMessages(),
        contexts: this.loadContexts(),
        activeContexts: this.loadActiveContexts(),
        currentModel: this.loadCurrentModel(),
        lmStudioBaseUrl: this.loadLMStudioBaseUrl(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }

      return JSON.stringify(state, null, 2)
    } catch (error) {
      throw new ValidationError('Failed to export state', 'export')
    }
  }

  static importState(json: string): void {
    try {
      const state = JSON.parse(json)

      // Validate the imported state
      if (!state.version || !state.timestamp) {
        throw new ValidationError('Invalid state format', 'import')
      }

      // Import each part with validation
      if (state.messages) {
        const messages = validateMessagesArray(state.messages)
        this.saveMessages(messages)
      }

      if (state.contexts) {
        const contexts = validateContextsArray(state.contexts)
        this.saveContexts(contexts)
      }

      if (state.activeContexts) {
        if (
          Array.isArray(state.activeContexts) &&
          state.activeContexts.every((id) => typeof id === 'string')
        ) {
          this.saveActiveContexts(state.activeContexts)
        }
      }

      if (state.currentModel && typeof state.currentModel === 'string') {
        this.saveCurrentModel(state.currentModel)
      }

      if (state.lmStudioBaseUrl && typeof state.lmStudioBaseUrl === 'string') {
        this.saveLMStudioBaseUrl(state.lmStudioBaseUrl)
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new ValidationError('Failed to import state', 'import')
    }
  }

  // Health check
  static checkStorageHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = []

    try {
      // Check if localStorage is available
      const testKey = 'yokai-chat-health-check'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
    } catch {
      issues.push('localStorage is not available')
    }

    // Check each stored value
    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (!validateStorageData(key, parsed)) {
            issues.push(`Invalid data format for ${key}`)
          }
        }
      } catch {
        issues.push(`Corrupted data for ${key}`)
      }
    })

    return {
      healthy: issues.length === 0,
      issues,
    }
  }
}
