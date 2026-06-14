import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA, FAQSection } from '@/app/components'
import { handoverItems, servicePages, siteConfig, solutionPages } from '@/app/data'

export const metadata: Metadata = {
  title: 'Yêu cầu báo giá thi công mạng LAN, WiFi, firewall, camera',
  description: 'Gửi yêu cầu báo giá thi công mạng LAN, WiFi doanh nghiệp, firewall, camera, NAS và hạ tầng CNTT. Intech tư vấn cấu hình theo hiện trạng thực tế.',
  alternates: { canonical: '/bao-gia' },
}

const quickInfo = [
  'Loại công trình: văn phòng, nhà xưởng, bệnh viện/phòng khám, trường học, khách sạn...',
  'Số lượng người dùng, máy tính, camera, máy in, access point dự kiến.',
  'Diện tích/số tầng/số khu vực cần kéo mạng hoặc phủ WiFi.',
  'Thiết bị đang có: router, switch, firewall, WiFi, tủ rack, camera, NAS/server.',
  'Nhu cầu đặc biệt: tách VLAN, WiFi khách, VPN, camera, backup dữ liệu, bảo mật truy cập.',
  'Thời gian cần triển khai và ngân sách dự kiến nếu có.',
]

const packages = [
  { title: 'Gói khảo sát nhanh', desc: 'Phù hợp văn phòng nhỏ hoặc nhu cầu nâng cấp thiết bị đơn giản.', items: ['Rà soát hiện trạng', 'Tư vấn danh mục thiết bị', 'Ước lượng vật tư/chi phí', 'Gợi ý phương án triển khai'] },
  { title: 'Gói thiết kế & thi công', desc: 'Phù hợp dự án cần triển khai mạng LAN/WiFi/firewall từ đầu.', items: ['Sơ đồ mạng và tủ rack', 'Danh mục thiết bị/vật tư', 'Thi công, cấu hình, test line', 'Nghiệm thu và bàn giao tài liệu'] },
  { title: 'Gói bảo trì định kỳ', desc: 'Phù hợp doanh nghiệp đã có hệ thống và muốn giảm downtime.', items: ['Kiểm tra switch/router/firewall/WiFi', 'Backup cấu hình', 'Rà soát log/cảnh báo', 'Báo cáo khuyến nghị tối ưu'] },
]

export default function QuotePage() {
  return (
    <main>
      <Breadcrumbs current="Yêu cầu báo giá" />
      <section className="section split">
        <div>
          <p className="eyebrow">Báo giá & tư vấn cấu hình</p>
          <h1>Gửi nhu cầu để Intech đề xuất phương án hạ tầng mạng phù hợp</h1>
          <p className="lead">Intech ưu tiên báo giá theo hiện trạng thực tế: số lượng người dùng, mặt bằng, yêu cầu bảo mật, WiFi, camera, server/NAS và khả năng mở rộng.</p>
          <div className="actions">
            <Link className="btn primary" href={`tel:${siteConfig.phone}`}>Gọi {siteConfig.phoneDisplay}</Link>
            <Link className="btn secondary" href={`mailto:${siteConfig.email}`}>Gửi email yêu cầu</Link>
          </div>
        </div>
        <div className="quote-box">
          <p className="eyebrow">Thông tin liên hệ</p>
          <h2>{siteConfig.shortName}</h2>
          <p><strong>Điện thoại:</strong> {siteConfig.phoneDisplay}</p>
          <p><strong>Email:</strong> {siteConfig.email}</p>
          <p><strong>Địa chỉ:</strong> {siteConfig.address}</p>
        </div>
      </section>
      <section className="section surface split">
        <div><p className="eyebrow">Checklist</p><h2>Thông tin nên gửi để báo giá sát hơn</h2></div>
        <ul className="list">{quickInfo.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="section">
        <div className="heading"><p className="eyebrow">Gói tư vấn</p><h2>Chọn cách làm theo mức độ sẵn sàng của dự án</h2></div>
        <div className="cards">{packages.map((pack) => <article className="card" key={pack.title}><h3>{pack.title}</h3><p>{pack.desc}</p><ul className="list">{pack.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
      </section>
      <section className="section surface">
        <div className="heading"><p className="eyebrow">Lối tắt</p><h2>Chưa rõ chọn dịch vụ hay giải pháp nào?</h2></div>
        <div className="cards">
          {servicePages.slice(0, 3).map((service) => <article className="card" key={service.slug}><h3>{service.title}</h3><p>{service.description}</p><Link href={`/dich-vu/${service.slug}`}>Xem dịch vụ</Link></article>)}
          {solutionPages.slice(0, 3).map((solution) => <article className="card" key={solution.slug}><h3>{solution.title}</h3><p>{solution.description}</p><Link href={`/giai-phap/${solution.slug}`}>Xem giải pháp</Link></article>)}
        </div>
      </section>
      <section className="section split">
        <div><p className="eyebrow">Sau báo giá</p><h2>Nếu triển khai, cần chốt rõ hạng mục bàn giao ngay từ đầu</h2></div>
        <ul className="list">{handoverItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <FAQSection />
      <CTA />
    </main>
  )
}
