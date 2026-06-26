import { useState } from 'react'

const OPTIONS = [
  { label: 'A', color: 'bg-blue-500 active:bg-blue-700' },
  { label: 'B', color: 'bg-red-500 active:bg-red-700' },
  { label: 'C', color: 'bg-yellow-500 active:bg-yellow-700' },
  { label: 'D', color: 'bg-green-500 active:bg-green-700' },
]

interface Props {
  questionIndex: number
  totalQuestions: number
  onAnswer: (index: number) => void
}

export function AnswerPad({ questionIndex, totalQuestions, onAnswer }: Props) {
  const [answered, setAnswered] = useState<number | null>(null)

  function handleAnswer(i: number) {
    if (answered !== null) return
    setAnswered(i)
    onAnswer(i)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="p-4 text-center text-white/70">
        第 {questionIndex + 1} / {totalQuestions} 題
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 p-4">
        {OPTIONS.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            disabled={answered !== null}
            aria-label={`選項 ${opt.label}`}
            className={`
              ${opt.color} rounded-2xl flex items-center justify-center
              text-white text-4xl font-bold
              disabled:opacity-50 transition-all active:scale-95
              ${answered === i ? 'ring-4 ring-white' : ''}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {answered !== null && (
        <div className="p-4 text-center text-white/70 animate-pulse">等待結果...</div>
      )}
    </div>
  )
}
