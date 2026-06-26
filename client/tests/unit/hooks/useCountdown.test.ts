import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCountdown } from '../../../src/hooks/useCountdown'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useCountdown', () => {
  it('initialises with given value', () => {
    const { result } = renderHook(() => useCountdown(30))
    expect(result.current.timeLeft).toBe(30)
  })

  it('counts down by 1 each second after start', () => {
    const { result } = renderHook(() => useCountdown(10))
    act(() => result.current.start(10))
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.timeLeft).toBe(7)
  })

  it('stops at 0 and does not go negative', () => {
    const { result } = renderHook(() => useCountdown(3))
    act(() => result.current.start(3))
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.timeLeft).toBe(0)
  })

  it('reset sets value without starting timer', () => {
    const { result } = renderHook(() => useCountdown(10))
    act(() => result.current.start(10))
    act(() => vi.advanceTimersByTime(2000))
    act(() => result.current.reset(20))
    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.timeLeft).toBe(20)
  })

  it('stop halts countdown mid-way', () => {
    const { result } = renderHook(() => useCountdown(10))
    act(() => result.current.start(10))
    act(() => vi.advanceTimersByTime(3000))
    act(() => result.current.stop())
    const frozen = result.current.timeLeft
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.timeLeft).toBe(frozen)
  })
})
