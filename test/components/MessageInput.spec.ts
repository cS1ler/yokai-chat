import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import { createTestingPinia } from '@pinia/testing'
import MessageInput from '@/components/MessageInput.vue'

describe('MessageInput', () => {
  it('disables send when no message and no context', async () => {
    const { getByRole } = render(MessageInput, {
      props: { isStreaming: false },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const sendButton = getByRole('button', { name: /➤/ }) as HTMLButtonElement
    expect(sendButton.disabled).toBe(true)
  })

  it('enables send when message is provided', async () => {
    const { getByRole } = render(MessageInput, {
      props: { isStreaming: false },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const input = getByRole('textbox') as HTMLInputElement
    await fireEvent.update(input, 'hello')

    const sendButton = getByRole('button', { name: /➤/ }) as HTMLButtonElement
    expect(sendButton.disabled).toBe(false)
  })

  it('emits send with message when form submitted', async () => {
    const { getByRole, emitted } = render(MessageInput, {
      props: { isStreaming: false },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const input = getByRole('textbox') as HTMLInputElement
    await fireEvent.update(input, 'hello')
    const sendButton = getByRole('button', { name: /➤/ })
    await fireEvent.click(sendButton)

    const events = emitted()
    expect(events.send).toBeTruthy()
    expect(events.send[0][0]).toBe('hello')
  })

  it('shows stop button when streaming', async () => {
    const { getByRole } = render(MessageInput, {
      props: { isStreaming: true },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const stopButton = getByRole('button', { name: /⏹/ })
    expect(stopButton).toBeInTheDocument()
  })

  it('emits stop when stop button clicked', async () => {
    const { getByRole, emitted } = render(MessageInput, {
      props: { isStreaming: true },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const stopButton = getByRole('button', { name: /⏹/ })
    await fireEvent.click(stopButton)

    const events = emitted()
    expect(events.stop).toBeTruthy()
  })

  it('handles Enter key to send message', async () => {
    const { getByRole, emitted } = render(MessageInput, {
      props: { isStreaming: false },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const input = getByRole('textbox') as HTMLInputElement
    await fireEvent.update(input, 'hello')
    await fireEvent.keyDown(input, { key: 'Enter' })

    const events = emitted()
    expect(events.send).toBeTruthy()
    expect(events.send[0][0]).toBe('hello')
  })
})
