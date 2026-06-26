interface Props {
  timeRemaining: number
  timeLimit: number
}

export function CountdownRing({ timeRemaining, timeLimit }: Props) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const ratio = Math.max(0, Math.min(1, timeRemaining / timeLimit))
  const dashoffset = circumference * (1 - ratio)
  const color = ratio > 0.5 ? '#22c55e' : ratio > 0.25 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center justify-center" aria-label={`倒數 ${Math.ceil(timeRemaining)} 秒`}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#ffffff33" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
        />
        <text x="48" y="53" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
          {Math.ceil(timeRemaining)}
        </text>
      </svg>
    </div>
  )
}
