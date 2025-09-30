import { test, expect } from '@playwright/test'

test.describe('Yokai Chat Application', () => {
  test('loads landing page with correct title and content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Yokai/i)

    // Check for main hero content
    await expect(page.locator('h1')).toContainText('Yokai')
    await expect(page.locator('.hero-title')).toBeVisible()
    await expect(page.locator('.definition-card')).toBeVisible()
  })

  test('shows connection form and model selection', async ({ page }) => {
    await page.goto('/')

    // Check for connection form elements
    await expect(page.locator('input[placeholder*="IP address"]')).toBeVisible()
    await expect(page.locator('button:has-text("Check Connection")')).toBeVisible()
  })

  test('navigates to chat page after model selection', async ({ page }) => {
    await page.goto('/')

    // Fill in connection details (mock)
    await page.fill('input[placeholder*="IP address"]', '127.0.0.1:1234')

    // Mock the connection check and model loading
    await page.route('**/v1/models', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'test-model' }] }),
      })
    })

    await page.route('**/v1/chat/completions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ choices: [{ message: { content: 'Test response' } }] }),
      })
    })

    // Click check connection
    await page.click('button:has-text("Check Connection")')

    // Wait for models to load and select one
    await page.waitForSelector('button:has-text("Select Model")', { timeout: 5000 })
    await page.click('button:has-text("Select Model")')

    // Should navigate to chat page
    await expect(page).toHaveURL('/chat')
    await expect(page.locator('.chat-container')).toBeVisible()
  })

  test('shows model validation error when no model selected', async ({ page }) => {
    await page.goto('/chat')

    // Should show error message
    await expect(page.locator('.model-error-container')).toBeVisible()
    await expect(page.locator('button:has-text("Configure Connection & Model")')).toBeVisible()
  })

  test('displays current model in chat header', async ({ page }) => {
    // Mock localStorage with model data
    await page.addInitScript(() => {
      localStorage.setItem('currentModel', 'test-model')
      localStorage.setItem('lmStudioBaseUrl', 'http://127.0.0.1:1234/v1')
    })

    await page.goto('/chat')

    // Should show model in header
    await expect(page.locator('.model-display')).toBeVisible()
    await expect(page.locator('.model-name')).toContainText('test-model')
  })

  test('allows sending messages in chat interface', async ({ page }) => {
    // Mock localStorage with model data
    await page.addInitScript(() => {
      localStorage.setItem('currentModel', 'test-model')
      localStorage.setItem('lmStudioBaseUrl', 'http://127.0.0.1:1234/v1')
    })

    await page.goto('/chat')

    // Mock API responses
    await page.route('**/v1/chat/completions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"choices":[{"delta":{"content":"Test response"}}]}\n\n',
      })
    })

    // Find message input and send a message
    const messageInput = page.locator('input[placeholder*="message"]')
    await messageInput.fill('Hello, test message')

    const sendButton = page.locator('button:has-text("➤")')
    await sendButton.click()

    // Should show the message in the chat
    await expect(page.locator('.message-list-container')).toBeVisible()
  })

  test('navigates between pages correctly', async ({ page }) => {
    await page.goto('/')

    // Navigate to models page
    await page.click('a[href="/models"]')
    await expect(page).toHaveURL('/models')

    // Navigate back to landing
    await page.click('a:has-text("← Landing")')
    await expect(page).toHaveURL('/')
  })
})
