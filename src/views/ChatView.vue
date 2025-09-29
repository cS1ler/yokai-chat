<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import MessageList from '@/components/MessageList.vue'
import MessageInput from '@/components/MessageInput.vue'
import ModelSelector from '@/components/ModelSelector.vue'
import ContextManager from '@/components/ContextManager.vue'
import ContextForm from '@/components/ContextForm.vue'
import { useChatStore } from '@/stores/chat'
import { createLMStudioService } from '@/services/lmstudio'
import { useMarkdown } from '@/composables/useMarkdown'
import { ERROR_MESSAGES } from '@/constants'
import type { ContextItem } from '@/types/chat'

const chatStore = useChatStore()
const { formatMessageWithContext } = useMarkdown()
const contextManagerRef = ref<InstanceType<typeof ContextManager>>()
const contextFormRef = ref<InstanceType<typeof ContextForm>>()
const messageInputRef = ref<{
  setContextItems: (contexts: ContextItem[]) => void
  addContextItem: (context: ContextItem) => void
}>()
// Scroll target: use the rendered message list container

// Load active contexts and base URL on initialization
chatStore.loadActiveContextsFromStorage()
chatStore.loadLMStudioBaseUrlFromStorage()

// Auto-scroll to bottom when new messages are added
const scrollToBottom = async (smooth = false) => {
  await nextTick()
  const container = document.querySelector('.message-list-container') as HTMLElement | null
  if (!container) return
  if (smooth && 'scrollTo' in container) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  } else {
    container.scrollTop = container.scrollHeight
  }
}

// Watch for new messages and scroll to bottom
watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom(true) // Smooth scroll for new messages
  },
  { flush: 'post' },
)

// Watch for typing indicator changes
watch(
  () => chatStore.isTyping,
  () => {
    scrollToBottom(true) // Smooth scroll for typing indicator
  },
  { flush: 'post' },
)

// Watch for streaming updates to scroll during streaming
watch(
  () => chatStore.isStreaming,
  (isStreaming) => {
    if (isStreaming) {
      // Scroll immediately when streaming starts
      scrollToBottom(false)
    }
  },
)

// Watch for message content updates during streaming
watch(
  () => chatStore.messages,
  () => {
    if (chatStore.isStreaming) {
      // Scroll to bottom during streaming to follow the response
      scrollToBottom(false)
    }
  },
  { deep: true, flush: 'post' },
)

async function handleSend(content: string, context?: ContextItem[]) {
  // Add user message (only the text, not the context)
  chatStore.createUserMessage(content)

  // Add active contexts as developer messages if any are active
  const activeContexts = chatStore.getActiveContexts()
  if (activeContexts.length > 0) {
    activeContexts.forEach((ctx) => {
      const developerMessage = {
        id: Date.now() + Math.random(),
        role: 'developer' as const,
        content: `[${ctx.type.toUpperCase()}] ${ctx.title}\n\n${ctx.content}`,
        timestamp: new Date(),
      }
      chatStore.addMessage(developerMessage)
    })
  }

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

  // Get last 10 messages for AI memory (excluding the current user message and assistant placeholder)
  const chatHistory = chatStore
    .getLastMessages(10)
    .filter((msg) => msg.id !== assistantMessage.id) // Exclude the current assistant message placeholder
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

  try {
    const service = createLMStudioService(
      (chatStore as unknown as { lmStudioBaseUrl?: string }).lmStudioBaseUrl || '',
    )
    await service.sendMessageStream(
      fullMessage,
      chatStore.currentModel,
      (chunk) => {
        // Get the current content from the store to avoid race conditions
        const currentMessage = chatStore.messages.find((m) => m.id === assistantMessage.id)
        const currentContent = currentMessage?.content || ''
        chatStore.updateMessage(assistantMessage.id, {
          content: currentContent + chunk,
        })
      },
      (error) => {
        chatStore.setError(error)
      },
      abortController,
      chatHistory,
    )
  } catch (error) {
    // Don't show error if it was aborted
    if (error instanceof Error && error.name !== 'AbortError') {
      chatStore.updateMessage(assistantMessage.id, {
        content: ERROR_MESSAGES.LMSTUDIO_CONNECTION,
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

function handleContextSelection(selectedContexts: ContextItem[]) {
  // Set the selected contexts as active contexts
  const contextIds = selectedContexts.map((ctx) => ctx.id)
  chatStore.setActiveContexts(contextIds)

  // Pass the selected contexts to MessageInput component
  messageInputRef.value?.setContextItems(selectedContexts)
}

function openContextManager() {
  contextManagerRef.value?.openManager()
}

function openContextForm() {
  contextFormRef.value?.openForm()
}

function handleContextAdd(context: ContextItem) {
  // Pass the context to MessageInput component
  messageInputRef.value?.addContextItem(context)
}

function handleContextSave(context: ContextItem) {
  // Save context to store
  chatStore.saveContext(context)
}

async function testLMStudio() {
  try {
    const service = createLMStudioService(
      (chatStore as unknown as { lmStudioBaseUrl?: string }).lmStudioBaseUrl || '',
    )
    const isConnected = await service.testConnection()
    if (isConnected) {
      const models = await service.getAvailableModels()
      alert(`Connected to LM Studio! Available models: ${models.join(', ') || 'none'}`)
    } else {
      alert('⚠️ Could not reach LM Studio')
    }
  } catch (error) {
    console.error('LM Studio test failed', error)
    alert('⚠️ Could not reach LM Studio')
  }
}
</script>

<template>
  <div class="flex flex-col h-screen bg-primary modern-layout">
    <header class="modern-header">
      <div class="header-content">
        <h1 class="app-title">Yokai Chat</h1>
        <div class="header-controls">
          <router-link to="/" class="btn btn-secondary modern-btn">← Landing</router-link>
          <ModelSelector />
          <router-link to="/models" class="btn btn-secondary modern-btn">📦 Models</router-link>
          <button @click="testLMStudio" class="btn btn-primary modern-btn">Test LM Studio</button>
        </div>
      </div>
    </header>
    <div class="chat-container">
      <div class="chat-body">
        <MessageList :messages="chatStore.messages" :is-typing="chatStore.isTyping" />
      </div>
    </div>

    <!-- Fixed bottom input -->
    <div class="fixed-input-container">
      <MessageInput
        ref="messageInputRef"
        :is-streaming="chatStore.isStreaming"
        @send="handleSend"
        @stop="handleStop"
        @open-context-manager="openContextManager"
        @open-context-form="openContextForm"
      />
    </div>

    <!-- Context Manager Modal - moved to top level -->
    <ContextManager ref="contextManagerRef" @select="handleContextSelection" @close="() => {}" />

    <!-- Context Form Modal - moved to top level -->
    <ContextForm
      ref="contextFormRef"
      @add="handleContextAdd"
      @save="handleContextSave"
      @cancel="() => {}"
    />
  </div>
</template>

<style scoped>
/* Component-specific styles only */

/* Modern Layout Styles */
.modern-layout {
  background: linear-gradient(135deg, var(--color-primary) 0%, #0f0f0f 100%);
}

.modern-header {
  background: var(--color-header);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-4) var(--space-8);
  position: sticky;
  top: 0;
  z-index: var(--z-dropdown);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.app-title {
  color: var(--color-accent);
  font-size: var(--text-2xl);
  font-weight: 700;
  text-shadow: 0 0 10px var(--color-accent-glow);
  margin: 0;
}

.modern-btn {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
}

.chat-container {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: var(--space-8) var(--space-8) 0 var(--space-8);
  padding-bottom: 180px; /* Increased padding to account for fixed input */
  min-height: 0; /* Allow flex item to shrink */
}

.chat-body {
  width: 100%;
  max-width: 1200px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px); /* Adjusted height to account for header and input */
  max-height: calc(100vh - 280px);
}

.fixed-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
  z-index: var(--z-dropdown);
  padding: var(--space-6) var(--space-8);
  padding-bottom: calc(
    var(--space-6) + env(safe-area-inset-bottom, 0px)
  ); /* Account for mobile safe area */
  max-width: 1200px;
  margin: 0 auto;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-xl);
  min-height: 80px; /* Ensure minimum height */
}
</style>
