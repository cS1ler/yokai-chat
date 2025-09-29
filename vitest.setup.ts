import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/vue'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest expect with Testing Library DOM matchers
expect.extend(matchers)

// Ensure DOM is cleaned up between tests
afterEach(() => {
  cleanup()
})

// Mock scrollIntoView and other non-implemented DOM APIs if needed
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn()
}


