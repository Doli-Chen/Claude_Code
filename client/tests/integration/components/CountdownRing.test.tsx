import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CountdownRing } from '../../../src/components/display/CountdownRing'

describe('CountdownRing', () => {
  it('renders with aria-label showing time', () => {
    render(<CountdownRing timeRemaining={15} timeLimit={20} />)
    expect(screen.getByLabelText('倒數 15 秒')).toBeInTheDocument()
  })

  it('shows ceiling of timeRemaining in text', () => {
    render(<CountdownRing timeRemaining={14.7} timeLimit={20} />)
    expect(screen.getByLabelText(/倒數 15 秒/)).toBeInTheDocument()
  })

  it('renders at 0 seconds', () => {
    render(<CountdownRing timeRemaining={0} timeLimit={20} />)
    expect(screen.getByLabelText('倒數 0 秒')).toBeInTheDocument()
  })

  it('renders at full time', () => {
    render(<CountdownRing timeRemaining={20} timeLimit={20} />)
    expect(screen.getByLabelText('倒數 20 秒')).toBeInTheDocument()
  })
})
