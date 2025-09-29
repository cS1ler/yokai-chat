<script setup lang="ts">
import { onMounted, onUpdated, nextTick } from 'vue'
import type { Message } from '@/types/chat'
import { useMarkdown } from '@/composables/useMarkdown'
import TypingIndicator from './TypingIndicator.vue'

defineProps<{
  messages: Message[]
  isTyping?: boolean
}>()

const { parseMarkdown } = useMarkdown()

// Extract filename from context content
const extractFilename = (content: string) => {
  // Look for [TYPE] pattern at the beginning
  const match = content.match(/^\[([^\]]+)\]\s+(.+)/)
  if (match) {
    const [, , title] = match
    return title.split('\n')[0]
  }
  return 'Context'
}

function enhanceCodeBlocks() {
  // Add copy buttons to all code blocks within rendered markdown
  const containers = document.querySelectorAll('.markdown-content')
  containers.forEach((container) => {
    const pres = container.querySelectorAll('pre')
    pres.forEach((pre) => {
      // Skip if already enhanced
      if (pre.querySelector('.copy-code-btn')) return
      pre.classList.add('pre-with-toolbar')

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'copy-code-btn'
      button.title = 'Copy code'
      button.textContent = 'Copy'

      button.addEventListener('click', async (e) => {
        e.stopPropagation()
        const code = pre.querySelector('code')
        const text = code ? code.textContent ?? '' : pre.textContent ?? ''
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

onMounted(async () => {
  await nextTick()
  enhanceCodeBlocks()
})

onUpdated(async () => {
  await nextTick()
  enhanceCodeBlocks()
})
</script>

<template>
  <div class="message-list-container">
    <div v-for="msg in messages" :key="msg.id" :class="['message', `message-${msg.role}`]">
      <div
        v-if="msg.role === 'assistant'"
        v-html="parseMarkdown(msg.content)"
        class="markdown-content"
      ></div>
      <div v-else-if="msg.role === 'developer'" class="developer-context-indicator">
        <span class="context-filename">{{ extractFilename(msg.content) }}</span>
        <span class="context-label">context</span>
      </div>
      <span v-else>{{ msg.content }}</span>
    </div>

    <!-- Typing Indicator -->
    <TypingIndicator v-if="isTyping" />
  </div>
</template>

<style scoped>
/* Message list container with proper scrolling */
.message-list-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  padding-bottom: calc(var(--space-6) + 2rem); /* Extra bottom padding to prevent input overlap */
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
  max-height: 100%;
  scroll-behavior: smooth;
}

/* Custom scrollbar styling */
.message-list-container::-webkit-scrollbar {
  width: 8px;
}

.message-list-container::-webkit-scrollbar-track {
  background: var(--color-secondary);
  border-radius: var(--radius-sm);
}

.message-list-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

.message-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

/* Utility classes removed - now using global classes */

/* Markdown content styling */
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
.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-6);
  margin: var(--space-4) 0;
  opacity: 0.9;
}
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: var(--space-2) 0;
  padding-left: 1.5rem;
}
.markdown-content :deep(li) {
  margin: var(--space-1) 0;
}
.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: var(--space-4) 0;
}
.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--color-border);
  padding: var(--space-2);
  text-align: left;
}
.markdown-content :deep(th) {
  background: var(--color-tertiary);
  font-weight: 600;
}
.markdown-content :deep(a) {
  color: var(--color-accent);
  text-decoration: underline;
}
.markdown-content :deep(a:hover) {
  opacity: 0.8;
}
.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-6) 0;
}

/* Developer role message styling - compact context indicator */
.message-developer {
  align-self: flex-start;
  background: var(--color-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent-glow);
  max-width: 60%;
  font-size: var(--text-xs);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
}

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
