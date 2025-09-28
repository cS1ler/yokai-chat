# LM Studio Integration Setup

This branch (`lm_studio`) has been converted to use LM Studio instead of Ollama for local AI model inference.

## What Changed

### Services
- **New**: `src/services/lmstudio.ts` - LM Studio API service
- **Kept**: `src/services/ollama.ts` - Original Ollama service (for reference)

### Configuration
- **Base URL**: Changed from `http://10.0.0.210:11434` to `http://localhost:1234/v1`
- **API Endpoints**: Updated to use OpenAI-compatible endpoints
- **Default Model**: Changed to `llama-3.2-3b-instruct`

### Features
- ✅ Chat functionality with streaming responses
- ✅ Model selection and switching
- ✅ Model library page with download instructions
- ✅ Context management (unchanged)
- ✅ All existing UI components work with LM Studio

## Setup Instructions

### 1. Install LM Studio
1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Install and launch the application

### 2. Download Models
1. Open LM Studio
2. Go to the "Models" tab
3. Search for and download models like:
   - `llama-3.2-3b-instruct`
   - `llama-3.2-1b-instruct`
   - `gemma-2-2b-it`
   - `qwen2.5-3b-instruct`
   - `phi-3-mini-4k-instruct`

### 3. Start the API Server
1. In LM Studio, go to the "Server" tab
2. Click "Start Server"
3. The server will run on `http://localhost:1234`

### 4. Run the Application
```bash
npm run dev
```

## API Differences

### Ollama vs LM Studio

| Feature | Ollama | LM Studio |
|---------|--------|-----------|
| Base URL | `http://localhost:11434` | `http://localhost:1234/v1` |
| Chat Endpoint | `/api/generate` | `/chat/completions` |
| Models Endpoint | `/api/tags` | `/models` |
| Request Format | Custom | OpenAI-compatible |
| Model Download | API-based | Manual via UI |

### Request Format Changes

**Ollama:**
```json
{
  "model": "llama3.2:3b",
  "prompt": "Hello!",
  "stream": true
}
```

**LM Studio:**
```json
{
  "model": "llama-3.2-3b-instruct",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

## Model Compatibility

### Recommended Models for LM Studio
- **Small Models (1B-3B)**: Good for Raspberry Pi
  - `llama-3.2-1b-instruct`
  - `llama-3.2-3b-instruct`
  - `gemma-2-2b-it`
  - `qwen2.5-3b-instruct`
  - `phi-3-mini-4k-instruct`

### Model Naming
- LM Studio uses different model names than Ollama
- Examples:
  - Ollama: `llama3.2:3b` → LM Studio: `llama-3.2-3b-instruct`
  - Ollama: `gemma2:2b` → LM Studio: `gemma-2-2b-it`

## Troubleshooting

### Connection Issues
1. Ensure LM Studio is running
2. Check that the API server is started
3. Verify the server is running on `localhost:1234`
4. Check browser console for CORS errors

### Model Issues
1. Ensure models are downloaded in LM Studio
2. Check that models are loaded in the server
3. Verify model names match exactly

### Performance
- LM Studio may be slower than Ollama for some models
- Consider using smaller models for better performance
- GPU acceleration depends on your hardware setup

## Reverting to Ollama

To switch back to Ollama:
1. Checkout the main branch: `git checkout main`
2. Update the base URL in constants
3. Use the original Ollama service

## Benefits of LM Studio

1. **Better UI**: More user-friendly model management
2. **OpenAI Compatibility**: Works with OpenAI-compatible APIs
3. **Model Variety**: Access to Hugging Face models
4. **Quantization Options**: Better model optimization options
5. **Cross-Platform**: Works on Windows, Mac, and Linux
