<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { createLMStudioService } from '@/services/lmstudio'
import { useChatStore } from '@/stores/chat'
import { searchGGUFTextGenModels, type LMStudioCatalogItem } from '@/services/huggingface'

type ModelInfo = LMStudioCatalogItem

interface PullProgress {
  status: string
  digest?: string
  total?: number
  completed?: number
}

const availableModels = ref<ModelInfo[]>([])
const installedModels = ref<ModelInfo[]>([])
const isLoading = ref(false)
const isPulling = ref(false)
const pullProgress = ref<PullProgress>({ status: '' })
const searchQuery = ref('')
const selectedModel = ref('')

// Computed properties
const filteredModels = computed(() => {
  if (!searchQuery.value) return availableModels.value
  return availableModels.value.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const isModelInstalled = (modelName: string) => {
  return installedModels.value.some((model) => model.name === modelName)
}

// Methods
const loadModels = async () => {
  isLoading.value = true
  try {
    // Load installed models using user-provided base URL
    const chatStore = useChatStore()
    // Ensure base URL is loaded from storage
    chatStore.loadLMStudioBaseUrlFromStorage()
    const baseUrl = chatStore.lmStudioBaseUrl || ''

    if (!baseUrl) {
      console.warn('No LM Studio base URL configured')
      return
    }

    const service = createLMStudioService(baseUrl)
    const installed = await service.getAvailableModels()
    installedModels.value = installed.map((name) => ({
      name,
      size: 0,
      digest: '',
      modified_at: '',
    }))

    // Fetch models from Hugging Face that are likely to work in LM Studio
    const hf = await searchGGUFTextGenModels(60)
    // Basic quality filter: require size > 0 and format gguf
    availableModels.value = hf.filter((m) => m.size >= 0 && m.details?.format === 'gguf')
  } catch (error) {
    console.error('Failed to load models:', error)
  } finally {
    isLoading.value = false
  }
}

const downloadModel = async (modelName: string) => {
  if (isPulling.value) return

  selectedModel.value = modelName
  isPulling.value = true
  pullProgress.value = { status: 'Starting download...' }

  try {
    // LM Studio doesn't have a direct API for downloading models
    // Instead, we'll show instructions to the user
    pullProgress.value.status = 'Please download this model in LM Studio'

    // Show instructions
    alert(
      `To download ${modelName}:\n\n1. Open LM Studio\n2. Go to the "Models" tab\n3. Search for "${modelName}"\n4. Click "Download" next to the model\n5. Once downloaded, refresh this page`,
    )

    pullProgress.value.status = 'Model download instructions shown'
    isPulling.value = false
    selectedModel.value = ''

    // Refresh installed models after a delay
    setTimeout(async () => {
      await loadModels()
    }, 2000)
  } catch (error) {
    console.error('Failed to show download instructions:', error)
    pullProgress.value.status = 'Failed to show instructions'
    isPulling.value = false
    selectedModel.value = ''
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(async () => {
  // Wait for page to fully load, then add 1 second delay before making API request
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await loadModels()
})
</script>

<template>
  <div class="model-download-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">Model Library</h1>
          <p class="page-subtitle">Download and manage AI models for LM Studio</p>
        </div>
        <div class="header-right">
          <router-link to="/" class="btn btn-secondary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Chat
          </router-link>
          <button @click="loadModels" class="btn btn-primary" :disabled="isLoading">
            <svg v-if="isLoading" class="spinning-icon" width="16" height="16" viewBox="0 0 24 24">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" fill="currentColor" />
            </svg>
            {{ isLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>
    </header>

    <div class="page-content">
      <!-- Search and Filters -->
      <div class="search-section">
        <div class="search-container">
          <svg
            class="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search models..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Download Progress -->
      <div v-if="isPulling" class="download-progress">
        <div class="progress-header">
          <h3>Downloading {{ selectedModel }}</h3>
          <span class="progress-status">{{ pullProgress.status }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width:
                pullProgress.total && pullProgress.completed
                  ? `${(pullProgress.completed / pullProgress.total) * 100}%`
                  : '0%',
            }"
          ></div>
        </div>
      </div>

      <!-- Models Grid -->
      <div class="models-grid">
        <div
          v-for="model in filteredModels"
          :key="model.name"
          class="model-card"
          :class="{ downloading: selectedModel === model.name }"
        >
          <div class="model-header">
            <div class="model-info">
              <h3 class="model-name">{{ model.name }}</h3>
              <div class="model-badges">
                <span class="badge badge-primary">{{ model.details?.family || 'Unknown' }}</span>
                <span class="badge badge-secondary">{{
                  model.details?.parameter_size || 'N/A'
                }}</span>
              </div>
            </div>
            <div class="model-status">
              <span v-if="isModelInstalled(model.name)" class="status-badge installed">
                ✓ Installed
              </span>
              <span v-else class="status-badge available"> Available </span>
            </div>
          </div>

          <div class="model-details">
            <div class="detail-row">
              <span class="detail-label">Size:</span>
              <span class="detail-value">{{
                model.size > 0 ? formatFileSize(model.size) : 'Check HF page'
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Downloads:</span>
              <span class="detail-value">{{ model.downloads?.toLocaleString() || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Likes:</span>
              <span class="detail-value">{{ model.likes?.toLocaleString() || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Format:</span>
              <span class="detail-value">{{ model.details?.format || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantization:</span>
              <span class="detail-value">{{ model.details?.quantization_level || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Updated:</span>
              <span class="detail-value">{{ formatDate(model.modified_at) }}</span>
            </div>
          </div>

          <div class="model-actions">
            <button
              v-if="!isModelInstalled(model.name)"
              @click="downloadModel(model.name)"
              class="btn btn-primary btn-download"
              :disabled="isPulling"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {{ selectedModel === model.name ? 'Downloading...' : 'Download' }}
            </button>
            <button v-else class="btn btn-secondary" disabled>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              Installed
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredModels.length === 0 && !isLoading" class="empty-state">
        <svg
          class="empty-icon"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <h3>No models found</h3>
        <p>Try adjusting your search terms or refresh the list.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-download-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #0f0f0f 100%);
  color: var(--color-text);
}

.page-header {
  background: var(--color-header);
  border-bottom: 1px solid var(--color-border);
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  flex: 1;
}

.page-title {
  color: var(--neon-green);
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 0 10px var(--neon-green-glow);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.search-section {
  margin-bottom: 2rem;
}

.search-container {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: var(--bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--neon-green);
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.2);
}

.download-progress {
  background: var(--bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-header h3 {
  color: var(--neon-green);
  margin: 0;
}

.progress-status {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-green), var(--neon-green-glow));
  transition: width 0.3s ease;
  box-shadow: 0 0 8px var(--neon-green-glow);
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.model-card {
  background: var(--bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.model-card:hover {
  border-color: var(--neon-green);
  box-shadow: 0 8px 32px rgba(0, 255, 0, 0.1);
  transform: translateY(-2px);
}

.model-card.downloading {
  border-color: var(--neon-green);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.model-info {
  flex: 1;
}

.model-name {
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.model-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-primary {
  background: var(--neon-green);
  color: var(--bg-primary);
}

.badge-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-border);
}

.model-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.installed {
  background: rgba(0, 255, 0, 0.1);
  color: var(--neon-green);
  border: 1px solid var(--neon-green);
}

.status-badge.available {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-border);
}

.model-details {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--bg-primary);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.detail-value {
  color: var(--color-text);
  font-weight: 500;
  font-size: 0.9rem;
}

.model-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: var(--neon-green);
  color: var(--bg-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--neon-green-glow);
  box-shadow: 0 4px 16px rgba(0, 255, 0, 0.3);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-download {
  flex: 1;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  margin: 0;
}

.spinning-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .models-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-content {
    padding: 1rem;
  }
}
</style>
