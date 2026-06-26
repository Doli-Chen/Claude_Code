interface Props { rank: number }

export function MedalIcon({ rank }: Props) {
  if (rank === 1) return <span className="text-4xl">🥇</span>
  if (rank === 2) return <span className="text-4xl">🥈</span>
  if (rank === 3) return <span className="text-4xl">🥉</span>
  return <span className="text-2xl text-gray-400">#{rank}</span>
}
