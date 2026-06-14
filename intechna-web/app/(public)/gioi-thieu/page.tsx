import type { Metadata } from 'next'
import { Breadcrumbs, CTA, FAQSection } from '@/app/components'

export const metadata: Metadata = {
  title: 'Giới thiệu Intech | Công ty thi công hạ tầng mạng tại Nghệ An',
  description: 'Intech tư vấn, thiết kế, thi công mạng LAN/WAN, WiFi doanh nghiệp, firewall, camera, server và bảo trì hạ tầng CNTT cho doanh nghiệp tại Nghệ An.',
  alternates: { canonical: '/gioi-thieu' },
}

const values = [
  { title: 'Khảo sát kỹ trước khi báo giải pháp', desc: 'Intech ưu tiên hiểu hiện trạng, số lượng người dùng, mặt bằng, ứng dụng quan trọng và ngân sách trước khi đề xuất thiết bị.' },
  { title: 'Thiết kế rõ để dễ vận hành', desc: 'Hệ thống được chia vùng mạng, đánh nhãn dây/cổng, lập sơ đồ tủ rack, IP plan và tài liệu cấu hình để đội vận hành dễ tiếp quản.' },
  { title: 'Thi công gọn, nghiệm thu có checklist', desc: 'Quá trình triển khai tập trung vào độ ổn định, thẩm mỹ tủ rack, test line, kiểm tra WiFi/firewall/switch và bàn giao rõ ràng.' },
]

const capabilities = ['Thi công mạng LAN/WAN văn phòng, nhà xưởng, bệnh viện/phòng khám', 'Triển khai WiFi doanh nghiệp, roaming, controller/cloud, captive portal', 'Cấu hình firewall, VPN, policy bảo mật, tách VLAN', 'Cung cấp switch, router, firewall, AP, NAS, module quang và phụ kiện hạ tầng', 'Bảo trì hệ thống mạng định kỳ, backup cấu hình, rà soát log và tối ưu vận hành']

export default function AboutPage() {
  return (
    <main>
      <Breadcrumbs current="Giới thiệu" />
      <section className="section split">
        <div>
          <p className="eyebrow">Giới thiệu</p>
          <h1>Intech xây dựng hạ tầng mạng ổn định, bảo mật và dễ vận hành</h1>
        </div>
        <p>Intech tập trung vào các giải pháp mạng LAN/WAN, thiết bị mạng, firewall, WiFi doanh nghiệp, server, camera và bảo trì hệ thống. Cách làm của Intech là khảo sát kỹ, thiết kế rõ, triển khai gọn, bàn giao có tài liệu và hỗ trợ sau nghiệm thu.</p>
      </section>
      <section className="section surface">
        <div className="heading"><p className="eyebrow">Cách làm</p><h2>Không chỉ bán thiết bị — Intech bán một hệ thống có thể vận hành lâu dài</h2></div>
        <div className="cards">{values.map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.desc}</p></article>)}</div>
      </section>
      <section className="section split">
        <div><p className="eyebrow">Năng lực</p><h2>Các hạng mục Intech có thể đồng hành cùng doanh nghiệp</h2></div>
        <ul className="list">{capabilities.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="section surface">
        <div className="heading"><p className="eyebrow">Quy trình</p><h2>Quy trình làm việc rõ ràng từ khảo sát đến bảo trì</h2></div>
        <div className="cards">
          {['Khảo sát hiện trạng', 'Thiết kế giải pháp', 'Cung cấp thiết bị/vật tư', 'Thi công và cấu hình', 'Nghiệm thu và bàn giao', 'Bảo trì và tối ưu'].map((step, index) => <article className="card" key={step}><p className="eyebrow">Bước {index + 1}</p><h3>{step}</h3><p>Mỗi bước đều hướng đến mục tiêu giảm lỗi phát sinh, kiểm soát chi phí và giúp hệ thống dễ quản trị sau bàn giao.</p></article>)}
        </div>
      </section>
      <FAQSection />
      <CTA />
    </main>
  )
}
