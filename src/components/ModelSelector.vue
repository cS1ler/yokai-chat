<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const isOpen = ref(false)
const dropdownRef = ref<HTMLDivElement>()

const currentModel = computed(() => chatStore.currentModel)
const availableModels = computed(() => chatStore.availableModels)
const isLoadingModels = computed(() => chatStore.isLoadingModels)

// Load models on mount
onMounted(async () => {
  await chatStore.loadCurrentModelFromStorage()
  await chatStore.loadAvailableModels()
})

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

// Watch for outside clicks
watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectModel = (model: string) => {
  chatStore.setCurrentModel(model)
  isOpen.value = false
}

const refreshModels = async () => {
  await chatStore.loadAvailableModels()
}
</script>

<template>
  <div class="model-selector" ref="dropdownRef">
    <button @click="toggleDropdown" class="model-selector-button" :disabled="isLoadingModels">
      <span class="model-name">{{ currentModel }}</span>
      <svg
        class="dropdown-icon"
        :class="{ rotated: isOpen }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6,9 12,15 18,9"></polyline>
      </svg>
    </button>

    <div v-if="isOpen" class="model-dropdown">
      <div class="dropdown-header">
        <span class="dropdown-title">Select Model</span>
        <button
          @click="refreshModels"
          class="refresh-button"
          :disabled="isLoadingModels"
          title="Refresh models"
        >
          <svg
            class="refresh-icon"
            :class="{ spinning: isLoadingModels }"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="23,4 23,10 17,10"></polyline>
            <polyline points="1,20 1,14 7,14"></polyline>
            <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
          </svg>
        </button>
      </div>

      <div v-if="isLoadingModels" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Loading models...</span>
      </div>

      <div v-else-if="availableModels.length === 0" class="empty-state">
        <span>No models available</span>
        <button @click="refreshModels" class="retry-button">Try Again</button>
      </div>

      <div v-else class="model-list">
        <button
          v-for="model in availableModels"
          :key="model"
          @click="selectModel(model)"
          class="model-option"
          :class="{ selected: model === currentModel }"
        >
          <span class="model-name">{{ model }}</span>
          <svg
            v-if="model === currentModel"
            class="check-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-selector {
  position: relative;
  display: inline-block;
}

.model-selector-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-header);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
}

.model-selector-button:hover:not(:disabled) {
  background: var(--color-hover);
  border-color: var(--neon-green);
}

.model-selector-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.model-name {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.model-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: var(--color-header);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--bg-secondary);
}

.dropdown-title {
  font-weight: 600;
  color: var(--color-text);
}

.refresh-button {
  display: flex;
  align-items: center;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: var(--color-hover);
  color: var(--neon-green);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform 0.2s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-text-muted);
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--neon-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-text-muted);
}

.retry-button {
  padding: 0.5rem 1rem;
  background: var(--neon-green);
  color: var(--bg-primary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: var(--neon-green-glow);
}

.model-list {
  max-height: 200px;
  overflow-y: auto;
}

.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.model-option:hover {
  background: var(--color-hover);
}

.model-option.selected {
  background: var(--neon-green);
  color: var(--bg-primary);
}

.check-icon {
  flex-shrink: 0;
}

/* Scrollbar styling */
.model-list::-webkit-scrollbar {
  width: 6px;
}

.model-list::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.model-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.model-list::-webkit-scrollbar-thumb:hover {
  background: var(--neon-green);
}
</style>
