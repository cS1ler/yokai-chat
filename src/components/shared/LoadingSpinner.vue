<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'accent' | 'muted'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'accent',
})

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

const colorClasses = {
  primary: 'border-primary',
  accent: 'border-accent',
  muted: 'border-muted',
}
</script>

<template>
  <div
    :class="[
      'loading-spinner border-2 border-transparent border-t-current rounded-full animate-spin',
      sizeClasses[size],
      colorClasses[color],
    ]"
  />
</template>

<style scoped>
.loading-spinner {
  border-top-color: currentColor;
}
</style>
