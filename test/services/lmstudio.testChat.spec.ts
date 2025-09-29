import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLMStudioService } from '@/services/lmstudio'

describe('LMStudioService.testChat', () => {
  const baseUrl = 'http://example.com:1234/v1'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('POSTs to /chat/completions and returns true on ok', async () => {
    const service = createLMStudioService(baseUrl)
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true } as any)
    const ok = await service.testChat('test-model')
    expect(ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalled()
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${baseUrl}/chat/completions`)
    expect(init.method).toBe('POST')
  })
})


