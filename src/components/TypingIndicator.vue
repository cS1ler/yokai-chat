<script setup lang="ts">
import LoadingSpinner from './shared/LoadingSpinner.vue'

defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="message message-assistant flex items-center gap-md min-h-48">
    <div class="flex gap-xs">
      <LoadingSpinner size="sm" class="animate-typing" />
      <LoadingSpinner size="sm" class="animate-typing" style="animation-delay: -0.16s" />
      <LoadingSpinner size="sm" class="animate-typing" style="animation-delay: 0s" />
    </div>
    <span class="text-muted text-sm italic">{{ message || 'Yokai is thinking...' }}</span>
  </div>
</template>

<style scoped>
/* Component-specific styles only - utility classes now global */

/* Spinner animation */
.spinner-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-accent);
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.spinner-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.spinner-dot:nth-child(2) {
  animation-delay: -0.16s;
}
.spinner-dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>
