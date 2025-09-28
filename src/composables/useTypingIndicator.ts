import { ref, computed, readonly } from 'vue'

export function useTypingIndicator() {
  const isTyping = ref(false)
  const typingStartTime = ref<Date | null>(null)

  const typingDuration = computed(() => {
    if (!typingStartTime.value) return 0
    return Date.now() - typingStartTime.value.getTime()
  })

  const showTypingIndicator = () => {
    isTyping.value = true
    typingStartTime.value = new Date()
  }

  const hideTypingIndicator = () => {
    isTyping.value = false
    typingStartTime.value = null
  }

  const resetTypingIndicator = () => {
    isTyping.value = false
    typingStartTime.value = null
  }

  return {
    isTyping: readonly(isTyping),
    typingDuration,
    showTypingIndicator,
    hideTypingIndicator,
    resetTypingIndicator,
  }
}
