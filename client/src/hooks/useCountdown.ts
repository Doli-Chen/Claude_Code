import { useState, useEffect, useRef, useCallback } from 'react'

export function useCountdown(initial: number) {
  const [timeLeft, setTimeLeft] = useState(initial)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback((from: number) => {
    stop()
    setTimeLeft(from)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stop()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stop])

  const reset = useCallback((value: number) => {
    stop()
    setTimeLeft(value)
  }, [stop])

  useEffect(() => () => stop(), [stop])

  return { timeLeft, start, stop, reset }
}
