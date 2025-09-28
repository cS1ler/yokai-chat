<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="message message-assistant flex items-center gap-md min-h-48">
    <div class="flex gap-xs">
      <div class="spinner-dot"></div>
      <div class="spinner-dot"></div>
      <div class="spinner-dot"></div>
    </div>
    <span class="text-muted text-sm italic">{{ message || 'Yokai is thinking...' }}</span>
  </div>
</template>

<style scoped>
/* Utility classes */
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.gap-xs {
  gap: 4px;
}
.gap-md {
  gap: var(--space-md);
}
.min-h-48 {
  min-height: 48px;
}
.text-muted {
  color: var(--text-secondary);
}
.text-sm {
  font-size: 0.9rem;
}
.italic {
  font-style: italic;
}

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
