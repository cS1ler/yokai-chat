import type { RequestInterceptor, ResponseInterceptor, RequestConfig } from '@/types/api'
import { ApiError, ErrorFactory } from '@/errors/ApiError'

// Request Interceptors
export class RequestInterceptors {
  private interceptors: RequestInterceptor[] = []

  add(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor)
  }

  remove(interceptor: RequestInterceptor): void {
    const index = this.interceptors.indexOf(interceptor)
    if (index > -1) {
      this.interceptors.splice(index, 1)
    }
  }

  async process(config: RequestConfig, provider: string): Promise<RequestConfig> {
    let processedConfig = config

    for (const interceptor of this.interceptors) {
      try {
        if (interceptor.onRequest) {
          processedConfig = await interceptor.onRequest(processedConfig)
        }
      } catch (error) {
        if (interceptor.onError) {
          const apiError = ErrorFactory.fromFetchError(
            error instanceof Error ? error : new Error(String(error)),
            provider,
          )
          throw await interceptor.onError(apiError)
        }
        throw error
      }
    }

    return processedConfig
  }
}

// Response Interceptors
export class ResponseInterceptors {
  private interceptors: ResponseInterceptor[] = []

  add(interceptor: ResponseInterceptor): void {
    this.interceptors.push(interceptor)
  }

  remove(interceptor: ResponseInterceptor): void {
    const index = this.interceptors.indexOf(interceptor)
    if (index > -1) {
      this.interceptors.splice(index, 1)
    }
  }

  async process(response: Response, provider: string): Promise<Response> {
    let processedResponse = response

    for (const interceptor of this.interceptors) {
      try {
        if (interceptor.onResponse) {
          processedResponse = await interceptor.onResponse(processedResponse)
        }
      } catch (error) {
        if (interceptor.onError) {
          const apiError = ErrorFactory.fromFetchError(
            error instanceof Error ? error : new Error(String(error)),
            provider,
          )
          throw await interceptor.onError(apiError)
        }
        throw error
      }
    }

    return processedResponse
  }
}

// Built-in Interceptors
export const builtInInterceptors = {
  // Logging interceptor
  logging: (): RequestInterceptor & ResponseInterceptor => ({
    onRequest: (config) => {
      console.debug(`[API Request] ${config.method} ${config.url}`, {
        headers: config.headers,
        body: config.body ? JSON.parse(config.body) : undefined,
      })
      return config
    },
    onResponse: (response) => {
      console.debug(`[API Response] ${response.status} ${response.statusText}`)
      return response
    },
  }),

  // Error handling interceptor
  errorHandling: (): RequestInterceptor & ResponseInterceptor => ({
    onError: (error) => {
      console.error('[API Error]', error)
      return error
    },
  }),

  // Retry interceptor
  retry: (maxRetries: number = 3, delay: number = 1000): RequestInterceptor => ({
    onRequest: async (config) => {
      // Add retry metadata to config
      return {
        ...config,
        retryCount: 0,
        maxRetries,
        retryDelay: delay,
      }
    },
  }),

  // Timeout interceptor
  timeout: (timeoutMs: number = 30000): RequestInterceptor => ({
    onRequest: (config) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      return {
        ...config,
        signal: controller.signal,
        timeoutId,
      }
    },
  }),

  // Content-Type interceptor
  contentType: (): RequestInterceptor => ({
    onRequest: (config) => {
      if (config.method === 'POST' && !config.headers['Content-Type']) {
        return {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'application/json',
          },
        }
      }
      return config
    },
  }),

  // Accept header interceptor
  accept: (acceptType: string = 'application/json'): RequestInterceptor => ({
    onRequest: (config) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          Accept: acceptType,
        },
      }
    },
  }),
}
