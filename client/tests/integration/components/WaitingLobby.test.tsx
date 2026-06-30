import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WaitingLobby } from '../../../src/components/player/WaitingLobby'

describe('WaitingLobby', () => {
  it('shows quiz title and nickname', () => {
    render(<WaitingLobby nickname="Alice" quizTitle="Bible Quiz" lobbyImageUrl={null} />)
    expect(screen.getByText('Bible Quiz')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows cross emoji when lobbyImageUrl is null', () => {
    render(<WaitingLobby nickname="Alice" quizTitle="Bible Quiz" lobbyImageUrl={null} />)
    expect(screen.getByText('✝️')).toBeInTheDocument()
    expect(screen.queryByAltText('等待畫面圖片')).not.toBeInTheDocument()
  })

  it('shows custom image when lobbyImageUrl is provided', () => {
    render(<WaitingLobby nickname="Alice" quizTitle="Bible Quiz" lobbyImageUrl="/uploads/banner.png" />)
    const img = screen.getByAltText('等待畫面圖片')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/uploads/banner.png')
    expect(screen.queryByText('✝️')).not.toBeInTheDocument()
  })

  it('shows waiting message', () => {
    render(<WaitingLobby nickname="Alice" quizTitle="Bible Quiz" lobbyImageUrl={null} />)
    expect(screen.getByText('等待主持人開始遊戲...')).toBeInTheDocument()
  })
})
