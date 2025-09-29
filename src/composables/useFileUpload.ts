import { ref } from 'vue'
import type { ProgrammingLanguage } from '@/types/chat'
import { APP_CONFIG } from '@/constants'

export function useFileUpload() {
  const isUploading = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

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

  const handleFileUpload = async (
    event: Event,
    onSuccess: (content: string, language: ProgrammingLanguage, filename: string) => void,
  ) => {
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

      onSuccess(fileContent, detectedLanguage, file.name)

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

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (
    event: DragEvent,
    onSuccess: (content: string, language: ProgrammingLanguage, filename: string) => void,
  ) => {
    event.preventDefault()
    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      // Create a fake event to reuse the existing handler
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as Event
      handleFileUpload(fakeEvent, onSuccess)
    }
  }

  const triggerFileUpload = () => {
    fileInput.value?.click()
  }

  return {
    isUploading,
    fileInput,
    handleFileUpload,
    handleDragOver,
    handleDrop,
    triggerFileUpload,
    detectLanguageFromFilename,
  }
}
