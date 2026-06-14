'use client'

import { useEffect, useState } from 'react'

type DraftService = { title: string; slug: string; description: string; keywords: string }
const emptyService: DraftService = { title: '', slug: '', description: '', keywords: '' }
function slugify(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export function ServiceAdminClient({ services, solutions }: { services: { title: string; slug: string; description: string }[]; solutions: { title: string; slug: string; description: string }[] }) {
  const [draft, setDraft] = useState<DraftService>(emptyService)
  const [saved, setSaved] = useState<DraftService[]>([])
  const [status, setStatus] = useState('')
  useEffect(() => { fetch('/api/admin/services').then((res) => res.json()).then(setSaved).catch(() => setStatus('Không tải được dịch vụ đã lưu')) }, [])
  function updateTitle(title: string) { setDraft((item) => ({ ...item, title, slug: item.slug || slugify(title) })) }
  async function saveService() {
    if (!draft.title || !draft.description) return
    setStatus('Đang lưu...')
    const res = await fetch('/api/admin/services', { method: draft.slug ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
    if (!res.ok) { setStatus('Lưu thất bại'); return }
    const service = await res.json(); setSaved((items) => [service, ...items.filter((item) => item.slug !== service.slug)]); setDraft(emptyService); setStatus('Đã lưu thật vào data/admin-services.json')
  }
  async function deleteService(slug: string) {
    if (!confirm('Xóa dịch vụ/giải pháp đã thêm từ admin?')) return
    await fetch('/api/admin/services', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) })
    setSaved((items) => items.filter((item) => item.slug !== slug)); setStatus('Đã xóa dịch vụ/giải pháp')
  }
  return (
    <div className="admin-split">
      <section className="admin-card"><h2>{draft.slug ? 'Sửa dịch vụ/giải pháp' : 'Thêm dịch vụ/giải pháp'}</h2><div className="admin-form"><label><span>Tiêu đề</span><input value={draft.title} onChange={(e) => updateTitle(e.target.value)} placeholder="VD: Thi công mạng khách sạn" /></label><label><span>Slug</span><input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></label><label><span>Mô tả SEO</span><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><label><span>Từ khóa</span><input value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} placeholder="thi công mạng khách sạn, WiFi khách sạn..." /></label><button className="admin-btn primary" type="button" onClick={saveService}>{draft.slug ? 'Cập nhật' : 'Lưu dịch vụ/giải pháp'}</button>{draft.slug && <button className="admin-btn" type="button" onClick={() => setDraft(emptyService)}>Hủy sửa</button>}{status && <p className="admin-note">{status}</p>}</div></section>
      <section className="admin-card"><h2>Dịch vụ/giải pháp hiện có</h2><div className="preview-box">{[...saved, ...services, ...solutions].map((item) => <div className="preview-item" key={item.slug}><strong>{item.title}</strong><small>/{item.slug}</small><p>{item.description}</p>{saved.some((savedItem) => savedItem.slug === item.slug) && <div className="admin-actions"><button className="admin-btn" onClick={() => setDraft({ title: item.title, slug: item.slug, description: item.description, keywords: 'keywords' in item ? String(item.keywords || '') : '' })}>Sửa</button><button className="admin-btn" onClick={() => deleteService(item.slug)}>Xóa</button></div>}</div>)}</div></section>
    </div>
  )
}
