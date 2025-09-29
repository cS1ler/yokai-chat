// API Service Types
export interface ApiRequest {
  model: string
  messages: ApiMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

export interface ApiMessage {
  role: 'system' | 'user' | 'assistant' | 'developer'
  content: string
}

export interface ApiResponse {
  id?: string
  object?: string
  created?: number
  model?: string
  choices?: Array<{
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason?: string
  }>
  error?: {
    message: string
    type: string
  }
}

export interface ApiModel {
  id: string
  object: string
  created: number
  owned_by: string
  permission: unknown[]
  root: string
  parent?: string
}

// Service Provider Types
export type ServiceProvider = 'lmstudio' | 'huggingface'

export interface ServiceConfig {
  baseUrl: string
  provider: ServiceProvider
  timeout?: number
  retries?: number
}

// Request/Response Interceptor Types
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onError?: (error: Error) => Error | Promise<Error>
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>
  onError?: (error: Error) => Error | Promise<Error>
}

export interface RequestConfig {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  signal?: AbortSignal
}

// Stream Handler Types
export interface StreamHandler {
  onChunk: (chunk: string) => void
  onError?: (error: string) => void
  onComplete?: () => void
}

// Service Interface
export interface ApiService {
  sendMessageStream(
    message: string,
    model: string,
    onChunk: (chunk: string) => void,
    onError?: (error: string) => void,
    abortController?: AbortController,
    chatHistory?: ApiMessage[],
  ): Promise<void>

  getAvailableModels(): Promise<string[]>
  testConnection(): Promise<boolean>
  testChat(modelId: string): Promise<boolean>
  getModelInfo(modelId: string): Promise<ApiModel | null>
}
