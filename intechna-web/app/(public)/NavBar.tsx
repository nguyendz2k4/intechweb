'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { navItems, siteConfig } from '@/app/data'

function PhoneIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.122-4.1-6.924-6.924l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

export function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close menu on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} ref={menuRef}>
      <div className="navbar__inner">
        {/* Brand */}
        <Link className="navbar__brand" href="/" aria-label="Intech – Trang chủ">
          <span className="navbar__mark">I</span>
          <span className="navbar__brand-text">
            <strong>INTECH</strong>
            <small>Network &amp; Infrastructure</small>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar__nav" aria-label="Điều hướng chính">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`navbar__link${isActive(href) ? ' navbar__link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA button desktop */}
        <Link className="navbar__cta btn-primary-sm" href={`tel:${siteConfig.phone}`} style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          <PhoneIcon className="w-4 h-4" />
          <span>{siteConfig.phoneDisplay}</span>
        </Link>

        {/* Hamburger button */}
        <button
          className={`navbar__hamburger${menuOpen ? ' navbar__hamburger--open' : ''}`}
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="navbar__mobile-menu" aria-label="Menu di động">
          <nav>
            {navItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`navbar__mobile-link${isActive(href) ? ' navbar__mobile-link--active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="navbar__mobile-footer">
            <Link className="btn-primary-full" href={`tel:${siteConfig.phone}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <PhoneIcon className="w-5 h-5" />
              <span>Gọi {siteConfig.phoneDisplay}</span>
            </Link>
            <Link className="btn-secondary-full" href="/lien-he">Liên hệ tư vấn</Link>
          </div>
        </div>
      )}
    </header>
  )
}
