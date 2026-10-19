'use client'

import '@/app/warranty.css'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { siteConfig } from '@/app/data'
import {
  formatWarrantyDate,
  validateWarrantyQuery,
  type PublicWarrantyRecord,
} from '@/app/lib/warranty'

type LookupState =
  | { kind: 'idle' }
  | { kind: 'invalid'; message: string }
  | { kind: 'loading' }
  | { kind: 'valid' | 'expired'; record: PublicWarrantyRecord }
  | { kind: 'not-found' }
  | { kind: 'error' }

const supportUrl = `https://zalo.me/${siteConfig.phone}`

export function WarrantyCheck({ initialKeyword = '' }: { initialKeyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [state, setState] = useState<LookupState>({ kind: 'idle' })
  const inputId = useId()
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  function cancelLookup() {
    requestIdRef.current += 1
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    controllerRef.current?.abort()
    controllerRef.current = null
  }

  useEffect(
    () => () => {
      requestIdRef.current += 1
      if (timerRef.current) clearTimeout(timerRef.current)
      controllerRef.current?.abort()
    },
    [],
  )

  function search() {
    cancelLookup()
    const query = keyword.trim()
    const validation = validateWarrantyQuery(query)
    if (validation) {
      setState({ kind: 'invalid', message: validation })
      inputRef.current?.focus()
      return
    }

    setState({ kind: 'loading' })
    const requestId = requestIdRef.current
    const controller = new AbortController()
    controllerRef.current = controller

    // Only an explicit submit starts a lookup; repeated submits collapse into one request.
    timerRef.current = setTimeout(async () => {
      timerRef.current = null
      try {
        const response = await fetch(`/api/warranty?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!response.ok) throw new Error('Warranty lookup failed')
        const record: PublicWarrantyRecord | null = await response.json()
        if (requestId !== requestIdRef.current || controller.signal.aborted) return
        setState(
          record
            ? { kind: record.coverage === 'expired' ? 'expired' : 'valid', record }
            : { kind: 'not-found' },
        )
      } catch {
        if (requestId !== requestIdRef.current || controller.signal.aborted) return
        setState({ kind: 'error' })
      } finally {
        if (requestId === requestIdRef.current) controllerRef.current = null
      }
    }, 300)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    search()
  }

  const found = state.kind === 'valid' || state.kind === 'expired' ? state.record : null
  const loading = state.kind === 'loading'

  return (
    <div className="warranty-lookup">
      <form className="warranty-search" onSubmit={handleSubmit} noValidate>
        <label className="warranty-input-label" htmlFor={inputId}>
          Mã phiếu bảo hành hoặc serial thiết bị
        </label>
        <div className={`warranty-search-pill${state.kind === 'invalid' ? ' is-invalid' : ''}`}>
          <svg
            className="warranty-search-icon"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="m16 16 4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            id={inputId}
            name="q"
            type="text"
            value={keyword}
            onChange={(event) => {
              cancelLookup()
              setKeyword(event.target.value)
              setState({ kind: 'idle' })
            }}
            placeholder="INTECH-2026-0001 hoặc serial thiết bị"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={128}
            aria-invalid={state.kind === 'invalid'}
            aria-describedby={state.kind === 'invalid' ? `${helpId} ${errorId}` : helpId}
          />
          <button className="btn primary warranty-search-button" type="submit" disabled={loading}>
            {loading && <span className="warranty-spinner" aria-hidden="true" />}
            {loading ? 'Đang tra cứu' : 'Tra cứu'}
          </button>
        </div>
        <p id={helpId} className="warranty-input-help">
          Nhập đầy đủ mã phiếu hoặc serial. Tối thiểu 6 ký tự.
        </p>
        {state.kind === 'invalid' && (
          <p id={errorId} className="warranty-input-error" role="alert">
            {state.message}
          </p>
        )}
      </form>

      <div className="warranty-feedback" aria-live="polite" aria-atomic="true" aria-busy={loading}>
        {state.kind === 'idle' && (
          <p className="warranty-privacy">
            <svg width="15" height="17" viewBox="0 0 18 20" fill="none" aria-hidden="true">
              <path
                d="M9 1.5 16 4v5.5c0 4.1-2.7 7.2-7 9-4.3-1.8-7-4.9-7-9V4l7-2.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="m5.5 9.5 2.3 2.3 4.7-4.7"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Thông tin khách hàng được che để bảo vệ quyền riêng tư.
          </p>
        )}

        {loading && (
          <div className="warranty-loading" role="status">
            <span className="warranty-loading-text">Đang kiểm tra thông tin bảo hành…</span>
            <div className="warranty-skeleton warranty-skeleton-title" aria-hidden="true" />
            <div className="warranty-skeleton" aria-hidden="true" />
            <div className="warranty-skeleton" aria-hidden="true" />
          </div>
        )}

        {found && (
          <article className="warranty-record">
            <header className="warranty-record-heading">
              <div>
                <p className="warranty-record-kicker">Thông tin thiết bị</p>
                <h2>{found.product}</h2>
                {found.model && <p>Model: {found.model}</p>}
              </div>
              <span className={`warranty-status is-${found.coverage}`}>
                <span aria-hidden="true" />
                {found.status}
              </span>
            </header>
            <dl className="warranty-record-details">
              <div>
                <dt>Mã bảo hành</dt>
                <dd>{found.code}</dd>
              </div>
              <div>
                <dt>Serial thiết bị</dt>
                <dd>{found.serial}</dd>
              </div>
              <div>
                <dt>Khách hàng</dt>
                <dd>{found.customer}</dd>
              </div>
              <div>
                <dt>Ngày mua</dt>
                <dd>{formatWarrantyDate(found.purchaseDate)}</dd>
              </div>
              <div>
                <dt>Bảo hành đến</dt>
                <dd>{formatWarrantyDate(found.warrantyUntil)}</dd>
              </div>
              <div>
                <dt>Thời hạn</dt>
                <dd>
                  {found.coverage === 'expired'
                    ? `Đã hết hạn${found.days !== null && found.days < 0 ? ` ${Math.abs(found.days)} ngày` : ''}`
                    : found.coverage === 'valid'
                      ? found.days === 0
                        ? 'Còn hiệu lực đến hết hôm nay'
                        : `Còn ${found.days} ngày`
                      : 'Liên hệ Intech để xác nhận'}
                </dd>
              </div>
            </dl>
            <div className="warranty-record-footer">
              <p>
                {found.coverage === 'expired'
                  ? 'Intech tiếp tục hỗ trợ kiểm tra thiết bị và tư vấn phương án bảo trì phù hợp.'
                  : 'Chuẩn bị mã phiếu và mô tả sự cố để kỹ thuật viên hỗ trợ nhanh hơn.'}
              </p>
              <Link className="btn primary" href="/lien-he">
                {found.coverage === 'expired'
                  ? 'Tư vấn bảo trì / nâng cấp'
                  : 'Yêu cầu hỗ trợ kỹ thuật'}
              </Link>
            </div>
          </article>
        )}

        {state.kind === 'not-found' && (
          <div className="warranty-message">
            <span className="warranty-message-symbol" aria-hidden="true">
              ?
            </span>
            <h2>Chưa tìm thấy dữ liệu cho mã này.</h2>
            <p>
              Có thể thiết bị mới bàn giao hoặc chưa cập nhật lên hệ thống. Kiểm tra lại mã, hoặc
              gửi ảnh tem serial để kỹ thuật viên tra soát trực tiếp.
            </p>
            <div className="warranty-message-actions">
              <a
                className="btn primary"
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Gửi ảnh serial qua Zalo
              </a>
              <a className="warranty-text-link" href={`tel:${siteConfig.phone}`}>
                Gọi {siteConfig.phoneDisplay} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="warranty-message">
            <span className="warranty-message-symbol" aria-hidden="true">
              !
            </span>
            <h2>Chưa thể kết nối hệ thống tra cứu.</h2>
            <p>
              Vui lòng kiểm tra kết nối và thử lại. Bạn cũng có thể gọi Intech để được hỗ trợ tra
              cứu.
            </p>
            <div className="warranty-message-actions">
              <button className="btn primary" type="button" onClick={search}>
                Thử lại
              </button>
              <a className="warranty-text-link" href={`tel:${siteConfig.phone}`}>
                Gọi kỹ thuật viên <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
