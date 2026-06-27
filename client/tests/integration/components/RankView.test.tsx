import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RankView } from '../../../src/components/player/RankView'

const top5 = [
  { rank: 1, nicknames: ['Alice'], total: 1, score: 100 },
  { rank: 2, nicknames: ['Bob'], total: 1, score: 80 },
  { rank: 3, nicknames: ['Carol'], total: 1, score: 60 },
]

describe('RankView', () => {
  it('shows personal rank and score', () => {
    render(<RankView myRank={2} myScore={80} top5={top5} />)
    expect(screen.getByText('第 2 名')).toBeInTheDocument()
    expect(screen.getByText('80 分')).toBeInTheDocument()
  })

  it('renders all top5 nicknames', () => {
    render(<RankView myRank={1} myScore={100} top5={top5} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('renders empty top5', () => {
    render(<RankView myRank={1} myScore={50} top5={[]} />)
    expect(screen.getByText('第 1 名')).toBeInTheDocument()
  })

  it('shows waiting message', () => {
    render(<RankView myRank={1} myScore={100} top5={top5} />)
    expect(screen.getByText('等待下一題...')).toBeInTheDocument()
  })

  it('shows tied players joined by 、', () => {
    const tied = [
      { rank: 1, nicknames: ['Alice', 'Bob'], total: 2, score: 100 },
    ]
    render(<RankView myRank={1} myScore={100} top5={tied} />)
    expect(screen.getByText('Alice、Bob')).toBeInTheDocument()
  })
})
