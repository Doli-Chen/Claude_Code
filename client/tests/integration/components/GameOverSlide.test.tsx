import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameOverSlide } from '../../../src/components/display/GameOverSlide'

const scores = [
  { rank: 1, nickname: 'Alice', score: 100 },
  { rank: 2, nickname: 'Bob', score: 80 },
  { rank: 3, nickname: 'Carol', score: 60 },
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
})
