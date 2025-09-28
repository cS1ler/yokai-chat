import type { LMStudioRequest, LMStudioResponse, LMStudioModel } from '@/types/chat'
import { APP_CONFIG, ERROR_MESSAGES } from '@/constants'

export class LMStudioService {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  async sendMessageStream(
    message: string,
    model: string = APP_CONFIG.DEFAULT_MODEL,
    onChunk: (chunk: string) => void,
    onError?: (error: string) => void,
    abortController?: AbortController,
  ): Promise<void> {
    try {
      const request: LMStudioRequest = {
        model,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }

      const response = await fetch(`${this.baseUrl}${APP_CONFIG.API_ENDPOINTS.CHAT_COMPLETIONS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: abortController?.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      await this.processStream(response.body, onChunk, onError, abortController)
    } catch (error) {
      // Don't treat abort as an error
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      const errorMessage = this.handleError(error)
      if (onError) {
        onError(errorMessage)
      }
      throw new Error(errorMessage)
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}${APP_CONFIG.API_ENDPOINTS.MODELS}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch models`)
      }

      const data: { data: LMStudioModel[] } = await response.json()
      return data.data?.map((model: LMStudioModel) => model.id) || []
    } catch (error) {
      console.error('Failed to fetch models:', error)
      return []
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const models = await this.getAvailableModels()
      return models.length > 0
    } catch {
      return false
    }
  }

  async getModelInfo(modelId: string): Promise<LMStudioModel | null> {
    try {
      const response = await fetch(`${this.baseUrl}${APP_CONFIG.API_ENDPOINTS.MODELS}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch model info`)
      }

      const data: { data: LMStudioModel[] } = await response.json()
      return data.data?.find((model: LMStudioModel) => model.id === modelId) || null
    } catch (error) {
      console.error('Failed to fetch model info:', error)
      return null
    }
  }

  private async processStream(
    stream: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void,
    onError?: (error: string) => void,
    abortController?: AbortController,
  ): Promise<void> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        // Check if the request was aborted
        if (abortController?.signal.aborted) {
          break
        }

        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((line) => line.trim() !== '')

        for (const line of lines) {
          try {
            // Handle Server-Sent Events format
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                return
              }

              const parsed: LMStudioResponse = JSON.parse(data)
              
              if (parsed.error) {
                if (onError) {
                  onError(parsed.error.message || 'Unknown error')
                }
                return
              }

              if (parsed.choices?.[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content)
              }
            }
          } catch {
            // Ignore malformed JSON lines (keepalive, etc.)
            console.debug('Ignoring malformed JSON:', line)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private handleError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return ERROR_MESSAGES.LMSTUDIO_CONNECTION
      }
      if (error.message.includes('NetworkError')) {
        return ERROR_MESSAGES.NETWORK_ERROR
      }
      return error.message
    }
    return ERROR_MESSAGES.UNKNOWN_ERROR
  }
}

// Export singleton instance with direct connection to LM Studio
export const lmStudioService = new LMStudioService(APP_CONFIG.LMSTUDIO_BASE_URL)

// Export legacy function for backward compatibility
export async function sendMessageStream(
  message: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  return lmStudioService.sendMessageStream(message, APP_CONFIG.DEFAULT_MODEL, onChunk)
}
