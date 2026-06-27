import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerPad } from '../../../src/components/player/AnswerPad'
import type { DisplayQuestion } from '../../../src/types/game'

const mockQuestion: DisplayQuestion = {
  text: '測試題目',
  imageUrl: null,
  options: [
    { text: '選項一' },
    { text: '選項二' },
    { text: '選項三' },
    { text: '選項四' },
  ],
}

describe('AnswerPad', () => {
  it('renders 4 option buttons', () => {
    render(<AnswerPad question={mockQuestion} questionIndex={0} totalQuestions={5} onAnswer={vi.fn()} />)
    expect(screen.getByLabelText('選項 A')).toBeInTheDocument()
    expect(screen.getByLabelText('選項 B')).toBeInTheDocument()
    expect(screen.getByLabelText('選項 C')).toBeInTheDocument()
    expect(screen.getByLabelText('選項 D')).toBeInTheDocument()
  })

  it('shows question progress', () => {
    render(<AnswerPad question={mockQuestion} questionIndex={2} totalQuestions={10} onAnswer={vi.fn()} />)
    expect(screen.getByText('第 3 / 10 題')).toBeInTheDocument()
  })

  it('shows question text and options', () => {
    render(<AnswerPad question={mockQuestion} questionIndex={0} totalQuestions={5} onAnswer={vi.fn()} />)
    expect(screen.getByText('測試題目')).toBeInTheDocument()
    expect(screen.getByText('選項一')).toBeInTheDocument()
    expect(screen.getByText('選項四')).toBeInTheDocument()
  })

  it('calls onAnswer with correct index on click', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<AnswerPad question={mockQuestion} questionIndex={0} totalQuestions={5} onAnswer={onAnswer} />)
    await user.click(screen.getByLabelText('選項 B'))
    expect(onAnswer).toHaveBeenCalledWith(1)
  })

  it('disables all buttons after answering', async () => {
    const user = userEvent.setup()
    render(<AnswerPad question={mockQuestion} questionIndex={0} totalQuestions={5} onAnswer={vi.fn()} />)
    await user.click(screen.getByLabelText('選項 A'))
    expect(screen.getByLabelText('選項 B')).toBeDisabled()
    expect(screen.getByLabelText('選項 C')).toBeDisabled()
  })

  it('shows waiting message after answering', async () => {
    const user = userEvent.setup()
    render(<AnswerPad question={mockQuestion} questionIndex={0} totalQuestions={5} onAnswer={vi.fn()} />)
    await user.click(screen.getByLabelText('選項 D'))
    expect(screen.getByText('等待結果...')).toBeInTheDocument()
  })

  it('ignores subsequent clicks after answering', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<AnswerPad question={mockQuestion} questionIndex={0} totalQuestions={5} onAnswer={onAnswer} />)
    await user.click(screen.getByLabelText('選項 A'))
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})
