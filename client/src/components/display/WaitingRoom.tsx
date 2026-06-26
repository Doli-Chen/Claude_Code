import { QRCodeDisplay } from '../shared/QRCodeDisplay'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  gameCode: string
  quizTitle: string
  playerCount: number
  latestNickname: string
  joinUrl: string
}

export function WaitingRoom({ gameCode, quizTitle, playerCount, latestNickname, joinUrl }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-white text-5xl font-bold text-center drop-shadow-lg">{quizTitle}</h1>

      <QRCodeDisplay url={joinUrl} gameCode={gameCode} size={280} />

      <div className="flex items-center gap-3 bg-white/10 rounded-full px-6 py-3">
        <span className="text-white text-xl">👥</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={playerCount}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-white text-2xl font-bold"
          >
            {playerCount}
          </motion.span>
        </AnimatePresence>
        <span className="text-white/70 text-xl">位玩家已加入</span>
      </div>

      {latestNickname && (
        <AnimatePresence>
          <motion.div
            key={latestNickname}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white/80 text-lg"
          >
            ✨ {latestNickname} 加入了！
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
