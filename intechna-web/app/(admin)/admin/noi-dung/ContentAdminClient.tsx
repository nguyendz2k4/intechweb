'use client'

import { useEffect, useState } from 'react'

type DraftPost = { title: string; slug: string; description: string; body: string }
const emptyPost: DraftPost = { title: '', slug: '', description: '', body: '' }
function slugify(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export function ContentAdminClient({ posts }: { posts: { title: string; slug: string; description: string }[] }) {
  const [draft, setDraft] = useState<DraftPost>(emptyPost)
  const [saved, setSaved] = useState<DraftPost[]>([])
  const [status, setStatus] = useState('')
  useEffect(() => { fetch('/api/admin/posts').then((res) => res.json()).then(setSaved).catch(() => setStatus('Không tải được bài đã lưu')) }, [])
  function updateTitle(title: string) { setDraft((item) => ({ ...item, title, slug: item.slug || slugify(title) })) }
  async function savePost() {
    if (!draft.title || !draft.description) return
    setStatus('Đang lưu...')
    const res = await fetch('/api/admin/posts', { method: draft.slug ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
    if (!res.ok) { setStatus('Lưu thất bại'); return }
    const post = await res.json(); setSaved((items) => [post, ...items.filter((item) => item.slug !== post.slug)]); setDraft(emptyPost); setStatus('Đã lưu thật vào data/admin-posts.json')
  }
  async function deletePost(slug: string) {
    if (!confirm('Xóa bài viết đã thêm từ admin?')) return
    await fetch('/api/admin/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) })
    setSaved((items) => items.filter((item) => item.slug !== slug)); setStatus('Đã xóa bài viết')
  }
  return (
    <div className="admin-split">
      <section className="admin-card"><h2>{draft.slug ? 'Sửa bài viết' : 'Thêm bài viết/nội dung'}</h2><div className="admin-form"><label><span>Tiêu đề</span><input value={draft.title} onChange={(e) => updateTitle(e.target.value)} placeholder="VD: Báo giá thi công mạng LAN phụ thuộc yếu tố nào?" /></label><label><span>Slug</span><input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></label><label><span>Mô tả SEO</span><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><label><span>Nội dung chính</span><textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label><button className="admin-btn primary" type="button" onClick={savePost}>{draft.slug ? 'Cập nhật bài viết' : 'Lưu bài viết'}</button>{draft.slug && <button className="admin-btn" type="button" onClick={() => setDraft(emptyPost)}>Hủy sửa</button>}{status && <p className="admin-note">{status}</p>}</div></section>
      <section className="admin-card"><h2>Bài viết hiện có</h2><div className="preview-box">{[...saved, ...posts].map((post) => <div className="preview-item" key={post.slug}><strong>{post.title}</strong><small>/{post.slug}</small><p>{post.description}</p>{saved.some((item) => item.slug === post.slug) && <div className="admin-actions"><button className="admin-btn" onClick={() => setDraft({ title: post.title, slug: post.slug, description: post.description, body: 'body' in post ? String(post.body || '') : '' })}>Sửa</button><button className="admin-btn" onClick={() => deletePost(post.slug)}>Xóa</button></div>}</div>)}</div></section>
    </div>
  )
}
