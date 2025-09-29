<script setup lang="ts">
import type { ContextItem } from '@/types/chat'
import { APP_CONFIG } from '@/constants'
import { truncateText } from '@/utils/string'
import BaseButton from './shared/BaseButton.vue'

defineProps<{
  context: ContextItem
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const handleRemove = (id: string) => {
  emit('remove', id)
}
</script>

<template>
  <div class="card">
    <div class="flex items-center gap-sm mb-sm">
      <span class="badge badge-primary">{{ context.type }}</span>
      <span class="font-semibold flex-1">{{ context.title }}</span>
      <BaseButton
        variant="icon"
        size="sm"
        @click="handleRemove(context.id)"
        class="text-error hover:text-red-300"
      >
        ×
      </BaseButton>
    </div>
    <div class="text-muted text-sm font-mono">
      {{ truncateText(context.content, APP_CONFIG.MESSAGE_LIMITS.MAX_CONTEXT_PREVIEW) }}
    </div>
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
.gap-sm {
  gap: var(--space-sm);
}
.mb-sm {
  margin-bottom: var(--space-sm);
}
.font-semibold {
  font-weight: 600;
}
.flex-1 {
  flex: 1;
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
</style>
