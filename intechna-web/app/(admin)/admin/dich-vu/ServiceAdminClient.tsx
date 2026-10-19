'use client'

import { useCallback, useEffect, useState } from 'react'
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

type DraftService = {
  title: string
  slug: string
  description: string
  keywords: string
  deliverables: string[]
  benefits: string[]
  status: 'published' | 'draft'
}
const emptyService: DraftService = {
  title: '',
  slug: '',
  description: '',
  keywords: '',
  deliverables: [],
  benefits: [],
  status: 'draft',
}

export function ServiceAdminClient({
  services,
  solutions,
}: {
  services: {
    title: string
    slug: string
    description: string
    keywords: string[]
    deliverables: string[]
    benefits: string[]
  }[]
  solutions: { title: string; slug: string; description: string }[]
}) {
  const canWrite = useAdminPermission('services:write')
  const [draft, setDraft] = useState<DraftService>(emptyService)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [slugCustomized, setSlugCustomized] = useState(false)
  const [saved, setSaved] = useState<DraftService[]>([])
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<AdminNotice>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<DraftService | null>(null)
  const fetchServices = useCallback(
    (signal?: AbortSignal) =>
      adminRequest<DraftService[]>('/api/admin/services', { signal })
        .then((data) => {
          if (signal?.aborted) return
          if (!Array.isArray(data)) throw new Error('Danh sách dịch vụ không hợp lệ.')
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
    void fetchServices(controller.signal)
    return () => controller.abort()
  }, [fetchServices])

  function loadServices() {
    setLoading(true)
    setLoadFailed(false)
    return fetchServices()
  }
  function updateTitle(title: string) {
    setDraft((item) => ({
      ...item,
      title,
      slug: !editingSlug && !slugCustomized ? slugify(title) : item.slug,
    }))
  }
  async function saveService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !canWrite) return
    setBusy(true)
    setNotice(null)
    try {
      const service = await adminRequest<DraftService>('/api/admin/services', {
        method: editingSlug ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          keywords: draft.keywords,
          deliverables: draft.deliverables.map((x) => x.trim()).filter(Boolean),
          benefits: draft.benefits.map((x) => x.trim()).filter(Boolean),
          status: draft.status,
          slug: editingSlug || draft.slug,
        }),
      })
      setSaved((items) => [service, ...items.filter((item) => item.slug !== service.slug)])
      setDraft({ ...emptyService })
      setEditingSlug(null)
      setSlugCustomized(false)
      setNotice({
        type: 'success',
        message:
          service.status === 'published'
            ? 'Đã xuất bản nội dung trên trang Dịch vụ và Giải pháp.'
            : 'Đã lưu bản nháp. Nội dung chưa hiển thị trên website.',
      })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }
  async function deleteService() {
    if (!pendingDelete || busy || !canWrite) return
    setBusy(true)
    try {
      await adminRequest('/api/admin/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pendingDelete.slug }),
      })
      setSaved((items) => items.filter((item) => item.slug !== pendingDelete.slug))
      if (editingSlug === pendingDelete.slug) {
        setDraft({ ...emptyService })
        setEditingSlug(null)
        setSlugCustomized(false)
      }
      setPendingDelete(null)
      setNotice({
        type: 'success',
        message: services.some((x) => x.slug === pendingDelete.slug)
          ? 'Đã xóa bản CMS. Trang dùng lại nội dung gốc của website.'
          : 'Đã xóa dịch vụ khỏi CMS và website.',
      })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }
  const filtered = saved.filter((item) =>
    `${item.title} ${item.slug}`.toLowerCase().includes(query.toLowerCase().trim()),
  )
  const references = [
    ...services.map((item) => ({ ...item, href: `/dich-vu/${encodeURIComponent(item.slug)}` })),
    ...solutions.map((item) => ({ ...item, href: `/giai-phap/${encodeURIComponent(item.slug)}` })),
  ]

  return (
    <>
      <Notice notice={notice} />
      {pendingDelete && (
        <>
          {services.some((x) => x.slug === pendingDelete.slug) && (
            <p className="admin-note">
              Xóa bản CMS sẽ khôi phục nội dung gốc. Chọn Bản nháp khi muốn ẩn dịch vụ này.
            </p>
          )}
          <DeleteConfirmation
            name={pendingDelete.title}
            busy={busy}
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => void deleteService()}
          />
        </>
      )}
      <div className="admin-split">
        {canWrite && (
          <section className="admin-card">
            <h2>{editingSlug ? 'Chỉnh sửa dịch vụ' : 'Thêm nội dung dịch vụ'}</h2>
            <form className="admin-form" onSubmit={saveService}>
              <fieldset className="admin-form admin-fields" disabled={busy}>
                <label>
                  <span>Tiêu đề *</span>
                  <input
                    required
                    maxLength={180}
                    value={draft.title}
                    onChange={(event) => updateTitle(event.target.value)}
                    placeholder="Thi công mạng khách sạn"
                  />
                </label>
                <label>
                  <span>Đường dẫn *</span>
                  <input
                    required
                    readOnly={Boolean(editingSlug)}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    maxLength={160}
                    value={draft.slug}
                    onChange={(event) => {
                      setSlugCustomized(true)
                      setDraft({ ...draft, slug: event.target.value })
                    }}
                  />
                  <small>
                    {editingSlug
                      ? 'Giữ đường dẫn hiện tại khi cập nhật.'
                      : 'Tự tạo từ tiêu đề trước lần lưu đầu tiên.'}
                  </small>
                </label>
                <label>
                  <span>Mô tả *</span>
                  <textarea
                    required
                    maxLength={2000}
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </label>
                <label>
                  <span>Từ khóa</span>
                  <input
                    maxLength={500}
                    value={draft.keywords}
                    onChange={(event) => setDraft({ ...draft, keywords: event.target.value })}
                    placeholder="thi công mạng khách sạn, WiFi khách sạn"
                  />
                </label>
                <label>
                  <span>Hạng mục bàn giao · Mỗi dòng một mục</span>
                  <textarea
                    value={draft.deliverables.join('\n')}
                    maxLength={15000}
                    rows={5}
                    onChange={(event) =>
                      setDraft({ ...draft, deliverables: event.target.value.split('\n') })
                    }
                  />
                </label>
                <label>
                  <span>Lợi ích · Mỗi dòng một mục</span>
                  <textarea
                    value={draft.benefits.join('\n')}
                    maxLength={15000}
                    rows={5}
                    onChange={(event) =>
                      setDraft({ ...draft, benefits: event.target.value.split('\n') })
                    }
                  />
                </label>
                <label>
                  <span>Trạng thái</span>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setDraft({ ...draft, status: event.target.value as DraftService['status'] })
                    }
                  >
                    <option value="draft">Bản nháp / Ẩn</option>
                    <option value="published">Đang hiển thị</option>
                  </select>
                </label>
                <div className="admin-actions">
                  <button
                    className="admin-btn primary"
                    disabled={busy || loading || loadFailed}
                    type="submit"
                  >
                    {busy ? 'Đang lưu…' : editingSlug ? 'Lưu thay đổi' : 'Lưu dịch vụ'}
                  </button>
                  {editingSlug && (
                    <button
                      className="admin-btn"
                      disabled={busy}
                      type="button"
                      onClick={() => {
                        setDraft({ ...emptyService })
                        setEditingSlug(null)
                        setSlugCustomized(false)
                      }}
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                </div>
              </fieldset>
            </form>
          </section>
        )}
        <section className="admin-card">
          <div className="admin-list-heading">
            <div>
              <h2>Nội dung trong CMS</h2>
              <p>
                {loading
                  ? 'Đang tải cơ sở dữ liệu…'
                  : loadFailed
                    ? 'Chưa tải được dữ liệu'
                    : `${saved.length} dịch vụ trong cơ sở dữ liệu`}
              </p>
            </div>
          </div>
          <div className="admin-form">
            <label>
              <span>Tìm dịch vụ</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tiêu đề hoặc đường dẫn…"
              />
            </label>
          </div>
          {loading ? (
            <LoadingRows />
          ) : loadFailed ? (
            <div className="admin-actions">
              <button className="admin-btn" onClick={() => void loadServices()}>
                Tải lại danh sách
              </button>
            </div>
          ) : !filtered.length ? (
            <EmptyState
              title={saved.length ? 'Không tìm thấy nội dung' : 'Chưa có dịch vụ trong CMS'}
              text={
                saved.length
                  ? 'Thử từ khóa khác.'
                  : 'Nội dung có sẵn của website được liệt kê phía dưới.'
              }
            />
          ) : (
            <div className="preview-box">
              {filtered.map((item) => (
                <article className="preview-item" key={item.slug}>
                  <strong>{item.title}</strong>
                  <span
                    className={`admin-pill ${item.status === 'published' ? 'success' : 'warning'}`}
                  >
                    {item.status === 'published' ? 'Đang hiển thị' : 'Bản nháp / Ẩn'}
                  </span>
                  <small>/{item.slug}</small>
                  <p>{item.description}</p>
                  {item.status === 'published' && (
                    <a
                      href={publicPageUrl(`/giai-phap/${encodeURIComponent(item.slug)}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem trên website ↗
                    </a>
                  )}
                  {canWrite && (
                    <div className="admin-actions">
                      <button
                        className="admin-btn compact"
                        disabled={busy}
                        onClick={() => {
                          setEditingSlug(item.slug)
                          setSlugCustomized(true)
                          setDraft({
                            ...item,
                            description: item.description ?? '',
                            keywords: item.keywords ?? '',
                          })
                          setNotice(null)
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="admin-btn compact danger"
                        disabled={busy}
                        onClick={() => {
                          setPendingDelete(item)
                          setNotice(null)
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <details className="admin-reference">
        <summary>{references.length} trang dịch vụ và giải pháp có sẵn trong mã website</summary>
        <section className="admin-card">
          <p>
            Nội dung xuất bản trong CMS hiển thị trên cả trang Dịch vụ và Giải pháp. Các giải pháp
            có sẵn vẫn được giữ lại; bản nháp không hiển thị trên website.
          </p>
          <div className="preview-box">
            {references.map((item) => (
              <article className="preview-item" key={item.href}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <a href={publicPageUrl(item.href)} target="_blank" rel="noopener noreferrer">
                  Xem trang ↗
                </a>
                {canWrite && services.some((service) => service.slug === item.slug) && (
                  <button
                    className="admin-btn compact"
                    disabled={busy || loading || loadFailed}
                    onClick={() => {
                      const source = services.find((service) => service.slug === item.slug)!
                      const stored = saved.find((service) => service.slug === item.slug)
                      setDraft(
                        stored ?? {
                          ...source,
                          keywords: source.keywords.join(', '),
                          status: 'draft',
                        },
                      )
                      setEditingSlug(source.slug)
                      setSlugCustomized(true)
                      setNotice(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Sửa nội dung dịch vụ
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      </details>
    </>
  )
}
