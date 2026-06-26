import { QRCodeSVG } from 'qrcode.react'

interface Props {
  url: string
  gameCode: string
  size?: number
}

export function QRCodeDisplay({ url, gameCode, size = 280 }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-lg">
        <QRCodeSVG value={url} size={size} />
      </div>
      <div className="text-center">
        <p className="text-white/70 text-sm">或輸入遊戲代碼</p>
        <p className="text-white font-mono text-3xl font-bold tracking-widest">{gameCode}</p>
      </div>
    </div>
  )
}
