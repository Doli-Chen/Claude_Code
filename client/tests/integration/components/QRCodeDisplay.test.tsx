import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QRCodeDisplay } from '../../../src/components/shared/QRCodeDisplay'

describe('QRCodeDisplay', () => {
  it('renders the game code text', () => {
    render(<QRCodeDisplay url="http://192.168.1.1:3001/play/ABC123" gameCode="ABC123" />)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('renders helper text', () => {
    render(<QRCodeDisplay url="http://192.168.1.1:3001/play/ABC123" gameCode="ABC123" />)
    expect(screen.getByText('或輸入遊戲代碼')).toBeInTheDocument()
  })

  it('renders an SVG element for the QR code', () => {
    const { container } = render(<QRCodeDisplay url="http://example.com" gameCode="XYZ789" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
