export const validationRules = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required'
    }
    return null
  },

  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`
    }
    return null
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters`
    }
    return null
  },

  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Must be a valid email address'
    }
    return null
  },

  url: (value: string) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return 'Must be a valid URL'
    }
    return null
  },

  fileSize: (maxSize: number) => (file: File) => {
    if (file && file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`
    }
    return null
  },

  fileType: (allowedTypes: string[]) => (file: File) => {
    if (file && !allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`
    }
    return null
  },
}

export const createValidator = (rules: Array<(value: any) => string | null>) => {
  return (value: any) => {
    for (const rule of rules) {
      const error = rule(value)
      if (error) return error
    }
    return null
  }
}
