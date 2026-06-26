import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockSocket = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
}))

vi.mock('../../../src/socket', () => ({ socket: mockSocket }))

const { useSocketEvents } = await import('../../../src/hooks/useSocket')

describe('useSocketEvents', () => {
  it('registers all event handlers on mount', () => {
    const handler = vi.fn()
    renderHook(() => useSocketEvents({ 'test:event': handler }))
    expect(mockSocket.on).toHaveBeenCalledWith('test:event', handler)
  })

  it('deregisters all event handlers on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useSocketEvents({ 'test:event': handler }))
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('test:event', handler)
  })

  it('registers multiple events', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    renderHook(() => useSocketEvents({ 'event:a': h1, 'event:b': h2 }))
    expect(mockSocket.on).toHaveBeenCalledWith('event:a', h1)
    expect(mockSocket.on).toHaveBeenCalledWith('event:b', h2)
  })
})
