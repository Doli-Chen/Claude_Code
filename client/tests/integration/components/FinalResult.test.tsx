import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FinalResult } from '../../../src/components/player/FinalResult'

const top5 = [
  { rank: 1, nicknames: ['Alice'], total: 1, score: 100 },
  { rank: 2, nicknames: ['Bob'], total: 1, score: 80 },
]

describe('FinalResult', () => {
  it('renders game over heading', () => {
    render(<FinalResult finalRank={1} finalScore={100} top5={top5} />)
    expect(screen.getByText('遊戲結束！')).toBeInTheDocument()
  })

  it('shows final rank and score', () => {
    render(<FinalResult finalRank={2} finalScore={80} top5={top5} />)
    expect(screen.getByText('第 2 名')).toBeInTheDocument()
    expect(screen.getByText('80 分')).toBeInTheDocument()
  })

  it('renders all top5 players', () => {
    render(<FinalResult finalRank={1} finalScore={100} top5={top5} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows closing message', () => {
    render(<FinalResult finalRank={1} finalScore={100} top5={top5} />)
    expect(screen.getByText(/感謝參與/)).toBeInTheDocument()
  })

  it('shows tied players joined by 、', () => {
    const tied = [
      { rank: 1, nicknames: ['Alice', 'Bob'], total: 2, score: 100 },
    ]
    render(<FinalResult finalRank={1} finalScore={100} top5={tied} />)
    expect(screen.getByText('Alice、Bob')).toBeInTheDocument()
  })
})
