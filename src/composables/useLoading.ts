import { ref } from 'vue'

export function useLoading(initialState = false) {
  const isLoading = ref(initialState)

  const startLoading = () => {
    isLoading.value = true
  }

  const stopLoading = () => {
    isLoading.value = false
  }

  const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    startLoading()
    try {
      return await asyncFn()
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  }
}
