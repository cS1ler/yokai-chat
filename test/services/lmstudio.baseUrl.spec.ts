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
})
