import { CountdownRing } from './CountdownRing'
import type { DisplayQuestion } from '../../types/game'

const OPTION_COLORS = [
  'bg-blue-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
]
const OPTION_LABELS = ['A', 'B', 'C', 'D']

interface Props {
  question: DisplayQuestion
  questionIndex: number
  totalQuestions: number
  timeRemaining: number
  timeLimit: number
  showTimer: boolean
  correctIndex?: number
}

export function QuestionSlide({ question, questionIndex, totalQuestions, timeRemaining, timeLimit, showTimer, correctIndex }: Props) {
  const isRevealing = correctIndex !== undefined && correctIndex >= 0
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 flex flex-col">
      {isRevealing && (
        <div className="bg-yellow-400 text-gray-900 font-bold text-2xl text-center py-3 tracking-wide" role="status">
          🎯 公佈答案
        </div>
      )}
      <div className="flex items-center justify-between p-4 bg-black/30">
        <span className="text-white/70 text-lg">
          第 {questionIndex + 1} / {totalQuestions} 題
        </span>
        {showTimer && (
          <CountdownRing timeRemaining={timeRemaining} timeLimit={timeLimit} />
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {question.imageUrl && (
          <img src={question.imageUrl} alt="題目圖片" className="max-h-48 rounded-xl object-contain" />
        )}
        <h2 className="text-white text-3xl font-bold text-center max-w-3xl">{question.text}</h2>
      </div>

      <div className="grid grid-cols-2 gap-6 p-6">
        {question.options.map((opt, i) => {
          const isCorrect = correctIndex !== undefined && i === correctIndex
          const isWrong = correctIndex !== undefined && correctIndex >= 0 && i !== correctIndex
          return (
            <div
              key={i}
              className={`
                ${OPTION_COLORS[i]} rounded-xl p-8 min-h-32 flex items-center gap-3
                ${isWrong ? 'opacity-40' : ''}
                ${isCorrect ? 'ring-4 ring-white' : ''}
              `}
            >
              <span className="text-white text-4xl font-bold w-12">{OPTION_LABELS[i]}</span>
              <span className="text-white text-3xl font-semibold">{opt.text}</span>
              {isCorrect && <span className="ml-auto text-2xl">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
