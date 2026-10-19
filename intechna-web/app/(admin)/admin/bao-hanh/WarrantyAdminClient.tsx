'use client'

import { WarrantyImport } from './WarrantyImport'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  displayWarrantyCode,
  addWarrantyMonths,
  adminWarrantyRecord,
  formatWarrantyDate,
  warrantyStatusForEditing,
} from '@/app/lib/warranty'
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

type WarrantyRecord = {
  id?: number
  code: string
  serial: string
  customer: string
  model?: string | null
  product: string
  purchaseDate: string | null
  warrantyUntil: string | null
  status: string | null
  storedStatus?: string | null
  note: string | null
}
type WarrantyTerm = '12' | '24' | '36' | 'custom'

function todayString() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-')
}

export function WarrantyAdminClient() {
  const canWrite = useAdminPermission('warranty:write')
  const [serial, setSerial] = useState('')
  const [customer, setCustomer] = useState('')
  const [product, setProduct] = useState('')
  const [model, setModel] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayString)
  const [warrantyUntil, setWarrantyUntil] = useState(() => addWarrantyMonths(todayString(), 12))
  const [term, setTerm] = useState<WarrantyTerm>('12')
  const [status, setStatus] = useState('Còn bảo hành')
  const [note, setNote] = useState('')
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WarrantyRecord | null>(null)
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<'save' | 'delete' | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [notice, setNotice] = useState<AdminNotice>(null)
  const editorHeading = useRef<HTMLHeadingElement>(null)
  const deleteConfirmation = useRef<HTMLDivElement>(null)
  const deleteTrigger = useRef<HTMLButtonElement | null>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const busy = busyAction !== null

  const loadWarrantyRecords = useCallback(
    (signal?: AbortSignal) =>
      adminRequest<WarrantyRecord[]>('/api/admin/warranty', { signal })
        .then((data) => {
          if (signal?.aborted) return
          if (!Array.isArray(data)) throw new Error('Danh sách bảo hành không hợp lệ.')
          setWarranties(data)
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
    void loadWarrantyRecords(controller.signal)
    return () => controller.abort()
  }, [loadWarrantyRecords])
  useEffect(() => {
    if (editingCode) {
      editorHeading.current?.focus()
    }
  }, [editingCode])
  useEffect(() => {
    if (pendingDelete) deleteConfirmation.current?.focus()
  }, [pendingDelete])

  function fetchWarranties() {
    setLoading(true)
    setLoadFailed(false)
    return loadWarrantyRecords()
  }

  function resetForm() {
    const today = todayString()
    setEditingCode(null)
    setSerial('')
    setCustomer('')
    setProduct('')
    setModel('')
    setPurchaseDate(today)
    setWarrantyUntil(addWarrantyMonths(today, 12))
    setTerm('12')
    setStatus('Còn bảo hành')
    setNote('')
  }

  function editWarranty(item: WarrantyRecord) {
    if (busy || !canWrite) return
    setPendingDelete(null)
    setNotice(null)
    setEditingCode(item.code)
    setSerial(item.serial)
    setCustomer(item.customer)
    setProduct(item.product)
    setModel(item.model ?? '')
    setPurchaseDate(item.purchaseDate || '')
    setWarrantyUntil(item.warrantyUntil || '')
    setTerm(
      (['12', '24', '36'] as const).find(
        (months) =>
          item.purchaseDate &&
          item.warrantyUntil &&
          addWarrantyMonths(item.purchaseDate, Number(months)) === item.warrantyUntil,
      ) || 'custom',
    )
    setStatus(warrantyStatusForEditing(item))
    setNote(item.note || '')
    // Also focus when the user selects the row already being edited.
    editorHeading.current?.focus()
  }

  function changePurchaseDate(value: string) {
    setPurchaseDate(value)
    if (term !== 'custom') setWarrantyUntil(addWarrantyMonths(value, Number(term)))
  }

  function changeTerm(value: WarrantyTerm) {
    setTerm(value)
    if (value !== 'custom') setWarrantyUntil(addWarrantyMonths(purchaseDate, Number(value)))
  }

  async function saveWarranty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || pendingDelete || !canWrite) return
    if (warrantyUntil && purchaseDate && warrantyUntil < purchaseDate) {
      setNotice({ type: 'error', message: 'Hạn bảo hành phải bằng hoặc sau ngày mua.' })
      return
    }
    setBusyAction('save')
    setNotice(null)
    try {
      const data = await adminRequest<WarrantyRecord>('/api/admin/warranty', {
        method: editingCode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingCode ? { code: editingCode } : {}),
          serial: serial.trim(),
          customer: customer.trim(),
          product: product.trim(),
          model: model.trim(),
          purchaseDate,
          warrantyUntil,
          status,
          note: note.trim(),
        }),
      })
      setWarranties((items) =>
        editingCode
          ? items.map((item) => (item.code === editingCode ? data : item))
          : [data, ...items],
      )
      setNotice({
        type: 'success',
        message: `${editingCode ? 'Đã cập nhật' : 'Đã thêm'} hồ sơ bảo hành. Mã hồ sơ: ${displayWarrantyCode(data.code)}`,
      })
      resetForm()
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  async function deleteWarranty() {
    if (!pendingDelete || busy || !canWrite) return
    const item = pendingDelete
    setBusyAction('delete')
    setNotice(null)
    try {
      await adminRequest('/api/admin/warranty', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: item.code }),
      })
      setWarranties((items) => items.filter((record) => record.code !== item.code))
      if (editingCode === item.code) resetForm()
      setPendingDelete(null)
      setNotice({
        type: 'success',
        message: `Đã xóa hồ sơ bảo hành ${displayWarrantyCode(item.code)}.`,
      })
      searchInput.current?.focus()
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  const previewStatus = adminWarrantyRecord({ warrantyUntil: warrantyUntil || null, status }).status
  const filtered = warranties.filter((item) =>
    [
      item.code,
      displayWarrantyCode(item.code),
      item.serial,
      item.customer,
      item.product,
      item.model,
      item.note,
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  )

  return (
    <>
      <Notice notice={notice} />
      {canWrite && <WarrantyImport onImported={fetchWarranties} />}
      <div className={canWrite ? 'admin-split' : undefined}>
        {canWrite && (
          <section className="admin-card">
            <h2 ref={editorHeading} tabIndex={-1}>
              {editingCode ? 'Sửa hồ sơ bảo hành' : 'Thêm hồ sơ bảo hành'}
            </h2>
            <p className="admin-warranty-help" id="warranty-history-help">
              Nhập ngày mua thực tế, kể cả sản phẩm đã mua từ năm 2024. Hồ sơ đã hết hạn vẫn có thể
              lưu và tra cứu.
            </p>
            <form
              className="admin-form"
              onSubmit={saveWarranty}
              aria-describedby="warranty-history-help"
              aria-busy={busyAction === 'save'}
            >
              <fieldset className="admin-form admin-fields" disabled={busy || !!pendingDelete}>
                <label>
                  <span>Mã bảo hành</span>
                  <input
                    readOnly
                    value={editingCode ? displayWarrantyCode(editingCode) : 'Tự tạo khi thêm hồ sơ'}
                  />
                  <small>
                    {editingCode
                      ? 'Mã hồ sơ được giữ nguyên khi chỉnh sửa.'
                      : 'Mã hồ sơ có dạng INT-C9B9CA2FE18A, không kèm năm.'}
                  </small>
                </label>
                <label>
                  <span>Số serial thiết bị *</span>
                  <input
                    required
                    minLength={6}
                    maxLength={128}
                    value={serial}
                    onChange={(event) => setSerial(event.target.value)}
                  />
                </label>
                <label>
                  <span>Sản phẩm *</span>
                  <input
                    required
                    maxLength={200}
                    value={product}
                    onChange={(event) => setProduct(event.target.value)}
                  />
                </label>
                <label>
                  <span>Model</span>
                  <input
                    maxLength={240}
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder="Ví dụ: H610M H V3 DDR4"
                  />
                </label>
                <label>
                  <span>Khách hàng *</span>
                  <input
                    required
                    maxLength={200}
                    value={customer}
                    onChange={(event) => setCustomer(event.target.value)}
                  />
                </label>
                <label>
                  <span>Ngày mua thực tế *</span>
                  <input
                    required
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => changePurchaseDate(event.target.value)}
                  />
                </label>
                <label>
                  <span>Thời hạn tính từ ngày mua</span>
                  <select
                    value={term}
                    onChange={(event) => changeTerm(event.target.value as WarrantyTerm)}
                  >
                    <option value="12">12 tháng</option>
                    <option value="24">24 tháng</option>
                    <option value="36">36 tháng</option>
                    <option value="custom">Tùy chỉnh ngày hết hạn</option>
                  </select>
                </label>
                <label>
                  <span>Hạn bảo hành thực tế *</span>
                  <input
                    required
                    min={purchaseDate || undefined}
                    type="date"
                    value={warrantyUntil}
                    onChange={(event) => {
                      setWarrantyUntil(event.target.value)
                      setTerm('custom')
                    }}
                  />
                  <small>
                    Chọn thời hạn để tự tính từ ngày mua, hoặc nhập ngày hết hạn theo phiếu bảo
                    hành.
                  </small>
                </label>
                <label>
                  <span>Trạng thái bảo hành</span>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="Còn bảo hành">Tự động theo ngày hết hạn</option>
                    <option value="Bảo hành đặc biệt">Bảo hành đặc biệt</option>
                    <option value="Hết hạn">Đánh dấu hết hạn</option>
                  </select>
                  <small role="status">
                    Trạng thái hiện tại: <strong>{previewStatus}</strong>.
                  </small>
                </label>
                <label>
                  <span>Ghi chú nội bộ</span>
                  <textarea
                    maxLength={3000}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Thông tin hỗ trợ hoặc lưu ý của hồ sơ."
                  />
                </label>
                <div className="admin-actions">
                  <button
                    className="admin-btn primary"
                    disabled={busy || loading || loadFailed}
                    type="submit"
                  >
                    {busyAction === 'save'
                      ? 'Đang lưu…'
                      : editingCode
                        ? 'Lưu thay đổi'
                        : 'Thêm hồ sơ bảo hành'}
                  </button>
                  {editingCode && (
                    <button className="admin-btn" type="button" onClick={resetForm}>
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
              <h2>Danh sách hồ sơ bảo hành</h2>
              <p>
                {loading
                  ? 'Đang tải cơ sở dữ liệu…'
                  : loadFailed
                    ? 'Chưa tải được dữ liệu'
                    : `${warranties.length} hồ sơ trong cơ sở dữ liệu`}
              </p>
            </div>
          </div>
          {pendingDelete && (
            <div ref={deleteConfirmation} tabIndex={-1}>
              <DeleteConfirmation
                name={`hồ sơ ${pendingDelete.code} · ${pendingDelete.product}`}
                busy={busy}
                onCancel={() => {
                  setPendingDelete(null)
                  requestAnimationFrame(() => deleteTrigger.current?.focus())
                }}
                onConfirm={() => void deleteWarranty()}
              />
            </div>
          )}
          <div className="admin-form">
            <label>
              <span>Tìm hồ sơ</span>
              <input
                ref={searchInput}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Mã bảo hành, serial, khách hàng…"
              />
            </label>
          </div>
          {loading ? (
            <LoadingRows />
          ) : loadFailed ? (
            <div className="admin-actions">
              <button
                className="admin-btn"
                onClick={() => {
                  setNotice(null)
                  void fetchWarranties()
                }}
              >
                Tải lại danh sách
              </button>
            </div>
          ) : !filtered.length ? (
            <EmptyState
              title={warranties.length ? 'Không tìm thấy hồ sơ' : 'Chưa có hồ sơ bảo hành'}
              text={
                warranties.length
                  ? 'Thử tìm theo mã bảo hành hoặc số serial.'
                  : 'Hồ sơ mới sẽ xuất hiện sau khi thêm thành công.'
              }
            />
          ) : (
            <>
              <p className="admin-count">{filtered.length} hồ sơ phù hợp</p>
              <div className="admin-table-wrap">
                <table className="admin-table admin-warranty-table">
                  <thead>
                    <tr>
                      <th>Mã / serial</th>
                      <th>Sản phẩm / khách hàng</th>
                      <th>Thời hạn</th>
                      <th>Trạng thái</th>
                      {canWrite && <th>Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.code}>
                        <td>
                          <strong className="admin-code">{displayWarrantyCode(item.code)}</strong>
                          <small className="admin-code">{item.serial}</small>
                        </td>
                        <td>
                          <strong>{item.product}</strong>
                          {item.model && <small>Model: {item.model}</small>}
                          <small>{item.customer}</small>
                          {item.note && <small>{item.note}</small>}
                        </td>
                        <td>
                          <small>Mua: {formatWarrantyDate(item.purchaseDate)}</small>
                          <small>Đến: {formatWarrantyDate(item.warrantyUntil)}</small>
                        </td>
                        <td>
                          <span
                            className={`admin-pill ${item.status === 'Còn bảo hành' ? 'success' : item.status === 'Hết hạn' ? 'error' : 'warning'}`}
                          >
                            {item.status || 'Chưa có'}
                          </span>
                        </td>
                        {canWrite && (
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-btn compact"
                                disabled={busy || !!pendingDelete}
                                type="button"
                                aria-label={`Sửa hồ sơ ${displayWarrantyCode(item.code)}`}
                                onClick={() => editWarranty(item)}
                              >
                                Sửa
                              </button>
                              <button
                                className="admin-btn compact danger"
                                disabled={busy || !!pendingDelete}
                                type="button"
                                aria-label={`Xóa hồ sơ ${displayWarrantyCode(item.code)}`}
                                onClick={(event) => {
                                  deleteTrigger.current = event.currentTarget
                                  setNotice(null)
                                  setPendingDelete(item)
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}
