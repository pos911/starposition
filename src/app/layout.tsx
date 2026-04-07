import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '별자리 운세 ✨ — AI 점성술사의 오늘 이야기',
  description: '제미나이 AI가 분석하는 30대 여성을 위한 맞춤형 별자리 운세. 오늘의 행운 점수, 2026 트렌드 컬러 코디, 커리어 조언까지 한 번에.',
  keywords: ['별자리 운세', '오늘의 운세', 'AI 점성술', '30대 여성', '행운', '타로', '일일 운세'],
  openGraph: {
    title: '별자리 운세 ✨ — AI 점성술사의 오늘 이야기',
    description: '당신만을 위한 AI 맞춤형 별자리 운세',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#080B1A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
