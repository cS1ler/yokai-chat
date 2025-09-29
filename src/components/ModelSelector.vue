<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useModal } from '@/composables/useModal'
import { useClickOutside } from '@/composables/useModal'
import { useLoading } from '@/composables/useLoading'
import LoadingSpinner from './shared/LoadingSpinner.vue'
import BaseButton from './shared/BaseButton.vue'

const chatStore = useChatStore()
const { isOpen, open: openDropdown, close: closeDropdown } = useModal()
const dropdownRef = ref<HTMLDivElement>()
const { isLoading: isLoadingModels, withLoading } = useLoading()

const currentModel = computed(() => chatStore.currentModel)
const availableModels = computed(() => chatStore.availableModels)

// Load models on mount
onMounted(async () => {
  await chatStore.loadCurrentModelFromStorage()
  await withLoading(() => chatStore.loadAvailableModels())
})

// Close dropdown when clicking outside
useClickOutside(dropdownRef as any, closeDropdown)

const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const selectModel = (model: string) => {
  chatStore.setCurrentModel(model)
  closeDropdown()
}

const refreshModels = async () => {
  await withLoading(() => chatStore.loadAvailableModels())
}
</script>

<template>
  <div class="model-selector" ref="dropdownRef">
    <BaseButton
      variant="secondary"
      @click="toggleDropdown"
      :disabled="isLoadingModels"
      class="model-selector-button"
    >
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
    </BaseButton>

    <div v-if="isOpen" class="model-dropdown">
      <div class="dropdown-header">
        <span class="dropdown-title">Select Model</span>
        <BaseButton
          variant="icon"
          size="sm"
          @click="refreshModels"
          :loading="isLoadingModels"
          title="Refresh models"
        >
          <svg
            class="refresh-icon"
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
        </BaseButton>
      </div>

      <div v-if="isLoadingModels" class="loading-state">
        <LoadingSpinner size="sm" />
        <span>Loading models...</span>
      </div>

      <div v-else-if="availableModels.length === 0" class="empty-state">
        <span>No models available</span>
        <BaseButton variant="primary" size="sm" @click="refreshModels">Try Again</BaseButton>
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
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-header);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 200px;
}

.model-selector-button:hover:not(:disabled) {
  background: var(--color-hover);
  border-color: var(--color-accent);
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
  transition: transform var(--transition-fast);
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
  margin-top: var(--space-1);
  background: var(--color-header);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-dropdown);
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-secondary);
}

.dropdown-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.refresh-button {
  display: flex;
  align-items: center;
  padding: var(--space-1);
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.refresh-button:hover:not(:disabled) {
  background: var(--color-hover);
  color: var(--color-accent);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform var(--transition-fast);
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
  gap: var(--space-2);
  padding: var(--space-4);
  color: var(--color-text-muted);
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  color: var(--color-text-muted);
}

.retry-button {
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  transition: all var(--transition-fast);
}

.retry-button:hover {
  background: var(--color-accent-glow);
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
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.model-option:hover {
  background: var(--color-hover);
}

.model-option.selected {
  background: var(--color-accent);
  color: var(--color-primary);
}

.check-icon {
  flex-shrink: 0;
}

/* Scrollbar styling */
.model-list::-webkit-scrollbar {
  width: 6px;
}

.model-list::-webkit-scrollbar-track {
  background: var(--color-secondary);
}

.model-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.model-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}
</style>
