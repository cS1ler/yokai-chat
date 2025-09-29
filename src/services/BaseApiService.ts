import type {
  ApiService,
  ApiRequest,
  ApiResponse,
  ApiModel,
  ServiceConfig,
  StreamHandler,
} from '@/types/api'
import {
  ApiError,
  ConnectionError,
  NetworkError,
  StreamError,
  ErrorFactory,
} from '@/errors/ApiError'
import { RequestInterceptors, ResponseInterceptors, builtInInterceptors } from './interceptors'

export abstract class BaseApiService implements ApiService {
  protected config: ServiceConfig
  protected requestInterceptors: RequestInterceptors
  protected responseInterceptors: ResponseInterceptors

  constructor(config: ServiceConfig) {
    this.config = config
    this.requestInterceptors = new RequestInterceptors()
    this.responseInterceptors = new ResponseInterceptors()

    // Add built-in interceptors
    this.setupBuiltInInterceptors()
  }

  private setupBuiltInInterceptors(): void {
    // Add logging in development
    if (import.meta.env.DEV) {
      this.requestInterceptors.add(builtInInterceptors.logging())
      this.responseInterceptors.add(builtInInterceptors.logging())
    }

    // Add error handling
    this.requestInterceptors.add(builtInInterceptors.errorHandling())
    this.responseInterceptors.add(builtInInterceptors.errorHandling())

    // Add content type
    this.requestInterceptors.add(builtInInterceptors.contentType())

    // Add timeout
    this.requestInterceptors.add(builtInInterceptors.timeout(this.config.timeout || 30000))
  }

  abstract sendMessageStream(
    message: string,
    model: string,
    onChunk: (chunk: string) => void,
    onError?: (error: string) => void,
    abortController?: AbortController,
    chatHistory?: Array<{ role: 'user' | 'assistant' | 'system' | 'developer'; content: string }>,
  ): Promise<void>

  abstract getAvailableModels(): Promise<string[]>
  abstract testConnection(): Promise<boolean>
  abstract testChat(modelId: string): Promise<boolean>
  abstract getModelInfo(modelId: string): Promise<ApiModel | null>

  protected async makeRequest(
    endpoint: string,
    request: ApiRequest,
    abortController?: AbortController,
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`

    const requestConfig = {
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(request),
      signal: abortController?.signal,
    }

    try {
      const processedConfig = await this.requestInterceptors.process(
        requestConfig,
        this.config.provider,
      )

      const response = await fetch(processedConfig.url, {
        method: processedConfig.method,
        headers: processedConfig.headers,
        body: processedConfig.body,
        signal: processedConfig.signal,
      })

      const processedResponse = await this.responseInterceptors.process(
        response,
        this.config.provider,
      )

      return processedResponse
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw ErrorFactory.fromFetchError(
        error instanceof Error ? error : new Error(String(error)),
        this.config.provider,
      )
    }
  }

  protected async makeGetRequest(endpoint: string): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`

    const requestConfig = {
      url,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }

    try {
      const processedConfig = await this.requestInterceptors.process(
        requestConfig,
        this.config.provider,
      )

      const response = await fetch(processedConfig.url, {
        method: processedConfig.method,
        headers: processedConfig.headers,
      })

      const processedResponse = await this.responseInterceptors.process(
        response,
        this.config.provider,
      )

      return processedResponse
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw ErrorFactory.fromFetchError(
        error instanceof Error ? error : new Error(String(error)),
        this.config.provider,
      )
    }
  }

  protected async processStream(
    stream: ReadableStream<Uint8Array>,
    handler: StreamHandler,
    abortController?: AbortController,
  ): Promise<void> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        if (abortController?.signal.aborted) {
          break
        }

        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((line) => line.trim() !== '')

        for (const line of lines) {
          try {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                handler.onComplete?.()
                return
              }

              const parsed: ApiResponse = JSON.parse(data)

              if (parsed.error) {
                const errorMessage = parsed.error.message || 'Unknown error'
                if (handler.onError) {
                  handler.onError(errorMessage)
                }
                throw new StreamError(this.config.provider)
              }

              if (parsed.choices?.[0]?.delta?.content) {
                handler.onChunk(parsed.choices[0].delta.content)
              }
            }
          } catch (parseError) {
            // Ignore malformed JSON lines (keepalive, etc.)
            console.debug('Ignoring malformed JSON:', line)
          }
        }
      }
    } catch (error) {
      if (error instanceof StreamError) {
        throw error
      }

      throw new StreamError(
        this.config.provider,
        error instanceof Error ? error : new Error(String(error)),
      )
    } finally {
      reader.releaseLock()
    }
  }

  protected handleHttpError(response: Response): never {
    throw ErrorFactory.fromHttpResponse(response.status, response.statusText, this.config.provider)
  }

  protected handleStreamError(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message
    }

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return 'Connection error - please check your server'
      }
      if (error.message.includes('NetworkError')) {
        return 'Network error occurred'
      }
      return error.message
    }

    return 'An unexpected error occurred'
  }
}
