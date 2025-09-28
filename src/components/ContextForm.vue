<script setup lang="ts">
import { ref } from 'vue'
import type { ContextItem, ContextType, ProgrammingLanguage } from '@/types/chat'
import { CONTEXT_TYPES, PROGRAMMING_LANGUAGES, ERROR_MESSAGES, APP_CONFIG } from '@/constants'

const emit = defineEmits<{
  add: [context: ContextItem]
  save: [context: ContextItem]
  cancel: []
}>()

const showForm = ref(false)
const contextType = ref<ContextType>('code')
const title = ref('')
const content = ref('')
const language = ref<ProgrammingLanguage>('javascript')
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const resetForm = () => {
  title.value = ''
  content.value = ''
  language.value = 'javascript'
  contextType.value = 'code'
}

const createContextItem = (): ContextItem => {
  return {
    id: Date.now().toString(),
    type: contextType.value,
    title: title.value.trim(),
    content: content.value.trim(),
    language: contextType.value === 'code' ? language.value : undefined,
  }
}

const handleAdd = () => {
  if (!title.value.trim() || !content.value.trim()) {
    alert(ERROR_MESSAGES.CONTEXT_REQUIRED)
    return
  }

  const contextItem = createContextItem()
  emit('add', contextItem)
  resetForm()
  showForm.value = false
}

const handleSave = () => {
  if (!title.value.trim() || !content.value.trim()) {
    alert(ERROR_MESSAGES.CONTEXT_REQUIRED)
    return
  }

  const contextItem = createContextItem()
  emit('save', contextItem)
  resetForm()
  showForm.value = false
}

const handleCancel = () => {
  resetForm()
  showForm.value = false
  emit('cancel')
}

const openForm = () => {
  showForm.value = true
}

// File upload handling
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Check file size
  if (file.size > APP_CONFIG.MESSAGE_LIMITS.MAX_FILE_SIZE) {
    alert(
      `File is too large. Maximum size is ${Math.round(APP_CONFIG.MESSAGE_LIMITS.MAX_FILE_SIZE / (1024 * 1024))}MB`,
    )
    return
  }

  isUploading.value = true

  try {
    const fileContent = await readFileContent(file)
    const detectedLanguage = detectLanguageFromFilename(file.name)

    // Auto-fill form with file content
    title.value = file.name
    content.value = fileContent
    language.value = detectedLanguage
    contextType.value = 'file'

    // Clear the file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Error reading file:', error)
    alert('Error reading file. Please try again.')
  } finally {
    isUploading.value = false
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file content'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

const detectLanguageFromFilename = (filename: string): ProgrammingLanguage => {
  const ext = filename.split('.').pop()?.toLowerCase()

  const extensionMap: Record<string, ProgrammingLanguage> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    vue: 'vue',
    html: 'html',
    htm: 'html',
    css: 'css',
    json: 'json',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
    md: 'markdown',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
  }

  return extensionMap[ext || ''] || 'text'
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

// Drag and drop handling
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    // Create a fake event to reuse the existing handler
    const fakeEvent = {
      target: { files: [file] },
    } as unknown as Event
    handleFileUpload(fakeEvent)
  }
}

defineExpose({
  openForm,
})
</script>

<template>
  <div v-if="showForm" class="card">
    <div class="card-header">
      <h4>Add Context</h4>
      <button type="button" @click="handleCancel" class="btn-icon">×</button>
    </div>

    <!-- File Upload Section -->
    <div class="mb-md">
      <div class="flex gap-sm items-center mb-sm">
        <button
          type="button"
          @click="triggerFileUpload"
          :disabled="isUploading"
          class="btn btn-secondary"
          :class="{ 'opacity-50': isUploading }"
        >
          📁 {{ isUploading ? 'Uploading...' : 'Upload File' }}
        </button>
        <span class="text-sm text-muted">or enter content manually below</span>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        @change="handleFileUpload"
        accept=".js,.ts,.py,.vue,.html,.css,.json,.sh,.sql,.md,.java,.cpp,.cs,.go,.rs,.txt"
        class="hidden"
      />
    </div>

    <div class="flex gap-sm mb-md flex-wrap">
      <select v-model="contextType" class="select min-w-120">
        <option v-for="type in CONTEXT_TYPES" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>
      <input
        v-model="title"
        type="text"
        placeholder="Title/Description"
        class="input flex-1 min-w-200"
      />
      <select
        v-if="contextType === 'code' || contextType === 'file'"
        v-model="language"
        class="select min-w-100"
      >
        <option v-for="lang in PROGRAMMING_LANGUAGES" :key="lang.value" :value="lang.value">
          {{ lang.label }}
        </option>
      </select>
    </div>

    <div
      @dragover="handleDragOver"
      @drop="handleDrop"
      class="textarea mb-lg min-h-120 border-dashed border-2 border-muted hover:border-accent transition-colors cursor-pointer"
      :class="{ 'border-accent': isUploading }"
    >
      <textarea
        v-model="content"
        placeholder="Enter your code, file content, or text context here... (or drag & drop a file)"
        class="w-full h-full resize-none border-none outline-none bg-transparent"
        rows="6"
      ></textarea>
    </div>

    <div class="flex gap-sm justify-end">
      <button type="button" @click="handleCancel" class="btn btn-secondary">Cancel</button>
      <button type="button" @click="handleAdd" class="btn btn-primary">Add Context</button>
      <button type="button" @click="handleSave" class="btn btn-accent">Save Context</button>
    </div>
  </div>
</template>

<style scoped>
/* Utility classes */
.flex {
  display: flex;
}
.gap-sm {
  gap: var(--space-sm);
}
.mb-md {
  margin-bottom: var(--space-md);
}
.mb-lg {
  margin-bottom: var(--space-lg);
}
.flex-wrap {
  flex-wrap: wrap;
}
.justify-end {
  justify-content: flex-end;
}
.min-w-120 {
  min-width: 120px;
}
.min-w-200 {
  min-width: 200px;
}
.min-w-100 {
  min-width: 100px;
}
.min-h-120 {
  min-height: 120px;
}
.hidden {
  display: none;
}
.items-center {
  align-items: center;
}
.text-sm {
  font-size: 0.85rem;
}
.text-muted {
  color: var(--text-secondary);
}
.opacity-50 {
  opacity: 0.5;
}
.border-dashed {
  border-style: dashed;
}
.border-2 {
  border-width: 2px;
}
.border-muted {
  border-color: var(--text-secondary);
}
.hover\:border-accent:hover {
  border-color: var(--accent);
}
.transition-colors {
  transition: border-color 0.2s;
}
.cursor-pointer {
  cursor: pointer;
}
.w-full {
  width: 100%;
}
.h-full {
  height: 100%;
}
.resize-none {
  resize: none;
}
.border-none {
  border: none;
}
.outline-none {
  outline: none;
}
.bg-transparent {
  background: transparent;
}
</style>
