import Link from 'next/link'
import { siteConfig } from '@/app/data'
import { NavBar } from './NavBar'
import { JsonLd } from '@/app/JsonLd'
import { siteSchema } from '@/app/lib/seo'
import '@/app/public.css'

const footerGroups = [
  {
    title: 'Thiết bị',
    links: [
      ['Switch', '/san-pham/switch'],
      ['Router', '/san-pham/router'],
      ['WiFi Access Point', '/san-pham/wifi-access-point'],
      ['Firewall', '/san-pham/firewall'],
      ['NAS & lưu trữ', '/san-pham/nas-luu-tru'],
    ],
  },
  {
    title: 'Giải pháp',
    links: [
      ['Văn phòng', '/giai-phap/mang-van-phong'],
      ['Nhà xưởng', '/giai-phap/mang-nha-xuong'],
      ['Y tế', '/giai-phap/mang-benh-vien-phong-kham'],
      ['Khách sạn & trường học', '/giai-phap/wifi-khach-san-truong-hoc'],
    ],
  },
  {
    title: 'Dịch vụ',
    links: [
      ['Tư vấn & báo giá', '/bao-gia'],
      ['Thi công hạ tầng', '/dich-vu'],
      ['Bảo trì hệ thống', '/dich-vu'],
      ['Tra cứu bảo hành', '/bao-hanh'],
    ],
  },
  {
    title: 'Về Intech',
    links: [
      ['Giới thiệu', '/gioi-thieu'],
      ['Thương hiệu', '/thuong-hieu'],
      ['Dự án', '/du-an'],
      ['Kiến thức mạng', '/tin-tuc'],
      ['Liên hệ', '/lien-he'],
    ],
  },
] as const

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site">
      <JsonLd data={siteSchema} />
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <NavBar />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-intro">
            <Link className="wordmark" href="/">
              intech<span>.</span>
            </Link>
            <p>Thiết bị đúng. Hạ tầng vững.</p>
          </div>
          <div className="footer-columns">
            {footerGroups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2>{group.title}</h2>
                {group.links.map(([label, href]) => (
                  <Link key={`${href}:${label}`} href={href}>
                    {label}
                  </Link>
                ))}
              </nav>
            ))}
            <div className="footer-contact">
              <h2>Kết nối với Intech</h2>
              <a href={`tel:${siteConfig.phone}`}>{siteConfig.phoneDisplay}</a>
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              <p>{siteConfig.address}</p>
            </div>
          </div>
          <div className="footer-legal">
            <p>© 2026 {siteConfig.name}.</p>
            <p>Khảo sát · Thiết kế · Triển khai · Bảo trì</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
