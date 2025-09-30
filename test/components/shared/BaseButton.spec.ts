import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import BaseButton from '@/components/shared/BaseButton.vue'

describe('BaseButton', () => {
  it('renders button with correct text', () => {
    const { getByRole } = render(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Click me' },
    })

    expect(getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies correct variant classes', () => {
    const { getByRole } = render(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Button' },
    })

    const button = getByRole('button')
    expect(button).toHaveClass('btn-primary')
  })

  it('applies secondary variant classes', () => {
    const { getByRole } = render(BaseButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Button' },
    })

    const button = getByRole('button')
    expect(button).toHaveClass('btn-secondary')
  })

  it('handles click events', async () => {
    const { getByRole, emitted } = render(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Button' },
    })

    const button = getByRole('button')
    await fireEvent.click(button)

    expect(emitted().click).toBeTruthy()
  })

  it('disables button when disabled prop is true', () => {
    const { getByRole } = render(BaseButton, {
      props: { variant: 'primary', disabled: true },
      slots: { default: 'Button' },
    })

    const button = getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows loading state when loading prop is true', () => {
    const { getByText } = render(BaseButton, {
      props: { variant: 'primary', loading: true },
      slots: { default: 'Button' },
    })

    expect(getByText(/loading/i)).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { getByRole } = render(BaseButton, {
      props: { variant: 'primary', size: 'large' },
      slots: { default: 'Button' },
    })

    const button = getByRole('button')
    expect(button).toHaveClass('btn-large')
  })

  it('applies modern button classes when modern prop is true', () => {
    const { getByRole } = render(BaseButton, {
      props: { variant: 'primary', modern: true },
      slots: { default: 'Button' },
    })

    const button = getByRole('button')
    expect(button).toHaveClass('modern-btn')
  })
})
