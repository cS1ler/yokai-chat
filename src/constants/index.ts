export const APP_CONFIG = {
  NAME: 'Yokai Chat',
  // LMSTUDIO_BASE_URL is now dynamic and set by user input
  // Model selection is now dynamic and set by user on landing page
  API_ENDPOINTS: {
    CHAT_COMPLETIONS: '/chat/completions',
    MODELS: '/models',
  },
  MESSAGE_LIMITS: {
    MAX_CONTEXT_PREVIEW: 100,
    MAX_MESSAGES_PER_SESSION: 1000,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  },
  UI: {
    MESSAGE_MAX_WIDTH: '70%',
    CONTAINER_MAX_WIDTH: '720px',
    TYPING_INDICATOR_DELAY: 1000,
  },
} as const

export const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'vue', label: 'Vue' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
] as const

export const CONTEXT_TYPES = [
  { value: 'code', label: 'Code Block' },
  { value: 'file', label: 'File Content' },
  { value: 'text', label: 'Text Context' },
] as const

export const DEFAULT_WELCOME_MESSAGE = `# Welcome to Yokai Chat

Start by typing a message below, or choose a model to begin.

- Basic Markdown is supported (bold, code blocks, lists)
- Use the gear icon to add or load contexts`

export const ERROR_MESSAGES = {
  LMSTUDIO_CONNECTION: '⚠️ Error connecting to LM Studio',
  INVALID_INPUT: 'Please enter a valid message',
  CONTEXT_REQUIRED: 'Context title and content are required',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const
