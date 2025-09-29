<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'icon' | 'danger' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = 'btn'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    icon: 'btn-icon',
    danger: 'btn-danger',
    accent: 'btn-primary', // Use primary styling for accent
  }
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'text-sm px-3 py-2',
    lg: 'btn-lg',
  }

  return [
    baseClasses,
    variantClasses[props.variant],
    sizeClasses[props.size],
    props.disabled || props.loading ? 'opacity-50 cursor-not-allowed' : '',
    props.loading ? 'relative' : '',
  ]
    .filter(Boolean)
    .join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button :class="buttonClasses" :disabled="disabled || loading" @click="handleClick">
    <LoadingSpinner v-if="loading" size="sm" class="mr-2" />
    <slot />
  </button>
</template>
