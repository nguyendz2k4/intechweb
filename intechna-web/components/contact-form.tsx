'use client'

import { useSyncExternalStore, useState, type FormEvent } from 'react'

const subscribeToHydration = () => () => {}
const clientHydrationSnapshot = () => true
const serverHydrationSnapshot = () => false

export function ContactForm() {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    clientHydrationSnapshot,
    serverHydrationSnapshot,
  )
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return
    const form = event.currentTarget
    const fields = new FormData(form)
    const body = Object.fromEntries(
      ['name', 'phone', 'email', 'note'].map((key) => [key, String(fields.get(key) ?? '').trim()]),
    )
    if (!body.name || !/^[+\d\s().-]{8,20}$/.test(body.phone)) {
      setMessage('Vui lòng nhập họ tên và số điện thoại hợp lệ.')
      setStatus('error')
      return
    }
    setStatus('submitting')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('contact-failed')
      setStatus('success')
    } catch {
      setMessage('Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi hotline Intech.')
      setStatus('error')
    }
  }

  if (status === 'success')
    return (
      <div className="contact-success" role="status">
        <p className="eyebrow">Đã tiếp nhận yêu cầu</p>
        <h3>Cảm ơn bạn đã liên hệ.</h3>
        <p>Đội ngũ Intech sẽ liên hệ theo thông tin bạn cung cấp để trao đổi về dự án.</p>
        <button className="btn secondary" onClick={() => setStatus('idle')}>
          Gửi yêu cầu khác
        </button>
      </div>
    )
  return (
    <form className="contact-form" onSubmit={submit} aria-busy={status === 'submitting'}>
      <label htmlFor="contact-name">
        Họ và tên *
        <input
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          maxLength={120}
          placeholder="Tên của bạn"
        />
      </label>
      <label htmlFor="contact-phone">
        Số điện thoại *
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          minLength={8}
          maxLength={20}
          placeholder="Số điện thoại liên hệ"
        />
      </label>
      <label htmlFor="contact-email">
        Email
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="Email của bạn (không bắt buộc)"
        />
      </label>
      <label htmlFor="contact-note">
        Nhu cầu của bạn
        <textarea
          id="contact-note"
          name="note"
          rows={3}
          maxLength={3000}
          placeholder="Loại công trình, số người dùng, thiết bị hoặc yêu cầu triển khai…"
        />
      </label>
      {status === 'error' && (
        <p className="form-message error" role="alert">
          {message}
        </p>
      )}
      <button className="btn primary" type="submit" disabled={!hydrated || status === 'submitting'}>
        {status === 'submitting' ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu tư vấn'}
      </button>
      <noscript>
        <p className="form-message">
          Vui lòng gọi hotline hoặc gửi email để được tư vấn khi JavaScript đang tắt.
        </p>
      </noscript>
    </form>
  )
}
