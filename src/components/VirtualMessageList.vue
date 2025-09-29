<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { Message } from '@/types/chat'
import { useMarkdown } from '@/composables/useMarkdown'
import { extractFilename } from '@/utils/string'
import TypingIndicator from './TypingIndicator.vue'

interface Props {
  messages: Message[]
  isTyping?: boolean
  itemHeight?: number
  overscan?: number
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 100,
  overscan: 5,
  threshold: 100,
})

const { parseMarkdown } = useMarkdown()

// Virtual scrolling state
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const containerHeight = ref(0)
const isScrolling = ref(false)
const scrollTimeout = ref<number>()

// Performance monitoring
const renderStartTime = ref(0)
const renderCount = ref(0)

// Environment check for development features
const isDevelopment = import.meta.env.DEV

// Virtual scrolling calculations
const totalHeight = computed(() => props.messages.length * props.itemHeight)

const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
  const end = Math.min(
    props.messages.length,
    Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.overscan,
  )
  return { start, end }
})

const visibleMessages = computed(() => {
  const { start, end } = visibleRange.value
  return props.messages.slice(start, end).map((message, index) => ({
    ...message,
    virtualIndex: start + index,
    top: (start + index) * props.itemHeight,
  }))
})

const offsetY = computed(() => visibleRange.value.start * props.itemHeight)

// Message class helper
const messageClassFor = (role: Message['role']) => {
  if (role === 'assistant') return 'message-assistant'
  if (role === 'developer') return 'message-developer'
  return 'message-user'
}

// Scroll handling
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  isScrolling.value = true

  // Clear existing timeout
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  // Set timeout to detect scroll end
  scrollTimeout.value = window.setTimeout(() => {
    isScrolling.value = false
  }, 150)
}

// Auto-scroll to bottom for new messages
const shouldAutoScroll = ref(true)
const lastMessageCount = ref(props.messages.length)

watch(
  () => props.messages.length,
  (newCount) => {
    if (newCount > lastMessageCount.value && shouldAutoScroll.value) {
      nextTick(() => {
        scrollToBottom()
      })
    }
    lastMessageCount.value = newCount
  },
)

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight
  }
}

// Performance monitoring
const startRenderTimer = () => {
  renderStartTime.value = performance.now()
}

const endRenderTimer = () => {
  if (renderStartTime.value > 0) {
    const renderTime = performance.now() - renderStartTime.value
    renderCount.value++

    // Log performance metrics in development
    if (isDevelopment && renderTime > 16) {
      console.warn(
        `Slow render detected: ${renderTime.toFixed(2)}ms for ${visibleMessages.value.length} messages`,
      )
    }
  }
}

// Code block enhancement (optimized for virtual scrolling)
const enhanceCodeBlocks = () => {
  if (isScrolling.value) return // Skip during scrolling for performance

  const containers = document.querySelectorAll('.virtual-message .markdown-content')
  containers.forEach((container) => {
    const pres = container.querySelectorAll('pre:not(.enhanced)')
    pres.forEach((pre) => {
      pre.classList.add('enhanced')

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'copy-code-btn'
      button.title = 'Copy code'
      button.textContent = 'Copy'

      button.addEventListener('click', async (e) => {
        e.stopPropagation()
        const code = pre.querySelector('code')
        const text = code ? (code.textContent ?? '') : (pre.textContent ?? '')
        try {
          await navigator.clipboard.writeText(text)
          const old = button.textContent
          button.textContent = 'Copied'
          setTimeout(() => (button.textContent = old), 1200)
        } catch {
          // Fallback: select text
          const range = document.createRange()
          range.selectNodeContents(pre)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      })

      pre.appendChild(button)
    })
  })
}

// Lifecycle
onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
    scrollToBottom()
  }

  // Enhance code blocks after initial render
  nextTick(() => {
    startRenderTimer()
    enhanceCodeBlocks()
    endRenderTimer()
  })
})

onUnmounted(() => {
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

// Watch for visible messages changes to enhance code blocks
watch(
  visibleMessages,
  () => {
    if (!isScrolling.value) {
      nextTick(() => {
        enhanceCodeBlocks()
      })
    }
  },
  { flush: 'post' },
)

// Expose methods for parent components
defineExpose({
  scrollToBottom,
  scrollToTop: () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0
    }
  },
  scrollToMessage: (messageId: number) => {
    const messageIndex = props.messages.findIndex((m) => m.id === messageId)
    if (messageIndex !== -1 && containerRef.value) {
      containerRef.value.scrollTop = messageIndex * props.itemHeight
    }
  },
})
</script>

<template>
  <div ref="containerRef" class="virtual-message-list-container" @scroll="handleScroll">
    <!-- Virtual spacer for total height -->
    <div class="virtual-spacer" :style="{ height: `${totalHeight}px` }" />

    <!-- Visible messages container -->
    <div class="virtual-messages" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="message in visibleMessages"
        :key="message.id"
        :class="['virtual-message', messageClassFor(message.role)]"
        :data-virtual-index="message.virtualIndex"
      >
        <div
          v-if="message.role === 'assistant'"
          v-html="parseMarkdown(message.content)"
          class="markdown-content"
        />
        <div v-else-if="message.role === 'developer'" class="developer-context-indicator">
          <span class="context-filename">{{ extractFilename(message.content) }}</span>
          <span class="context-label">context</span>
        </div>
        <span v-else>{{ message.content }}</span>
      </div>
    </div>

    <!-- Typing Indicator -->
    <TypingIndicator v-if="isTyping" class="typing-indicator" />

    <!-- Performance indicator (development only) -->
    <div v-if="isDevelopment" class="performance-indicator">
      {{ visibleMessages.length }}/{{ messages.length }} messages visible
    </div>
  </div>
</template>

<style scoped>
.virtual-message-list-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  padding-bottom: calc(var(--space-6) + 2rem);
  height: 100%;
  max-height: 100%;
  scroll-behavior: smooth;
  position: relative;
}

.virtual-spacer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.virtual-messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.virtual-message {
  min-height: v-bind('`${itemHeight}px`');
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.virtual-message:hover {
  border-color: var(--color-accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Message role styling */
.virtual-message.message-assistant {
  align-self: flex-start;
  background: var(--color-secondary);
  color: var(--color-text-primary);
  max-width: 80%;
}

.virtual-message.message-user {
  align-self: flex-end;
  background: var(--color-accent);
  color: var(--color-text-inverse);
  max-width: 80%;
}

.virtual-message.message-developer {
  align-self: flex-start;
  background: var(--color-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent-glow);
  max-width: 60%;
  font-size: var(--text-xs);
  padding: var(--space-2) var(--space-3);
}

/* Typing indicator positioning */
.typing-indicator {
  position: sticky;
  bottom: 0;
  background: var(--color-background);
  padding: var(--space-2) 0;
  z-index: 10;
}

/* Performance indicator */
.performance-indicator {
  position: fixed;
  top: 10px;
  right: 10px;
  background: var(--color-primary);
  color: var(--color-text-primary);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  z-index: 1000;
  opacity: 0.8;
}

/* Custom scrollbar styling */
.virtual-message-list-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-message-list-container::-webkit-scrollbar-track {
  background: var(--color-secondary);
  border-radius: var(--radius-sm);
}

.virtual-message-list-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

.virtual-message-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

/* Markdown content styling (inherited from MessageList) */
.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: var(--space-6) 0 var(--space-2) 0;
  color: var(--color-text-primary);
  font-weight: 600;
}

.markdown-content :deep(h1) {
  font-size: var(--text-xl);
}
.markdown-content :deep(h2) {
  font-size: var(--text-lg);
}
.markdown-content :deep(h3) {
  font-size: var(--text-base);
}
.markdown-content :deep(p) {
  margin: var(--space-2) 0;
}
.markdown-content :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: 0.9em;
}
.markdown-content :deep(pre) {
  background: var(--color-primary);
  padding: var(--space-6);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--space-4) 0;
  border-left: 3px solid var(--color-accent);
}
.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: var(--text-xs);
}

/* Copy button styling */
.markdown-content :deep(.pre-with-toolbar) {
  position: relative;
}
.markdown-content :deep(.copy-code-btn) {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.markdown-content :deep(.copy-code-btn:hover) {
  background: var(--color-hover);
  border-color: var(--color-accent);
}

/* Developer context indicator */
.developer-context-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.context-filename {
  color: var(--color-accent);
  font-weight: 600;
  font-family: var(--font-family-mono);
  font-size: var(--text-xs);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-label {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--color-accent-glow);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
</style>
