import { motion } from 'framer-motion'
import type { ScoreEntry } from '../../types/game'
import { MedalIcon } from '../shared/MedalIcon'

interface Props { finalRank: number; finalScore: number; top5: ScoreEntry[] }

export function FinalResult({ finalRank, finalScore, top5 }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 to-orange-900 flex flex-col items-center gap-5 p-6">
      <motion.h1 initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white text-4xl font-bold mt-6">
        遊戲結束！
      </motion.h1>
      <div className="bg-white/10 rounded-2xl px-8 py-4 text-center">
        <p className="text-white/70">你的最終排名</p>
        <p className="text-white text-5xl font-bold">第 {finalRank} 名</p>
        <p className="text-yellow-300 text-3xl font-bold">{finalScore} 分</p>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-2">
        {top5.map((entry, i) => (
          <div key={entry.nickname} className={`flex items-center gap-3 rounded-xl px-4 py-2 ${entry.rank === finalRank ? 'bg-white/30 ring-2 ring-white' : 'bg-white/10'}`}>
            <MedalIcon rank={entry.rank} />
            <span className={`text-white flex-1 ${i === 0 ? 'text-xl font-bold' : ''}`}>{entry.nickname}</span>
            <span className="text-yellow-300 font-bold">{entry.score}</span>
          </div>
        ))}
      </div>
      <p className="text-white/60 text-sm mt-auto">感謝參與！願神的話語存在你心！</p>
    </div>
  )
}
