'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { navItems } from '@/app/data'

export function NavBar() {
  const pathname = usePathname()
  const menuRef = useRef<HTMLDetailsElement>(null)
  const category =
    pathname.startsWith('/san-pham') || pathname.startsWith('/thuong-hieu')
      ? 'Thiết bị mạng'
      : pathname.startsWith('/bao-hanh')
        ? 'Dịch vụ bảo hành'
        : 'Hạ tầng doanh nghiệp'
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false
  }, [pathname])

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false
        menuRef.current.querySelector('summary')?.focus()
      }
    }
    const outside = (event: PointerEvent) => {
      if (menuRef.current?.open && !menuRef.current.contains(event.target as Node))
        menuRef.current.open = false
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
    }
  }, [])

  return (
    <header className="site-header">
      <div className="global-nav">
        <div className="nav-container">
          <Link className="nav-brand" href="/" aria-label="Intech — Trang chủ">
            <Image
              className="nav-brand-image"
              src="/images/brand/intech-logo.png"
              alt="Intech — International Technology"
              fill
              sizes="112px"
              preload
            />
          </Link>
          <nav className="global-links" aria-label="Điều hướng chính">
            {navItems
              .filter(([, href]) => href !== '/')
              .map(([label, href]) => (
                <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}>
                  {label}
                </Link>
              ))}
          </nav>
          <Link className="nav-search" href="/san-pham/catalog" aria-label="Tìm thiết bị">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
          </Link>
          <details className="mobile-nav" ref={menuRef}>
            <summary aria-label="Menu điều hướng">
              <span />
              <span />
            </summary>
            <nav className="mobile-nav-panel" aria-label="Điều hướng di động">
              {navItems.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={active(href) ? 'page' : undefined}
                  onClick={() => {
                    if (menuRef.current) menuRef.current.open = false
                  }}
                >
                  {label}
                </Link>
              ))}
              <Link href="/thuong-hieu">Thương hiệu</Link>
            </nav>
          </details>
        </div>
      </div>
      <div className="local-nav">
        <div className="nav-container">
          <Link
            className="local-title"
            href={pathname.startsWith('/bao-hanh') ? '/bao-hanh' : '/san-pham'}
          >
            {category}
          </Link>
          <nav className="local-links" aria-label="Điều hướng thiết bị">
            <Link href="/san-pham/catalog">Catalog</Link>
            <Link href="/thuong-hieu">Thương hiệu</Link>
            <Link href="/bao-hanh">Tra cứu bảo hành</Link>
          </nav>
          <Link className="btn primary nav-quote" href="/bao-gia">
            Yêu cầu tư vấn
          </Link>
        </div>
      </div>
    </header>
  )
}
