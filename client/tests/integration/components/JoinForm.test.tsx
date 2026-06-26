import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JoinForm } from '../../../src/components/player/JoinForm'

describe('JoinForm', () => {
  it('renders game code and nickname inputs', () => {
    render(<JoinForm onJoin={vi.fn()} />)
    expect(screen.getByLabelText('遊戲代碼')).toBeInTheDocument()
    expect(screen.getByLabelText('暱稱')).toBeInTheDocument()
  })

  it('submit button is disabled when fields are empty', () => {
    render(<JoinForm onJoin={vi.fn()} />)
    expect(screen.getByRole('button', { name: '加入遊戲' })).toBeDisabled()
  })

  it('calls onJoin with uppercase code and trimmed nickname', async () => {
    const user = userEvent.setup()
    const onJoin = vi.fn()
    render(<JoinForm onJoin={onJoin} />)
    await user.type(screen.getByLabelText('遊戲代碼'), 'abc123')
    await user.type(screen.getByLabelText('暱稱'), '  Alice  ')
    await user.click(screen.getByRole('button', { name: '加入遊戲' }))
    expect(onJoin).toHaveBeenCalledWith('ABC123', 'Alice')
  })

  it('pre-fills game code from initialCode prop', () => {
    render(<JoinForm initialCode="XYZ789" onJoin={vi.fn()} />)
    expect(screen.getByLabelText('遊戲代碼')).toHaveValue('XYZ789')
  })

  it('shows error message', () => {
    render(<JoinForm onJoin={vi.fn()} error="找不到此遊戲" />)
    expect(screen.getByText('找不到此遊戲')).toBeInTheDocument()
  })
})
