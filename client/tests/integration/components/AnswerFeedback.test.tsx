import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnswerFeedback } from '../../../src/components/player/AnswerFeedback'

describe('AnswerFeedback', () => {
  it('shows ✓ and correct message when correct', () => {
    render(<AnswerFeedback result={{ correct: true, score: 15, totalScore: 30, rank: 2 }} />)
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByText('答對了！')).toBeInTheDocument()
  })

  it('shows ✗ and wrong message when incorrect', () => {
    render(<AnswerFeedback result={{ correct: false, score: 0, totalScore: 15, rank: 5 }} />)
    expect(screen.getByText('✗')).toBeInTheDocument()
    expect(screen.getByText('答錯了')).toBeInTheDocument()
  })

  it('shows score gained when correct', () => {
    render(<AnswerFeedback result={{ correct: true, score: 18, totalScore: 50, rank: 1 }} />)
    expect(screen.getByText('+18 分')).toBeInTheDocument()
  })

  it('does not show score gained when incorrect', () => {
    render(<AnswerFeedback result={{ correct: false, score: 0, totalScore: 15, rank: 5 }} />)
    expect(screen.queryByText(/\+0 分/)).not.toBeInTheDocument()
  })

  it('shows total score', () => {
    render(<AnswerFeedback result={{ correct: true, score: 10, totalScore: 35, rank: 2 }} />)
    expect(screen.getByText('累計：35 分')).toBeInTheDocument()
  })
})
