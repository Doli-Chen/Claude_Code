import type { Question } from '../../types/quiz'
import { VALID_TIME_LIMITS } from '../../types/quiz'
import { ImageUploader } from './ImageUploader'

const OPTION_COLORS = ['border-blue-400', 'border-red-400', 'border-yellow-400', 'border-green-400']
const OPTION_LABELS = ['A', 'B', 'C', 'D']

interface Props {
  question: Question
  onChange: (updates: Partial<Question>) => void
}

export function QuestionEditor({ question, onChange }: Props) {
  function updateOption(index: number, text: string) {
    const options = question.options.map((o) =>
      o.index === index ? { ...o, text } : o
    )
    onChange({ options })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">題目文字</label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="輸入題目..."
          rows={3}
          className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="題目文字"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">題目圖片（選填）</label>
        <ImageUploader
          imageUrl={question.imageUrl}
          onUploaded={(url) => onChange({ imageUrl: url })}
          onRemoved={() => onChange({ imageUrl: null })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">選項（點選正確答案）</label>
        <div className="flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <div key={i} className={`flex items-center gap-2 border-2 rounded-lg p-2 ${OPTION_COLORS[i]}`}>
              <button
                onClick={() => onChange({ correctIndex: i })}
                className={`w-8 h-8 rounded-full font-bold text-sm shrink-0 transition-colors ${
                  question.correctIndex === i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                aria-label={`設定選項 ${OPTION_LABELS[i]} 為正確答案`}
              >
                {OPTION_LABELS[i]}
              </button>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`選項 ${OPTION_LABELS[i]}`}
                className="flex-1 border-none outline-none text-sm bg-transparent"
                aria-label={`選項 ${OPTION_LABELS[i]} 文字`}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">作答秒數</label>
        <select
          value={question.timeLimit}
          onChange={(e) => onChange({ timeLimit: Number(e.target.value) })}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="作答秒數"
        >
          {VALID_TIME_LIMITS.map((t) => (
            <option key={t} value={t}>{t} 秒</option>
          ))}
        </select>
      </div>
    </div>
  )
}
