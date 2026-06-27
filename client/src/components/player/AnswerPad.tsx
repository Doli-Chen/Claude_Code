import { useState } from 'react'
import type { DisplayQuestion } from '../../types/game'

const OPTIONS = [
  { label: 'A', color: 'bg-blue-500 active:bg-blue-700' },
  { label: 'B', color: 'bg-red-500 active:bg-red-700' },
  { label: 'C', color: 'bg-yellow-500 active:bg-yellow-700' },
  { label: 'D', color: 'bg-green-500 active:bg-green-700' },
]

interface Props {
  question: DisplayQuestion
  questionIndex: number
  totalQuestions: number
  onAnswer: (index: number) => void
}

export function AnswerPad({ question, questionIndex, totalQuestions, onAnswer }: Props) {
  const [answered, setAnswered] = useState<number | null>(null)

  function handleAnswer(i: number) {
    if (answered !== null) return
    setAnswered(i)
    onAnswer(i)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col overflow-y-auto">
      <div className="p-3 text-center text-white/60 text-sm">
        第 {questionIndex + 1} / {totalQuestions} 題
      </div>

      <div className="mx-4 mb-4 bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-white text-lg font-medium text-center leading-snug">
          {question.text}
        </p>
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="題目圖片"
            className="w-full rounded-xl object-cover max-h-48"
          />
        )}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 px-4 pb-4">
        {OPTIONS.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            disabled={answered !== null}
            aria-label={`選項 ${opt.label}`}
            className={`
              ${opt.color} rounded-2xl flex flex-col items-center justify-center
              text-white p-3 min-h-24
              disabled:opacity-50 transition-all active:scale-95
              ${answered === i ? 'ring-4 ring-white' : ''}
            `}
          >
            <span className="text-2xl font-bold">{opt.label}</span>
            {question.options[i] && (
              <span className="text-sm mt-1 text-center leading-tight">
                {question.options[i].text}
              </span>
            )}
          </button>
        ))}
      </div>

      {answered !== null && (
        <div className="p-4 text-center text-white/70 animate-pulse">等待結果...</div>
      )}
    </div>
  )
}
