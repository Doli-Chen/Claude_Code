import { motion } from 'framer-motion'
import type { ScoreEntry } from '../../types/game'
import { MedalIcon } from '../shared/MedalIcon'

interface Props { scores: ScoreEntry[] }

export function GameOverSlide({ scores }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 flex flex-col items-center justify-center gap-6 p-8">
      <motion.h1
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-white text-5xl font-bold"
      >
        🎉 遊戲結束！
      </motion.h1>

      <div className="flex flex-col gap-3 w-full max-w-2xl">
        {scores.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.2 }}
            className="flex items-center gap-4 bg-white/10 rounded-2xl px-6 py-4"
          >
            <MedalIcon rank={entry.rank} />
            <span className={`text-white font-bold flex-1 ${i === 0 ? 'text-4xl' : i === 1 ? 'text-3xl' : 'text-2xl'}`}>
              {entry.nicknames.slice(0, 3).join('、')}
              {entry.total > 3 && (
                <span className="text-white/60 text-base font-normal ml-2">（共 {entry.total} 人）</span>
              )}
            </span>
            <span className={`text-yellow-300 font-bold ${i === 0 ? 'text-4xl' : 'text-2xl'}`}>
              {entry.score} 分
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
