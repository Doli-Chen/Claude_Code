import { useRef, useState } from 'react'
import { uploadImage } from '../../services/uploadApi'

interface Props {
  imageUrl: string | null
  onUploaded: (url: string) => void
  onRemoved: () => void
}

export function ImageUploader({ imageUrl, onUploaded, onRemoved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('只允許圖片檔案')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      onUploaded(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : '上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      {imageUrl ? (
        <div className="relative">
          <img src={imageUrl} alt="題目圖片" className="w-full max-h-48 object-contain rounded-lg border" />
          <button
            onClick={onRemoved}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold hover:bg-red-600"
            aria-label="移除圖片"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          aria-label="上傳圖片區域"
        >
          {uploading ? (
            <span className="text-gray-500">上傳中...</span>
          ) : (
            <>
              <span className="text-2xl">🖼️</span>
              <span className="text-gray-500 text-sm">點擊或拖曳上傳圖片（選填）</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
