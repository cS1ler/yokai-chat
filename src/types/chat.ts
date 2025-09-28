export interface Message {
  id: number
  role: 'user' | 'assistant'
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
