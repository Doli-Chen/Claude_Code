import type { ScoreEntry } from '../../types/game'
import { MedalIcon } from '../shared/MedalIcon'

interface Props { myRank: number; myScore: number; top5: ScoreEntry[] }

export function RankView({ myRank, myScore, top5 }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center gap-4 p-6">
      <h2 className="text-white text-3xl font-bold mt-4">排行榜</h2>
      <div className="bg-white/10 rounded-2xl px-6 py-3 text-center">
        <p className="text-white/70 text-sm">你的排名</p>
        <p className="text-white text-4xl font-bold">第 {myRank} 名</p>
        <p className="text-yellow-300 text-2xl font-bold">{myScore} 分</p>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-2">
        {top5.map((entry) => (
          <div
            key={entry.nickname}
            className={`flex items-center gap-3 rounded-xl px-4 py-2 ${entry.rank === myRank ? 'bg-white/30 ring-2 ring-white' : 'bg-white/10'}`}
          >
            <MedalIcon rank={entry.rank} />
            <span className="text-white flex-1">{entry.nickname}</span>
            <span className="text-yellow-300 font-bold">{entry.score}</span>
          </div>
        ))}
      </div>
      <p className="text-white/50 animate-pulse">等待下一題...</p>
    </div>
  )
}
