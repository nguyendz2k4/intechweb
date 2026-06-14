import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA } from '@/app/components'
import { siteConfig } from '@/app/data'

export const metadata: Metadata = {
  title: 'Liên hệ Intech tư vấn thi công mạng LAN, WiFi, firewall tại Nghệ An',
  description: 'Liên hệ Intech để được tư vấn thi công mạng LAN/WAN, firewall, WiFi doanh nghiệp, server, camera và bảo trì hệ thống tại Nghệ An.',
  alternates: { canonical: '/lien-he' },
}

const checklist = ['Loại công trình: văn phòng, nhà xưởng, bệnh viện/phòng khám, trường học, khách sạn...', 'Số lượng người dùng, máy tính, camera, access point dự kiến', 'Hiện trạng Internet, switch, router, firewall, tủ rack đang có', 'Yêu cầu WiFi khách/nội bộ, VPN, bảo mật, camera, lưu trữ', 'Thời gian cần triển khai và ngân sách dự kiến nếu có']

export default function ContactPage() {
  return (
    <main>
      <Breadcrumbs current="Liên hệ" />
      <section className="section split">
        <div>
          <p className="eyebrow">Liên hệ</p>
          <h1>Trao đổi nhu cầu để Intech đề xuất phương án phù hợp</h1>
          <p className="lead">Ông/bà chỉ cần mô tả ngắn hiện trạng và mục tiêu triển khai. Intech sẽ hỗ trợ rà soát nhu cầu, gợi ý cấu hình, danh mục thiết bị và phương án thi công phù hợp.</p>
          <div className="actions">
            <Link className="btn primary" href={`tel:${siteConfig.phone}`}>Gọi {siteConfig.phoneDisplay}</Link>
            <Link className="btn secondary" href={`mailto:${siteConfig.email}`}>Gửi email</Link>
          </div>
        </div>
        <div className="card">
          <h2>{siteConfig.shortName}</h2>
          <p><strong>Điện thoại:</strong> <Link href={`tel:${siteConfig.phone}`}>{siteConfig.phoneDisplay}</Link></p>
          <p><strong>Email:</strong> <Link href={`mailto:${siteConfig.email}`}>{siteConfig.email}</Link></p>
          <p><strong>Địa chỉ:</strong> {siteConfig.address}</p>
          <p><strong>Khu vực phục vụ:</strong> Nghệ An và các tỉnh lân cận theo quy mô dự án.</p>
        </div>
      </section>
      <section className="section surface split">
        <div><p className="eyebrow">Gửi yêu cầu nhanh</p><h2>Nên chuẩn bị thông tin gì để được tư vấn sát hơn?</h2></div>
        <ul className="list">{checklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <CTA />
    </main>
  )
}
