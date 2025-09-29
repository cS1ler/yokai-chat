<script setup lang="ts">
import type { ContextItem, ContextType, ProgrammingLanguage } from '@/types/chat'
import { CONTEXT_TYPES, PROGRAMMING_LANGUAGES, ERROR_MESSAGES } from '@/constants'
import { useModal } from '@/composables/useModal'
import { useForm } from '@/composables/useForm'
import BaseModal from './shared/BaseModal.vue'
import FileUpload from './shared/FileUpload.vue'
import BaseButton from './shared/BaseButton.vue'

const emit = defineEmits<{
  add: [context: ContextItem]
  save: [context: ContextItem]
  cancel: []
}>()

const { isOpen: showForm, open: openForm, close: closeForm } = useModal()

const { formData, errors, validate, reset } = useForm({
  contextType: 'code' as ContextType,
  title: '',
  content: '',
  language: 'javascript' as ProgrammingLanguage,
})

const createContextItem = (): ContextItem => {
  return {
    id: Date.now().toString(),
    type: formData.value.contextType,
    title: formData.value.title.trim(),
    content: formData.value.content.trim(),
    language: formData.value.contextType === 'code' ? formData.value.language : undefined,
  }
}

const handleAdd = () => {
  const isValid = validate({
    title: (value) => (!value.trim() ? 'Title is required' : null),
    content: (value) => (!value.trim() ? 'Content is required' : null),
  })

  if (!isValid) {
    alert(ERROR_MESSAGES.CONTEXT_REQUIRED)
    return
  }

  const contextItem = createContextItem()
  emit('add', contextItem)
  reset()
  closeForm()
}

const handleSave = () => {
  const isValid = validate({
    title: (value) => (!value.trim() ? 'Title is required' : null),
    content: (value) => (!value.trim() ? 'Content is required' : null),
  })

  if (!isValid) {
    alert(ERROR_MESSAGES.CONTEXT_REQUIRED)
    return
  }

  const contextItem = createContextItem()
  emit('save', contextItem)
  reset()
  closeForm()
}

const handleCancel = () => {
  reset()
  closeForm()
  emit('cancel')
}

const handleFileUpload = (content: string, language: ProgrammingLanguage, filename: string) => {
  // Auto-fill form with file content
  formData.value.title = filename
  formData.value.content = content
  formData.value.language = language
  formData.value.contextType = 'file'
}

defineExpose({
  openForm,
})
</script>

<template>
  <BaseModal :is-open="showForm" title="Add Context" size="xl" @close="handleCancel">
    <!-- File Upload Section -->
    <div class="mb-md">
      <div class="flex gap-sm items-center mb-sm">
        <span class="text-sm text-muted">Upload a file or enter content manually below</span>
      </div>
      <FileUpload @upload="handleFileUpload" />
    </div>

    <div class="flex gap-sm mb-md flex-wrap">
      <select v-model="formData.contextType" class="select min-w-120">
        <option v-for="type in CONTEXT_TYPES" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>
      <input
        v-model="formData.title"
        type="text"
        placeholder="Title/Description"
        class="input flex-1 min-w-200"
        :class="{ 'border-error': errors.title }"
      />
      <select
        v-if="formData.contextType === 'code' || formData.contextType === 'file'"
        v-model="formData.language"
        class="select min-w-100"
      >
        <option v-for="lang in PROGRAMMING_LANGUAGES" :key="lang.value" :value="lang.value">
          {{ lang.label }}
        </option>
      </select>
    </div>

    <div class="mb-lg">
      <textarea
        v-model="formData.content"
        placeholder="Enter your code, file content, or text context here..."
        class="textarea w-full min-h-120"
        :class="{ 'border-error': errors.content }"
        rows="6"
      ></textarea>
      <div v-if="errors.title || errors.content" class="text-error text-sm mt-1">
        {{ errors.title || errors.content }}
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="handleCancel">Cancel</BaseButton>
      <BaseButton variant="primary" @click="handleAdd">Add Context</BaseButton>
      <BaseButton variant="accent" @click="handleSave">Save Context</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Component-specific styles only - utility classes now global */

/* Modal overlay - now uses global modal-overlay class */
</style>
