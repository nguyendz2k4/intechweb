'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminRequest,
  errorMessage,
  Notice,
  LoadingRows,
  EmptyState,
  DeleteConfirmation,
  useAdminPermission,
  type AdminNotice,
} from '../AdminUi'

type Contact = {
  id: number
  name: string
  phone: string
  email: string | null
  note: string | null
  status: 'mới' | 'đang xử lý' | 'đã xử lý'
  submittedAt: string | null
}
function submittedDate(value: string | null) {
  if (!value) return 'Chưa có ngày gửi'
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : 'Chưa có ngày gửi'
}

export function ContactAdminClient() {
  const canWrite = useAdminPermission('contacts:write')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [statusDrafts, setStatusDrafts] = useState<Record<number, Contact['status']>>({})
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notice, setNotice] = useState<AdminNotice>(null)
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null)

  const fetchContacts = useCallback(
    (signal?: AbortSignal) =>
      adminRequest<Contact[]>('/api/admin/contacts', { signal })
        .then((data) => {
          if (signal?.aborted) return
          if (!Array.isArray(data)) throw new Error('Danh sách liên hệ không hợp lệ.')
          setContacts(data)
          setStatusDrafts({})
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
    void fetchContacts(controller.signal)
    return () => controller.abort()
  }, [fetchContacts])

  function loadContacts() {
    setLoading(true)
    setLoadFailed(false)
    return fetchContacts()
  }

  const filtered = useMemo(
    () =>
      contacts.filter(
        (item) =>
          [item.name, item.phone, item.email, item.note]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase().trim()) &&
          (statusFilter === 'all' || item.status === statusFilter),
      ),
    [contacts, query, statusFilter],
  )

  async function updateStatus(contact: Contact) {
    if (busyId !== null || !canWrite) return
    setBusyId(contact.id)
    setNotice(null)
    try {
      const updated = await adminRequest<Contact>('/api/admin/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contact.id,
          status: statusDrafts[contact.id] || contact.status,
        }),
      })
      setContacts((items) => items.map((item) => (item.id === updated.id ? updated : item)))
      setStatusDrafts((items) => {
        const next = { ...items }
        delete next[contact.id]
        return next
      })
      setNotice({ type: 'success', message: `Đã cập nhật trạng thái yêu cầu của ${contact.name}.` })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }
  async function deleteContact() {
    if (!pendingDelete || busyId !== null || !canWrite) return
    setBusyId(pendingDelete.id)
    try {
      await adminRequest('/api/admin/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingDelete.id }),
      })
      setContacts((items) => items.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
      setNotice({ type: 'success', message: 'Đã xóa yêu cầu liên hệ khỏi cơ sở dữ liệu.' })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-list-heading">
        <div>
          <h2>Hộp thư liên hệ</h2>
          <p>
            {loading
              ? 'Đang tải cơ sở dữ liệu…'
              : loadFailed
                ? 'Chưa tải được dữ liệu'
                : `${contacts.length} yêu cầu được tải · Tối đa 500 yêu cầu gần nhất`}
          </p>
        </div>
        <button
          className="admin-btn"
          disabled={loading || busyId !== null}
          onClick={() => void loadContacts()}
        >
          Làm mới
        </button>
      </div>
      <Notice notice={notice} />
      {pendingDelete && (
        <DeleteConfirmation
          name={`yêu cầu của ${pendingDelete.name}`}
          busy={busyId !== null}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void deleteContact()}
        />
      )}
      <div className="admin-toolbar">
        <div className="admin-form">
          <label>
            <span>Tìm yêu cầu</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên, điện thoại, email, nội dung…"
            />
          </label>
        </div>
        <div className="admin-form">
          <label>
            <span>Trạng thái</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tất cả</option>
              <option value="mới">Mới</option>
              <option value="đang xử lý">Đang xử lý</option>
              <option value="đã xử lý">Đã xử lý</option>
            </select>
          </label>
        </div>
      </div>
      {loading ? (
        <LoadingRows />
      ) : loadFailed ? (
        <button className="admin-btn" onClick={() => void loadContacts()}>
          Tải lại danh sách
        </button>
      ) : !filtered.length ? (
        <EmptyState
          title={contacts.length ? 'Không tìm thấy yêu cầu' : 'Chưa có yêu cầu liên hệ'}
          text={
            contacts.length
              ? 'Thử từ khóa hoặc trạng thái khác.'
              : 'Yêu cầu từ biểu mẫu liên hệ của website sẽ xuất hiện tại đây.'
          }
        />
      ) : (
        <>
          <p className="admin-count">{filtered.length} yêu cầu phù hợp</p>
          <div className="admin-contact-list">
            {filtered.map((contact) => (
              <article className="admin-contact-item" key={contact.id}>
                <div>
                  <h3>
                    {contact.name}{' '}
                    <span
                      className={`admin-pill ${contact.status === 'mới' ? '' : contact.status === 'đã xử lý' ? 'success' : 'warning'}`}
                    >
                      {contact.status === 'mới'
                        ? 'Mới'
                        : contact.status === 'đang xử lý'
                          ? 'Đang xử lý'
                          : 'Đã xử lý'}
                    </span>
                  </h3>
                  <div className="admin-contact-meta">
                    <span>{contact.phone}</span>
                    {contact.email && <span>{contact.email}</span>}
                    <time dateTime={contact.submittedAt ?? undefined}>
                      {submittedDate(contact.submittedAt)}
                    </time>
                  </div>
                  <p>{contact.note || 'Khách hàng chưa gửi nội dung yêu cầu.'}</p>
                </div>
                {canWrite && (
                  <div className="admin-form">
                    <label>
                      <span>Tiến độ xử lý</span>
                      <select
                        disabled={busyId !== null}
                        value={statusDrafts[contact.id] || contact.status}
                        onChange={(event) =>
                          setStatusDrafts({
                            ...statusDrafts,
                            [contact.id]: event.target.value as Contact['status'],
                          })
                        }
                      >
                        <option value="mới">Mới</option>
                        <option value="đang xử lý">Đang xử lý</option>
                        <option value="đã xử lý">Đã xử lý</option>
                      </select>
                    </label>
                    <div className="admin-actions">
                      <button
                        className="admin-btn compact primary"
                        disabled={
                          busyId !== null ||
                          !statusDrafts[contact.id] ||
                          statusDrafts[contact.id] === contact.status
                        }
                        onClick={() => void updateStatus(contact)}
                      >
                        {busyId === contact.id ? 'Đang lưu…' : 'Lưu trạng thái'}
                      </button>
                      <button
                        className="admin-btn compact danger"
                        disabled={busyId !== null}
                        onClick={() => {
                          setPendingDelete(contact)
                          setNotice(null)
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
