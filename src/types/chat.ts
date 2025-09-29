export interface Message {
  id: number
  role: 'user' | 'assistant' | 'developer'
  content: string
  timestamp?: Date
  context?: ContextItem[]
}

export interface ContextItem {
  id: string
  type: ContextType
  title: string
  content: string
  language?: ProgrammingLanguage
}

export type ContextType = 'code' | 'file' | 'text'

export type ProgrammingLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'vue'
  | 'html'
  | 'css'
  | 'json'
  | 'bash'
  | 'sql'
  | 'markdown'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'

export interface ChatState {
  messages: Message[]
  isTyping: boolean
  isStreaming: boolean
  currentModel: string
  error?: string
}

export interface OllamaResponse {
  response?: string
  done?: boolean
  error?: string
}

export interface OllamaRequest {
  model: string
  prompt: string
  stream: boolean
}

// LM Studio specific types
export interface LMStudioMessage {
  role: 'system' | 'user' | 'assistant' | 'developer'
  content: string
}

export interface LMStudioRequest {
  model: string
  messages: LMStudioMessage[]
  stream: boolean
  temperature?: number
  max_tokens?: number
}

export interface LMStudioResponse {
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

export interface LMStudioModel {
  id: string
  object: string
  created: number
  owned_by: string
  permission: any[]
  root: string
  parent?: string
}
