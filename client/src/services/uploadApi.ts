export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error)
  }
  const data = await res.json()
  return data.url as string
}

export async function deleteImage(filename: string): Promise<void> {
  await fetch(`/api/upload/${filename}`, { method: 'DELETE' })
}
