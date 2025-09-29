<script setup lang="ts">
import { useModal } from '@/composables/useModal'

interface Props {
  isOpen: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  close: []
}>()

const { close } = useModal()

const handleClose = () => {
  close()
  emit('close')
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div
      :class="['card w-full max-h-[80vh] overflow-hidden flex flex-col', sizeClasses[size]]"
      @click.stop
    >
      <div class="card-header">
        <h2 class="text-xl font-semibold">{{ title }}</h2>
        <button @click="handleClose" class="btn-icon text-muted hover:text-accent">×</button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>

      <div v-if="$slots.footer" class="flex gap-sm justify-end mt-md">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component uses global utility classes */
</style>
