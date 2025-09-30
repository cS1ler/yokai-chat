import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/vue'
import { createTestingPinia } from '@pinia/testing'
import MessageList from '@/components/MessageList.vue'
import type { Message } from '@/types/chat'

describe('MessageList', () => {
  const mockMessages: Message[] = [
    {
      id: 1,
      role: 'user',
      content: 'Hello, how are you?',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 2,
      role: 'assistant',
      content: 'I am doing well, thank you for asking!',
      timestamp: new Date('2024-01-01T10:01:00Z'),
    },
    {
      id: 3,
      role: 'developer',
      content: '[CONTEXT] Test context information',
      timestamp: new Date('2024-01-01T10:02:00Z'),
    },
  ]

  it('renders messages correctly', () => {
    const { getByText } = render(MessageList, {
      props: { messages: mockMessages },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    expect(getByText('Hello, how are you?')).toBeInTheDocument()
    expect(getByText('I am doing well, thank you for asking!')).toBeInTheDocument()
    expect(getByText('[CONTEXT] Test context information')).toBeInTheDocument()
  })

  it('applies correct CSS classes for different message roles', () => {
    const { container } = render(MessageList, {
      props: { messages: mockMessages },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const userMessage = container.querySelector('.message-user')
    const assistantMessage = container.querySelector('.message-assistant')
    const developerMessage = container.querySelector('.message-developer')

    expect(userMessage).toBeInTheDocument()
    expect(assistantMessage).toBeInTheDocument()
    expect(developerMessage).toBeInTheDocument()
  })

  it('shows typing indicator when isTyping is true', () => {
    const { getByText } = render(MessageList, {
      props: { messages: mockMessages, isTyping: true },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    // Assuming TypingIndicator shows some text
    expect(getByText(/typing/i)).toBeInTheDocument()
  })

  it('does not show typing indicator when isTyping is false', () => {
    const { queryByText } = render(MessageList, {
      props: { messages: mockMessages, isTyping: false },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    expect(queryByText(/typing/i)).not.toBeInTheDocument()
  })

  it('handles empty messages array', () => {
    const { container } = render(MessageList, {
      props: { messages: [] },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const messages = container.querySelectorAll('.message')
    expect(messages).toHaveLength(0)
  })

  it('uses virtual scrolling for large message lists', () => {
    const largeMessages = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      role: 'user' as const,
      content: `Message ${i + 1}`,
      timestamp: new Date(),
    }))

    const { container } = render(MessageList, {
      props: {
        messages: largeMessages,
        useVirtualScrolling: true,
        virtualScrollingThreshold: 100,
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    // Should use VirtualMessageList component
    expect(container.querySelector('.virtual-message-list-container')).toBeInTheDocument()
  })

  it('uses regular rendering for small message lists', () => {
    const { container } = render(MessageList, {
      props: {
        messages: mockMessages,
        useVirtualScrolling: true,
        virtualScrollingThreshold: 100,
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    // Should use regular message list
    expect(container.querySelector('.message-list-container')).toBeInTheDocument()
  })
})
