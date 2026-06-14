'use client'

import { useMemo, useState } from 'react'
import { warrantyRecords } from '@/app/data'

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function WarrantyCheck() {
  const [keyword, setKeyword] = useState('')
  const query = normalize(keyword)
  const result = useMemo(() => {
    if (!query) return null
    return warrantyRecords.find((item) =>
      [item.code, item.serial, item.customer, item.product].some((value) => normalize(value).includes(query)),
    )
  }, [query])

  return (
    <section className="warranty-panel card">
      <div>
        <p className="eyebrow">Tra cứu nhanh</p>
        <h2>Nhập mã bảo hành hoặc serial thiết bị</h2>
        <p>Hệ thống demo đang dùng dữ liệu mẫu. Khi triển khai thật, module này có thể nối database/API để khách hàng tự kiểm tra trạng thái bảo hành.</p>
      </div>
      <div className="warranty-form">
        <input
          aria-label="Mã bảo hành hoặc serial"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="VD: INTECH-2026-0001 hoặc FGT60F3G26ABC001"
        />
        <button className="btn primary" type="button">Kiểm tra bảo hành</button>
      </div>
      {query && (
        result ? (
          <div className="warranty-result success">
            <strong>{result.status}</strong>
            <p><b>Sản phẩm:</b> {result.product}</p>
            <p><b>Khách hàng:</b> {result.customer}</p>
            <p><b>Mã bảo hành:</b> {result.code}</p>
            <p><b>Serial:</b> {result.serial}</p>
            <p><b>Ngày mua:</b> {result.purchaseDate}</p>
            <p><b>Bảo hành đến:</b> {result.warrantyUntil}</p>
            <p>{result.note}</p>
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
