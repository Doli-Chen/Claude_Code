import { motion } from 'framer-motion'
import type { AnswerResult } from '../../types/game'

interface Props { result: AnswerResult }

export function AnswerFeedback({ result }: Props) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-6 p-6 ${result.correct ? 'bg-green-800' : 'bg-red-800'}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="text-8xl"
      >
        {result.correct ? '✓' : '✗'}
      </motion.div>
      <p className="text-white text-3xl font-bold">
        {result.correct ? '答對了！' : '答錯了'}
      </p>
      {result.correct && (
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-yellow-300 text-4xl font-bold"
        >
          +{result.score} 分
        </motion.p>
      )}
      <p className="text-white/70 text-xl">累計：{result.totalScore} 分</p>
      <p className="text-white/70 text-lg animate-pulse">等待排行榜...</p>
    </div>
  )
}
