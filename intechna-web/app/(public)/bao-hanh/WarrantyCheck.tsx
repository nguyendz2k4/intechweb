'use client'

import { useEffect, useState } from 'react'

type WarrantyResult = {
  code: string
  serial: string
  customer: string
  product: string
  purchaseDate: string | null
  warrantyUntil: string | null
  status: string | null
  note: string | null
} | null

export function WarrantyCheck() {
  const [keyword, setKeyword]   = useState('')
  const [result, setResult]     = useState<WarrantyResult>(undefined as unknown as WarrantyResult)
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!keyword.trim()) {
      setResult(undefined as unknown as WarrantyResult)
      setSearched(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/warranty?q=${encodeURIComponent(keyword.trim())}`)
        const data = await res.json()
        setResult(data)
        setSearched(true)
      } catch {
        setResult(null)
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [keyword])

  return (
    <section className="warranty-panel card">
      <div>
        <p className="eyebrow">Tra cứu nhanh</p>
        <h2>Nhập mã bảo hành hoặc serial thiết bị</h2>
        <p>Nhập mã bảo hành, số serial, tên khách hàng hoặc tên sản phẩm. Kết quả sẽ hiện ngay sau khi nhập.</p>
      </div>
      <div className="warranty-form">
        <input
          aria-label="Mã bảo hành hoặc serial"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Ví dụ: INTECH-2026-0001 hoặc FGT60F3G26ABC001"
        />
        {loading && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Đang tra cứu...</span>}
      </div>
      {searched && (
        result ? (
          <div className="warranty-result success">
            <strong>{result.status ?? 'Còn bảo hành'}</strong>
            <p><b>Sản phẩm:</b> {result.product}</p>
            <p><b>Khách hàng:</b> {result.customer}</p>
            <p><b>Mã bảo hành:</b> {result.code}</p>
            <p><b>Serial:</b> {result.serial}</p>
            <p><b>Ngày mua:</b> {result.purchaseDate}</p>
            <p><b>Bảo hành đến:</b> {result.warrantyUntil}</p>
            {result.note && <p>{result.note}</p>}
          </div>
        ) : (
          <div className="warranty-result">
            <strong>Chưa tìm thấy thông tin</strong>
            <p>Vui lòng kiểm tra lại mã/serial hoặc liên hệ Intech để nhân sự kỹ thuật tra cứu thủ công.</p>
          </div>
        )
      )}
    </section>
  )
}

