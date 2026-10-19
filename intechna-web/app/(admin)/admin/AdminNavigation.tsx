'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { AdminSession } from '@/app/lib/admin-auth'
import { AdminSessionContext, adminRequest, errorMessage, publicPageUrl } from './AdminUi'

const navigation = [
  { label: 'Tổng quan', href: '/admin', permission: null },
  { label: 'Sản phẩm', href: '/admin/san-pham', permission: 'products:read' },
  { label: 'Bài viết', href: '/admin/noi-dung', permission: 'posts:read' },
  { label: 'Dịch vụ', href: '/admin/dich-vu', permission: 'services:read' },
  { label: 'Bảo hành', href: '/admin/bao-hanh', permission: 'warranty:read' },
  { label: 'Liên hệ', href: '/admin/lien-he', permission: 'contacts:read' },
  { label: 'Tài khoản', href: '/admin/tai-khoan', permission: null },
] as const

export function AdminNavigation({
  session,
  children,
}: {
  session: AdminSession
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navigationPath = pathname.startsWith('/admin')
    ? pathname
    : `/admin${pathname === '/' ? '' : pathname}`
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function logout() {
    setBusy(true)
    setError('')
    try {
      await adminRequest('/api/admin/auth/logout', { method: 'POST' })
      // Reload the document so the old authenticated router cache is discarded.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/admin-login')
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  const roleLabels = {
    admin: 'Quản trị viên',
    editor: 'Biên tập viên',
    support: 'Chăm sóc khách hàng',
  }
  return (
    <AdminSessionContext.Provider value={session}>
      <div className="admin-shell">
        <a className="admin-skip" href="#admin-main">
          Đến nội dung quản trị
        </a>
        <header className="admin-header">
          <Link className="admin-brand" href="/admin">
            <span className="admin-mark" aria-hidden="true">
              i
            </span>
            <span>
              <strong>intech</strong>
              <small>Quản trị website</small>
            </span>
          </Link>
          <div className="admin-account">
            <span>
              <strong>{session.username}</strong>
              <small>{roleLabels[session.role]}</small>
            </span>
            <a
              className="admin-website-link"
              href={publicPageUrl('/')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xem website <span aria-hidden="true">↗</span>
            </a>
            <button className="admin-btn compact" disabled={busy} onClick={logout}>
              {busy ? 'Đang thoát…' : 'Đăng xuất'}
            </button>
          </div>
        </header>
        <nav className="admin-nav" aria-label="Quản trị website">
          {navigation
            .filter(
              (item) =>
                !item.permission ||
                session.permissions.some((permission) => permission === item.permission),
            )
            .map((item) => {
              const active =
                item.href === '/admin'
                  ? navigationPath === item.href
                  : navigationPath.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
                  {item.label}
                </Link>
              )
            })}
        </nav>
        <main className="admin-main" id="admin-main">
          {error && (
            <p className="admin-note error" role="alert">
              {error}
            </p>
          )}
          {children}
        </main>
        <footer className="admin-footer">Intech · Không gian quản trị nội bộ</footer>
      </div>
    </AdminSessionContext.Provider>
  )
}
