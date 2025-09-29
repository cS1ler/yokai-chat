import type { ApiRequest, ApiModel, ServiceConfig } from '@/types/api'
import { BaseApiService } from './BaseApiService'
import { APP_CONFIG } from '@/constants'
import { cachedFetch, cacheConfigs } from '@/utils/requestCache'

export class LMStudioService extends BaseApiService {
  constructor(baseUrl: string = '') {
    const config: ServiceConfig = {
      baseUrl,
      provider: 'lmstudio',
      timeout: 30000,
      retries: 3,
    }
    super(config)
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

      const request: ApiRequest = {
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }

      const response = await this.makeRequest(
        APP_CONFIG.API_ENDPOINTS.CHAT_COMPLETIONS,
        request,
        abortController,
      )

      if (!response.ok) {
        this.handleHttpError(response)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      await this.processStream(
        response.body,
        {
          onChunk,
          onError,
        },
        abortController,
      )
    } catch (error) {
      // Don't treat abort as an error
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      const errorMessage = this.handleStreamError(error)
      if (onError) {
        onError(errorMessage)
      }
      throw error
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const url = `${this.config.baseUrl}${APP_CONFIG.API_ENDPOINTS.MODELS}`

      // Use cached fetch for better performance
      const data: { data: ApiModel[] } = await cachedFetch(
        url,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
        cacheConfigs.models,
      )

      return data?.data?.map((model: ApiModel) => model.id) || []
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

  async testChat(modelId: string): Promise<boolean> {
    try {
      const request: ApiRequest = {
        model: modelId,
        messages: [
          {
            role: 'user',
            content: 'ping',
          },
        ],
        stream: false,
        temperature: 0,
        max_tokens: 1,
      }
      const response = await this.makeRequest(APP_CONFIG.API_ENDPOINTS.CHAT_COMPLETIONS, request)
      return response.ok
    } catch {
      return false
    }
  }

  async getModelInfo(modelId: string): Promise<ApiModel | null> {
    try {
      const url = `${this.config.baseUrl}${APP_CONFIG.API_ENDPOINTS.MODELS}`

      // Use cached fetch for better performance
      const data: { data: ApiModel[] } = await cachedFetch(
        url,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
        cacheConfigs.modelInfo,
      )

      return data.data?.find((model: ApiModel) => model.id === modelId) || null
    } catch (error) {
      console.error('Failed to fetch model info:', error)
      return null
    }
  }
}

// Factory to create a service instance with a custom base URL
export function createLMStudioService(baseUrl: string) {
  return new LMStudioService(baseUrl)
}

// Note: No longer exporting a singleton instance since base URL is now dynamic
// Use createLMStudioService(baseUrl) instead
