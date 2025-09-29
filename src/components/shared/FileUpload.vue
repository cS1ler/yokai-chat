<script setup lang="ts">
import { useFileUpload } from '@/composables/useFileUpload'
import LoadingSpinner from './LoadingSpinner.vue'
import type { ProgrammingLanguage } from '@/types/chat'

interface Props {
  accept?: string
  maxSize?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.js,.ts,.py,.vue,.html,.css,.json,.sh,.sql,.md,.java,.cpp,.cs,.go,.rs,.txt',
  maxSize: 5 * 1024 * 1024, // 5MB
  disabled: false,
})

const emit = defineEmits<{
  upload: [content: string, language: ProgrammingLanguage, filename: string]
}>()

const { isUploading, fileInput, handleFileUpload, handleDragOver, handleDrop, triggerFileUpload } =
  useFileUpload()

const handleFileSuccess = (content: string, language: ProgrammingLanguage, filename: string) => {
  emit('upload', content, language, filename)
}

const onFileUpload = (event: Event) => {
  handleFileUpload(event, handleFileSuccess)
}

const onDrop = (event: DragEvent) => {
  handleDrop(event, handleFileSuccess)
}
</script>

<template>
  <div class="file-upload-container">
    <div
      class="file-upload-area"
      :class="{
        'border-accent': isUploading,
        'opacity-50 cursor-not-allowed': disabled,
      }"
      @dragover="handleDragOver"
      @drop="onDrop"
      @click="!disabled && triggerFileUpload()"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :disabled="disabled"
        @change="onFileUpload"
        class="hidden"
      />

      <div class="text-center">
        <div v-if="isUploading" class="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Uploading...</span>
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <span class="text-2xl">📁</span>
          <span class="text-sm text-muted">
            {{ disabled ? 'Upload disabled' : 'Click or drag & drop a file' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-upload-container {
  width: 100%;
}

.file-upload-area {
  @apply border-2 border-dashed border-muted rounded-lg p-6 cursor-pointer transition-colors;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-upload-area:hover:not(.opacity-50) {
  @apply border-accent;
}
</style>
