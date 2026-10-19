import type { Metadata, Viewport } from 'next'
import './globals.css'
import { siteConfig } from './data'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: {
    default: 'Intech | Thi công mạng LAN/WAN, Firewall, WiFi tại Nghệ An',
    template: '%s | Intech',
  },
  description: siteConfig.description,
  keywords: [
    'thi công mạng LAN WAN Nghệ An',
    'thiết bị mạng Nghệ An',
    'firewall doanh nghiệp',
    'wifi doanh nghiệp',
    'bảo trì hệ thống mạng',
  ],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: siteConfig.domain,
    siteName: siteConfig.shortName,
    title: 'Intech | Giải pháp hạ tầng mạng doanh nghiệp',
    description: siteConfig.description,
    images: [
      {
        url: '/images/hardware/infrastructure.webp',
        width: 1536,
        height: 1024,
        alt: 'Intech — Giải pháp hạ tầng mạng doanh nghiệp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intech | Giải pháp hạ tầng mạng doanh nghiệp',
    description: siteConfig.description,
    images: ['/images/hardware/infrastructure.webp'],
  },
  icons: {
    icon: [
      { url: '/favicon-48.png?v=intech-gold-3', type: 'image/png', sizes: '48x48' },
      { url: '/favicon.svg?v=intech-gold-3', type: 'image/svg+xml', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=intech-gold-3',
    apple: [{ url: '/apple-touch-icon.png?v=intech-gold-3', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#e7f0f7',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
