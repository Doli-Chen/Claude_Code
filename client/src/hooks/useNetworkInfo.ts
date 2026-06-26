import { useState, useEffect } from 'react'

interface NetworkInfo {
  localIP: string
  port: number | string
}

export function useNetworkInfo() {
  const [info, setInfo] = useState<NetworkInfo | null>(null)

  useEffect(() => {
    fetch('/api/network')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ localIP: '127.0.0.1', port: 3001 }))
  }, [])

  return info
}
