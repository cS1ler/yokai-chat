import { ref, computed } from 'vue'

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const formData = ref<T>({ ...initialValues })
  const errors = ref<Partial<Record<keyof T, string>>>({})

  const isDirty = computed(() => {
    return Object.keys(formData.value).some((key) => formData.value[key] !== initialValues[key])
  })

  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0
  })

  const setField = <K extends keyof T>(field: K, value: T[K]) => {
    formData.value[field] = value
    // Clear error when user starts typing
    if (errors.value[field]) {
      delete errors.value[field]
    }
  }

  const setError = <K extends keyof T>(field: K, error: string) => {
    errors.value[field] = error
  }

  const clearError = <K extends keyof T>(field: K) => {
    delete errors.value[field]
  }

  const clearErrors = () => {
    errors.value = {}
  }

  const reset = () => {
    formData.value = { ...initialValues }
    clearErrors()
  }

  const validate = (rules: Partial<Record<keyof T, (value: any) => string | null>>) => {
    clearErrors()
    let hasErrors = false

    Object.keys(rules).forEach((field) => {
      const rule = rules[field as keyof T]
      if (rule) {
        const error = rule(formData.value[field as keyof T])
        if (error) {
          setError(field as keyof T, error)
          hasErrors = true
        }
      }
    })

    return !hasErrors
  }

  return {
    formData,
    errors,
    isDirty,
    isValid,
    setField,
    setError,
    clearError,
    clearErrors,
    reset,
    validate,
  }
}
