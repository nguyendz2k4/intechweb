'use client'

import { useEffect, useState } from 'react'

type WarrantyRecord = {
  id?: number
  code: string
  serial: string
  customer: string
  product: string
  purchaseDate: string | null
  warrantyUntil: string | null
  status: string | null
  note: string | null
}

const getTodayString = () => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

const getNextYearString = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export function WarrantyAdminClient() {
  // Form state
  const [serial, setSerial] = useState('')
  const [customer, setCustomer] = useState('')
  const [product, setProduct] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(getTodayString())
  const [warrantyUntil, setWarrantyUntil] = useState(getNextYearString())
  const [status, setStatus] = useState('Còn bảo hành')
  const [note, setNote] = useState('')

  // List & filtering state
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' })

  // Fetch warranties on load
  const fetchWarranties = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/warranty')
      if (res.ok) {
        const data = await res.json()
        setWarranties(data)
      }
    } catch (error) {
      console.error('Không tải được danh sách bảo hành:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarranties()
  }, [])

  // Handle form submission
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serial.trim() || !customer.trim() || !product.trim()) {
      setSubmitStatus({ type: 'error', message: 'Vui lòng điền đầy đủ các trường bắt buộc' })
      return
    }

    setSubmitStatus({ type: '', message: 'Đang kích hoạt...' })

    try {
      const res = await fetch('/api/admin/warranty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serial: serial.trim(),
          customer: customer.trim(),
          product: product.trim(),
          purchaseDate,
          warrantyUntil,
          status,
          note: note.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitStatus({
          type: 'success',
          message: `Kích hoạt thành công! Mã bảo hành tự động tạo: ${data.code}`,
        })
        // Reset form inputs except defaults
        setSerial('')
        setCustomer('')
        setProduct('')
        setNote('')
        // Refresh list
        fetchWarranties()
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Đã xảy ra lỗi khi kích hoạt bảo hành',
        })
      }
    } catch (error: any) {
      setSubmitStatus({
        type: 'error',
        message: 'Lỗi kết nối server: ' + error.message,
      })
    }
  }

  // Filter list by search query
  const filteredWarranties = warranties.filter((item) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      item.code.toLowerCase().includes(q) ||
      item.serial.toLowerCase().includes(q) ||
      item.customer.toLowerCase().includes(q) ||
      item.product.toLowerCase().includes(q) ||
      (item.note && item.note.toLowerCase().includes(q))
    )
  })

  return (
    <div className="admin-split">
      {/* Cột 1: Form kích hoạt */}
      <section className="admin-card">
        <h2>Kích hoạt bảo hành mới</h2>
        <form onSubmit={handleActivate} className="admin-form">
          <label>
            <span>Mã bảo hành</span>
            <input
              type="text"
              disabled
              value="Tự động sinh bởi hệ thống (Dạng INTECH-YYYY-XXXX)"
              style={{ background: 'var(--soft)', color: 'var(--muted)', cursor: 'not-allowed', fontStyle: 'italic' }}
            />
          </label>

          <label>
            <span>Số Serial thiết bị *</span>
            <input
              type="text"
              required
              placeholder=""
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
            />
          </label>

          <label>
            <span>Sản phẩm / Model *</span>
            <input
              type="text"
              required
              placeholder=""
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
          </label>

          <label>
            <span>Khách hàng mua hàng *</span>
            <input
              type="text"
              required
              placeholder=""
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              <span>Ngày mua</span>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </label>

            <label>
              <span>Hạn bảo hành</span>
              <input
                type="date"
                value={warrantyUntil}
                onChange={(e) => setWarrantyUntil(e.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Trạng thái bảo hành</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Còn bảo hành">Còn bảo hành</option>
              <option value="Bảo hành đặc biệt">Bảo hành đặc biệt</option>
            </select>
          </label>

          <label>
            <span>Ghi chú bổ sung</span>
            <textarea
              placeholder="Ví dụ: Hỗ trợ cấu hình từ xa, bảo hành phần cứng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ minHeight: '80px' }}
            />
          </label>

          <button className="admin-btn primary" type="submit">
            Kích hoạt bảo hành
          </button>

          {submitStatus.message && (
            <div
              className="admin-note"
              style={{
                borderColor: submitStatus.type === 'error' ? '#ef4444' : '#10b981',
                background: submitStatus.type === 'error' ? '#fef2f2' : '#f0fdf4',
                color: submitStatus.type === 'error' ? '#991b1b' : '#166534',
                marginTop: '12px',
              }}
            >
              {submitStatus.message}
            </div>
          )}
        </form>
      </section>

      {/* Cột 2: Bảng danh sách chỉ đọc */}
      <section className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Danh sách đã kích hoạt</h2>
          <span className="admin-pill">{filteredWarranties.length} bản ghi</span>
        </div>

        <div className="admin-form" style={{ marginBottom: '18px' }}>
          <label>
            <span>Tìm kiếm nhanh</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Mã BH, Serial, Khách hàng, Sản phẩm..."
            />
          </label>
        </div>

        {loading && warranties.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Đang tải dữ liệu...</p>
        ) : filteredWarranties.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px' }}>Không tìm thấy bản ghi bảo hành nào.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã BH</th>
                  <th>Sản phẩm / Khách hàng</th>
                  <th>Số Serial</th>
                  <th>Hạn bảo hành</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarranties.map((item) => (
                  <tr key={item.code}>
                    <td style={{ verticalAlign: 'top' }}>
                      <strong style={{ color: 'var(--blue-dark)' }}>{item.code}</strong>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800 }}>{item.product}</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                        KH: {item.customer}
                      </div>
                      {item.note && (
                        <div style={{ fontSize: '12px', color: 'var(--muted-light)', fontStyle: 'italic', marginTop: '4px' }}>
                          * {item.note}
                        </div>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <code style={{ fontSize: '13px', background: 'var(--sky)', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.serial}
                      </code>
                    </td>
                    <td style={{ verticalAlign: 'top', fontSize: '13px' }}>
                      Mua: {item.purchaseDate || 'N/A'}
                      <br />
                      Đến: {item.warrantyUntil || 'N/A'}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <span
                        className="admin-pill"
                        style={{
                          background: item.status === 'Còn bảo hành' ? '#f0fdf4' : item.status === 'Hết hạn' ? '#fef2f2' : '#fef8e7',
                          color: item.status === 'Còn bảo hành' ? '#166534' : item.status === 'Hết hạn' ? '#991b1b' : '#b45309',
                          fontSize: '11px',
                          border: `1px solid ${
                            item.status === 'Còn bảo hành' ? '#bbf7d0' : item.status === 'Hết hạn' ? '#fecaca' : '#fef08a'
                          }`,
                        }}
                      >
                        {item.status || 'Chưa rõ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
