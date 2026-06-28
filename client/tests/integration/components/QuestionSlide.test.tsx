import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestionSlide } from '../../../src/components/display/QuestionSlide'
import type { DisplayQuestion } from '../../../src/types/game'

const question: DisplayQuestion = {
  text: 'Who wrote Romans?',
  imageUrl: null,
  options: [
    { text: 'Peter', imageUrl: null },
    { text: 'Paul', imageUrl: null },
    { text: 'John', imageUrl: null },
    { text: 'James', imageUrl: null },
  ],
}

describe('QuestionSlide', () => {
  it('renders question text', () => {
    render(<QuestionSlide question={question} questionIndex={0} totalQuestions={5} timeRemaining={15} timeLimit={20} showTimer={false} />)
    expect(screen.getByText('Who wrote Romans?')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<QuestionSlide question={question} questionIndex={0} totalQuestions={5} timeRemaining={15} timeLimit={20} showTimer={false} />)
    expect(screen.getByText('Peter')).toBeInTheDocument()
    expect(screen.getByText('Paul')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('James')).toBeInTheDocument()
  })

  it('shows timer when showTimer=true', () => {
    render(<QuestionSlide question={question} questionIndex={0} totalQuestions={5} timeRemaining={15} timeLimit={20} showTimer={true} />)
    expect(screen.getByLabelText(/倒數/)).toBeInTheDocument()
  })

  it('does not show timer when showTimer=false', () => {
    render(<QuestionSlide question={question} questionIndex={0} totalQuestions={5} timeRemaining={15} timeLimit={20} showTimer={false} />)
    expect(screen.queryByLabelText(/倒數/)).not.toBeInTheDocument()
  })

  it('shows correct answer checkmark when correctIndex given', () => {
    render(<QuestionSlide question={question} questionIndex={0} totalQuestions={5} timeRemaining={0} timeLimit={20} showTimer={false} correctIndex={1} />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('shows 公佈答案 banner when correctIndex given', () => {
    render(<QuestionSlide question={question} questionIndex={0} totalQuestions={5} timeRemaining={0} timeLimit={20} showTimer={false} correctIndex={1} />)
    expect(screen.getByRole('status')).toHaveTextContent('公佈答案')
  })

  it('does not show 公佈答案 banner when correctIndex is undefined', () => {
    render(<QuestionSlide question={question} questionIndex={0} totalQuestions={5} timeRemaining={15} timeLimit={20} showTimer={true} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows question progress', () => {
    render(<QuestionSlide question={question} questionIndex={2} totalQuestions={10} timeRemaining={15} timeLimit={20} showTimer={false} />)
    expect(screen.getByText('第 3 / 10 題')).toBeInTheDocument()
  })

  it('renders image when imageUrl provided', () => {
    const qWithImage = { ...question, imageUrl: '/uploads/test.png' }
    render(<QuestionSlide question={qWithImage} questionIndex={0} totalQuestions={5} timeRemaining={15} timeLimit={20} showTimer={false} />)
    expect(screen.getByAltText('題目圖片')).toBeInTheDocument()
  })
})
