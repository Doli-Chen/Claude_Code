import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameOverSlide } from '../../../src/components/display/GameOverSlide'

const scores = [
  { rank: 1, nicknames: ['Alice'], total: 1, score: 100 },
  { rank: 2, nicknames: ['Bob'], total: 1, score: 80 },
  { rank: 3, nicknames: ['Carol'], total: 1, score: 60 },
]

describe('GameOverSlide', () => {
  it('renders game over heading', () => {
    render(<GameOverSlide scores={scores} />)
    expect(screen.getByText(/遊戲結束！/)).toBeInTheDocument()
  })

  it('renders all player nicknames', () => {
    render(<GameOverSlide scores={scores} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('renders scores with 分 suffix', () => {
    render(<GameOverSlide scores={scores} />)
    expect(screen.getByText('100 分')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<GameOverSlide scores={[]} />)
    expect(screen.getByText(/遊戲結束！/)).toBeInTheDocument()
  })

  it('shows tied players joined by 、', () => {
    const tied = [{ rank: 1, nicknames: ['Alice', 'Bob'], total: 2, score: 100 }]
    render(<GameOverSlide scores={tied} />)
    expect(screen.getByText('Alice、Bob')).toBeInTheDocument()
  })

  it('shows 共N人 note when more than 3 tied', () => {
    const manyTied = [{ rank: 1, nicknames: ['A', 'B', 'C', 'D'], total: 4, score: 100 }]
    render(<GameOverSlide scores={manyTied} />)
    expect(screen.getByText('（共 4 人）')).toBeInTheDocument()
    expect(screen.getByText('A、B、C')).toBeInTheDocument()
  })
})
