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
    chatHistory?: Array<{ role: 'user' | 'assistant' | 'system' | 'developer'; content: string }>,
  ): Promise<void> {
    try {
      // Build messages array with chat history
      const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []

      // Add chat history if provided
      if (chatHistory && chatHistory.length > 0) {
        messages.push(
          ...chatHistory.map((msg) => ({
            role:
              msg.role === 'developer' ? 'system' : (msg.role as 'user' | 'assistant' | 'system'),
            content: msg.content,
          })),
        )
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: message,
      })

      const request: LMStudioRequest = {
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }

      const response = await this.makeRequest(
        `${this.baseUrl}${APP_CONFIG.API_ENDPOINTS.CHAT_COMPLETIONS}`,
        request,
        abortController,
      )

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

  private async makeRequest(
    url: string,
    request: LMStudioRequest,
    abortController?: AbortController,
  ): Promise<Response> {
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal: abortController?.signal,
      })
    } catch (error) {
      throw error
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}${APP_CONFIG.API_ENDPOINTS.MODELS}`, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        // Treat 404/401 as "no models" to avoid noisy errors during setup
        if (response.status === 404 || response.status === 401) {
          return []
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch models`)
      }
      // Ensure JSON, handle non-JSON gracefully
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        // Avoid noisy warnings in UI; surface as empty list
        console.debug(
          'Models endpoint did not return JSON',
          { status: response.status, contentType },
        )
        return []
      }
      const data: { data: LMStudioModel[] } = await response.json()
      return data?.data?.map((model: LMStudioModel) => model.id) || []
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

// Factory to create a service instance with a custom base URL
export function createLMStudioService(baseUrl: string) {
  return new LMStudioService(baseUrl)
}

// Export singleton instance with direct connection to LM Studio
export const lmStudioService = new LMStudioService(APP_CONFIG.LMSTUDIO_BASE_URL)

// Export legacy function for backward compatibility
export async function sendMessageStream(
  message: string,
  onChunk: (chunk: string) => void,
  chatHistory?: Array<{ role: 'user' | 'assistant' | 'system' | 'developer'; content: string }>,
): Promise<void> {
  console.warn('sendMessageStream legacy export uses default base URL; prefer createLMStudioService')
  return lmStudioService.sendMessageStream(
    message,
    APP_CONFIG.DEFAULT_MODEL,
    onChunk,
    undefined,
    undefined,
    chatHistory,
  )
}
