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
  <div class="flex justify-center h-screen bg-primary">
    <div class="container-sm flex flex-col flex-1 border-l border-r border-border">
      <header
        class="sticky top-0 bg-primary p-md border-b border-border text-center font-semibold text-lg"
      >
        <div class="flex items-center justify-between">
          <h1 class="text-accent">Yokai Chat</h1>
          <button @click="testOllama" class="btn btn-secondary text-sm">Test Ollama</button>
        </div>
      </header>
      <MessageList :messages="chatStore.messages" :is-typing="chatStore.isTyping" />
      <MessageInput :is-streaming="chatStore.isStreaming" @send="handleSend" @stop="handleStop" />
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
</style>
