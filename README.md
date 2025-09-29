# Yokai Chat

A modern, Vue 3-based chat interface for interacting with local AI models via Ollama and LM Studio. Yokai Chat provides a clean, responsive UI with markdown support, context management, and real-time streaming responses.

## Features

- 🤖 **Multi-Platform AI Integration**: Support for both Ollama and LM Studio
- 📝 **Markdown Support**: Rich text rendering with code syntax highlighting
- 🔄 **Real-time Streaming**: Live response streaming with typing indicators
- 📁 **Advanced Context Management**: Save and reuse code snippets, files, and text contexts
- 🎨 **Modern UI**: Clean, responsive design with neon green theme
- ⚡ **Fast & Lightweight**: Built with Vue 3, TypeScript, and Vite
- 🛡️ **Type Safe**: Full TypeScript support with comprehensive type definitions
- 💬 **Fixed Chat Input**: Always-visible chat input at the bottom of the screen
- 🔧 **Context Modals**: Centered modal dialogs for context management

## Prerequisites

- **Node.js**: Version 20.19.0 or higher (or 22.12.0+)
- **AI Backend**: Either Ollama or LM Studio installed locally
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Branches

### Main Branch (Ollama)

The main branch supports Ollama integration for local AI conversations.

### LM Studio Branch

The `lm_studio` branch adds support for LM Studio integration with enhanced UI features:

- **Fixed Chat Input**: Chat input stays at the bottom of the screen
- **Centered Modals**: Context management modals are properly centered
- **Enhanced Context Management**: Improved context selection and management
- **Better Error Handling**: Improved race condition handling for streaming responses

To use the LM Studio branch:

```bash
git checkout lm_studio
npm install
npm run dev
```

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

3. **Configure AI Backend**

   **For Ollama (main branch):**
   - Update the Ollama base URL in `src/constants/index.ts` if needed
   - Start Ollama: `ollama serve`
   - Pull a model: `ollama pull gemma3:4b`

   **For LM Studio (lm_studio branch):**
   - Install LM Studio from [lmstudio.ai](https://lmstudio.ai)
   - Start LM Studio and load a model
   - The app will connect to `http://localhost:1234/v1` by default

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
2. Type your message in the fixed input field at the bottom
3. Press Enter or click Send to get a response
4. Use the "Test" button to verify your AI backend connection

### Context Management (LM Studio Branch)

1. **Add Context**: Click the ⚙️ button to enable advanced mode, then use 📎 to add contexts
2. **Load Saved Contexts**: Click "📚 Load Saved" to select from previously saved contexts
3. **Context Types**: Support for code snippets, files, and text contexts
4. **File Upload**: Drag and drop files or click "📁 Upload File" to add file contexts
5. **Context Selection**: Select multiple contexts before sending messages

### Features Overview

- **Streaming Responses**: Watch responses appear in real-time with improved race condition handling
- **Stop Generation**: Click the stop button to halt ongoing responses
- **Markdown Rendering**: Supports code blocks, lists, links, and formatting
- **Model Selection**: Switch between different AI models (Ollama or LM Studio)
- **Fixed Input**: Chat input always stays at the bottom of the screen
- **Centered Modals**: Context management modals are properly centered
- **Error Handling**: Clear error messages for connection issues
- **Context Persistence**: Save and reuse contexts across sessions

## Configuration

### Ollama Setup (Main Branch)

The application connects to Ollama at `http://localhost:11434` by default. To change this:

1. Edit `src/constants/index.ts`
2. Update the `OLLAMA_BASE_URL` value
3. Restart the development server

### LM Studio Setup (LM Studio Branch)

The application connects to LM Studio at `http://localhost:1234/v1` by default. To change this:

1. Edit `src/constants/index.ts`
2. Update the `LMSTUDIO_BASE_URL` value
3. Restart the development server

### Model Configuration

**Ollama**: Default model is set to `gemma3:4b`. To change:

1. Edit `src/constants/index.ts`
2. Update the `DEFAULT_MODEL` value
3. Ensure the model is available in your Ollama installation

**LM Studio**: Models are managed through the LM Studio interface. The app will automatically detect available models.

### UI Customization

Modify `src/assets/theme.css` to customize colors, spacing, and styling.

## Troubleshooting

### Connection Issues

**Ollama:**

- **"Could not reach Ollama"**: Ensure Ollama is running (`ollama serve`)
- **"No models available"**: Pull a model (`ollama pull <model-name>`)
- **Network errors**: Check firewall settings and Ollama URL configuration

**LM Studio:**

- **"Could not reach LM Studio"**: Ensure LM Studio is running and a model is loaded
- **"No models available"**: Load a model in LM Studio interface
- **Connection errors**: Check that LM Studio is running on port 1234

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
│   ├── ollama.ts          # Ollama API service
│   └── lmstudio.ts        # LM Studio API service
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
