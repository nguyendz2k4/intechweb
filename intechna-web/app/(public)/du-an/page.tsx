import type { Metadata } from 'next'
import { Breadcrumbs, CTA, FAQSection } from '@/app/components'
import { handoverItems } from '@/app/data'

export const metadata: Metadata = {
  title: 'Dự án thi công mạng LAN, WiFi, firewall, camera doanh nghiệp',
  description: 'Các nhóm dự án Intech triển khai: mạng văn phòng, nhà xưởng, bệnh viện, WiFi doanh nghiệp, firewall VPN, camera IP, chuẩn hóa tủ rack và bảo trì hệ thống.',
  alternates: { canonical: '/du-an' },
}

const projects = [
  { title: 'Mạng văn phòng nhiều phòng ban', desc: 'Thi công mạng LAN, chia VLAN, WiFi khách/nội bộ, firewall, máy in, camera và tài liệu bàn giao cho văn phòng doanh nghiệp.', scope: ['Switch access/core', 'WiFi roaming', 'Firewall/VPN', 'Tủ rack và đánh nhãn'] },
  { title: 'Hạ tầng mạng nhà xưởng', desc: 'Kết nối văn phòng - khu sản xuất - kho, triển khai WiFi vùng phủ rộng, camera IP và uplink quang giữa các khu vực.', scope: ['Uplink quang', 'WiFi nhà xưởng', 'Camera IP', 'Tủ rack khu vực'] },
  { title: 'Mạng bệnh viện/phòng khám', desc: 'Tách vùng mạng nhân viên, khách, camera, server; ưu tiên bảo mật dữ liệu, vận hành liên tục và khả năng mở rộng.', scope: ['VLAN theo khu vực', 'WiFi khách', 'Firewall policy', 'Lưu trữ camera/dữ liệu'] },
  { title: 'Chuẩn hóa firewall và VPN chi nhánh', desc: 'Thiết lập firewall, NAT, VPN site-to-site, remote access và phân quyền truy cập theo phòng ban/ứng dụng.', scope: ['Firewall rule', 'VPN', 'Backup config', 'Tài liệu quản trị'] },
  { title: 'Nâng cấp WiFi doanh nghiệp', desc: 'Khảo sát vùng phủ, thay access point, tối ưu vị trí lắp đặt, cấu hình roaming, captive portal và quản trị tập trung.', scope: ['Khảo sát sóng', 'Controller/cloud', 'SSID/VLAN', 'Tối ưu roaming'] },
  { title: 'Bảo trì hệ thống mạng định kỳ', desc: 'Kiểm tra switch, router, firewall, WiFi, camera, log, backup cấu hình và đề xuất tối ưu để giảm downtime.', scope: ['Health check', 'Backup cấu hình', 'Rà soát log', 'Báo cáo khuyến nghị'] },
]

export default function ProjectsPage() {
  return (
    <main>
      <Breadcrumbs current="Dự án" />
      <section className="section surface">
        <div className="heading">
          <p className="eyebrow">Dự án</p>
          <h1>Các nhóm dự án hạ tầng mạng Intech có thể triển khai</h1>
          <p className="lead">Tập trung vào tính ổn định, khả năng mở rộng, tài liệu rõ ràng và hỗ trợ vận hành lâu dài. Các dự án thực tế sẽ được cập nhật thêm khi có hình ảnh và thông tin được phép công khai.</p>
        </div>
        <div className="cards">
          {projects.map((project) => <article className="card" key={project.title}><h2>{project.title}</h2><p>{project.desc}</p><ul className="mini-list">{project.scope.map((item) => <li key={item}>{item}</li>)}</ul></article>)}
        </div>
      </section>
      <section className="section split">
        <div><p className="eyebrow">Tiêu chí nghiệm thu</p><h2>Mỗi dự án cần bàn giao được cả hệ thống lẫn cách vận hành</h2></div>
        <ul className="list">{handoverItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <FAQSection />
      <CTA />
    </main>
  )
}
