<script setup lang="ts">
import type { Message } from '@/types/chat'
import { useMarkdown } from '@/composables/useMarkdown'
import TypingIndicator from './TypingIndicator.vue'

defineProps<{
  messages: Message[]
  isTyping?: boolean
}>()

const { parseMarkdown } = useMarkdown()
</script>

<template>
  <div class="flex-1 overflow-y-auto p-lg flex flex-col gap-md">
    <div v-for="msg in messages" :key="msg.id" :class="['message', `message-${msg.role}`]">
      <div
        v-if="msg.role === 'assistant'"
        v-html="parseMarkdown(msg.content)"
        class="markdown-content"
      ></div>
      <span v-else>{{ msg.content }}</span>
    </div>

    <!-- Typing Indicator -->
    <TypingIndicator v-if="isTyping" />
  </div>
</template>

<style scoped>
/* Utility classes */
.flex-1 {
  flex: 1;
}
.overflow-y-auto {
  overflow-y: auto;
}
.p-lg {
  padding: var(--space-lg);
}
.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}
.gap-md {
  gap: var(--space-md);
}

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
  margin: var(--space-lg) 0 var(--space-sm) 0;
  color: var(--text-primary);
  font-weight: 600;
}

.markdown-content :deep(h1) {
  font-size: 1.25rem;
}
.markdown-content :deep(h2) {
  font-size: 1.1rem;
}
.markdown-content :deep(h3) {
  font-size: 1rem;
}
.markdown-content :deep(p) {
  margin: var(--space-sm) 0;
}
.markdown-content :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
}
.markdown-content :deep(pre) {
  background: var(--bg-primary);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--space-md) 0;
  border-left: 3px solid var(--color-accent);
}
.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 0.85rem;
}
.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-lg);
  margin: var(--space-md) 0;
  opacity: 0.9;
}
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: var(--space-sm) 0;
  padding-left: 1.5rem;
}
.markdown-content :deep(li) {
  margin: var(--space-xs) 0;
}
.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: var(--space-md) 0;
}
.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--color-border);
  padding: var(--space-sm);
  text-align: left;
}
.markdown-content :deep(th) {
  background: var(--bg-tertiary);
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
  margin: var(--space-lg) 0;
}
</style>
