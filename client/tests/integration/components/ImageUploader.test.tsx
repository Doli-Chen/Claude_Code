import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUploader } from '../../../src/components/design/ImageUploader'

vi.mock('../../../src/services/uploadApi', () => ({
  uploadImage: vi.fn(),
}))

import * as uploadApi from '../../../src/services/uploadApi'

const onUploaded = vi.fn()
const onRemoved = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function triggerFileChange(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

describe('ImageUploader', () => {
  it('renders upload area when no image', () => {
    render(<ImageUploader imageUrl={null} onUploaded={onUploaded} onRemoved={onRemoved} />)
    expect(screen.getByLabelText('上傳圖片區域')).toBeInTheDocument()
    expect(screen.getByText('點擊或拖曳上傳圖片（選填）')).toBeInTheDocument()
  })

  it('renders image preview and remove button when imageUrl provided', () => {
    render(<ImageUploader imageUrl="/uploads/test.png" onUploaded={onUploaded} onRemoved={onRemoved} />)
    expect(screen.getByAltText('題目圖片')).toHaveAttribute('src', '/uploads/test.png')
    expect(screen.getByLabelText('移除圖片')).toBeInTheDocument()
  })

  it('calls onRemoved when remove button clicked', async () => {
    const user = userEvent.setup()
    render(<ImageUploader imageUrl="/uploads/test.png" onUploaded={onUploaded} onRemoved={onRemoved} />)
    await user.click(screen.getByLabelText('移除圖片'))
    expect(onRemoved).toHaveBeenCalledOnce()
  })

  it('rejects non-image file and shows error', async () => {
    render(<ImageUploader imageUrl={null} onUploaded={onUploaded} onRemoved={onRemoved} />)
    const file = new File(['text'], 'doc.pdf', { type: 'application/pdf' })
    triggerFileChange(file)
    await waitFor(() => expect(screen.getByText('只允許圖片檔案')).toBeInTheDocument())
    expect(onUploaded).not.toHaveBeenCalled()
  })

  it('uploads image via file input and calls onUploaded with url', async () => {
    vi.mocked(uploadApi.uploadImage).mockResolvedValueOnce('/uploads/image.png')
    render(<ImageUploader imageUrl={null} onUploaded={onUploaded} onRemoved={onRemoved} />)
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    triggerFileChange(file)
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith('/uploads/image.png'))
  })

  it('shows error message when upload fails', async () => {
    vi.mocked(uploadApi.uploadImage).mockRejectedValueOnce(new Error('檔案過大'))
    render(<ImageUploader imageUrl={null} onUploaded={onUploaded} onRemoved={onRemoved} />)
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    triggerFileChange(file)
    await waitFor(() => expect(screen.getByText('檔案過大')).toBeInTheDocument())
  })

  it('shows uploading state during upload', async () => {
    let resolveUpload!: (url: string) => void
    vi.mocked(uploadApi.uploadImage).mockImplementationOnce(
      () => new Promise((res) => { resolveUpload = res })
    )
    render(<ImageUploader imageUrl={null} onUploaded={onUploaded} onRemoved={onRemoved} />)
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    triggerFileChange(file)
    expect(screen.getByText('上傳中...')).toBeInTheDocument()
    resolveUpload('/uploads/done.png')
    await waitFor(() => expect(screen.queryByText('上傳中...')).not.toBeInTheDocument())
  })

  it('onDrop with image file triggers upload', async () => {
    vi.mocked(uploadApi.uploadImage).mockResolvedValueOnce('/uploads/dropped.png')
    render(<ImageUploader imageUrl={null} onUploaded={onUploaded} onRemoved={onRemoved} />)
    const dropZone = screen.getByLabelText('上傳圖片區域')
    const file = new File(['img'], 'dropped.png', { type: 'image/png' })
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith('/uploads/dropped.png'))
  })

  it('onDrop with no file does nothing', () => {
    render(<ImageUploader imageUrl={null} onUploaded={onUploaded} onRemoved={onRemoved} />)
    const dropZone = screen.getByLabelText('上傳圖片區域')
    fireEvent.drop(dropZone, { dataTransfer: { files: [] } })
    expect(onUploaded).not.toHaveBeenCalled()
  })
})
