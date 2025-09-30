<script setup lang="ts">
import { ref } from 'vue'
import type { ContextItem } from '@/types/chat'
import { useChatStore } from '@/stores/chat'
import { useModal } from '@/composables/useModal'
import BaseModal from './shared/BaseModal.vue'
import BaseButton from './shared/BaseButton.vue'
import { truncateText } from '@/utils/string'

const chatStore = useChatStore()
const { isOpen: showManager, open: openManager, close: closeManager } = useModal()

// Debug logging
console.log('ContextManager - savedContexts:', chatStore.savedContexts)
console.log('ContextManager - savedContexts length:', chatStore.savedContexts.length)

const emit = defineEmits<{
  close: []
  select: [contexts: ContextItem[]]
}>()

const isSelected = (id: string) => {
  return chatStore.selectedContextIds.includes(id)
}

const isActive = (id: string) => {
  return chatStore.activeContextIds.includes(id)
}

const toggleSelection = (id: string) => {
  chatStore.toggleContextSelection(id)
}

const toggleActive = (id: string) => {
  chatStore.toggleActiveContext(id)
}

const handleSelect = () => {
  const selectedContexts = chatStore.getSelectedContexts()
  emit('select', selectedContexts)
  closeManager()
}

const handleDelete = (id: string) => {
  chatStore.deleteContext(id)
}

const handleClose = () => {
  closeManager()
  emit('close')
}

const openManagerWithDebug = () => {
  console.log('Opening context manager...')
  console.log('Current savedContexts:', chatStore.savedContexts)
  console.log('Current savedContexts length:', chatStore.savedContexts.length)
  openManager()
}

defineExpose({
  openManager: openManagerWithDebug,
})
</script>

<template>
  <BaseModal :is-open="showManager" title="Saved Contexts" size="xl" @close="handleClose">
    <div v-if="chatStore.savedContexts.length === 0" class="text-center text-muted py-lg">
      No saved contexts yet. Add some context items to save them here.
    </div>

    <div v-else class="space-y-sm">
      <div
        v-for="context in chatStore.savedContexts"
        :key="context.id"
        class="card cursor-pointer transition-colors"
        :class="{
          'ring-2 ring-accent': isSelected(context.id) || isActive(context.id),
        }"
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
          <div class="flex items-center gap-xs">
            <BaseButton
              variant="icon"
              size="sm"
              @click.stop="toggleActive(context.id)"
              :class="{
                'bg-accent text-primary': isActive(context.id),
                'text-muted hover:text-accent': !isActive(context.id),
              }"
              :title="isActive(context.id) ? 'Deactivate context' : 'Activate context'"
            >
              {{ isActive(context.id) ? '⚡' : '⚪' }}
            </BaseButton>
            <BaseButton
              variant="icon"
              size="sm"
              @click.stop="handleDelete(context.id)"
              class="text-error hover:text-red-300"
              title="Delete context"
            >
              🗑️
            </BaseButton>
          </div>
        </div>
        <div class="text-muted text-sm font-mono">
          {{ truncateText(context.content, 100) }}
        </div>
        <div v-if="isActive(context.id)" class="mt-sm text-xs text-accent font-semibold">
          ⚡ ACTIVE - Will be sent with developer role
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="handleClose">Cancel</BaseButton>
      <BaseButton
        variant="primary"
        @click="handleSelect"
        :disabled="chatStore.selectedContextIds.length === 0"
      >
        Select ({{ chatStore.selectedContextIds.length }})
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Component-specific styles only - utility classes now global */
.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-accent);
  cursor: pointer;
  border-radius: var(--radius-sm);
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.checkbox:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent-glow);
}

.checkbox:checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 0 12px var(--color-accent-glow);
}

/* Modal overlay - now uses global modal-overlay class */
</style>
