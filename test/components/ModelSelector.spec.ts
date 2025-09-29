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
})


