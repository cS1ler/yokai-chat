<script setup lang="ts">
import { ref, onErrorCaptured, onMounted } from 'vue'
import BaseButton from './BaseButton.vue'

interface Props {
  fallback?: string
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fallback: 'Something went wrong. Please try again.',
  showDetails: false,
})

const emit = defineEmits<{
  error: [error: Error, info: string]
  retry: []
}>()

const hasError = ref(false)
const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

// Capture component errors
onErrorCaptured((err, instance, info) => {
  hasError.value = true
  error.value = err
  errorInfo.value = info

  console.error('Component error captured:', err, info)

  // Emit error event for parent components
  emit('error', err, info)

  // Prevent error from propagating
  return false
})

// Retry function
const retry = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = ''
  emit('retry')
}

// Reset error state on mount
onMounted(() => {
  hasError.value = false
  error.value = null
  errorInfo.value = ''
})
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">{{ fallback }}</p>

      <div v-if="showDetails && error" class="error-details">
        <details>
          <summary>Error Details</summary>
          <pre class="error-stack">{{ error.stack }}</pre>
          <p class="error-info">{{ errorInfo }}</p>
        </details>
      </div>

      <div class="error-actions">
        <BaseButton @click="retry" variant="primary"> Try Again </BaseButton>
        <BaseButton @click="$router.push('/')" variant="secondary"> Go Home </BaseButton>
      </div>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: var(--space-6);
  background: var(--color-background);
}

.error-content {
  text-align: center;
  max-width: 500px;
  padding: var(--space-6);
  background: var(--color-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
}

.error-title {
  color: var(--color-text-primary);
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: var(--space-3);
}

.error-message {
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  margin-bottom: var(--space-4);
  line-height: 1.5;
}

.error-details {
  margin: var(--space-4) 0;
  text-align: left;
}

.error-details details {
  background: var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
}

.error-details summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.error-stack {
  background: var(--color-background);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--text-xs);
  color: var(--color-text-primary);
  overflow-x: auto;
  white-space: pre-wrap;
  margin: var(--space-2) 0;
}

.error-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: var(--space-2) 0 0 0;
}

.error-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  margin-top: var(--space-4);
}

@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
  }

  .error-content {
    padding: var(--space-4);
  }
}
</style>
