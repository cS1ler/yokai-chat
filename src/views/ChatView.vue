<script setup lang="ts">
import MessageList from '@/components/MessageList.vue'
import MessageInput from '@/components/MessageInput.vue'
import { useChatStore } from '@/stores/chat'
import { ollamaService } from '@/services/ollama'
import { useMarkdown } from '@/composables/useMarkdown'
import { ERROR_MESSAGES } from '@/constants'
import type { ContextItem } from '@/types/chat'

const chatStore = useChatStore()
const { formatMessageWithContext } = useMarkdown()

async function handleSend(content: string, context?: ContextItem[]) {
  // Add user message (only the text, not the context)
  chatStore.createUserMessage(content)

  // Create placeholder for assistant response
  const assistantMessage = chatStore.createAssistantMessage()

  // Show typing indicator and set up streaming
  chatStore.setTyping(true)
  chatStore.setStreaming(true)
  chatStore.clearError()

  // Create abort controller for this request
  const abortController = new AbortController()
  chatStore.setAbortController(abortController)

  // Format the full message with context for the AI (but don't show it in chat)
  const fullMessage =
    context && context.length > 0 ? formatMessageWithContext(content, context) : content

  try {
    await ollamaService.sendMessageStream(
      fullMessage,
      chatStore.currentModel,
      (chunk) => {
        chatStore.updateMessage(assistantMessage.id, {
          content: assistantMessage.content + chunk,
        })
      },
      (error) => {
        chatStore.setError(error)
      },
      abortController,
    )
  } catch (error) {
    // Don't show error if it was aborted
    if (error instanceof Error && error.name !== 'AbortError') {
      chatStore.updateMessage(assistantMessage.id, {
        content: ERROR_MESSAGES.OLLAMA_CONNECTION,
      })
      chatStore.setError(error.message)
    }
  } finally {
    chatStore.setTyping(false)
    chatStore.setStreaming(false)
    chatStore.setAbortController(null)
  }
}

function handleStop() {
  chatStore.stopStreaming()
}

async function testOllama() {
  try {
    const isConnected = await ollamaService.testConnection()
    if (isConnected) {
      const models = await ollamaService.getAvailableModels()
      alert(`Connected to Ollama! Available models: ${models.join(', ') || 'none'}`)
    } else {
      alert('⚠️ Could not reach Ollama')
    }
  } catch (error) {
    console.error('Ollama test failed', error)
    alert('⚠️ Could not reach Ollama')
  }
}
</script>

<template>
  <div class="flex flex-col h-screen bg-primary modern-layout">
    <header class="modern-header">
      <div class="header-content">
        <h1 class="app-title">Yokai Chat</h1>
        <button @click="testOllama" class="btn btn-primary modern-btn">Test Ollama</button>
      </div>
    </header>
    <div class="chat-container">
      <div class="chat-body">
        <MessageList :messages="chatStore.messages" :is-typing="chatStore.isTyping" />
        <MessageInput :is-streaming="chatStore.isStreaming" @send="handleSend" @stop="handleStop" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional utility classes for layout */
.h-screen {
  height: 100vh;
}
.flex-1 {
  flex: 1;
}
.sticky {
  position: sticky;
}
.top-0 {
  top: 0;
}
.bg-primary {
  background: var(--bg-primary);
}
.bg-secondary {
  background: var(--bg-secondary);
}
.border-l {
  border-left: 1px solid var(--color-border);
}
.border-r {
  border-right: 1px solid var(--color-border);
}
.border-b {
  border-bottom: 1px solid var(--color-border);
}
.border-border {
  border-color: var(--color-border);
}
.p-md {
  padding: var(--space-md);
}
.text-center {
  text-align: center;
}
.font-semibold {
  font-weight: 600;
}
.text-lg {
  font-size: 1.1rem;
}
.text-sm {
  font-size: 0.9rem;
}
.w-full {
  width: 100%;
}
.max-w-7xl {
  max-width: 80rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.header-compact {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.w-20 {
  width: 5rem;
}
.flex-1 {
  flex: 1;
}
.justify-end {
  justify-content: flex-end;
}

/* Modern Layout Styles */
.modern-layout {
  background: linear-gradient(135deg, var(--bg-primary) 0%, #0f0f0f 100%);
}

.modern-header {
  background: var(--color-header);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.app-title {
  color: var(--neon-green);
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 0 10px var(--neon-green-glow);
  margin: 0;
}

.modern-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  border-radius: 8px;
}

.chat-container {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.chat-body {
  width: 100%;
  max-width: 1200px;
  background: var(--color-chat-body);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
