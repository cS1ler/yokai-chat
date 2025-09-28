<script setup lang="ts">
import { ref } from 'vue'
import type { ContextItem } from '@/types/chat'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const showManager = ref(false)

const emit = defineEmits<{
  close: []
  select: [contexts: ContextItem[]]
}>()

const isSelected = (id: string) => {
  return chatStore.selectedContextIds.includes(id)
}

const toggleSelection = (id: string) => {
  chatStore.toggleContextSelection(id)
}

const handleSelect = () => {
  const selectedContexts = chatStore.getSelectedContexts()
  emit('select', selectedContexts)
  emit('close')
}

const handleDelete = (id: string) => {
  chatStore.deleteContext(id)
}

const openManager = () => {
  showManager.value = true
}

const closeManager = () => {
  showManager.value = false
  emit('close')
}

defineExpose({
  openManager,
})
</script>

<template>
  <div
    v-if="showManager"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div
      class="bg-primary border border-border rounded-lg p-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
    >
      <div class="flex items-center justify-between mb-md">
        <h2 class="text-xl font-semibold">Saved Contexts</h2>
        <button @click="closeManager" class="btn-icon text-muted hover:text-accent">×</button>
      </div>

      <div class="flex-1 overflow-y-auto mb-md">
        <div v-if="chatStore.savedContexts.length === 0" class="text-center text-muted py-lg">
          No saved contexts yet. Add some context items to save them here.
        </div>

        <div v-else class="space-y-sm">
          <div
            v-for="context in chatStore.savedContexts"
            :key="context.id"
            class="card cursor-pointer transition-colors"
            :class="{ 'ring-2 ring-accent': isSelected(context.id) }"
            @click="toggleSelection(context.id)"
          >
            <div class="flex items-center gap-sm mb-sm">
              <input
                type="checkbox"
                :checked="isSelected(context.id)"
                @click.stop="toggleSelection(context.id)"
                class="checkbox"
              />
              <span class="badge badge-primary">{{ context.type }}</span>
              <span class="font-semibold flex-1">{{ context.title }}</span>
              <button
                @click.stop="handleDelete(context.id)"
                class="btn-icon text-red-400 hover:text-red-300"
                title="Delete context"
              >
                🗑️
              </button>
            </div>
            <div class="text-muted text-sm font-mono">
              {{ context.content.substring(0, 100) }}
              {{ context.content.length > 100 ? '...' : '' }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-sm justify-end">
        <button @click="closeManager" class="btn btn-secondary">Cancel</button>
        <button
          @click="handleSelect"
          class="btn btn-primary"
          :disabled="chatStore.selectedContextIds.length === 0"
        >
          Select ({{ chatStore.selectedContextIds.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utility classes */
.fixed {
  position: fixed;
}
.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.bg-black {
  background-color: #000;
}
.bg-opacity-50 {
  background-color: rgba(0, 0, 0, 0.5);
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.justify-end {
  justify-content: flex-end;
}
.z-50 {
  z-index: 50;
}
.bg-primary {
  background: var(--bg-primary);
}
.border {
  border: 1px solid var(--color-border);
}
.border-border {
  border-color: var(--color-border);
}
.rounded-lg {
  border-radius: 0.5rem;
}
.p-lg {
  padding: var(--space-lg);
}
.max-w-2xl {
  max-width: 42rem;
}
.w-full {
  width: 100%;
}
.max-h-\[80vh\] {
  max-height: 80vh;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-y-auto {
  overflow-y: auto;
}
.flex-col {
  flex-direction: column;
}
.mb-md {
  margin-bottom: var(--space-md);
}
.mb-sm {
  margin-bottom: var(--space-sm);
}
.text-xl {
  font-size: 1.25rem;
}
.font-semibold {
  font-weight: 600;
}
.text-center {
  text-align: center;
}
.text-muted {
  color: var(--text-secondary);
}
.text-sm {
  font-size: 0.85rem;
}
.font-mono {
  font-family: var(--font-mono);
}
.text-red-400 {
  color: var(--accent-red);
}
.hover\:text-red-300:hover {
  color: #f87171;
}
.hover\:text-accent:hover {
  color: var(--accent);
}
.py-lg {
  padding-top: var(--space-lg);
  padding-bottom: var(--space-lg);
}
.space-y-sm > * + * {
  margin-top: var(--space-sm);
}
.cursor-pointer {
  cursor: pointer;
}
.transition-colors {
  transition: colors 0.2s;
}
.ring-2 {
  box-shadow: 0 0 0 2px var(--accent);
}
.ring-accent {
  --tw-ring-color: var(--accent);
}
.gap-sm {
  gap: var(--space-sm);
}
.flex-1 {
  flex: 1;
}
.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--neon-green);
  cursor: pointer;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.checkbox:hover {
  border-color: var(--neon-green);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
}

.checkbox:checked {
  background: var(--neon-green);
  border-color: var(--neon-green);
  box-shadow: 0 0 12px var(--neon-green-glow);
}
</style>
