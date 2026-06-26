import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeaderboardSlide } from '../../../src/components/display/LeaderboardSlide'

const scores = [
  { rank: 1, nickname: 'Alice', score: 100 },
  { rank: 2, nickname: 'Bob', score: 80 },
  { rank: 3, nickname: 'Carol', score: 60 },
  { rank: 4, nickname: 'Dave', score: 40 },
  { rank: 5, nickname: 'Eve', score: 20 },
]

describe('LeaderboardSlide', () => {
  it('renders the heading', () => {
    render(<LeaderboardSlide scores={scores} />)
    expect(screen.getByText('排行榜')).toBeInTheDocument()
  })

  it('renders all player nicknames', () => {
    render(<LeaderboardSlide scores={scores} />)
    scores.forEach((s) => {
      expect(screen.getByText(s.nickname)).toBeInTheDocument()
    })
  })

  it('renders all scores', () => {
    render(<LeaderboardSlide scores={scores} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
  })

  it('renders with empty scores', () => {
    render(<LeaderboardSlide scores={[]} />)
    expect(screen.getByText('排行榜')).toBeInTheDocument()
  })

  it('first place nickname has largest font class', () => {
    render(<LeaderboardSlide scores={scores} />)
    const alice = screen.getByText('Alice')
    expect(alice.className).toContain('text-6xl')
  })

  it('second place nickname has smaller font class', () => {
    render(<LeaderboardSlide scores={scores} />)
    const bob = screen.getByText('Bob')
    expect(bob.className).toContain('text-5xl')
  })
})
