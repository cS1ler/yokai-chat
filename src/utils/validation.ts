import type { Message, ContextItem, ChatState } from '@/types/chat'
import { PROGRAMMING_LANGUAGES, CONTEXT_TYPES } from '@/constants'

// Type Guards
export function isMessage(obj: unknown): obj is Message {
  if (!obj || typeof obj !== 'object') return false

  const message = obj as Record<string, unknown>

  return (
    typeof message.id === 'number' &&
    typeof message.role === 'string' &&
    ['user', 'assistant', 'developer'].includes(message.role) &&
    typeof message.content === 'string' &&
    (message.timestamp === undefined || message.timestamp instanceof Date) &&
    (message.context === undefined || Array.isArray(message.context))
  )
}

export function isContextItem(obj: unknown): obj is ContextItem {
  if (!obj || typeof obj !== 'object') return false

  const context = obj as Record<string, unknown>

  return (
    typeof context.id === 'string' &&
    typeof context.type === 'string' &&
    CONTEXT_TYPES.some((t) => t.value === context.type) &&
    typeof context.title === 'string' &&
    typeof context.content === 'string' &&
    (context.language === undefined ||
      PROGRAMMING_LANGUAGES.some((l) => l.value === context.language))
  )
}

export function isChatState(obj: unknown): obj is ChatState {
  if (!obj || typeof obj !== 'object') return false

  const state = obj as Record<string, unknown>

  return (
    Array.isArray(state.messages) &&
    state.messages.every(isMessage) &&
    typeof state.isTyping === 'boolean' &&
    typeof state.isStreaming === 'boolean' &&
    typeof state.currentModel === 'string' &&
    (state.error === undefined || typeof state.error === 'string')
  )
}

// Validation Functions
export function validateMessage(message: unknown): Message {
  if (!isMessage(message)) {
    throw new Error('Invalid message format')
  }
  return message
}

export function validateContextItem(context: unknown): ContextItem {
  if (!isContextItem(context)) {
    throw new Error('Invalid context item format')
  }
  return context
}

export function validateChatState(state: unknown): ChatState {
  if (!isChatState(state)) {
    throw new Error('Invalid chat state format')
  }
  return state
}

// Sanitization Functions
export function sanitizeMessage(message: Message): Message {
  return {
    id: Math.max(0, Math.floor(message.id)),
    role: message.role,
    content: String(message.content).trim(),
    timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(),
    context: message.context?.filter(isContextItem) || undefined,
  }
}

export function sanitizeContextItem(context: ContextItem): ContextItem {
  return {
    id: String(context.id).trim(),
    type: context.type,
    title: String(context.title).trim(),
    content: String(context.content).trim(),
    language: context.language,
  }
}

// State Validation
export function validateMessagesArray(messages: unknown[]): Message[] {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array')
  }

  return messages.map((msg, index) => {
    try {
      return validateMessage(msg)
    } catch (error) {
      throw new Error(
        `Invalid message at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  })
}

export function validateContextsArray(contexts: unknown[]): ContextItem[] {
  if (!Array.isArray(contexts)) {
    throw new Error('Contexts must be an array')
  }

  return contexts.map((ctx, index) => {
    try {
      return validateContextItem(ctx)
    } catch (error) {
      throw new Error(
        `Invalid context at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  })
}

// Safe Parsing Functions
export function safeParseJSON<T>(json: string, validator: (obj: unknown) => obj is T): T | null {
  try {
    const parsed = JSON.parse(json)
    if (validator(parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function safeParseMessages(json: string): Message[] | null {
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) {
      return validateMessagesArray(parsed)
    }
    return null
  } catch {
    return null
  }
}

export function safeParseContexts(json: string): ContextItem[] | null {
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) {
      return validateContextsArray(parsed)
    }
    return null
  } catch {
    return null
  }
}

// Storage Validation
export function validateStorageData(key: string, data: unknown): boolean {
  switch (key) {
    case 'yokai-chat-contexts':
      return Array.isArray(data) && data.every(isContextItem)
    case 'yokai-chat-active-contexts':
      return Array.isArray(data) && data.every((id) => typeof id === 'string')
    case 'yokai-chat-current-model':
      return typeof data === 'string' && data.length > 0
    case 'yokai-chat-lmstudio-base-url':
      return typeof data === 'string'
    default:
      return false
  }
}

// Error Handling for Validation
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function createValidationError(message: string, field?: string): ValidationError {
  return new ValidationError(message, field)
}
