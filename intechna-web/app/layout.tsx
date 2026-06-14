import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { siteConfig } from './data'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: {
    default: 'Intech | Thi công mạng LAN/WAN, Firewall, WiFi tại Nghệ An',
    template: '%s | Intech',
  },
  description: siteConfig.description,
  keywords: ['thi công mạng LAN WAN Nghệ An', 'thiết bị mạng Nghệ An', 'firewall doanh nghiệp', 'wifi doanh nghiệp', 'bảo trì hệ thống mạng'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: siteConfig.domain,
    siteName: siteConfig.shortName,
    title: 'Intech | Giải pháp hạ tầng mạng doanh nghiệp',
    description: siteConfig.description,
  },
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
  name: siteConfig.name,
  url: siteConfig.domain,
  telephone: siteConfig.phone,
  email: siteConfig.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Số 31, ngõ 20, đường Nguyễn Đức Cảnh',
    addressLocality: 'Thành Vinh',
    addressRegion: 'Nghệ An',
    addressCountry: 'VN',
  },
  areaServed: 'Nghệ An, Việt Nam',
  serviceType: ['Thi công mạng LAN/WAN', 'Cung cấp thiết bị mạng', 'Triển khai firewall', 'WiFi doanh nghiệp', 'Bảo trì hệ thống mạng'],
  contactPoint: [{ '@type': 'ContactPoint', telephone: siteConfig.phone, email: siteConfig.email, contactType: 'sales', areaServed: 'VN', availableLanguage: ['vi'] }],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  )
}
