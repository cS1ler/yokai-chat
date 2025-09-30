<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useLoading } from '@/composables/useLoading'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseModal from '@/components/shared/BaseModal.vue'

const router = useRouter()
const chatStore = useChatStore()
const { isLoading: isCheckingConnection, withLoading } = useLoading()
const { isLoading: isLoadingModels, withLoading: withLoadingModels } = useLoading()

const isConnected = ref(false)
const connectionError = ref('')
const availableModels = ref<string[]>([])
const apiUrlInput = ref<string>('') // expect "host:port" or "ip:port"
const hasAttempted = ref(false)
const showLoadHelp = ref(false)
const selectedModel = ref<string>('')
const showModelPrompt = ref(false)

// Check LM Studio connection and load models
onMounted(async () => {
  chatStore.loadLMStudioBaseUrlFromStorage()
  const saved = (chatStore as unknown as { lmStudioBaseUrl?: string }).lmStudioBaseUrl
  if (saved) {
    try {
      const url = new URL(saved)
      const hostPort = `${url.hostname}${url.port ? ':' + url.port : ''}`
      apiUrlInput.value = hostPort
    } catch {
      apiUrlInput.value = saved.replace(/^https?:\/\//, '').replace(/\/?v1\/?$/, '')
    }
  }
})

function buildBaseUrlFromInput(): string {
  const trimmed = apiUrlInput.value.trim()
  if (!trimmed) return ''
  const hasScheme = /^http?:\/\//i.test(trimmed)
  const withScheme = hasScheme ? trimmed : `http://${trimmed}`
  const withV1 = withScheme.endsWith('/v1') ? withScheme : `${withScheme.replace(/\/?$/, '')}/v1`
  return withV1
}

async function checkConnection() {
  try {
    // Use a service instance with the provided URL for connection test
    const { createLMStudioService } = await import('@/services/lmstudio')
    const baseUrl = buildBaseUrlFromInput()
    if (!baseUrl) {
      connectionError.value = 'Enter host:port to connect'
      hasAttempted.value = true
      isConnected.value = false
      return
    }
    const service = createLMStudioService(baseUrl)
    isConnected.value = await withLoading(() => service.testConnection())
    if (isConnected.value) {
      // Persist base URL immediately after successful connection
      chatStore.setLMStudioBaseUrl(baseUrl)
      // Auto-load models so options appear right away
      await loadModels()
    }
    hasAttempted.value = true
    if (!isConnected.value) {
      connectionError.value = 'LM Studio is not running or not accessible'
    }
  } catch {
    isConnected.value = false
    connectionError.value = 'Failed to connect to LM Studio'
    hasAttempted.value = true
  }
}

async function loadModels() {
  try {
    const { createLMStudioService } = await import('@/services/lmstudio')
    const service = createLMStudioService(
      (chatStore as unknown as { lmStudioBaseUrl?: string }).lmStudioBaseUrl ||
        buildBaseUrlFromInput(),
    )
    availableModels.value = await withLoadingModels(() => service.getAvailableModels())
    // If none found, prompt user to load a model in LM Studio
    if (availableModels.value.length === 0) {
      showLoadHelp.value = true
    }
  } catch (error) {
    console.error('Failed to load models:', error)
  }
}

function scrollToModels() {
  const modelsSection = document.getElementById('model-selection')
  if (modelsSection) {
    modelsSection.scrollIntoView({ behavior: 'smooth' })
  }
}

async function selectModel(model: string) {
  const baseUrl = buildBaseUrlFromInput()
  console.log('selectModel - baseUrl:', baseUrl)
  chatStore.setLMStudioBaseUrl(baseUrl)
  chatStore.setCurrentModel(model)

  // Wait for next tick to ensure reactivity updates are complete
  await nextTick()

  // Verify the model was set correctly
  console.log('Selected model:', model)
  console.log('Current model in store:', chatStore.currentModel)
  console.log(
    'Base URL in store:',
    (chatStore as unknown as { lmStudioBaseUrl?: string }).lmStudioBaseUrl,
  )

  // Navigate to chat page
  await router.push('/chat')
}

async function proceedToChat() {
  const baseUrl =
    (chatStore as unknown as { lmStudioBaseUrl?: string }).lmStudioBaseUrl ||
    buildBaseUrlFromInput()
  chatStore.setLMStudioBaseUrl(baseUrl)
  chatStore.setCurrentModel(selectedModel.value)
  // Verify chat endpoint with selected model
  const { createLMStudioService } = await import('@/services/lmstudio')
  const service = createLMStudioService(baseUrl)
  const ok = await service.testChat(selectedModel.value)
  if (ok) {
    router.push('/chat')
  } else {
    connectionError.value = 'Chat endpoint failed. Ensure the model is running in LM Studio.'
    isConnected.value = false
  }
}

function retryConnection() {
  checkConnection()
  if (isConnected.value) {
    loadModels()
  }
}
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="title-main">Yokai</span>
            <span class="title-accent">Chat</span>
          </h1>
          <div class="definition-card">
            <h2 class="definition-title">Yokai (妖怪)</h2>
            <p class="definition-text">
              Supernatural creatures, spirits, or demons in Japanese folklore. Yokai are mysterious
              entities that inhabit the boundary between the known and unknown, often possessing
              supernatural powers and appearing in various forms throughout Japanese mythology and
              popular culture.
            </p>
            <div class="definition-tags">
              <span class="tag">Supernatural</span>
              <span class="tag">Folklore</span>
              <span class="tag">Mystery</span>
              <span class="tag">Spirit</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="yokai-symbol">👹</div>
          <div class="floating-elements">
            <div class="element element-1">⚡</div>
            <div class="element element-2">🌟</div>
            <div class="element element-3">💫</div>
            <div class="element element-4">✨</div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="scroll-indicator" @click="scrollToModels">
        <div class="scroll-arrow">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </div>
        <span class="scroll-text">Choose Your Model</span>
      </div>
    </section>

    <!-- Model Selection Section -->
    <section id="model-selection" class="model-selection-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Connect to Your AI Model</h2>
          <p class="section-subtitle">
            Enter your LM Studio server details and select a model to begin your mystical
            conversation with Yokai Chat
          </p>
        </div>

        <!-- API Host:Port Input -->
        <div class="api-input-row">
          <input
            v-model="apiUrlInput"
            type="text"
            class="input flex-1"
            placeholder="127.0.0.1:1234"
          />
          <BaseButton variant="primary" @click="checkConnection" :loading="isCheckingConnection">
            Connect
          </BaseButton>
        </div>

        <!-- Connection Status -->
        <div class="connection-status">
          <div v-if="isCheckingConnection" class="status-card loading">
            <LoadingSpinner size="sm" />
            <span>Checking LM Studio connection...</span>
          </div>

          <div v-else-if="hasAttempted && !isConnected" class="status-card error">
            <div class="status-icon">⚠️</div>
            <div class="status-content">
              <h3>Connection Failed</h3>
              <p>{{ connectionError }}</p>
              <p class="help-text">
                Make sure LM Studio is running and the server is accessible at the specified
                address.
              </p>
              <BaseButton
                variant="primary"
                @click="retryConnection"
                :loading="isCheckingConnection"
              >
                Try Again
              </BaseButton>
            </div>
          </div>

          <div v-else-if="isConnected" class="status-card success">
            <div class="status-icon">✅</div>
            <div class="status-content">
              <h3>Connection Successful!</h3>
              <p>
                Your LM Studio server is ready. Choose a model below to begin your mystical chat
                experience.
              </p>
            </div>
          </div>
        </div>

        <!-- Model Selection -->
        <div v-if="isConnected" class="model-grid">
          <div v-if="isLoadingModels" class="loading-models">
            <LoadingSpinner size="md" />
            <span>Discovering available AI models...</span>
          </div>

          <div v-else-if="availableModels.length === 0" class="no-models">
            <div class="no-models-icon">📦</div>
            <h3>No AI Models Found</h3>
            <p>
              No models are currently loaded in your LM Studio server. Load a model to begin your
              mystical conversation.
            </p>
            <BaseButton variant="secondary" @click="loadModels" :loading="isLoadingModels">
              🔄 Refresh Models
            </BaseButton>
            <BaseButton variant="primary" @click="showLoadHelp = true">
              📖 How to Load a Model
            </BaseButton>
          </div>

          <div v-else-if="showModelPrompt" class="model-prompt">
            <div class="prompt-icon">🤖</div>
            <h3>Model Selection Complete!</h3>
            <p>
              Please load <strong>{{ selectedModel }}</strong> in your LM Studio application, then
              click below to begin your mystical chat.
            </p>
            <BaseButton variant="primary" @click="proceedToChat">✨ Start Mystical Chat</BaseButton>
          </div>

          <div v-else class="models-list">
            <div
              v-for="model in availableModels"
              :key="model"
              class="model-card"
              @click="selectModel(model)"
            >
              <div class="model-icon">🤖</div>
              <div class="model-info">
                <h3 class="model-name">{{ model }}</h3>
                <p class="model-description">Ready for mystical conversation</p>
              </div>
              <div class="model-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Help Modal -->
    <BaseModal
      :isOpen="showLoadHelp"
      @close="showLoadHelp = false"
      title="How to Load a Model in LM Studio"
    >
      <template #default>
        <div class="help-content">
          <h4>Follow these steps to load your AI model:</h4>
          <ol>
            <li>
              <strong>Launch LM Studio</strong> - Open the LM Studio application on your computer
            </li>
            <li>
              <strong>Download a Model</strong> - Go to the Models section and download a model if
              you haven't already
            </li>
            <li>
              <strong>Start the Server</strong> - Click "Start" or "Load" to run the selected model
            </li>
            <li>
              <strong>Verify Connection</strong> - Ensure the server is running at the host:port you
              entered above
            </li>
          </ol>
          <p>
            <strong>Next:</strong> Once your model is loaded, click "🔄 Refresh Models" to see it in
            the list below.
          </p>
        </div>
      </template>
      <template #footer>
        <BaseButton variant="primary" @click="showLoadHelp = false">✨ Got it!</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, #0f0f0f 100%);
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-8);
  position: relative;
  overflow: hidden;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-16);
  align-items: center;
  max-width: 1200px;
  width: 100%;
  z-index: 2;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  margin: 0;
}

.title-main {
  color: var(--color-text-primary);
  display: block;
}

.title-accent {
  color: var(--color-accent);
  display: block;
  text-shadow: 0 0 20px var(--color-accent-glow);
}

.definition-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(10px);
}

.definition-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: var(--space-4);
  font-family: var(--font-family-mono);
}

.definition-text {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

.definition-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  background: var(--color-accent);
  color: var(--color-primary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.yokai-symbol {
  font-size: 8rem;
  animation: float 3s ease-in-out infinite;
  z-index: 2;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.element {
  position: absolute;
  font-size: 2rem;
  animation: orbit 4s linear infinite;
}

.element-1 {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.element-2 {
  top: 20%;
  right: 20%;
  animation-delay: 1s;
}

.element-3 {
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}

.element-4 {
  bottom: 20%;
  right: 20%;
  animation-delay: 3s;
}

.scroll-indicator {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  transition: all var(--transition-normal);
  z-index: 2;
}

.scroll-indicator:hover {
  transform: translateX(-50%) translateY(-4px);
}

.scroll-arrow {
  color: var(--color-accent);
  animation: bounce 2s infinite;
}

.scroll-text {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* Model Selection Section */
.model-selection-section {
  padding: var(--space-16) var(--space-8);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.api-input-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  max-width: 800px;
  margin: 0 auto var(--space-8);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.connection-status {
  margin-bottom: var(--space-12);
}

.status-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid;
  max-width: 600px;
  margin: 0 auto;
}

.status-card.loading {
  background: var(--color-card);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.status-card.error {
  background: rgba(255, 71, 87, 0.1);
  border-color: var(--color-error);
  color: var(--color-text-primary);
}

.status-card.success {
  background: rgba(0, 255, 65, 0.1);
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.status-icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
}

.status-content h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.status-content p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.model-grid {
  max-width: 800px;
  margin: 0 auto;
}

.loading-models,
.no-models {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-secondary);
}

.no-models-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}

.no-models h3 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.no-models .btn + .btn {
  margin-left: var(--space-3);
}

.model-prompt {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-secondary);
}

.prompt-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}

.model-prompt h3 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.help-content h4 {
  color: var(--color-accent);
  margin-bottom: var(--space-4);
  font-size: var(--text-lg);
  font-weight: 600;
}

.help-content ol {
  padding-left: var(--space-6);
  line-height: var(--leading-relaxed);
}

.help-content p {
  margin-top: var(--space-4);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.help-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

.models-list {
  display: grid;
  gap: var(--space-4);
}

.model-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.model-card:hover {
  background: var(--color-hover);
  border-color: var(--color-accent);
  box-shadow: 0 0 20px var(--color-accent-glow);
  transform: translateY(-2px);
}

.model-icon {
  font-size: var(--text-2xl);
  flex-shrink: 0;
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.model-description {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.model-arrow {
  font-size: var(--text-xl);
  color: var(--color-accent);
  transition: transform var(--transition-normal);
}

.model-card:hover .model-arrow {
  transform: translateX(4px);
}

/* Animations */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes orbit {
  0% {
    transform: rotate(0deg) translateX(60px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(60px) rotate(-360deg);
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: var(--space-8);
    text-align: center;
  }

  .hero-title {
    font-size: 3rem;
  }

  .definition-card {
    padding: var(--space-6);
  }

  .yokai-symbol {
    font-size: 6rem;
  }

  .model-selection-section {
    padding: var(--space-8) var(--space-4);
  }
}
</style>
