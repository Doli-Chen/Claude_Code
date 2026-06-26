import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useNetworkInfo } from '../../../src/hooks/useNetworkInfo'

describe('useNetworkInfo', () => {
  it('returns null initially', () => {
    const { result } = renderHook(() => useNetworkInfo())
    expect(result.current).toBeNull()
  })

  it('fetches and returns network info', async () => {
    const { result } = renderHook(() => useNetworkInfo())
    await waitFor(() => expect(result.current).not.toBeNull())
    expect(result.current?.localIP).toBe('192.168.1.1')
    expect(result.current?.port).toBe(3001)
  })
})
