// Custom Error Classes for API handling
export class ApiError extends Error {
  public readonly code: string
  public readonly status?: number
  public readonly provider: string
  public readonly originalError?: Error

  constructor(
    message: string,
    code: string,
    provider: string,
    status?: number,
    originalError?: Error,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.provider = provider
    this.originalError = originalError

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      provider: this.provider,
      stack: this.stack,
    }
  }
}

export class ConnectionError extends ApiError {
  constructor(provider: string, originalError?: Error) {
    super(
      `Failed to connect to ${provider}`,
      'CONNECTION_ERROR',
      provider,
      undefined,
      originalError,
    )
    this.name = 'ConnectionError'
  }
}

export class NetworkError extends ApiError {
  constructor(provider: string, status?: number, originalError?: Error) {
    super(
      `Network error occurred with ${provider}`,
      'NETWORK_ERROR',
      provider,
      status,
      originalError,
    )
    this.name = 'NetworkError'
  }
}

export class ModelNotFoundError extends ApiError {
  constructor(modelId: string, provider: string) {
    super(`Model '${modelId}' not found`, 'MODEL_NOT_FOUND', provider)
    this.name = 'ModelNotFoundError'
  }
}

export class StreamError extends ApiError {
  constructor(provider: string, originalError?: Error) {
    super(
      `Stream processing error with ${provider}`,
      'STREAM_ERROR',
      provider,
      undefined,
      originalError,
    )
    this.name = 'StreamError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, provider: string) {
    super(message, 'VALIDATION_ERROR', provider)
    this.name = 'ValidationError'
  }
}

export class TimeoutError extends ApiError {
  constructor(provider: string, timeout: number) {
    super(`Request timeout after ${timeout}ms`, 'TIMEOUT_ERROR', provider)
    this.name = 'TimeoutError'
  }
}

// Error factory for creating appropriate error types
export class ErrorFactory {
  static fromFetchError(error: Error, provider: string): ApiError {
    if (error.name === 'AbortError') {
      return new TimeoutError(provider, 0)
    }

    if (error.message.includes('Failed to fetch')) {
      return new ConnectionError(provider, error)
    }

    if (error.message.includes('NetworkError')) {
      return new NetworkError(provider, undefined, error)
    }

    return new ApiError(error.message, 'UNKNOWN_ERROR', provider, undefined, error)
  }

  static fromHttpResponse(status: number, message: string, provider: string): ApiError {
    switch (status) {
      case 404:
        return new ModelNotFoundError('', provider)
      case 401:
      case 403:
        return new ApiError('Authentication failed', 'AUTH_ERROR', provider, status)
      case 429:
        return new ApiError('Rate limit exceeded', 'RATE_LIMIT_ERROR', provider, status)
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError('Server error', 'SERVER_ERROR', provider, status)
      default:
        return new NetworkError(provider, status)
    }
  }
}
