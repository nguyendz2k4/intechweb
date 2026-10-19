'use client'

import { createContext, useContext } from 'react'
import type { AdminSession } from '@/app/lib/admin-auth'
import { siteConfig } from '@/app/data'

export const AdminSessionContext = createContext<AdminSession | null>(null)

export function useAdminPermission(permission: string) {
  const session = useContext(AdminSessionContext)
  return session?.permissions.some((item) => item === permission) ?? false
}

export async function adminRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: 'no-store' })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401)
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    if (response.status === 403) throw new Error('Tài khoản không có quyền thực hiện thao tác này.')
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : 'Không thể thực hiện yêu cầu. Vui lòng thử lại.',
    )
  }
  return data as T
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.'
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
    .replace(/-+$/g, '')
}

export function publicPageUrl(path: string) {
  return new URL(path, `${siteConfig.domain}/`).href
}

export function safeAssetUrl(value: string | null | undefined) {
  const url = value?.trim() || ''
  if (/^\/(?!\/)/.test(url) && !/[\\\u0000-\u001f]/.test(url)) return url
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : ''
  } catch {
    return ''
  }
}

export type AdminNotice = { type: 'error' | 'success'; message: string } | null

export function Notice({ notice }: { notice: AdminNotice }) {
  return notice ? (
    <p className={`admin-note ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
      {notice.message}
      {notice.message.startsWith('Phiên đăng nhập') && (
        <>
          {' '}
          <a href="/admin-login">Đăng nhập lại</a>
        </>
      )}
    </p>
  ) : null
}

export function LoadingRows() {
  return (
    <div className="admin-loading" role="status" aria-label="Đang tải dữ liệu">
      {[0, 1, 2, 3].map((index) => (
        <div className="admin-skeleton" key={index} />
      ))}
      <span className="admin-sr-only">Đang tải dữ liệu…</span>
    </div>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-empty">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

export function DeleteConfirmation({
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="admin-delete-confirm" role="alert">
      <p>
        Xóa <strong>{name}</strong>? Thao tác này xóa bản ghi khỏi cơ sở dữ liệu.
      </p>
      <div className="admin-actions">
        <button className="admin-btn danger" disabled={busy} type="button" onClick={onConfirm}>
          {busy ? 'Đang xóa…' : 'Xác nhận xóa'}
        </button>
        <button className="admin-btn" disabled={busy} type="button" onClick={onCancel}>
          Giữ lại
        </button>
      </div>
    </div>
  )
}
