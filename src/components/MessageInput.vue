<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContextItem } from '@/types/chat'
import { useChatStore } from '@/stores/chat'
import ContextForm from './ContextForm.vue'
import ContextItemComponent from './ContextItem.vue'
import ContextManager from './ContextManager.vue'

const chatStore = useChatStore()
const message = ref('')
const isAdvancedMode = ref(false)
const contextItems = ref<ContextItem[]>([])
const contextFormRef = ref<InstanceType<typeof ContextForm>>()
const contextManagerRef = ref<InstanceType<typeof ContextManager>>()

defineProps<{
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string, context?: ContextItem[]): void
  (e: 'stop'): void
}>()

// Load saved contexts on mount
onMounted(() => {
  chatStore.loadContextsFromStorage()
})

const hasContext = computed(() => contextItems.value.length > 0)

function handleSend() {
  if (!message.value.trim() && !hasContext.value) return

  // Send the raw message text and context separately
  // The ChatView will handle formatting for the AI
  emit('send', message.value.trim(), contextItems.value)

  // Reset form
  message.value = ''
  contextItems.value = []
}

function toggleAdvancedMode() {
  isAdvancedMode.value = !isAdvancedMode.value
}

function addContextItem(context: ContextItem) {
  contextItems.value.push(context)
}

function removeContextItem(id: string) {
  const index = contextItems.value.findIndex((item) => item.id === id)
  if (index > -1) {
    contextItems.value.splice(index, 1)
  }
}

function showAddContextForm() {
  contextFormRef.value?.openForm()
}

function handleStop() {
  emit('stop')
}

function saveContextToStore(context: ContextItem) {
  chatStore.saveContext(context)
}

function openContextManager() {
  contextManagerRef.value?.openManager()
}

function handleContextSelection(selectedContexts: ContextItem[]) {
  contextItems.value = selectedContexts
}
</script>

<template>
  <div class="flex flex-col gap-md p-lg border-t border-border bg-primary">
    <!-- Context Items Display -->
    <div v-if="hasContext" class="flex flex-col gap-sm">
      <ContextItemComponent
        v-for="item in contextItems"
        :key="item.id"
        :context="item"
        @remove="removeContextItem"
      />
    </div>

    <!-- Add Context Form -->
    <ContextForm
      ref="contextFormRef"
      @add="addContextItem"
      @save="saveContextToStore"
      @cancel="() => {}"
    />

    <!-- Context Manager Modal -->
    <ContextManager ref="contextManagerRef" @select="handleContextSelection" @close="() => {}" />

    <!-- Context Management -->
    <div v-if="isAdvancedMode" class="flex gap-sm">
      <button
        type="button"
        @click="openContextManager"
        class="btn btn-secondary text-sm"
        title="Load saved contexts"
      >
        📚 Load Saved
      </button>
      <button
        type="button"
        @click="showAddContextForm"
        class="btn btn-secondary text-sm"
        title="Add new context"
      >
        ➕ Add New
      </button>
    </div>

    <!-- Main Input Form -->
    <form @submit.prevent="handleSend">
      <div class="flex gap-sm">
        <div class="flex gap-xs">
          <button
            type="button"
            @click="toggleAdvancedMode"
            :class="['btn-icon', { active: isAdvancedMode }]"
            title="Toggle advanced mode"
          >
            ⚙️
          </button>
          <button
            v-if="isAdvancedMode"
            type="button"
            @click="showAddContextForm"
            class="btn-icon"
            title="Add context"
          >
            📎
          </button>
        </div>

        <input
          v-model="message"
          type="text"
          :placeholder="isAdvancedMode ? 'Message + Context' : 'Message Yokai...'"
          class="input flex-1"
        />

        <button
          v-if="!isStreaming"
          type="submit"
          :disabled="!message.trim() && !hasContext"
          class="btn btn-primary"
          :class="{ 'opacity-50': !message.trim() && !hasContext }"
        >
          ➤
        </button>

        <button v-else type="button" @click="handleStop" class="btn btn-danger">⏹</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Utility classes */
.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}
.gap-xs {
  gap: var(--space-xs);
}
.gap-sm {
  gap: var(--space-sm);
}
.gap-md {
  gap: var(--space-md);
}
.p-lg {
  padding: var(--space-lg);
}
.border-t {
  border-top: 1px solid var(--color-border);
}
.border-border {
  border-color: var(--color-border);
}
.bg-primary {
  background: var(--bg-primary);
}
.flex-1 {
  flex: 1;
}
.opacity-50 {
  opacity: 0.5;
}
</style>
