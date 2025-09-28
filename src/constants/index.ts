export const APP_CONFIG = {
  NAME: 'Yokai Chat',
  DEFAULT_MODEL: 'llama-3.2-3b-instruct',
  LMSTUDIO_BASE_URL: 'http://localhost:1234/v1',
  OLLAMA_BASE_URL: 'http://10.0.0.210:11434', // Keep for reference
  API_ENDPOINTS: {
    CHAT_COMPLETIONS: '/chat/completions',
    MODELS: '/models',
    GENERATE: '/api/generate', // Keep for reference
    TAGS: '/api/tags', // Keep for reference
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

export const DEFAULT_WELCOME_MESSAGE = `# 👋 Welcome to Yokai Chat!

I can now render **markdown** content! Here are some examples:

## Code Example
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## Lists
- Feature 1
- Feature 2
- Feature 3

## Links
Check out [Vue.js](https://vuejs.org) for more info!

Try sending me a message with markdown formatting!`

export const ERROR_MESSAGES = {
  LMSTUDIO_CONNECTION: '⚠️ Error connecting to LM Studio',
  OLLAMA_CONNECTION: '⚠️ Error connecting to Ollama', // Keep for reference
  INVALID_INPUT: 'Please enter a valid message',
  CONTEXT_REQUIRED: 'Context title and content are required',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const
