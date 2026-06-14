import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { posts, servicePages } from '@/app/data'

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find((item) => item.slug === slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/tin-tuc/${post.slug}` },
  }
}

const articleSections = [
  { title: '1. Khảo sát hiện trạng trước khi mua thiết bị', body: 'Doanh nghiệp nên kiểm tra mặt bằng, số lượng người dùng, thiết bị hiện có, tuyến cáp, tủ rack, đường Internet, nhu cầu WiFi, camera, VPN và các ứng dụng quan trọng. Bước này giúp tránh mua thiếu, mua thừa hoặc chọn sai dòng thiết bị.' },
  { title: '2. Thiết kế sơ đồ mạng và phân vùng truy cập', body: 'Một hệ thống dễ vận hành cần có sơ đồ mạng, IP plan, VLAN cho nhân viên/khách/camera/server, policy firewall và quy ước đặt tên thiết bị. Đây là phần nhiều đơn vị bỏ qua nhưng lại quyết định khả năng bảo trì lâu dài.' },
  { title: '3. Chọn thiết bị theo tải thực tế', body: 'Switch, router, firewall và access point nên được chọn theo số user, băng thông, mật độ truy cập, nhu cầu PoE, uplink quang, bảo mật và khả năng mở rộng. Không nên chỉ so sánh giá model mà bỏ qua chi phí vận hành sau này.' },
  { title: '4. Thi công, đánh nhãn và nghiệm thu', body: 'Khi triển khai cần test từng line, đánh nhãn hai đầu dây, chuẩn hóa tủ rack, backup cấu hình và nghiệm thu các hạng mục: Internet, VLAN, WiFi roaming, VPN, camera, máy in, server và các ứng dụng nội bộ.' },
  { title: '5. Bảo trì định kỳ để giảm downtime', body: 'Sau bàn giao, hệ thống nên được kiểm tra định kỳ: log firewall, trạng thái switch/AP, dung lượng NAS, cảnh báo camera, backup cấu hình và tài liệu thay đổi. Việc này giúp phát hiện rủi ro sớm trước khi thành sự cố lớn.' },
]

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts.find((item) => item.slug === slug)
  if (!post) notFound()

  return (
    <main>
      <Breadcrumbs current={post.title} />
      <article className="section article">
        <p className="eyebrow">Kiến thức</p>
        <h1>{post.title}</h1>
        <p className="lead">{post.description}</p>
        {articleSections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
        <h2>Gợi ý bước tiếp theo</h2>
        <p>Nếu doanh nghiệp chưa có sơ đồ mạng hoặc đang gặp tình trạng WiFi chập chờn, firewall khó quản trị, dây mạng không đánh nhãn, nên bắt đầu bằng một buổi khảo sát hiện trạng. Từ đó mới đưa ra danh mục thiết bị và phương án thi công chính xác.</p>
        <ul>
          {servicePages.slice(0, 4).map((service) => <li key={service.slug}><Link href={`/dich-vu/${service.slug}`}>{service.title}</Link></li>)}
        </ul>
      </article>
      <CTA />
    </main>
  )
}
