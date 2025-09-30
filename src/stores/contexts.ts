import { defineStore } from 'pinia'
import { ref, shallowRef, triggerRef } from 'vue'
import type { ContextItem } from '@/types/chat'
import { StatePersistence } from '@/utils/persistence'

export const useContextsStore = defineStore('contexts', () => {
  // State - Use shallowRef for better performance with large arrays
  const savedContexts = shallowRef<ContextItem[]>([])
  const selectedContextIds = ref<string[]>([])
  const activeContextIds = ref<string[]>([]) // Contexts that are currently active/loaded

  // Actions
  const saveContext = (context: ContextItem) => {
    console.log('saveContext called with:', context)
    const existingIndex = savedContexts.value.findIndex((c) => c.id === context.id)
    let newContexts: ContextItem[]

    if (existingIndex >= 0) {
      newContexts = [...savedContexts.value]
      newContexts[existingIndex] = context
      console.log('Updating existing context at index:', existingIndex)
    } else {
      newContexts = [...savedContexts.value, context]
      console.log('Adding new context. Total contexts now:', newContexts.length)
    }

    savedContexts.value = newContexts
    triggerRef(savedContexts)
    saveContextsToStorage()
    console.log('Context saved successfully. savedContexts.value:', savedContexts.value)
  }

  const deleteContext = (id: string) => {
    const index = savedContexts.value.findIndex((c) => c.id === id)
    if (index >= 0) {
      const newContexts = savedContexts.value.filter((_, i) => i !== index)
      savedContexts.value = newContexts
      triggerRef(savedContexts)

      // Remove from selected contexts if it was selected
      const selectedIndex = selectedContextIds.value.indexOf(id)
      if (selectedIndex >= 0) {
        selectedContextIds.value.splice(selectedIndex, 1)
      }
      saveContextsToStorage()
    }
  }

  const toggleContextSelection = (id: string) => {
    const index = selectedContextIds.value.indexOf(id)
    if (index >= 0) {
      selectedContextIds.value.splice(index, 1)
    } else {
      selectedContextIds.value.push(id)
    }
  }

  const getSelectedContexts = () => {
    return savedContexts.value.filter((c) => selectedContextIds.value.includes(c.id))
  }

  const getActiveContexts = () => {
    return savedContexts.value.filter((c) => activeContextIds.value.includes(c.id))
  }

  const clearSelectedContexts = () => {
    selectedContextIds.value = []
  }

  const setActiveContexts = (contextIds: string[]) => {
    activeContextIds.value = contextIds
    // Persist active contexts to localStorage
    try {
      localStorage.setItem('yokai-chat-active-contexts', JSON.stringify(contextIds))
    } catch (error) {
      console.warn('Failed to save active contexts to localStorage:', error)
    }
  }

  const loadActiveContextsFromStorage = () => {
    try {
      const stored = localStorage.getItem('yokai-chat-active-contexts')
      if (stored) {
        activeContextIds.value = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load active contexts from localStorage:', error)
    }
  }

  const toggleActiveContext = (id: string) => {
    const index = activeContextIds.value.indexOf(id)
    if (index >= 0) {
      activeContextIds.value.splice(index, 1)
    } else {
      activeContextIds.value.push(id)
    }
    setActiveContexts(activeContextIds.value)
  }

  const clearActiveContexts = () => {
    activeContextIds.value = []
    setActiveContexts([])
  }

  // Persistence
  const saveContextsToStorage = () => {
    try {
      console.log('Saving contexts to storage:', savedContexts.value)
      StatePersistence.saveContexts(savedContexts.value)
      console.log('Contexts saved to localStorage successfully')
    } catch (error) {
      console.warn('Failed to save contexts to localStorage:', error)
    }
  }

  const loadContextsFromStorage = () => {
    try {
      const storedContexts = StatePersistence.loadContexts()
      savedContexts.value = storedContexts
      triggerRef(savedContexts)
      console.log('Loaded contexts from storage:', storedContexts.length, 'contexts')
    } catch (error) {
      console.warn('Failed to load contexts from localStorage:', error)
      savedContexts.value = []
      triggerRef(savedContexts)
    }
  }

  return {
    // State
    savedContexts,
    selectedContextIds,
    activeContextIds,

    // Actions
    saveContext,
    deleteContext,
    toggleContextSelection,
    getSelectedContexts,
    getActiveContexts,
    clearSelectedContexts,
    setActiveContexts,
    toggleActiveContext,
    clearActiveContexts,
    loadActiveContextsFromStorage,
    loadContextsFromStorage,
  }
})
