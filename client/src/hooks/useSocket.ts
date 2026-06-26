import { useEffect } from 'react'
import { socket } from '../socket'

type SocketEvents = Record<string, (...args: unknown[]) => void>

export function useSocketEvents(events: SocketEvents) {
  useEffect(() => {
    const entries = Object.entries(events)
    entries.forEach(([event, handler]) => socket.on(event, handler))
    return () => {
      entries.forEach(([event, handler]) => socket.off(event, handler))
    }
  })
}
