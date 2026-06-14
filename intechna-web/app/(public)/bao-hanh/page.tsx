import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA } from '@/app/components'
import { siteConfig } from '@/app/data'
import { WarrantyCheck } from './WarrantyCheck'

export const metadata: Metadata = {
  title: 'Tra cứu bảo hành thiết bị mạng Intech',
  description: 'Tra cứu bảo hành thiết bị mạng, firewall, switch, WiFi, server và camera do Intech cung cấp, hỗ trợ kiểm tra theo mã bảo hành hoặc serial.',
  alternates: { canonical: '/bao-hanh' },
}

const steps = [
  'Nhập mã bảo hành, serial hoặc tên khách hàng đã đăng ký khi mua thiết bị.',
  'Kiểm tra thời hạn bảo hành, thông tin sản phẩm và ghi chú hỗ trợ kỹ thuật.',
  'Nếu chưa có dữ liệu, gửi hình tem/serial để Intech xác minh thủ công.',
]

export default function WarrantyPage() {
  return (
    <main>
      <Breadcrumbs current="Bảo hành" />
      <section className="section split">
        <div>
          <p className="eyebrow">Check bảo hành</p>
          <h1>Tra cứu bảo hành thiết bị do Intech cung cấp</h1>
          <p className="lead">Khách hàng có thể kiểm tra nhanh trạng thái bảo hành theo mã phiếu, serial thiết bị hoặc thông tin đăng ký. Module hiện là bản giao diện + dữ liệu mẫu, sẵn sàng nối dữ liệu thật khi cần.</p>
          <div className="actions">
            <Link className="btn primary" href={`tel:${siteConfig.phone}`}>Gọi {siteConfig.phoneDisplay}</Link>
            <Link className="btn secondary" href="/lien-he">Gửi yêu cầu hỗ trợ</Link>
          </div>
        </div>
        <WarrantyCheck />
      </section>
      <section className="section surface">
        <div className="heading">
          <p className="eyebrow">Quy trình hỗ trợ</p>
          <h2>Thông tin cần có khi yêu cầu bảo hành</h2>
        </div>
        <div className="timeline-grid">{steps.map((step, index) => <article className="timeline-card" key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></article>)}</div>
      </section>
      <CTA />
    </main>
  )
}
