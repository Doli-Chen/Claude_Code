import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionEditor } from '../../../src/components/design/QuestionEditor'
import { makeQuestion } from '../../helpers/factories'

const baseQuestion = makeQuestion()

describe('QuestionEditor', () => {
  it('renders question text and all 4 options', () => {
    render(<QuestionEditor question={baseQuestion} onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('Who wrote Romans?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Peter')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Paul')).toBeInTheDocument()
  })

  it('calls onChange with updated text when textarea changes', () => {
    const onChange = vi.fn()
    render(<QuestionEditor question={baseQuestion} onChange={onChange} />)
    const textarea = screen.getByLabelText('題目文字')
    fireEvent.change(textarea, { target: { value: 'New question text' } })
    expect(onChange).toHaveBeenCalledWith({ text: 'New question text' })
  })

  it('calls onChange with correctIndex when option button clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuestionEditor question={baseQuestion} onChange={onChange} />)
    await user.click(screen.getByLabelText('設定選項 A 為正確答案'))
    expect(onChange).toHaveBeenCalledWith({ correctIndex: 0 })
  })

  it('shows current correct answer with green styling', () => {
    render(<QuestionEditor question={baseQuestion} onChange={vi.fn()} />)
    const btnB = screen.getByLabelText('設定選項 B 為正確答案')
    expect(btnB.className).toContain('bg-green-500')
  })

  it('calls onChange with new timeLimit when select changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuestionEditor question={baseQuestion} onChange={onChange} />)
    await user.selectOptions(screen.getByLabelText('作答秒數'), '30')
    expect(onChange).toHaveBeenCalledWith({ timeLimit: 30 })
  })

  it('calls onChange with updated option text', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuestionEditor question={baseQuestion} onChange={onChange} />)
    const optionA = screen.getByLabelText('選項 A 文字')
    await user.clear(optionA)
    await user.type(optionA, 'Matthew')
    expect(onChange).toHaveBeenCalled()
  })

  it('renders an image uploader for the question and each of the 4 options', () => {
    render(<QuestionEditor question={baseQuestion} onChange={vi.fn()} />)
    expect(screen.getAllByLabelText('上傳圖片區域')).toHaveLength(5)
  })

  it('calls onChange with updated option imageUrl after uploading to option slot', async () => {
    const onChange = vi.fn()
    const { container } = render(<QuestionEditor question={baseQuestion} onChange={onChange} />)
    const fileInputs = container.querySelectorAll('input[type="file"]')
    // index 0 is the question image input; index 1 is option A
    const optionAInput = fileInputs[1] as HTMLInputElement
    const file = new File(['img'], 'option-a.png', { type: 'image/png' })
    Object.defineProperty(optionAInput, 'files', { value: [file], configurable: true })
    fireEvent.change(optionAInput)
    await waitFor(() => {
      const calls = onChange.mock.calls
      const optionCall = calls.find((c) =>
        c[0]?.options?.some((o: { index: number; imageUrl: string | null }) => o.index === 0 && o.imageUrl === '/uploads/test.png')
      )
      expect(optionCall).toBeTruthy()
    })
  })

  it('calls onChange with null option imageUrl after removing option image', async () => {
    const onChange = vi.fn()
    const questionWithOptionImage = makeQuestion({
      options: [
        { index: 0, text: 'Peter', imageUrl: '/uploads/existing.png' },
        { index: 1, text: 'Paul', imageUrl: null },
        { index: 2, text: 'John', imageUrl: null },
        { index: 3, text: 'James', imageUrl: null },
      ],
    })
    render(<QuestionEditor question={questionWithOptionImage} onChange={onChange} />)
    await userEvent.setup().click(screen.getAllByLabelText('移除圖片')[0])
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.arrayContaining([
        expect.objectContaining({ index: 0, imageUrl: null }),
      ]),
    }))
  })
})
