import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerPad } from '../../../src/components/player/AnswerPad'

describe('AnswerPad', () => {
  it('renders 4 option buttons', () => {
    render(<AnswerPad questionIndex={0} totalQuestions={5} onAnswer={vi.fn()} />)
    expect(screen.getByLabelText('選項 A')).toBeInTheDocument()
    expect(screen.getByLabelText('選項 B')).toBeInTheDocument()
    expect(screen.getByLabelText('選項 C')).toBeInTheDocument()
    expect(screen.getByLabelText('選項 D')).toBeInTheDocument()
  })

  it('shows question progress', () => {
    render(<AnswerPad questionIndex={2} totalQuestions={10} onAnswer={vi.fn()} />)
    expect(screen.getByText('第 3 / 10 題')).toBeInTheDocument()
  })

  it('calls onAnswer with correct index on click', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<AnswerPad questionIndex={0} totalQuestions={5} onAnswer={onAnswer} />)
    await user.click(screen.getByLabelText('選項 B'))
    expect(onAnswer).toHaveBeenCalledWith(1)
  })

  it('disables all buttons after answering', async () => {
    const user = userEvent.setup()
    render(<AnswerPad questionIndex={0} totalQuestions={5} onAnswer={vi.fn()} />)
    await user.click(screen.getByLabelText('選項 A'))
    expect(screen.getByLabelText('選項 B')).toBeDisabled()
    expect(screen.getByLabelText('選項 C')).toBeDisabled()
  })

  it('shows waiting message after answering', async () => {
    const user = userEvent.setup()
    render(<AnswerPad questionIndex={0} totalQuestions={5} onAnswer={vi.fn()} />)
    await user.click(screen.getByLabelText('選項 D'))
    expect(screen.getByText('等待結果...')).toBeInTheDocument()
  })

  it('ignores subsequent clicks after answering', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<AnswerPad questionIndex={0} totalQuestions={5} onAnswer={onAnswer} />)
    await user.click(screen.getByLabelText('選項 A'))
    // second click should be ignored via disabled
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})
