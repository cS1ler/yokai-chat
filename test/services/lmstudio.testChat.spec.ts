import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLMStudioService } from '@/services/lmstudio'

describe('LMStudioService.testChat', () => {
  const baseUrl = 'http://example.com:1234/v1'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('POSTs to /chat/completions and returns true on ok', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)
    const ok = await service.testChat('test-model')
    expect(ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalled()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${baseUrl}/chat/completions`)
    expect(init.method).toBe('POST')
  })

  it('returns false when request fails', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response)
    const ok = await service.testChat('test-model')
    expect(ok).toBe(false)
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('handles network errors gracefully', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
    const ok = await service.testChat('test-model')
    expect(ok).toBe(false)
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('sends correct request body for chat test', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)

    await service.testChat('test-model')

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)

    expect(body.model).toBe('test-model')
    expect(body.messages).toBeDefined()
    expect(body.stream).toBe(false)
  })
})
