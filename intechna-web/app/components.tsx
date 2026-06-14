'use client'

import { useState } from 'react'
import Link from 'next/link'
import { commonFaqs, processSteps, siteConfig } from '@/app/data'

function PhoneIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.122-4.1-6.924-6.924l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

function CheckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function AlertIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function NetworkGraphics() {
  return (
    <div className="hero-graphic-card">
      <div className="card-ports">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="port-slot">
            <span className="port-label">{i + 1}</span>
            <div className="port-jack">
              <span className={`port-led ${i % 3 === 0 ? 'led-active' : i % 7 === 0 ? 'led-warn' : 'led-idle'}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="rack-diagram">
        <svg viewBox="0 0 300 150" className="network-svg" xmlns="http://www.w3.org/2000/svg">
          <circle cx="150" cy="30" r="8" className="svg-node core-node" />
          <circle cx="70" cy="80" r="6" className="svg-node" />
          <circle cx="150" cy="80" r="6" className="svg-node" />
          <circle cx="230" cy="80" r="6" className="svg-node" />
          
          <circle cx="40" cy="130" r="4" className="svg-node endpoint" />
          <circle cx="100" cy="130" r="4" className="svg-node endpoint" />
          <circle cx="200" cy="130" r="4" className="svg-node endpoint" />
          <circle cx="260" cy="130" r="4" className="svg-node endpoint" />

          <path d="M 150 30 L 70 80 M 150 30 L 150 80 M 150 30 L 230 80" className="svg-edge active-edge" />
          <path d="M 70 80 L 40 130 M 70 80 L 100 130 M 230 80 L 200 130 M 230 80 L 260 130" className="svg-edge" />

          <circle r="3" fill="var(--blue)" className="data-pulse pulse-1" />
          <circle r="3" fill="var(--blue-mid)" className="data-pulse pulse-2" />
        </svg>
      </div>
      <div className="terminal-log font-mono">
        <div className="log-line"><span className="log-success">SYS OK</span> Core routing active</div>
        <div className="log-line"><span className="log-info">CONFIG</span> VLAN 10/20/30 provisioned</div>
        <div className="log-line"><span className="log-warning">ALERT</span> 0 packet drop detected</div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="hero" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center' }}>
      <div className="asym-grid-16-10" style={{ width: '100%', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <p className="eyebrow">{siteConfig.shortName}</p>
          <h1 style={{ marginBottom: '24px' }}>Giải pháp hạ tầng mạng chuyên nghiệp cho doanh nghiệp</h1>
          <p className="lead" style={{ marginBottom: '32px' }}>
            Intech tư vấn, thiết kế, cung cấp thiết bị và thi công hệ thống LAN/WAN, firewall, switch, WiFi, server, camera với định hướng ổn định – bảo mật – dễ vận hành.
          </p>
          <div className="actions" style={{ display: 'flex', gap: '16px' }}>
            <Link className="btn primary" href={`tel:${siteConfig.phone}`} style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
              <PhoneIcon className="w-5 h-5" />
              <span>Gọi {siteConfig.phoneDisplay}</span>
            </Link>
            <Link className="btn secondary" href="/lien-he">Liên hệ tư vấn</Link>
          </div>
        </div>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
          <NetworkGraphics />
        </div>
      </div>
    </section>
  )
}

export function CTA() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', note: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) {
      setStatus('error')
      return
    }
    setStatus('submitting')
    // Simulate API request
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setStatus('success')
    setFormData({ name: '', phone: '', email: '', note: '' })
  }

  return (
    <section className="section contact reveal" style={{ background: 'linear-gradient(135deg, var(--blue-darker) 0%, var(--ink-mid) 100%)' }}>
      <div className="asym-grid-12-8" style={{ alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', color: '#cbd5e1' }}>
          <p className="eyebrow" style={{ color: 'var(--blue)' }}>Nhận tư vấn</p>
          <h2 style={{ color: 'var(--white)', marginBottom: '24px' }}>Sẵn sàng khảo sát và đề xuất giải pháp phù hợp cho dự án</h2>
          <p className="lead" style={{ color: '#94a3b8', marginBottom: '32px' }}>
            Gửi nhu cầu hoặc gọi trực tiếp để Intech tư vấn phương án mạng, firewall, WiFi, server, camera phù hợp ngân sách và mục tiêu vận hành.
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ display: 'flex', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
              <PhoneIcon className="w-5 h-5" />
            </div>
            <div>
              <small style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hotline 24/7</small>
              <Link href={`tel:${siteConfig.phone}`} style={{ fontSize: '18px', fontWeight: '800', color: 'var(--white)' }}>{siteConfig.phoneDisplay}</Link>
            </div>
          </div>
        </div>

        <div className="liquid-glass" style={{ padding: '40px', borderRadius: '28px', width: '100%' }}>
          {status === 'success' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 0' }}>
              <div style={{ display: 'flex', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <CheckIcon className="w-8 h-8" />
              </div>
              <h3 style={{ color: 'var(--ink)' }}>Gửi yêu cầu thành công</h3>
              <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '8px' }}>
                Cảm ơn bạn đã liên hệ. Đội ngũ kỹ thuật Intech sẽ phản hồi lại bạn sớm nhất có thể.
              </p>
              <button 
                type="button" 
                className="btn secondary" 
                onClick={() => setStatus('idle')}
                style={{ marginTop: '24px', minHeight: '44px', fontSize: '14px' }}
              >
                Gửi liên hệ khác
              </button>
            </div>
          ) : (
            <form className="form" onSubmit={handleSubmit} style={{ background: 'transparent', padding: 0, boxShadow: 'none', border: 'none', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }} htmlFor="cta-name">Họ và tên *</label>
                <input 
                  id="cta-name"
                  type="text"
                  required
                  placeholder="Họ và tên của bạn" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ background: 'var(--white)', border: '1px solid var(--blue-mid)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }} htmlFor="cta-phone">Số điện thoại *</label>
                <input 
                  id="cta-phone"
                  type="tel"
                  required
                  placeholder="Số điện thoại liên hệ" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ background: 'var(--white)', border: '1px solid var(--blue-mid)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }} htmlFor="cta-email">Email</label>
                <input 
                  id="cta-email"
                  type="email"
                  placeholder="Địa chỉ email (không bắt buộc)" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ background: 'var(--white)', border: '1px solid var(--blue-mid)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }} htmlFor="cta-note">Nhu cầu tư vấn / Nội dung dự án</label>
                <textarea 
                  id="cta-note"
                  placeholder="Mô tả sơ bộ nhu cầu: loại công trình, số lượng thiết bị, yêu cầu đặc biệt..." 
                  rows={4} 
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{ background: 'var(--white)', border: '1px solid var(--blue-mid)', resize: 'none' }}
                />
              </div>

              {status === 'error' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '14px' }}>
                  <AlertIcon className="w-5 h-5" />
                  <span>Vui lòng điền đầy đủ các thông tin bắt buộc.</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn primary" 
                disabled={status === 'submitting'}
                style={{ width: '100%', marginTop: '8px', cursor: status === 'submitting' ? 'not-allowed' : 'pointer', opacity: status === 'submitting' ? 0.7 : 1 }}
              >
                {status === 'submitting' ? 'Đang gửi thông tin...' : 'Gửi thông tin liên hệ'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export function ProcessSection() {
  return (
    <section className="section surface overflow-hidden reveal">
      <div className="heading" style={{ textAlign: 'center', margin: '0 auto 64px', maxWidth: '720px' }}>
        <p className="eyebrow">Quy trình</p>
        <h2>Làm theo checklist để giảm lỗi và dễ nghiệm thu</h2>
        <p className="lead" style={{ margin: '0 auto' }}>
          Intech không chỉ bán thiết bị. Mỗi dự án cần đi từ khảo sát, thiết kế, thi công đến bàn giao tài liệu để hệ thống vận hành ổn định lâu dài.
        </p>
      </div>
      <div className="process-staggered">
        {processSteps.map((step, index) => {
          const isEven = index % 2 === 0
          return (
            <div key={step.title} className={`process-row ${isEven ? 'row-even' : 'row-odd'}`}>
              <div className="process-space" />
              <div className="process-node-container">
                <span className="process-dot-pulse" />
              </div>
              <article className="process-card liquid-glass">
                <span className="process-number">{String(index + 1).padStart(2, '0')}</span>
                <h3 style={{ marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ margin: 0 }}>{step.desc}</p>
              </article>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function FAQSection() {
  return (
    <section className="section reveal">
      <div className="heading" style={{ textAlign: 'center', margin: '0 auto 56px', maxWidth: '720px' }}>
        <p className="eyebrow">FAQ</p>
        <h2>Câu hỏi thường gặp trước khi triển khai</h2>
      </div>
      <div className="faq-list">
        {commonFaqs.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>
              <span>{item.question}</span>
              <span className="faq-icon-wrapper">
                <svg className="faq-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </span>
            </summary>
            <div className="faq-content">
              <p style={{ margin: 0 }}>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

export function Breadcrumbs({ current }: { current: string }) {
  return (
    <div className="breadcrumbs" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px var(--pad-x) 0' }}>
      <Link href="/" style={{ color: 'var(--muted)', fontWeight: '600' }}>Trang chủ</Link>
      <span style={{ color: 'var(--muted-light)', margin: '0 10px' }}>/</span>
      <span style={{ color: 'var(--blue-dark)', fontWeight: '700' }}>{current}</span>
    </div>
  )
}
