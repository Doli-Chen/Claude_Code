import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WaitingRoom } from '../../../src/components/display/WaitingRoom'

const defaultProps = {
  gameCode: 'ABC123',
  quizTitle: 'Bible Quiz',
  playerCount: 5,
  latestNickname: 'Alice',
  joinUrl: 'http://192.168.1.1:3001/play/ABC123',
}

describe('WaitingRoom', () => {
  it('renders quiz title', () => {
    render(<WaitingRoom {...defaultProps} />)
    expect(screen.getByText('Bible Quiz')).toBeInTheDocument()
  })

  it('shows player count', () => {
    render(<WaitingRoom {...defaultProps} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows latest nickname', () => {
    render(<WaitingRoom {...defaultProps} />)
    expect(screen.getByText(/Alice 加入了！/)).toBeInTheDocument()
  })

  it('does not show join message when no latestNickname', () => {
    render(<WaitingRoom {...defaultProps} latestNickname="" />)
    expect(screen.queryByText(/加入了！/)).not.toBeInTheDocument()
  })

  it('renders game code in QR display', () => {
    render(<WaitingRoom {...defaultProps} />)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })
})
