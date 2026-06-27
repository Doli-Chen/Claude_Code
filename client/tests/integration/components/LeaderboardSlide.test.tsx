import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeaderboardSlide } from '../../../src/components/display/LeaderboardSlide'

const scores = [
  { rank: 1, nicknames: ['Alice'], total: 1, score: 100 },
  { rank: 2, nicknames: ['Bob'], total: 1, score: 80 },
  { rank: 3, nicknames: ['Carol'], total: 1, score: 60 },
  { rank: 4, nicknames: ['Dave'], total: 1, score: 40 },
  { rank: 5, nicknames: ['Eve'], total: 1, score: 20 },
]

describe('LeaderboardSlide', () => {
  it('renders the heading', () => {
    render(<LeaderboardSlide scores={scores} />)
    expect(screen.getByText('排行榜')).toBeInTheDocument()
  })

  it('renders all player nicknames', () => {
    render(<LeaderboardSlide scores={scores} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
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

  it('shows tied players joined by 、', () => {
    const tied = [
      { rank: 1, nicknames: ['Alice', 'Bob'], total: 2, score: 100 },
      { rank: 3, nicknames: ['Carol'], total: 1, score: 60 },
    ]
    render(<LeaderboardSlide scores={tied} />)
    expect(screen.getByText('Alice、Bob')).toBeInTheDocument()
  })

  it('shows 共N人 note when more than 3 tied', () => {
    const manyTied = [
      { rank: 1, nicknames: ['A', 'B', 'C', 'D'], total: 4, score: 100 },
    ]
    render(<LeaderboardSlide scores={manyTied} />)
    expect(screen.getByText('（共 4 人）')).toBeInTheDocument()
    expect(screen.getByText('A、B、C')).toBeInTheDocument()
  })
})
