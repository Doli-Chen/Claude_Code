import { motion } from 'framer-motion'
import type { ScoreEntry } from '../../types/game'
import { MedalIcon } from '../shared/MedalIcon'

const FONT_SIZES = ['text-6xl', 'text-5xl', 'text-4xl', 'text-3xl', 'text-2xl']

interface Props {
  scores: ScoreEntry[]
}

export function LeaderboardSlide({ scores }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-white text-4xl font-bold mb-4">排行榜</h2>
      {scores.map((entry, i) => (
        <motion.div
          key={entry.rank}
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-4 w-full max-w-2xl bg-white/10 rounded-2xl px-6 py-3"
        >
          <MedalIcon rank={entry.rank} />
          <span className={`text-white font-bold flex-1 ${FONT_SIZES[i] ?? 'text-xl'}`}>
            {entry.nicknames.slice(0, 3).join('、')}
            {entry.total > 3 && (
              <span className="text-white/60 text-base font-normal ml-2">（共 {entry.total} 人）</span>
            )}
          </span>
          <span className={`text-yellow-300 font-bold ${FONT_SIZES[i] ?? 'text-xl'}`}>
            {entry.score}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
