# Yokai Chat

A modern, Vue 3-based chat interface for interacting with local AI models via Ollama. Yokai Chat provides a clean, responsive UI with markdown support, context management, and real-time streaming responses.

## Features

- 🤖 **Local AI Integration**: Connect to Ollama for private, local AI conversations
- 📝 **Markdown Support**: Rich text rendering with code syntax highlighting
- 🔄 **Real-time Streaming**: Live response streaming with typing indicators
- 📁 **Context Management**: Save and reuse code snippets, files, and text contexts
- 🎨 **Modern UI**: Clean, responsive design with dark/light theme support
- ⚡ **Fast & Lightweight**: Built with Vue 3, TypeScript, and Vite
- 🛡️ **Type Safe**: Full TypeScript support with comprehensive type definitions

## Prerequisites

- **Node.js**: Version 20.19.0 or higher (or 22.12.0+)
- **Ollama**: Local Ollama installation with at least one model
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd yokai-chat
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Ollama connection**

   Update the Ollama base URL in `src/constants/index.ts` if needed:

   ```typescript
   OLLAMA_BASE_URL: 'http://localhost:11434' // Default Ollama URL
   ```

4. **Start Ollama** (if not already running)

   ```bash
   ollama serve
   ```

5. **Pull a model** (if you haven't already)
   ```bash
   ollama pull gemma3:4b  # or any other model you prefer
   ```

## Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

## Usage

### Basic Chat

1. Open the application in your browser
2. Type your message in the input field
3. Press Enter or click Send to get a response
4. Use the "Test Ollama" button to verify your connection

### Context Management

1. **Add Context**: Use the context manager to save code snippets, files, or text
2. **Select Context**: Choose relevant contexts before sending messages
3. **Reuse Context**: Previously saved contexts are available for future conversations

### Features Overview

- **Streaming Responses**: Watch responses appear in real-time
- **Stop Generation**: Click the stop button to halt ongoing responses
- **Markdown Rendering**: Supports code blocks, lists, links, and formatting
- **Model Selection**: Switch between different Ollama models
- **Error Handling**: Clear error messages for connection issues

## Configuration

### Ollama Setup

The application connects to Ollama at `http://localhost:11434` by default. To change this:

1. Edit `src/constants/index.ts`
2. Update the `OLLAMA_BASE_URL` value
3. Restart the development server

### Model Configuration

Default model is set to `gemma3:4b`. To change:

1. Edit `src/constants/index.ts`
2. Update the `DEFAULT_MODEL` value
3. Ensure the model is available in your Ollama installation

### UI Customization

Modify `src/assets/theme.css` to customize colors, spacing, and styling.

## Troubleshooting

### Connection Issues

- **"Could not reach Ollama"**: Ensure Ollama is running (`ollama serve`)
- **"No models available"**: Pull a model (`ollama pull <model-name>`)
- **Network errors**: Check firewall settings and Ollama URL configuration

### Performance Issues

- **Slow responses**: Try a smaller model or increase system resources
- **Memory issues**: Reduce `MAX_MESSAGES_PER_SESSION` in constants
- **Large files**: Check `MAX_FILE_SIZE` limit in configuration

### Development Issues

- **Type errors**: Run `npm run type-check` to identify issues
- **Linting errors**: Run `npm run lint` to fix code style issues
- **Build failures**: Check Node.js version compatibility

## Project Structure

```
src/
├── components/          # Vue components
│   ├── ContextForm.vue     # Context creation form
│   ├── ContextItem.vue     # Individual context display
│   ├── ContextManager.vue  # Context management interface
│   ├── MessageInput.vue    # Chat input component
│   ├── MessageList.vue     # Message display component
│   └── TypingIndicator.vue # Typing animation
├── composables/         # Vue composables
│   ├── useMarkdown.ts      # Markdown rendering utilities
│   └── useTypingIndicator.ts # Typing state management
├── constants/          # Application constants
├── services/           # External service integrations
│   └── ollama.ts          # Ollama API service
├── stores/            # Pinia state management
│   └── chat.ts           # Chat state store
├── types/             # TypeScript type definitions
│   └── chat.ts           # Chat-related types
└── views/             # Page components
    └── ChatView.vue      # Main chat interface
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).
