import { useState, useEffect } from 'react'
import type { DisplayQuestion } from '../../types/game'
import { CountdownRing } from '../display/CountdownRing'
import { useCountdown } from '../../hooks/useCountdown'

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
  timeLimit: number
  onAnswer: (index: number) => void
}

export function AnswerPad({ question, questionIndex, totalQuestions, timeLimit, onAnswer }: Props) {
  const [answered, setAnswered] = useState<number | null>(null)
  const { timeLeft, start, stop } = useCountdown(timeLimit)

  useEffect(() => {
    start(timeLimit)
  }, [])

  function handleAnswer(i: number) {
    if (answered !== null) return
    setAnswered(i)
    stop()
    onAnswer(i)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center px-4 pt-3 pb-1">
        <span className="text-white/60 text-sm">第 {questionIndex + 1} / {totalQuestions} 題</span>
        {answered === null && (
          <CountdownRing size={72} timeRemaining={timeLeft} timeLimit={timeLimit} />
        )}
      </div>

      <div className="mx-4 mb-4 bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-white text-2xl font-medium text-center leading-snug">
          {question.text}
        </p>
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="題目圖片"
            className="w-full rounded-xl object-contain max-h-64"
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
              transition-all active:scale-95
              ${answered !== null && answered !== i ? 'opacity-30' : ''}
              ${answered === i ? 'ring-[6px] ring-white scale-105 brightness-110' : ''}
            `}
          >
            <span className="text-3xl font-bold">{opt.label}</span>
            {question.options[i]?.imageUrl && (
              <img
                src={question.options[i].imageUrl ?? undefined}
                alt=""
                className="w-full max-h-28 object-contain rounded mt-1"
              />
            )}
            {question.options[i] && (
              <span className="text-2xl mt-1 text-center leading-tight">
                {question.options[i].text}
              </span>
            )}
          </button>
        ))}
      </div>

      {answered !== null && (
        <div className="px-4 pb-6 flex justify-center">
          <span className="bg-green-600 text-white font-bold text-lg px-6 py-2 rounded-full">
            ✓ 已作答
          </span>
        </div>
      )}
    </div>
  )
}
