'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { siteConfig } from '@/app/data'
import {
  adminRequest,
  errorMessage,
  slugify,
  publicPageUrl,
  Notice,
  LoadingRows,
  EmptyState,
  DeleteConfirmation,
  useAdminPermission,
  type AdminNotice,
} from '../AdminUi'

type Post = {
  id?: number
  title: string
  slug: string
  description: string | null
  body: string | null
  status: 'published' | 'draft'
}
type DraftPost = {
  title: string
  slug: string
  description: string
  body: string
  status: 'published' | 'draft'
}
const emptyPost: DraftPost = { title: '', slug: '', description: '', body: '', status: 'draft' }
const pageSize = 20

export function ContentAdminClient({
  posts: websitePosts,
}: {
  posts: { title: string; slug: string; description: string }[]
}) {
  const canWrite = useAdminPermission('posts:write')
  const [saved, setSaved] = useState<Post[]>([])
  const [draft, setDraft] = useState<DraftPost>(emptyPost)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [slugCustomized, setSlugCustomized] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<AdminNotice>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null)

  const fetchPosts = useCallback(
    (signal?: AbortSignal) =>
      adminRequest<Post[]>('/api/admin/posts', { signal })
        .then((data) => {
          if (signal?.aborted) return
          if (!Array.isArray(data)) throw new Error('Danh sách bài viết không hợp lệ.')
          setSaved(data)
          setNotice(null)
        })
        .catch((error: unknown) => {
          if (signal?.aborted) return
          setLoadFailed(true)
          setNotice({ type: 'error', message: errorMessage(error) })
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false)
        }),
    [],
  )
  useEffect(() => {
    const controller = new AbortController()
    void fetchPosts(controller.signal)
    return () => controller.abort()
  }, [fetchPosts])

  function loadPosts() {
    setLoading(true)
    setLoadFailed(false)
    return fetchPosts()
  }

  const filtered = useMemo(
    () =>
      saved.filter(
        (post) =>
          `${post.title} ${post.slug}`.toLowerCase().includes(query.toLowerCase().trim()) &&
          (filterStatus === 'all' || (post.status ?? 'published') === filterStatus),
      ),
    [saved, query, filterStatus],
  )
  const referencePosts = websitePosts.filter(
    (post) => !saved.some((item) => item.slug === post.slug),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function openEditor(post?: Post) {
    setEditingSlug(post?.slug ?? null)
    setSlugCustomized(Boolean(post))
    setDraft(
      post
        ? {
            title: post.title,
            slug: post.slug,
            description: post.description ?? '',
            body: post.body ?? '',
            status: post.status ?? 'published',
          }
        : { ...emptyPost },
    )
    setNotice(null)
    setEditorOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function updateTitle(title: string) {
    setDraft((item) => ({
      ...item,
      title,
      slug: !editingSlug && !slugCustomized ? slugify(title) : item.slug,
    }))
  }
  async function savePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !canWrite) return
    setBusy(true)
    setNotice(null)
    try {
      const post = await adminRequest<Post>('/api/admin/posts', {
        method: editingSlug ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, slug: editingSlug || draft.slug }),
      })
      setSaved((items) => [post, ...items.filter((item) => item.slug !== post.slug)])
      setEditorOpen(false)
      setNotice({
        type: 'success',
        message:
          draft.status === 'draft'
            ? 'Đã lưu bản nháp trong cơ sở dữ liệu.'
            : 'Đã lưu và xuất bản bài viết.',
      })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }
  async function deletePost() {
    if (!pendingDelete || busy || !canWrite) return
    setBusy(true)
    try {
      await adminRequest('/api/admin/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pendingDelete.slug }),
      })
      setSaved((items) => items.filter((item) => item.slug !== pendingDelete.slug))
      setPendingDelete(null)
      setNotice({ type: 'success', message: 'Đã xóa bài viết khỏi cơ sở dữ liệu.' })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  if (editorOpen)
    return (
      <>
        <div className="admin-editor-header">
          <div>
            <h2>{editingSlug ? 'Chỉnh sửa bài viết' : 'Thêm bài viết'}</h2>
            <p>Soạn nội dung theo mẫu bài viết hiện tại của website.</p>
          </div>
          <button
            className="admin-btn"
            disabled={busy}
            onClick={() => {
              setEditorOpen(false)
              setNotice(null)
            }}
          >
            ← Danh sách bài viết
          </button>
        </div>
        <Notice notice={notice} />
        <form className="admin-editor-layout" onSubmit={savePost}>
          <fieldset className="admin-card admin-form" disabled={busy}>
            <h2>Nội dung bài viết</h2>
            <label>
              <span>Tiêu đề *</span>
              <input
                required
                maxLength={200}
                value={draft.title}
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="Báo giá thi công mạng LAN phụ thuộc yếu tố nào?"
              />
            </label>
            <label>
              <span>Đường dẫn bài viết *</span>
              <input
                required
                readOnly={Boolean(editingSlug)}
                maxLength={160}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={draft.slug}
                onChange={(event) => {
                  setSlugCustomized(true)
                  setDraft({ ...draft, slug: event.target.value })
                }}
              />
              <small>
                {editingSlug
                  ? 'Đường dẫn được giữ cố định để bảo toàn liên kết hiện tại.'
                  : 'Tự tạo từ tiêu đề. Có thể điều chỉnh trước lần lưu đầu tiên.'}
              </small>
            </label>
            <label>
              <span>Mô tả ngắn *</span>
              <textarea
                required
                maxLength={3000}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="Tóm tắt nội dung và giá trị của bài viết."
              />
              <small>
                {draft.description.length} ký tự · Dùng cho phần giới thiệu và mô tả tìm kiếm.
              </small>
            </label>
            <label>
              <span>Nội dung chính</span>
              <textarea
                className="admin-body-editor"
                maxLength={100000}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                placeholder={
                  'Nội dung bài viết…\n\n## Tiêu đề mục\nNội dung của mục.\n\n- Ý thứ nhất\n- Ý thứ hai'
                }
              />
              <small>
                Dùng dòng trống để chia đoạn, ## cho tiêu đề mục, ### cho mục con và - cho danh
                sách. Nội dung được hiển thị an toàn trong mẫu bài viết của website.
              </small>
            </label>
          </fieldset>
          <aside className="admin-editor-aside">
            <fieldset className="admin-card admin-form" disabled={busy}>
              <h3>Xuất bản</h3>
              <label>
                <span>Trạng thái</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as DraftPost['status'] })
                  }
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đã xuất bản</option>
                </select>
                <small>Bản nháp không xuất hiện trên website công khai.</small>
              </label>
              <div className="admin-actions">
                <button className="admin-btn primary" disabled={busy} type="submit">
                  {busy ? 'Đang lưu…' : 'Lưu bài viết'}
                </button>
              </div>
              {editingSlug && draft.status === 'published' && (
                <a
                  href={publicPageUrl(`/tin-tuc/${encodeURIComponent(editingSlug)}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem bài viết ↗
                </a>
              )}
            </fieldset>
            <section className="admin-card">
              <h3>Xem trước tìm kiếm</h3>
              <div className="admin-seo-preview">
                <span className="admin-seo-url">
                  {siteConfig.domain}/tin-tuc/{draft.slug || 'duong-dan-bai-viet'}
                </span>
                <h4>
                  {draft.title || 'Tiêu đề bài viết'} | {siteConfig.shortName}
                </h4>
                <p>{draft.description || 'Mô tả ngắn của bài viết sẽ xuất hiện tại đây.'}</p>
              </div>
              <p className="admin-seo-hint">
                Tiêu đề và mô tả lấy trực tiếp từ nội dung bài viết theo quy tắc của website.
              </p>
            </section>
          </aside>
        </form>
      </>
    )

  return (
    <>
      <section className="admin-card">
        <div className="admin-list-heading">
          <div>
            <h2>Danh sách bài viết</h2>
            <p>
              {loading
                ? 'Đang tải cơ sở dữ liệu…'
                : loadFailed
                  ? 'Chưa tải được dữ liệu'
                  : `${saved.length} bài viết trong cơ sở dữ liệu`}
            </p>
          </div>
          {canWrite && (
            <button
              className="admin-btn primary"
              disabled={loading || loadFailed || busy}
              onClick={() => openEditor()}
            >
              + Thêm bài viết
            </button>
          )}
        </div>
        <Notice notice={notice} />
        {pendingDelete && (
          <DeleteConfirmation
            name={pendingDelete.title}
            busy={busy}
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => void deletePost()}
          />
        )}
        <div className="admin-toolbar">
          <div className="admin-form">
            <label>
              <span>Tìm bài viết</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Tiêu đề hoặc đường dẫn…"
              />
            </label>
          </div>
          <div className="admin-form">
            <label>
              <span>Trạng thái</span>
              <select
                value={filterStatus}
                onChange={(event) => {
                  setFilterStatus(event.target.value)
                  setPage(1)
                }}
              >
                <option value="all">Tất cả</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
              </select>
            </label>
          </div>
        </div>
        {loading ? (
          <LoadingRows />
        ) : loadFailed ? (
          <button className="admin-btn" onClick={() => void loadPosts()}>
            Tải lại danh sách
          </button>
        ) : !filtered.length ? (
          <EmptyState
            title={saved.length ? 'Không tìm thấy bài viết' : 'Chưa có bài viết trong CMS'}
            text={
              saved.length
                ? 'Thử từ khóa hoặc trạng thái khác.'
                : 'Thêm bài viết mới để quản lý nội dung từ cơ sở dữ liệu.'
            }
          />
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bài viết</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((post) => (
                    <tr key={post.slug}>
                      <td>
                        <strong>{post.title}</strong>
                        <small>/tin-tuc/{post.slug}</small>
                      </td>
                      <td>
                        <span className={`admin-pill ${post.status === 'draft' ? 'draft' : ''}`}>
                          {post.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {canWrite && (
                            <>
                              <button
                                className="admin-btn compact"
                                disabled={busy}
                                onClick={() => openEditor(post)}
                              >
                                Sửa
                              </button>
                              <button
                                className="admin-btn compact danger"
                                disabled={busy}
                                onClick={() => {
                                  setPendingDelete(post)
                                  setNotice(null)
                                }}
                              >
                                Xóa
                              </button>
                            </>
                          )}
                          {post.status !== 'draft' && (
                            <a
                              href={publicPageUrl(`/tin-tuc/${encodeURIComponent(post.slug)}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Xem ↗
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-list-heading">
              <p className="admin-count">
                {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)} / {filtered.length} bài viết
              </p>
              <div className="admin-actions">
                <button
                  className="admin-btn compact"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Trước
                </button>
                <span className="admin-count">
                  {currentPage} / {pages}
                </span>
                <button
                  className="admin-btn compact"
                  disabled={currentPage >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {!loading && !loadFailed && referencePosts.length > 0 && (
        <details className="admin-reference">
          <summary>{referencePosts.length} bài viết có sẵn trong mã website</summary>
          <section className="admin-card">
            <p>
              Các bài viết này vẫn hiển thị trên website. Nội dung có sẵn được quản lý trong mã
              nguồn.
            </p>
            <div className="preview-box">
              {referencePosts.map((post) => (
                <article className="preview-item" key={post.slug}>
                  <strong>{post.title}</strong>
                  <small>/tin-tuc/{post.slug}</small>
                  <p>{post.description}</p>
                  <a
                    href={publicPageUrl(`/tin-tuc/${encodeURIComponent(post.slug)}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem bài viết ↗
                  </a>
                </article>
              ))}
            </div>
          </section>
        </details>
      )}
    </>
  )
}
