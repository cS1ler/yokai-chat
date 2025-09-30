import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    const { getByRole } = render(LoadingSpinner)

    expect(getByRole('status')).toBeInTheDocument()
  })

  it('shows loading text by default', () => {
    const { getByText } = render(LoadingSpinner)

    expect(getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows custom text when provided', () => {
    const { getByText } = render(LoadingSpinner, {
      props: { text: 'Custom loading message' },
    })

    expect(getByText('Custom loading message')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { container } = render(LoadingSpinner, {
      props: { size: 'large' },
    })

    expect(container.querySelector('.spinner-large')).toBeInTheDocument()
  })

  it('applies color classes correctly', () => {
    const { container } = render(LoadingSpinner, {
      props: { color: 'accent' },
    })

    expect(container.querySelector('.spinner-accent')).toBeInTheDocument()
  })

  it('shows spinner animation', () => {
    const { container } = render(LoadingSpinner)

    const spinner = container.querySelector('.spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })
})
