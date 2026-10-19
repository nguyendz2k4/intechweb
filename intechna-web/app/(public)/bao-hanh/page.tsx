import type { Metadata } from 'next'
import { Breadcrumbs } from '@/app/components'
import { siteConfig } from '@/app/data'
import { WarrantyCheck } from './WarrantyCheck'
import { JsonLd } from '@/app/JsonLd'
import { pageMetadata, webPageSchema } from '@/app/lib/seo'

const warrantyMetadata = pageMetadata({
  title: 'Tra cứu bảo hành thiết bị mạng Intech',
  description:
    'Kiểm tra thời hạn bảo hành thiết bị do Intech cung cấp bằng mã phiếu hoặc serial. Hỗ trợ tra soát và yêu cầu bảo trì thiết bị.',
  path: '/bao-hanh',
})

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}): Promise<Metadata> {
  const params = await searchParams
  return {
    ...warrantyMetadata,
    ...(params.q !== undefined ? { robots: { index: false, follow: true } } : {}),
  }
}

const steps = [
  {
    title: 'Tìm mã thiết bị.',
    description:
      'Mã phiếu có trên biên bản bàn giao. Serial nằm trên tem ở mặt sau hoặc mặt dưới thiết bị.',
  },
  {
    title: 'Kiểm tra thời hạn.',
    description: 'Nhập đầy đủ mã và chọn Tra cứu để xem thiết bị, ngày mua và thời hạn bảo hành.',
  },
  {
    title: 'Kết nối kỹ thuật viên.',
    description:
      'Khi cần hỗ trợ, gửi mã thiết bị, ảnh tem serial và mô tả sự cố cho đội ngũ Intech.',
  },
]

export default async function WarrantyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const params = await searchParams
  const initialKeyword = typeof params.q === 'string' ? params.q.slice(0, 128) : ''

  return (
    <main className="warranty-page">
      <JsonLd
        data={webPageSchema({
          name: 'Tra cứu bảo hành thiết bị mạng Intech',
          description: String(warrantyMetadata.description),
          path: '/bao-hanh',
        })}
      />
      <Breadcrumbs current="Bảo hành" currentPath="/bao-hanh" />
      <section className="warranty-hero" aria-labelledby="warranty-title">
        <p className="eyebrow">Hỗ trợ thiết bị Intech</p>
        <h1 id="warranty-title">
          An tâm vận hành.
          <br />
          <span>Rõ ràng bảo hành.</span>
        </h1>
        <p className="warranty-intro">
          Kiểm tra thời hạn bảo hành thiết bị của bạn.
          <br className="warranty-desktop-break" /> Chỉ cần mã phiếu hoặc serial.
        </p>
        <WarrantyCheck key={initialKeyword} initialKeyword={initialKeyword} />
      </section>
      <section className="warranty-guide" aria-labelledby="warranty-guide-title">
        <div className="warranty-guide-heading">
          <p className="eyebrow">Luôn sẵn sàng hỗ trợ</p>
          <h2 id="warranty-guide-title">Tra cứu trong ba bước.</h2>
        </div>
        <ol className="warranty-guide-grid">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="warranty-step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <div className="warranty-support-note">
          <p>Cần tra soát trực tiếp?</p>
          <a href={`tel:${siteConfig.phone}`}>
            Gọi {siteConfig.phoneDisplay} <span aria-hidden="true">↗</span>
          </a>
          <a href={`https://zalo.me/${siteConfig.phone}`} target="_blank" rel="noopener noreferrer">
            Gửi ảnh tem qua Zalo <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
  )
}
