import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import { createTestingPinia } from '@pinia/testing'
import ModelSelector from '@/components/ModelSelector.vue'

describe('ModelSelector', () => {
  it('renders current model from store', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn, initialState: {
      chat: { currentModel: 'test-model', availableModels: ['test-model', 'other'] },
    } })

    const { getByText } = render(ModelSelector, {
      global: { plugins: [pinia] },
    })

    expect(getByText('test-model')).toBeInTheDocument()
  })

  it('shows available models in dropdown', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn, initialState: {
      chat: { currentModel: 'test-model', availableModels: ['test-model', 'other-model'] },
    } })

    const { getByText, getByRole } = render(ModelSelector, {
      global: { plugins: [pinia] },
    })

    const select = getByRole('combobox')
    await fireEvent.click(select)

    expect(getByText('other-model')).toBeInTheDocument()
  })

  it('emits model change when selection changes', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn, initialState: {
      chat: { currentModel: 'test-model', availableModels: ['test-model', 'other-model'] },
    } })

    const { getByRole, emitted } = render(ModelSelector, {
      global: { plugins: [pinia] },
    })

    const select = getByRole('combobox')
    await fireEvent.update(select, 'other-model')

    const events = emitted()
    expect(events['update:model']).toBeTruthy()
    expect(events['update:model'][0][0]).toBe('other-model')
  })

  it('shows loading state when models are loading', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn, initialState: {
      chat: { currentModel: '', availableModels: [], isLoadingModels: true },
    } })

    const { getByText } = render(ModelSelector, {
      global: { plugins: [pinia] },
    })

    expect(getByText(/loading/i)).toBeInTheDocument()
  })
})


