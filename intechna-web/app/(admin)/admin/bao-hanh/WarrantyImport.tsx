'use client'

import { useState, useRef } from 'react'
import { addWarrantyMonths } from '@/app/lib/warranty'
import type { ImportedWarranty } from '@/app/lib/warranty-file'
import { adminRequest, errorMessage, Notice, type AdminNotice } from '../AdminUi'

type Preview = {
  total: number
  newCount: number
  duplicateCount: number
  errorCount: number
  created: number
  issues: { row: number; kind: 'error' | 'duplicate'; message: string }[]
}
export function WarrantyImport({ onImported }: { onImported: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ImportedWarranty[]>([])
  const [filename, setFilename] = useState('')
  const [customer, setCustomer] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [term, setTerm] = useState('12')
  const [until, setUntil] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [notice, setNotice] = useState<AdminNotice>(null)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const invalidate = () => {
    setPreview(null)
    setNotice(null)
  }
  async function load(file: File) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    invalidate()
    setRows([])
    setFilename('')
    try {
      const { parseWarrantyFile } = await import('@/app/lib/warranty-file')
      const result = await parseWarrantyFile(file)
      setRows(result.records)
      setFilename(file.name)
      setPage(1)
      setNotice({
        type: 'success',
        message: `Đã đọc ${result.records.length} linh kiện. ${result.warnings.join(' ')} Kiểm tra thông tin trước khi lưu.`,
      })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  function updateRow(index: number, field: keyof ImportedWarranty, value: string) {
    invalidate()
    setRows((items) => items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }
  const expiry = term === 'custom' ? until : addWarrantyMonths(purchaseDate, Number(term))
  async function send(action: 'preview' | 'commit') {
    if (
      inFlight.current ||
      !rows.length ||
      (action === 'commit' && (!preview || preview.errorCount))
    )
      return
    inFlight.current = true
    setBusy(true)
    setNotice(null)
    try {
      const result = await adminRequest<Preview>('/api/admin/warranty/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rows: rows.map(({ systemSerial, ...item }) => ({
            ...item,
            customer: item.customer || customer.trim(),
            purchaseDate: item.purchaseDate || purchaseDate,
            warrantyUntil:
              item.warrantyUntil ||
              (term === 'custom'
                ? until
                : addWarrantyMonths(item.purchaseDate || purchaseDate, Number(term))),
            status: 'Còn bảo hành',
            note: [systemSerial ? `Serial bộ máy: ${systemSerial}` : '', item.note]
              .filter(Boolean)
              .join('\n'),
          })),
        }),
      })
      setPreview(result)
      if (action === 'commit') {
        setRows([])
        setPreview(null)
        setNotice({
          type: 'success',
          message: `Đã nhập ${result.created} linh kiện; bỏ qua ${result.duplicateCount} serial trùng.`,
        })
        await onImported()
      }
    } catch (error) {
      setPreview(null)
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <section className="admin-card admin-import">
      <div className="admin-list-heading">
        <div>
          <h2>Nhập bảo hành từ file</h2>
          <p>Mỗi linh kiện một phiếu, kèm serial bộ máy để đối chiếu.</p>
        </div>
        <button
          type="button"
          className="admin-btn"
          disabled={busy}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Thu gọn' : 'Nhập file'}
        </button>
      </div>
      {open && (
        <>
          <Notice notice={notice} />
          <fieldset className="admin-form admin-fields" disabled={busy}>
            <label>
              <span>File Word hoặc CSV</span>
              <input
                type="file"
                accept=".docx,.csv"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void load(file)
                  event.target.value = ''
                }}
              />
              <small>
                Tối đa 5 MB, 500 linh kiện. Hỗ trợ bảng serial bộ máy và bảng có cột Serial, Sản
                phẩm, Model.
              </small>
            </label>
            <a href="/templates/bao-hanh.csv" download>
              Tải mẫu CSV
            </a>
            {rows.length > 0 && (
              <>
                <p>
                  <strong>{filename}</strong> · {rows.length} linh kiện. Thông tin chung dưới đây áp
                  dụng cho ô còn trống trong file.
                </p>
                <div className="admin-field-row">
                  <label>
                    <span>Khách hàng</span>
                    <input
                      maxLength={240}
                      value={customer}
                      onChange={(event) => {
                        invalidate()
                        setCustomer(event.target.value)
                      }}
                      placeholder="Tên khách hàng / đơn vị"
                    />
                  </label>
                  <label>
                    <span>Ngày mua thực tế</span>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(event) => {
                        invalidate()
                        setPurchaseDate(event.target.value)
                      }}
                    />
                  </label>
                </div>
                <div className="admin-field-row">
                  <label>
                    <span>Thời hạn bảo hành</span>
                    <select
                      value={term}
                      onChange={(event) => {
                        invalidate()
                        setTerm(event.target.value)
                      }}
                    >
                      <option value="12">12 tháng</option>
                      <option value="24">24 tháng</option>
                      <option value="36">36 tháng</option>
                      <option value="custom">Ngày hết hạn tùy chỉnh</option>
                    </select>
                  </label>
                  <label>
                    <span>Hạn bảo hành</span>
                    <input
                      type="date"
                      min={purchaseDate || undefined}
                      value={expiry}
                      readOnly={term !== 'custom'}
                      onChange={(event) => {
                        invalidate()
                        setUntil(event.target.value)
                      }}
                    />
                  </label>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-import-table">
                    <thead>
                      <tr>
                        <th>Dòng</th>
                        <th>Serial bộ máy</th>
                        <th>Sản phẩm</th>
                        <th>Model</th>
                        <th>Serial linh kiện</th>
                        <th>Khách hàng / thời hạn riêng</th>
                        <th>Kiểm tra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice((page - 1) * pageSize, page * pageSize).map((row, offset) => {
                        const index = (page - 1) * pageSize + offset
                        const issue = preview?.issues.find((item) => item.row === index + 1)
                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{row.systemSerial || '—'}</td>
                            {(['product', 'model', 'serial'] as const).map((field) => (
                              <td key={field}>
                                <input
                                  aria-label={`${field === 'product' ? 'Sản phẩm' : field === 'model' ? 'Model' : 'Serial'} dòng ${index + 1}`}
                                  maxLength={field === 'serial' ? 128 : 240}
                                  value={row[field]}
                                  onChange={(event) => updateRow(index, field, event.target.value)}
                                />
                              </td>
                            ))}
                            <td>
                              <input
                                aria-label={`Khách hàng dòng ${index + 1}`}
                                maxLength={240}
                                value={row.customer}
                                placeholder={customer || 'Theo thông tin chung'}
                                onChange={(event) =>
                                  updateRow(index, 'customer', event.target.value)
                                }
                              />
                              <input
                                aria-label={`Ngày mua dòng ${index + 1}`}
                                type="date"
                                value={row.purchaseDate}
                                onChange={(event) =>
                                  updateRow(index, 'purchaseDate', event.target.value)
                                }
                              />
                              <input
                                aria-label={`Hạn bảo hành dòng ${index + 1}`}
                                type="date"
                                value={row.warrantyUntil}
                                onChange={(event) =>
                                  updateRow(index, 'warrantyUntil', event.target.value)
                                }
                              />
                            </td>
                            <td>
                              {issue ? (
                                <span
                                  className={`admin-pill ${issue.kind === 'error' ? 'error' : 'warning'}`}
                                >
                                  {issue.message}
                                </span>
                              ) : preview ? (
                                'Hợp lệ'
                              ) : (
                                'Chưa kiểm tra'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="admin-actions">
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Trang trước
                  </button>
                  <span>
                    Trang {page} / {Math.ceil(rows.length / pageSize)}
                  </span>
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={page * pageSize >= rows.length}
                    onClick={() => setPage(page + 1)}
                  >
                    Trang sau
                  </button>
                </div>
                {preview && (
                  <div role="status" className="admin-note">
                    <p>
                      {preview.newCount} phiếu mới · {preview.duplicateCount} serial trùng sẽ bỏ qua
                      · {preview.errorCount} dòng cần sửa.
                    </p>
                    {preview.errorCount > 0 && (
                      <p>
                        Dòng lỗi:{' '}
                        {preview.issues
                          .filter((item) => item.kind === 'error')
                          .map((item) => item.row)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                )}
                <div className="admin-actions">
                  <button className="admin-btn" type="button" onClick={() => void send('preview')}>
                    {busy ? 'Đang xử lý…' : 'Kiểm tra dữ liệu'}
                  </button>
                  <button
                    className="admin-btn primary"
                    type="button"
                    disabled={!preview || preview.errorCount > 0 || preview.newCount === 0}
                    onClick={() => void send('commit')}
                  >
                    Xác nhận nhập {preview?.newCount ?? 0} linh kiện
                  </button>
                </div>
              </>
            )}
          </fieldset>
        </>
      )}
    </section>
  )
}
