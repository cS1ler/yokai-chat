import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chat'
import type { Message } from '@/types/chat'

describe('Chat Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const store = useChatStore()

    expect(store.messages).toBeDefined()
    expect(store.isTyping).toBe(false)
    expect(store.isStreaming).toBe(false)
    expect(store.error).toBeUndefined()
  })

  it('adds messages correctly', () => {
    const store = useChatStore()
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test message',
      timestamp: new Date(),
    }

    store.addMessage(message)

    expect(store.messages).toContain(message)
    expect(store.messageCount).toBe(2) // 1 default + 1 added
  })

  it('updates messages correctly', () => {
    const store = useChatStore()
    const message: Message = {
      id: 1,
      role: 'assistant',
      content: 'Initial content',
      timestamp: new Date(),
    }

    store.addMessage(message)
    store.updateMessage(1, { content: 'Updated content' })

    const updatedMessage = store.messages.find((m) => m.id === 1)
    expect(updatedMessage?.content).toBe('Updated content')
  })

  it('removes messages correctly', () => {
    const store = useChatStore()
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test message',
      timestamp: new Date(),
    }

    store.addMessage(message)
    expect(store.messageCount).toBe(2)

    store.removeMessage(1)
    expect(store.messageCount).toBe(1)
  })

  it('clears all messages', () => {
    const store = useChatStore()
    const message: Message = {
      id: 1,
      role: 'user',
      content: 'Test message',
      timestamp: new Date(),
    }

    store.addMessage(message)
    expect(store.messageCount).toBe(2)

    store.clearMessages()
    expect(store.messageCount).toBe(1) // Only default welcome message remains
  })

  it('sets typing state', () => {
    const store = useChatStore()

    store.setTyping(true)
    expect(store.isTyping).toBe(true)

    store.setTyping(false)
    expect(store.isTyping).toBe(false)
  })

  it('sets streaming state', () => {
    const store = useChatStore()

    store.setStreaming(true)
    expect(store.isStreaming).toBe(true)

    store.setStreaming(false)
    expect(store.isStreaming).toBe(false)
  })

  it('sets error state', () => {
    const store = useChatStore()

    store.setError('Test error')
    expect(store.error).toBe('Test error')

    store.clearError()
    expect(store.error).toBeUndefined()
  })

  it('creates user message', () => {
    const store = useChatStore()
    const initialCount = store.messageCount

    const message = store.createUserMessage('Hello')

    expect(store.messageCount).toBe(initialCount + 1)
    expect(message.role).toBe('user')
    expect(message.content).toBe('Hello')
  })

  it('creates assistant message', () => {
    const store = useChatStore()
    const initialCount = store.messageCount

    const message = store.createAssistantMessage()

    expect(store.messageCount).toBe(initialCount + 1)
    expect(message.role).toBe('assistant')
    expect(message.content).toBe('')
  })

  it('gets last messages correctly', () => {
    const store = useChatStore()

    // Add multiple messages
    store.createUserMessage('Message 1')
    store.createUserMessage('Message 2')
    store.createUserMessage('Message 3')

    const lastMessages = store.getLastMessages(2)
    expect(lastMessages).toHaveLength(2)
    expect(lastMessages[0].content).toBe('Message 2')
    expect(lastMessages[1].content).toBe('Message 3')
  })

  it('stops streaming correctly', () => {
    const store = useChatStore()

    // Set up streaming state
    store.setStreaming(true)
    store.setTyping(true)

    store.stopStreaming()

    expect(store.isStreaming).toBe(false)
    expect(store.isTyping).toBe(false)
  })
})
