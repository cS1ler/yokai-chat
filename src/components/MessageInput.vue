<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContextItem } from '@/types/chat'
import { useChatStore } from '@/stores/chat'
import ContextItemComponent from './ContextItem.vue'

const chatStore = useChatStore()
const message = ref('')
const isAdvancedMode = ref(false)
const contextItems = ref<ContextItem[]>([])

defineProps<{
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string, context?: ContextItem[]): void
  (e: 'stop'): void
  (e: 'open-context-manager'): void
  (e: 'open-context-form'): void
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
  console.log('showAddContextForm called')
  emit('open-context-form')
}

function handleStop() {
  emit('stop')
}

function openContextManager() {
  emit('open-context-manager')
}

function handleContextSelection(selectedContexts: ContextItem[]) {
  contextItems.value = selectedContexts
}

defineExpose({
  setContextItems: handleContextSelection,
  addContextItem,
})
</script>

<template>
  <div class="flex flex-col gap-md">
    <!-- Context Items Display -->
    <div v-if="hasContext" class="flex flex-col gap-sm">
      <ContextItemComponent
        v-for="item in contextItems"
        :key="item.id"
        :context="item"
        @remove="removeContextItem"
      />
    </div>

    <!-- Add Context Form is now handled by ChatView -->

    <!-- Context Manager Modal is now handled by ChatView -->

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
/* Component-specific styles only - utility classes now global */
</style>
