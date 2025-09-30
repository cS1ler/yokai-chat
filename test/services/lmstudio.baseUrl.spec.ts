import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLMStudioService } from '@/services/lmstudio'

describe('LMStudioService baseUrl', () => {
  const baseUrl = 'http://example.com:1234/v1'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('prefixes models request with provided baseUrl', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]) as any,
      json: async () => ({ data: [] }),
    } as any)

    await service.getAvailableModels()
    expect(fetchSpy).toHaveBeenCalledWith(`${baseUrl}/models`, expect.anything())
  })

  it('prefixes chat completions request with provided baseUrl', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]) as any,
      json: async () => ({ choices: [] }),
    } as any)

    await service.testChat('test-model')
    expect(fetchSpy).toHaveBeenCalledWith(`${baseUrl}/chat/completions`, expect.anything())
  })

  it('handles connection test with provided baseUrl', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
    } as any)

    const result = await service.testConnection()
    expect(result).toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith(`${baseUrl}/models`, expect.anything())
  })

  it('handles streaming requests with provided baseUrl', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () => Promise.resolve({ done: true, value: undefined })
        })
      }
    } as any)

    await service.sendMessageStream(
      'test message',
      'test-model',
      () => {},
      () => {},
      new AbortController(),
      []
    )

    expect(fetchSpy).toHaveBeenCalledWith(`${baseUrl}/chat/completions`, expect.anything())
  })
})
