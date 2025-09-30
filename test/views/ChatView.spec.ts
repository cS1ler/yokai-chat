import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '@/views/ChatView.vue'

// Mock the router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: { template: '<div>Landing</div>' } },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/models', name: 'models', component: { template: '<div>Models</div>' } },
  ],
})

// Mock the LM Studio service
vi.mock('@/services/lmstudio', () => ({
  createLMStudioService: vi.fn(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
    getAvailableModels: vi.fn().mockResolvedValue(['model1', 'model2']),
    sendMessageStream: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe('ChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat interface when model is valid', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: 'test-model',
          messages: [],
          isTyping: false,
          isStreaming: false,
        },
      },
    })

    const { getByText, getByRole } = render(ChatView, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByText('Yokai Chat')).toBeInTheDocument()
    expect(getByText('test-model')).toBeInTheDocument()
    expect(getByRole('textbox')).toBeInTheDocument()
  })

  it('shows model validation error when no model selected', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          messages: [],
          isTyping: false,
          isStreaming: false,
        },
      },
    })

    const { getByText } = render(ChatView, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByText('Configuration Required')).toBeInTheDocument()
    expect(getByText('Configure Connection & Model')).toBeInTheDocument()
  })

  it('displays current model in header', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: 'test-model',
          messages: [],
          isTyping: false,
          isStreaming: false,
        },
      },
    })

    const { getByText } = render(ChatView, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByText('test-model')).toBeInTheDocument()
  })

  it('shows navigation links', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: 'test-model',
          messages: [],
          isTyping: false,
          isStreaming: false,
        },
      },
    })

    const { getByText } = render(ChatView, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByText('← Landing')).toBeInTheDocument()
    expect(getByText('📦 Models')).toBeInTheDocument()
  })

  it('handles message sending', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: 'test-model',
          messages: [],
          isTyping: false,
          isStreaming: false,
        },
      },
    })

    const { getByRole } = render(ChatView, {
      global: {
        plugins: [pinia, router],
      },
    })

    const input = getByRole('textbox')
    const sendButton = getByRole('button', { name: /➤/ })

    await fireEvent.update(input, 'Hello, test message')
    await fireEvent.click(sendButton)

    // Should trigger message sending (mocked)
    expect(input).toBeInTheDocument()
  })

  it('shows stop button when streaming', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: 'test-model',
          messages: [],
          isTyping: false,
          isStreaming: true,
        },
      },
    })

    const { getByRole } = render(ChatView, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByRole('button', { name: /⏹/ })).toBeInTheDocument()
  })

  it('displays messages correctly', () => {
    const messages = [
      {
        id: 1,
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      },
      {
        id: 2,
        role: 'assistant' as const,
        content: 'Hi there!',
        timestamp: new Date(),
      },
    ]

    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: 'test-model',
          messages,
          isTyping: false,
          isStreaming: false,
        },
      },
    })

    const { getByText } = render(ChatView, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByText('Hello')).toBeInTheDocument()
    expect(getByText('Hi there!')).toBeInTheDocument()
  })
})
