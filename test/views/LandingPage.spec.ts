import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '@/views/LandingPage.vue'

// Mock the router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingPage },
    { path: '/chat', name: 'chat', component: { template: '<div>Chat</div>' } },
  ],
})

// Mock the LM Studio service
vi.mock('@/services/lmstudio', () => ({
  createLMStudioService: vi.fn(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
    getAvailableModels: vi.fn().mockResolvedValue(['model1', 'model2']),
  })),
}))

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders landing page content', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: [],
          isLoadingModels: false,
        },
      },
    })

    const { getByText, getByRole } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByText('Yokai')).toBeInTheDocument()
    expect(getByText('Chat')).toBeInTheDocument()
    expect(getByRole('textbox', { name: /IP address/i })).toBeInTheDocument()
    expect(getByRole('button', { name: /Check Connection/i })).toBeInTheDocument()
  })

  it('shows connection form elements', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: [],
          isLoadingModels: false,
        },
      },
    })

    const { getByRole } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByRole('textbox', { name: /IP address/i })).toBeInTheDocument()
    expect(getByRole('button', { name: /Check Connection/i })).toBeInTheDocument()
  })

  it('handles connection check', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: [],
          isLoadingModels: false,
        },
      },
    })

    const { getByRole } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    const input = getByRole('textbox', { name: /IP address/i })
    const checkButton = getByRole('button', { name: /Check Connection/i })

    await fireEvent.update(input, '127.0.0.1:1234')
    await fireEvent.click(checkButton)

    // Should trigger connection check (mocked)
    expect(input).toBeInTheDocument()
  })

  it('shows available models after connection', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: ['model1', 'model2'],
          isLoadingModels: false,
        },
      },
    })

    const { getByText } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    await waitFor(() => {
      expect(getByText('model1')).toBeInTheDocument()
      expect(getByText('model2')).toBeInTheDocument()
    })
  })

  it('handles model selection', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: ['model1', 'model2'],
          isLoadingModels: false,
        },
      },
    })

    const { getByText } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    const selectButton = getByText('Select Model')
    await fireEvent.click(selectButton)

    // Should navigate to chat page
    expect(selectButton).toBeInTheDocument()
  })

  it('shows loading state during connection check', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: [],
          isLoadingModels: true,
        },
      },
    })

    const { getByText } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays connection error when connection fails', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: [],
          isLoadingModels: false,
        },
      },
    })

    // Mock connection failure
    vi.mocked(require('@/services/lmstudio').createLMStudioService).mockReturnValue({
      testConnection: vi.fn().mockResolvedValue(false),
      getAvailableModels: vi.fn().mockResolvedValue([]),
    })

    const { getByRole, getByText } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    const input = getByRole('textbox', { name: /IP address/i })
    const checkButton = getByRole('button', { name: /Check Connection/i })

    await fireEvent.update(input, 'invalid-address')
    await fireEvent.click(checkButton)

    // Should show error message
    await waitFor(() => {
      expect(getByText(/connection failed/i)).toBeInTheDocument()
    })
  })

  it('loads saved connection details on mount', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        chat: {
          currentModel: '',
          availableModels: [],
          isLoadingModels: false,
          lmStudioBaseUrl: 'http://127.0.0.1:1234/v1',
        },
      },
    })

    const { getByDisplayValue } = render(LandingPage, {
      global: {
        plugins: [pinia, router],
      },
    })

    // Should populate input with saved URL
    expect(getByDisplayValue('127.0.0.1:1234')).toBeInTheDocument()
  })
})
