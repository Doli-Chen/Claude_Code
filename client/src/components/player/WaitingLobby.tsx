import { motion } from 'framer-motion'

interface Props { nickname: string; quizTitle: string }

export function WaitingLobby({ nickname, quizTitle }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center gap-6 p-6">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-6xl"
      >
        ✝️
      </motion.div>
      <h2 className="text-white text-3xl font-bold text-center">{quizTitle}</h2>
      <div className="bg-white/10 rounded-2xl px-8 py-4 text-center">
        <p className="text-white/70 text-sm">你的暱稱</p>
        <p className="text-white text-2xl font-bold">{nickname}</p>
      </div>
      <p className="text-white/70 text-xl animate-pulse">等待主持人開始遊戲...</p>
    </div>
  )
}
