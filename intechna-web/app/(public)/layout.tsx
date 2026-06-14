import Link from 'next/link'
import { siteConfig } from '@/app/data'
import { NavBar } from './NavBar'
import { PageTransition } from './PageTransition'

function PhoneIcon({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.122-4.1-6.924-6.924l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

function MapPinIcon({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

function MailIcon({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <PageTransition>
        {children}
      </PageTransition>
      {/* Mobile floating CTA */}
      <Link className="mobile-call btn-primary-sm" href={`tel:${siteConfig.phone}`} aria-label="Gọi ngay" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
        <PhoneIcon className="w-4 h-4" />
        <span>Gọi ngay</span>
      </Link>
      <footer className="footer">
        <div className="footer-asym">
          <div className="footer__brand">
            <span className="footer__mark">I</span>
            <div>
              <strong>INTECH</strong>
              <small>{siteConfig.name}</small>
            </div>
            <p className="footer__desc">
              Giải pháp hạ tầng mạng, bảo mật, WiFi doanh nghiệp và dịch vụ vận hành CNTT ổn định và chuyên nghiệp.
            </p>
          </div>
          <div className="footer__info">
            <div className="footer__contact-item">
              <MapPinIcon style={{ width: '20px', height: '20px', color: 'var(--blue)', flexShrink: 0, marginTop: '3px' }} />
              <p>{siteConfig.address}</p>
            </div>
            <div className="footer__contact-item">
              <PhoneIcon style={{ width: '20px', height: '20px', color: 'var(--blue)', flexShrink: 0 }} />
              <Link href={`tel:${siteConfig.phone}`} style={{ fontWeight: '600' }}>{siteConfig.phoneDisplay}</Link>
            </div>
            <div className="footer__contact-item">
              <MailIcon style={{ width: '20px', height: '20px', color: 'var(--blue)', flexShrink: 0 }} />
              <Link href={`mailto:${siteConfig.email}`}>{siteConfig.email}</Link>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p className="footer__copy">© 2026 {siteConfig.name}. All rights reserved.</p>
          <div className="footer__links">
            <Link href="/gioi-thieu">Giới thiệu</Link>
            <Link href="/san-pham">Sản phẩm</Link>
            <Link href="/giai-phap">Giải pháp</Link>
            <Link href="/lien-he">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
